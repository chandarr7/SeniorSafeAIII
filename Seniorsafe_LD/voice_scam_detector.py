"""
Real-Time Voice Scam Detector
Detects manipulation patterns and fake tech support voices during phone calls
"""

import os
import re
import json
from typing import Dict, List, Optional
from datetime import datetime
import asyncio
from openai import AsyncOpenAI

# API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


class VoiceScamDetector:
    """Real-time voice scam detection using speech analysis"""

    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

        # Common scam phrases and manipulation tactics
        self.scam_phrases = {
            "tech_support": [
                "your computer has a virus",
                "windows has been compromised",
                "we detected suspicious activity",
                "your ip address",
                "remote access",
                "teamviewer",
                "anydesk",
                "allow me to access",
                "press windows key",
                "event viewer",
                "error messages",
                "your license has expired",
                "microsoft support",
                "apple support calling",
                "security alert"
            ],
            "irs_scam": [
                "irs calling",
                "internal revenue service",
                "tax refund",
                "you owe money",
                "arrest warrant",
                "legal action",
                "send payment immediately",
                "tax fraud",
                "social security suspension"
            ],
            "bank_scam": [
                "your account has been frozen",
                "suspicious transaction",
                "verify your identity",
                "credit card fraud",
                "unusual activity",
                "confirm your account",
                "security department",
                "fraud prevention"
            ],
            "grandparent_scam": [
                "it's me grandma",
                "it's me grandpa",
                "i'm in trouble",
                "i need money",
                "don't tell mom",
                "don't tell dad",
                "i've been arrested",
                "i'm in jail",
                "car accident",
                "need bail money"
            ],
            "lottery_scam": [
                "you've won",
                "lottery winner",
                "prize money",
                "claim your prize",
                "processing fee",
                "taxes on winnings",
                "send money to claim",
                "western union",
                "money gram",
                "gift cards"
            ],
            "pressure_tactics": [
                "act now",
                "immediately",
                "urgent",
                "within 24 hours",
                "right now",
                "don't hang up",
                "stay on the line",
                "don't tell anyone",
                "keep this confidential",
                "limited time",
                "last chance"
            ],
            "payment_requests": [
                "gift card",
                "itunes card",
                "google play card",
                "amazon card",
                "steam card",
                "wire transfer",
                "western union",
                "bitcoin",
                "cryptocurrency",
                "prepaid card",
                "money order",
                "cash app",
                "venmo",
                "zelle"
            ]
        }

        # Warning indicators
        self.warning_indicators = {
            "high_urgency": 0,
            "payment_request": 0,
            "tech_support": 0,
            "government_impersonation": 0,
            "pressure_tactics": 0,
            "identity_verification": 0,
            "suspicious_payment_method": 0
        }

    async def analyze_transcription(self, transcription: str, call_duration: int = 0) -> Dict:
        """
        Analyze transcribed speech for scam indicators
        """
        results = {
            "timestamp": datetime.now().isoformat(),
            "is_suspicious": False,
            "threat_level": "low",  # low, medium, high, critical
            "scam_type": None,
            "detected_phrases": [],
            "warning_indicators": {},
            "confidence": 0,
            "recommendations": [],
            "immediate_action": None
        }

        transcription_lower = transcription.lower()

        # Check for scam phrases
        detected_categories = {}

        for category, phrases in self.scam_phrases.items():
            matches = [phrase for phrase in phrases if phrase in transcription_lower]
            if matches:
                detected_categories[category] = matches
                results["detected_phrases"].extend(matches)

        # Calculate warning indicators
        warning_scores = {
            "high_urgency": len(detected_categories.get("pressure_tactics", [])),
            "payment_request": len(detected_categories.get("payment_requests", [])),
            "tech_support": len(detected_categories.get("tech_support", [])),
            "government_impersonation": len(detected_categories.get("irs_scam", [])),
            "pressure_tactics": len(detected_categories.get("pressure_tactics", [])),
            "identity_verification": sum(1 for phrase in ["verify", "confirm", "account number", "social security"] if phrase in transcription_lower),
            "suspicious_payment_method": len(detected_categories.get("payment_requests", []))
        }

        results["warning_indicators"] = warning_scores

        # Determine scam type and threat level
        total_indicators = sum(warning_scores.values())

        if total_indicators > 0:
            results["is_suspicious"] = True

            # Identify primary scam type
            if detected_categories.get("tech_support"):
                results["scam_type"] = "fake_tech_support"
                results["threat_level"] = "high"
            elif detected_categories.get("irs_scam"):
                results["scam_type"] = "government_impersonation"
                results["threat_level"] = "critical"
            elif detected_categories.get("grandparent_scam"):
                results["scam_type"] = "grandparent_scam"
                results["threat_level"] = "high"
            elif detected_categories.get("bank_scam"):
                results["scam_type"] = "bank_fraud"
                results["threat_level"] = "high"
            elif detected_categories.get("lottery_scam"):
                results["scam_type"] = "lottery_scam"
                results["threat_level"] = "medium"
            elif warning_scores["payment_request"] >= 2:
                results["scam_type"] = "payment_scam"
                results["threat_level"] = "high"
            else:
                results["scam_type"] = "unknown_scam"
                results["threat_level"] = "medium"

            # Confidence calculation (0-100)
            results["confidence"] = min(total_indicators * 15, 100)

            # Critical threat escalation
            if (warning_scores["payment_request"] >= 2 and
                warning_scores["high_urgency"] >= 2):
                results["threat_level"] = "critical"
                results["confidence"] = min(results["confidence"] + 20, 100)

        # Generate recommendations
        results["recommendations"] = self._generate_voice_recommendations(results)

        # Immediate action for critical threats
        if results["threat_level"] == "critical":
            results["immediate_action"] = "HANG UP IMMEDIATELY - This is a scam call!"

        return results

    async def analyze_audio_stream(self, audio_data: bytes, format: str = "wav") -> Dict:
        """
        Analyze audio stream using OpenAI Whisper for transcription
        Then analyze the transcription for scam indicators
        """
        if not self.openai_client:
            return {"error": "OpenAI API key not configured"}

        try:
            # Transcribe audio using Whisper
            transcription = await self._transcribe_audio(audio_data, format)

            if transcription.get("error"):
                return transcription

            # Analyze the transcription
            text = transcription.get("text", "")
            results = await self.analyze_transcription(text)

            # Add transcription to results
            results["transcription"] = text

            return results

        except Exception as e:
            return {"error": str(e)}

    async def _transcribe_audio(self, audio_data: bytes, format: str) -> Dict:
        """Transcribe audio using OpenAI Whisper API"""
        try:
            # Create a temporary file-like object
            import io
            audio_file = io.BytesIO(audio_data)
            audio_file.name = f"audio.{format}"

            # Call Whisper API
            response = await self.openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="json"
            )

            return {
                "text": response.text,
                "language": getattr(response, 'language', 'unknown')
            }

        except Exception as e:
            return {"error": f"Transcription failed: {str(e)}"}

    def _generate_voice_recommendations(self, results: Dict) -> List[str]:
        """Generate recommendations based on voice analysis"""
        recommendations = []

        if not results["is_suspicious"]:
            recommendations.append("✅ No immediate scam indicators detected")
            recommendations.append("However, remain cautious and never share personal information")
            return recommendations

        # Critical threat recommendations
        if results["threat_level"] == "critical":
            recommendations.append("🚨 HANG UP IMMEDIATELY - This is a scam!")
            recommendations.append("Do not provide any information")
            recommendations.append("Do not send money or gift cards")
            recommendations.append("Block this number")
            recommendations.append("Report to FTC at reportfraud.ftc.gov")

        # High threat recommendations
        elif results["threat_level"] == "high":
            recommendations.append("⚠️ WARNING - This call shows strong scam indicators")
            recommendations.append("End the call politely")
            recommendations.append("Call the organization back using official phone numbers")
            recommendations.append("Never allow remote access to your computer")

        # Medium threat recommendations
        elif results["threat_level"] == "medium":
            recommendations.append("⚠️ CAUTION - Suspicious patterns detected")
            recommendations.append("Verify the caller's identity independently")
            recommendations.append("Do not provide sensitive information")

        # Scam-type specific recommendations
        scam_type = results.get("scam_type")

        if scam_type == "fake_tech_support":
            recommendations.append("💻 Microsoft/Apple will NEVER call you unsolicited")
            recommendations.append("Do not allow remote access to your computer")
            recommendations.append("Hang up and contact tech support directly if concerned")

        elif scam_type == "government_impersonation":
            recommendations.append("🏛️ IRS/Government agencies send letters, not threatening calls")
            recommendations.append("They will never demand immediate payment")
            recommendations.append("Call the agency directly using official numbers")

        elif scam_type == "grandparent_scam":
            recommendations.append("👨‍👩‍👧‍👦 Verify by asking personal questions only the real person would know")
            recommendations.append("Call the family member directly using a known number")
            recommendations.append("Contact other family members to verify the situation")

        elif scam_type == "bank_fraud":
            recommendations.append("🏦 Hang up and call your bank using the number on your card")
            recommendations.append("Banks will never ask for full passwords or PINs")
            recommendations.append("Do not provide account numbers over the phone")

        # Payment warning
        if results["warning_indicators"].get("payment_request", 0) > 0:
            recommendations.append("💳 NEVER pay with gift cards, wire transfers, or cryptocurrency")
            recommendations.append("Legitimate organizations don't request these payment methods")

        # Urgency warning
        if results["warning_indicators"].get("high_urgency", 0) > 0:
            recommendations.append("⏰ Urgency is a classic scam tactic - take your time")
            recommendations.append("Legitimate issues can wait for you to verify")

        return recommendations

    async def analyze_with_ai(self, transcription: str) -> Dict:
        """
        Use OpenAI GPT-4 for advanced scam pattern analysis
        """
        if not self.openai_client:
            return {"error": "OpenAI API key not configured"}

        try:
            prompt = f"""Analyze this phone call transcription for scam indicators:

Transcription: "{transcription}"

Evaluate for:
1. Scam type (tech support, IRS, bank fraud, grandparent scam, lottery, etc.)
2. Manipulation tactics (urgency, fear, confusion, authority)
3. Red flags (payment requests, remote access, identity verification)
4. Confidence level (0-100) that this is a scam
5. Immediate recommendations for the call recipient

Provide a JSON response with:
{{
    "is_scam": boolean,
    "scam_type": string,
    "confidence": number,
    "red_flags": [list of strings],
    "manipulation_tactics": [list of strings],
    "recommendation": string,
    "should_hang_up": boolean
}}
"""

            response = await self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert in identifying phone scams targeting seniors. Analyze call transcriptions and provide clear, actionable guidance."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=600
            )

            content = response.choices[0].message.content

            # Parse JSON response
            try:
                analysis = json.loads(content)
                return analysis
            except json.JSONDecodeError:
                return {"error": "Failed to parse AI response", "raw_response": content}

        except Exception as e:
            return {"error": f"AI analysis failed: {str(e)}"}


# Global detector instance
detector = VoiceScamDetector()


async def analyze_call_audio(audio_data: bytes, format: str = "wav") -> Dict:
    """
    Public API function to analyze call audio
    """
    return await detector.analyze_audio_stream(audio_data, format)


async def analyze_call_text(transcription: str) -> Dict:
    """
    Public API function to analyze call transcription
    """
    return await detector.analyze_transcription(transcription)


async def get_real_time_analysis(text_chunks: List[str]) -> Dict:
    """
    Analyze real-time transcription chunks as they arrive
    Maintains state across chunks for continuous monitoring
    """
    # Combine all chunks
    full_transcription = " ".join(text_chunks)

    # Analyze combined text
    results = await detector.analyze_transcription(full_transcription)

    # Add chunk-specific information
    results["chunks_analyzed"] = len(text_chunks)
    results["latest_chunk"] = text_chunks[-1] if text_chunks else ""

    return results
