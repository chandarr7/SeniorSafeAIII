"""
Real-Time Link Scanner Service
Integrates Google Safe Browsing, VirusTotal, and OpenAI Vision for comprehensive link analysis
"""

import os
import re
import json
import hashlib
import base64
from typing import Dict, List, Optional
from datetime import datetime
import aiohttp
import asyncio
from urllib.parse import urlparse
from fastapi import HTTPException

# API Keys (should be stored in environment variables)
GOOGLE_SAFE_BROWSING_API_KEY = os.getenv("GOOGLE_SAFE_BROWSING_API_KEY", "")
VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


class LinkScanner:
    """Comprehensive link scanning service"""

    def __init__(self):
        self.google_api_url = "https://safebrowsing.googleapis.com/v4/threatMatches:find"
        self.virustotal_url_scan = "https://www.virustotal.com/api/v3/urls"
        self.virustotal_url_report = "https://www.virustotal.com/api/v3/urls/{}"
        self.openai_api_url = "https://api.openai.com/v1/chat/completions"

        # Common scam indicators
        self.scam_keywords = [
            "urgent", "verify", "suspended", "unusual activity", "confirm identity",
            "click here", "act now", "limited time", "prize", "winner", "claim",
            "refund", "tax refund", "inheritance", "cryptocurrency", "investment",
            "guaranteed", "risk-free", "earn money", "work from home", "bitcoin",
            "paypal", "venmo", "wire transfer", "gift card", "amazon", "walmart"
        ]

        # Suspicious URL patterns
        self.suspicious_patterns = [
            r'(?:bit\.ly|tinyurl\.com|goo\.gl|ow\.ly)',  # URL shorteners
            r'(?:\d{1,3}\.){3}\d{1,3}',  # IP addresses instead of domain names
            r'(?:[a-z0-9-]+\.)+(?:tk|ml|ga|cf|gq)',  # Free/suspicious TLDs
            r'(?:secure|account|verify|update|confirm)-[a-z0-9]+\.[a-z]{2,}',  # Phishing patterns
        ]

    async def scan_url(self, url: str) -> Dict:
        """
        Main method to scan a URL using multiple services
        Returns comprehensive threat analysis
        """
        results = {
            "url": url,
            "timestamp": datetime.now().isoformat(),
            "is_safe": True,
            "threat_level": "low",  # low, medium, high, critical
            "threats": [],
            "details": {},
            "recommendations": []
        }

        # Run all scans in parallel for faster results
        tasks = [
            self._check_url_pattern(url),
            self._scan_google_safe_browsing(url),
            self._scan_virustotal(url),
            self._analyze_with_openai(url)
        ]

        scan_results = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results
        pattern_check, google_result, vt_result, openai_result = scan_results

        # Pattern check
        if pattern_check["suspicious"]:
            results["threats"].append("Suspicious URL pattern detected")
            results["is_safe"] = False
            results["threat_level"] = "medium"
            results["details"]["pattern_analysis"] = pattern_check

        # Google Safe Browsing
        if isinstance(google_result, dict) and google_result.get("threats"):
            results["threats"].extend(google_result["threats"])
            results["is_safe"] = False
            results["threat_level"] = "high"
            results["details"]["google_safe_browsing"] = google_result

        # VirusTotal
        if isinstance(vt_result, dict) and vt_result.get("malicious_count", 0) > 0:
            results["threats"].append(f"Flagged by {vt_result['malicious_count']} security vendors")
            results["is_safe"] = False
            if vt_result["malicious_count"] > 5:
                results["threat_level"] = "critical"
            elif results["threat_level"] != "critical":
                results["threat_level"] = "high"
            results["details"]["virustotal"] = vt_result

        # OpenAI Analysis
        if isinstance(openai_result, dict) and openai_result.get("is_suspicious"):
            results["threats"].append("AI detected potential scam indicators")
            results["is_safe"] = False
            if results["threat_level"] == "low":
                results["threat_level"] = "medium"
            results["details"]["ai_analysis"] = openai_result

        # Generate recommendations
        results["recommendations"] = self._generate_recommendations(results)

        return results

    async def _check_url_pattern(self, url: str) -> Dict:
        """Check URL against suspicious patterns"""
        suspicious = False
        reasons = []

        # Check for URL shorteners
        for pattern in self.suspicious_patterns:
            if re.search(pattern, url, re.IGNORECASE):
                suspicious = True
                reasons.append(f"Matches suspicious pattern: {pattern}")

        # Check for misleading domain names
        parsed = urlparse(url)
        domain = parsed.netloc.lower()

        # Check for common brand impersonation
        trusted_brands = ["paypal", "amazon", "microsoft", "google", "apple", "facebook", "bank"]
        for brand in trusted_brands:
            if brand in domain and not domain.endswith(f"{brand}.com"):
                suspicious = True
                reasons.append(f"Possible {brand} impersonation")

        # Check for excessive subdomains
        if domain.count('.') > 3:
            suspicious = True
            reasons.append("Excessive subdomains")

        return {
            "suspicious": suspicious,
            "reasons": reasons,
            "domain": domain
        }

    async def _scan_google_safe_browsing(self, url: str) -> Dict:
        """Scan URL with Google Safe Browsing API"""
        if not GOOGLE_SAFE_BROWSING_API_KEY:
            return {"error": "Google Safe Browsing API key not configured"}

        try:
            payload = {
                "client": {
                    "clientId": "seniorsafeai",
                    "clientVersion": "1.0.0"
                },
                "threatInfo": {
                    "threatTypes": [
                        "MALWARE",
                        "SOCIAL_ENGINEERING",
                        "UNWANTED_SOFTWARE",
                        "POTENTIALLY_HARMFUL_APPLICATION"
                    ],
                    "platformTypes": ["ANY_PLATFORM"],
                    "threatEntryTypes": ["URL"],
                    "threatEntries": [{"url": url}]
                }
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.google_api_url}?key={GOOGLE_SAFE_BROWSING_API_KEY}",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        matches = data.get("matches", [])

                        if matches:
                            threats = [match.get("threatType") for match in matches]
                            return {
                                "threats": threats,
                                "details": matches
                            }
                        return {"threats": []}
                    else:
                        return {"error": f"API returned status {response.status}"}

        except Exception as e:
            return {"error": str(e)}

    async def _scan_virustotal(self, url: str) -> Dict:
        """Scan URL with VirusTotal API"""
        if not VIRUSTOTAL_API_KEY:
            return {"error": "VirusTotal API key not configured"}

        try:
            headers = {
                "x-apikey": VIRUSTOTAL_API_KEY
            }

            # Encode URL for VirusTotal
            url_id = base64.urlsafe_b64encode(url.encode()).decode().strip("=")

            async with aiohttp.ClientSession() as session:
                # Get URL report
                async with session.get(
                    self.virustotal_url_report.format(url_id),
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})

                        return {
                            "malicious_count": stats.get("malicious", 0),
                            "suspicious_count": stats.get("suspicious", 0),
                            "harmless_count": stats.get("harmless", 0),
                            "undetected_count": stats.get("undetected", 0),
                            "stats": stats
                        }
                    elif response.status == 404:
                        # URL not yet scanned, submit for scanning
                        return await self._submit_url_to_virustotal(url, session, headers)
                    else:
                        return {"error": f"API returned status {response.status}"}

        except Exception as e:
            return {"error": str(e)}

    async def _submit_url_to_virustotal(self, url: str, session: aiohttp.ClientSession, headers: Dict) -> Dict:
        """Submit URL to VirusTotal for scanning"""
        try:
            payload = {"url": url}
            async with session.post(
                self.virustotal_url_scan,
                headers=headers,
                data=payload,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status == 200:
                    return {
                        "malicious_count": 0,
                        "suspicious_count": 0,
                        "message": "URL submitted for scanning, results pending"
                    }
                else:
                    return {"error": f"Failed to submit URL: {response.status}"}
        except Exception as e:
            return {"error": str(e)}

    async def _analyze_with_openai(self, url: str) -> Dict:
        """Analyze URL with OpenAI for scam indicators"""
        if not OPENAI_API_KEY:
            return {"error": "OpenAI API key not configured"}

        try:
            # Extract domain and path for analysis
            parsed = urlparse(url)
            domain = parsed.netloc
            path = parsed.path
            query = parsed.query

            # Check for scam keywords in URL
            url_lower = url.lower()
            found_keywords = [kw for kw in self.scam_keywords if kw in url_lower]

            prompt = f"""Analyze this URL for potential scam indicators:
URL: {url}
Domain: {domain}
Path: {path}
Query parameters: {query}

Consider:
1. Domain legitimacy and trustworthiness
2. Presence of scam-related keywords
3. URL structure and patterns
4. Potential brand impersonation
5. Overall risk assessment

Found keywords: {', '.join(found_keywords) if found_keywords else 'None'}

Provide a JSON response with:
- is_suspicious (boolean)
- confidence (0-100)
- reasons (list of strings)
- recommendation (string)
"""

            headers = {
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": "gpt-4",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a cybersecurity expert specializing in scam detection. Analyze URLs for potential threats and provide clear, actionable guidance."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.3,
                "max_tokens": 500
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.openai_api_url,
                    headers=headers,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=20)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        content = data["choices"][0]["message"]["content"]

                        # Parse JSON response
                        try:
                            analysis = json.loads(content)
                            return analysis
                        except json.JSONDecodeError:
                            # If not valid JSON, create structured response
                            return {
                                "is_suspicious": len(found_keywords) > 2,
                                "confidence": min(len(found_keywords) * 20, 80),
                                "reasons": [f"Contains scam keyword: {kw}" for kw in found_keywords],
                                "recommendation": content
                            }
                    else:
                        return {"error": f"OpenAI API returned status {response.status}"}

        except Exception as e:
            return {"error": str(e)}

    def _generate_recommendations(self, results: Dict) -> List[str]:
        """Generate user-friendly recommendations based on scan results"""
        recommendations = []

        if results["is_safe"]:
            recommendations.append("✅ This link appears to be safe based on our analysis")
            recommendations.append("However, always verify the sender's identity before clicking")
        else:
            if results["threat_level"] == "critical":
                recommendations.append("🚨 DO NOT CLICK THIS LINK - Critical threat detected")
                recommendations.append("This link is extremely dangerous and may steal your information")
                recommendations.append("Delete the message containing this link immediately")
            elif results["threat_level"] == "high":
                recommendations.append("⚠️ DANGER - This link is highly suspicious")
                recommendations.append("Do not click unless you are absolutely certain it's legitimate")
                recommendations.append("Contact the supposed sender through official channels to verify")
            elif results["threat_level"] == "medium":
                recommendations.append("⚠️ CAUTION - This link shows suspicious characteristics")
                recommendations.append("Verify the sender's identity before proceeding")
                recommendations.append("Look for official contact information to confirm legitimacy")

            # Specific recommendations based on threats
            if any("SOCIAL_ENGINEERING" in str(t) for t in results.get("threats", [])):
                recommendations.append("This appears to be a phishing attempt - never enter personal information")

            if any("MALWARE" in str(t) for t in results.get("threats", [])):
                recommendations.append("This link may download malicious software to your device")

            # General safety advice
            recommendations.append("Never provide passwords, credit card numbers, or SSN through links")
            recommendations.append("When in doubt, contact SeniorSafeAI support or a trusted family member")

        return recommendations


# Global scanner instance
scanner = LinkScanner()


async def scan_link(url: str) -> Dict:
    """
    Public API function to scan a link
    """
    # Validate URL format
    if not url or not isinstance(url, str):
        raise HTTPException(status_code=400, detail="Invalid URL provided")

    # Add protocol if missing
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url

    # Validate URL structure
    try:
        parsed = urlparse(url)
        if not parsed.netloc:
            raise HTTPException(status_code=400, detail="Invalid URL format")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid URL format")

    # Perform scan
    results = await scanner.scan_url(url)
    return results


async def scan_email_content(email_text: str) -> Dict:
    """
    Scan email content for suspicious links and patterns
    """
    # Extract URLs from email text
    url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
    urls = re.findall(url_pattern, email_text)

    results = {
        "urls_found": len(urls),
        "scanned_urls": [],
        "is_safe": True,
        "threat_level": "low",
        "overall_threats": [],
        "recommendations": []
    }

    # Scan each URL found
    if urls:
        for url in urls[:10]:  # Limit to 10 URLs to prevent abuse
            url_result = await scanner.scan_url(url)
            results["scanned_urls"].append(url_result)

            if not url_result["is_safe"]:
                results["is_safe"] = False
                results["overall_threats"].extend(url_result["threats"])

                # Update threat level to highest found
                levels = ["low", "medium", "high", "critical"]
                if levels.index(url_result["threat_level"]) > levels.index(results["threat_level"]):
                    results["threat_level"] = url_result["threat_level"]

    # Check email content for scam keywords
    email_lower = email_text.lower()
    found_keywords = [kw for kw in scanner.scam_keywords if kw in email_lower]

    if found_keywords:
        results["overall_threats"].append(f"Email contains scam keywords: {', '.join(found_keywords[:5])}")
        if results["threat_level"] == "low":
            results["threat_level"] = "medium"
            results["is_safe"] = False

    # Generate recommendations
    if not results["is_safe"]:
        results["recommendations"].append("⚠️ This email contains suspicious elements")
        results["recommendations"].append("Do not click any links or provide personal information")
        results["recommendations"].append("Verify the sender through official contact methods")
    else:
        results["recommendations"].append("✅ No immediate threats detected in this email")
        results["recommendations"].append("Always verify sender identity before responding")

    return results
