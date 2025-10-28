/**
 * Voice Accessibility for SeniorSafe AI Chatbot
 * Browser-based Text-to-Speech and Speech-to-Text
 * Optimized for seniors
 */

class VoiceAccessibility {
    constructor() {
        this.voiceEnabled = true;
        this.recognition = null;
        this.isListening = false;
        this.initializeSpeechRecognition();
    }

    /**
     * Initialize Speech Recognition
     */
    initializeSpeechRecognition() {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;  // Stop after one phrase
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 1;
        } else {
            console.warn('Speech Recognition not supported in this browser');
        }
    }

    /**
     * Text-to-Speech - Make chatbot speak
     * @param {string} text - Text to speak
     * @param {Object} options - Speech options
     */
    speak(text, options = {}) {
        if (!this.voiceEnabled || !('speechSynthesis' in window)) {
            console.log('Speech synthesis not available');
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Clean text for better speech
        const cleanText = this.cleanTextForSpeech(text);

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(cleanText);

        // Configure for seniors (slower, clearer)
        utterance.rate = options.rate || 0.85;      // Slower than default
        utterance.pitch = options.pitch || 1.0;     // Normal pitch
        utterance.volume = options.volume || 1.0;   // Maximum volume

        // Choose voice (prefer female voice - easier for seniors)
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice =>
            voice.lang === 'en-US' && voice.name.includes('Female')
        ) || voices.find(voice => voice.lang === 'en-US') || voices[0];

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        // Event handlers
        utterance.onstart = () => {
            console.log('🔊 Speaking...');
            this.updateSpeakingIndicator(true);
        };

        utterance.onend = () => {
            console.log('✓ Finished speaking');
            this.updateSpeakingIndicator(false);
        };

        utterance.onerror = (event) => {
            console.error('Speech error:', event);
            this.updateSpeakingIndicator(false);
        };

        // Speak!
        window.speechSynthesis.speak(utterance);
    }

    /**
     * Stop speaking immediately
     */
    stopSpeaking() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            this.updateSpeakingIndicator(false);
        }
    }

    /**
     * Speech-to-Text - Listen to user
     * @param {Function} callback - Called with recognized text
     */
    listen(callback) {
        if (!this.recognition) {
            alert('Voice input not supported. Please use Chrome or Edge browser.');
            return;
        }

        if (this.isListening) {
            console.log('Already listening...');
            return;
        }

        // Start listening
        this.isListening = true;
        this.updateListeningIndicator(true);

        // Handle result
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const confidence = event.results[0][0].confidence;

            console.log(`🎤 Recognized: "${transcript}" (confidence: ${confidence.toFixed(2)})`);

            this.isListening = false;
            this.updateListeningIndicator(false);

            // Call callback with recognized text
            if (callback) {
                callback(transcript);
            }
        };

        // Handle errors
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            this.updateListeningIndicator(false);

            // User-friendly error messages
            const errorMessages = {
                'no-speech': 'No speech detected. Please try again.',
                'audio-capture': 'Microphone not found. Please check your microphone.',
                'not-allowed': 'Microphone access denied. Please allow microphone access.',
                'network': 'Network error. Please check your internet connection.'
            };

            const message = errorMessages[event.error] || 'Voice input error. Please try again.';
            alert(message);
        };

        // Handle end
        this.recognition.onend = () => {
            this.isListening = false;
            this.updateListeningIndicator(false);
        };

        // Start listening
        try {
            this.recognition.start();
            console.log('🎤 Listening... Please speak now.');
        } catch (error) {
            console.error('Error starting recognition:', error);
            this.isListening = false;
            this.updateListeningIndicator(false);
        }
    }

    /**
     * Stop listening
     */
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            this.updateListeningIndicator(false);
        }
    }

    /**
     * Toggle voice output on/off
     */
    toggleVoiceOutput() {
        this.voiceEnabled = !this.voiceEnabled;
        console.log(`Voice output: ${this.voiceEnabled ? 'ON' : 'OFF'}`);

        if (!this.voiceEnabled) {
            this.stopSpeaking();
        }

        return this.voiceEnabled;
    }

    /**
     * Clean text for speech (remove markdown, URLs, etc.)
     */
    cleanTextForSpeech(text) {
        // Remove markdown
        text = text.replace(/\*\*/g, '');
        text = text.replace(/\*/g, '');
        text = text.replace(/_/g, '');
        text = text.replace(/`/g, '');

        // Replace symbols with words
        text = text.replace(/&/g, ' and ');
        text = text.replace(/@/g, ' at ');
        text = text.replace(/#/g, ' number ');

        // Remove URLs (say "link" instead)
        text = text.replace(/https?:\/\/\S+/g, 'link');
        text = text.replace(/www\.\S+/g, 'link');

        // Remove excessive whitespace
        text = text.replace(/\s+/g, ' ').trim();

        return text;
    }

    /**
     * Update visual indicator for speaking
     */
    updateSpeakingIndicator(isSpeaking) {
        const indicator = document.getElementById('speaking-indicator');
        if (indicator) {
            indicator.style.display = isSpeaking ? 'block' : 'none';
        }
    }

    /**
     * Update visual indicator for listening
     */
    updateListeningIndicator(isListening) {
        const indicator = document.getElementById('listening-indicator');
        const button = document.getElementById('voice-input-btn');

        if (indicator) {
            indicator.style.display = isListening ? 'block' : 'none';
        }

        if (button) {
            button.textContent = isListening ? '🔴 Listening...' : '🎤 Speak';
            button.disabled = isListening;
        }
    }
}

// Export for use in React/other frameworks
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoiceAccessibility;
}

// Example usage:
/*
const voice = new VoiceAccessibility();

// Speak text
voice.speak("Hello! How can I help you today?");

// Listen to user
voice.listen((text) => {
    console.log("User said:", text);
    // Do something with the text (e.g., send to chatbot)
});

// Toggle voice on/off
voice.toggleVoiceOutput();

// Stop speaking
voice.stopSpeaking();
*/
