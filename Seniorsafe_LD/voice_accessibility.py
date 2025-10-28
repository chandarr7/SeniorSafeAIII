"""
Voice Accessibility Module for SeniorSafe AI Chatbot
Provides Text-to-Speech and Speech-to-Text functionality
"""

import pyttsx3
import speech_recognition as sr
from typing import Optional


class VoiceAccessibility:
    """Handles voice interaction for accessibility"""

    def __init__(self):
        """Initialize Text-to-Speech engine"""
        self.tts_engine = pyttsx3.init()
        self.recognizer = sr.Recognizer()

        # Configure TTS for seniors (slower, clearer speech)
        self.tts_engine.setProperty('rate', 140)      # Slower than default
        self.tts_engine.setProperty('volume', 1.0)    # Maximum volume

        # Get available voices and prefer female voice (studies show easier for seniors)
        voices = self.tts_engine.getProperty('voices')
        for voice in voices:
            if 'female' in voice.name.lower():
                self.tts_engine.setProperty('voice', voice.id)
                break

    def speak(self, text: str) -> None:
        """
        Convert text to speech

        Args:
            text: The text to speak
        """
        try:
            # Clean text for better speech
            clean_text = self._clean_text_for_speech(text)

            # Speak
            self.tts_engine.say(clean_text)
            self.tts_engine.runAndWait()

        except Exception as e:
            print(f"Error in text-to-speech: {e}")

    def listen(self, timeout: int = 5) -> Optional[str]:
        """
        Listen to user's speech and convert to text

        Args:
            timeout: How long to wait for speech (seconds)

        Returns:
            Recognized text or None if error
        """
        try:
            with sr.Microphone() as source:
                print("🎤 Listening... Please speak now.")

                # Adjust for ambient noise (important for seniors' environments)
                self.recognizer.adjust_for_ambient_noise(source, duration=1)

                # Listen with timeout
                audio = self.recognizer.listen(source, timeout=timeout)

                # Convert to text using Google Speech Recognition
                text = self.recognizer.recognize_google(audio)
                print(f"✓ You said: {text}")
                return text

        except sr.WaitTimeoutError:
            print("⚠ No speech detected. Please try again.")
            return None

        except sr.UnknownValueError:
            print("⚠ Sorry, I didn't understand that. Please speak clearly.")
            return None

        except sr.RequestError as e:
            print(f"⚠ Could not connect to speech service: {e}")
            return None

        except Exception as e:
            print(f"⚠ Error in speech recognition: {e}")
            return None

    def _clean_text_for_speech(self, text: str) -> str:
        """
        Clean text to make it more natural for speech
        Remove markdown, special characters, etc.
        """
        # Remove markdown bold/italic markers
        text = text.replace('**', '')
        text = text.replace('*', '')
        text = text.replace('_', '')

        # Replace common symbols with words
        text = text.replace('&', 'and')
        text = text.replace('@', 'at')
        text = text.replace('#', 'number')

        # Remove URLs (just say "link" instead)
        import re
        text = re.sub(r'http\S+', 'link', text)
        text = re.sub(r'www\.\S+', 'link', text)

        return text

    def stop_speaking(self) -> None:
        """Stop any ongoing speech"""
        try:
            self.tts_engine.stop()
        except Exception as e:
            print(f"Error stopping speech: {e}")


# Example usage
if __name__ == "__main__":
    # Create voice assistant
    voice = VoiceAccessibility()

    # Test text-to-speech
    print("\n=== Testing Text-to-Speech ===")
    voice.speak("Hello! I am your SeniorSafe AI assistant. How can I help you today?")

    # Test speech-to-text
    print("\n=== Testing Speech-to-Text ===")
    print("Please speak when you hear the prompt...")
    user_input = voice.listen(timeout=5)

    if user_input:
        voice.speak(f"You said: {user_input}")
        print(f"Recognized: {user_input}")
    else:
        voice.speak("I didn't catch that. Please try again.")
