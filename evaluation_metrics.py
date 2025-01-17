import json
import nltk
import spacy
import logging
from typing import Dict, Any, Optional, List
from functools import lru_cache
from textstat import flesch_reading_ease
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
from scipy.special import softmax
import torch
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from collections import Counter

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class TextAnalysisConfig:
    """Configuration for text analysis parameters"""
    roberta_model_name: str = "cardiffnlp/twitter-roberta-base-sentiment-latest"
    emotion_model_name: str = "j-hartmann/emotion-english-distilroberta-base"
    spacy_model_name: str = "en_core_web_sm"
    cache_size: int = 128
    batch_size: int = 8
    device: str = "cuda" if torch.cuda.is_available() else "cpu"


class TextAnalyzer:
    """A comprehensive text analysis tool with sentiment, emotion, and rhetorical analysis"""
    
    def __init__(self, config: TextAnalysisConfig = TextAnalysisConfig()):
        self.config = config
        self._initialize_models()
        
    def _initialize_models(self):
        """Initialize all required models and tokenizers"""
        try:
            # Initialize RoBERTa
            self.tokenizer = AutoTokenizer.from_pretrained(self.config.roberta_model_name)
            self.sentiment_model = AutoModelForSequenceClassification.from_pretrained(
                self.config.roberta_model_name
            ).to(self.config.device)
            
            # Initialize emotion classifier
            self.emotion_classifier = pipeline(
                "text-classification",
                model=self.config.emotion_model_name,
                device=self.config.device,
                top_k=None
            )
            
            # Initialize spaCy
            self.nlp = spacy.load(self.config.spacy_model_name)
            
            logger.info("All models initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing models: {str(e)}")
            raise


    @lru_cache(maxsize=128)
    def get_roberta_sentiment(self, text: str) -> Dict[str, float]:
        """Get sentiment scores using RoBERTa model with caching"""
        try:
            encoded_text = self.tokenizer(text, return_tensors='pt', truncation=True, max_length=512)
            encoded_text = {k: v.to(self.config.device) for k, v in encoded_text.items()}
            
            with torch.no_grad():
                output = self.sentiment_model(**encoded_text)
            
            scores = output[0][0].cpu().numpy()
            scores = softmax(scores)
            
            return {
                'negative': float(scores[0]),
                'neutral': float(scores[1]),
                'positive': float(scores[2])
            }
            
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {str(e)}")
            return {'negative': 0.0, 'neutral': 1.0, 'positive': 0.0}


    def analyze_rhetorical_devices(self, doc) -> Dict[str, Any]:
        """Analyze rhetorical devices in the text"""
        try:
            # Enhanced alliteration detection
            alliterations = []
            for sent in doc.sents:
                words = [token for token in sent if token.pos_ in ["NOUN", "ADJ", "VERB"]]
                for i in range(len(words)-1):
                    if words[i].text[0].lower() == words[i+1].text[0].lower():
                        alliterations.append((words[i].text, words[i+1].text))
            
            # Enhanced repetition analysis
            word_freq = Counter([token.text.lower() for token in doc 
                               if token.pos_ in ["NOUN", "VERB", "ADJ"] and not token.is_stop])
            significant_repetitions = {word: count for word, count in word_freq.items() 
                                    if count > 1}
            
            # Identify rhetorical questions with improved accuracy
            rhetorical_questions = []
            for sent in doc.sents:
                if sent.text.strip().endswith("?"):
                    has_subject = any(token.dep_ == "nsubj" for token in sent)
                    has_modal = any(token.pos_ == "AUX" for token in sent)
                    if has_subject and has_modal:
                        rhetorical_questions.append(sent.text)
            
            return {
                "alliterations": alliterations,
                "repetitions": significant_repetitions,
                "rhetorical_questions": rhetorical_questions
            }
            
        except Exception as e:
            logger.error(f"Error in rhetorical analysis: {str(e)}")
            return {}


    def analyze_persuasive_elements(self, doc) -> Dict[str, Any]:
        """Analyze persuasive elements in the text"""
        persuasive_markers = {
            "logical": ["because", "therefore", "consequently", "thus", "hence", "as a result"],
            "emotional": ["imagine", "feel", "understand", "consider", "picture"],
            "credibility": ["research shows", "studies indicate", "experts agree", "evidence suggests"],
            "urgency": ["now", "immediately", "today", "don't wait", "limited time"],
        }
        
        results = {}
        for category, markers in persuasive_markers.items():
            matches = []
            for marker in markers:
                if len(marker.split()) > 1:
                    if marker.lower() in doc.text.lower():
                        matches.append(marker)
                else:
                    matches.extend([token.text for token in doc if token.text.lower() == marker.lower()])
            results[category] = matches
        
        return results


    def evaluate_response(self, text: str, include_raw_scores: bool = False) -> Dict[str, Any]:
        """Comprehensive evaluation of a text response"""
        try:
            # Basic text preprocessing
            if not text or not isinstance(text, str):
                raise ValueError("Invalid input text")
            text = text.strip()
            
            # Parallel processing of independent analyses
            with ThreadPoolExecutor() as executor:
                sentiment_future = executor.submit(self.get_roberta_sentiment, text)
                emotion_future = executor.submit(self.emotion_classifier, text)
                readability_future = executor.submit(flesch_reading_ease, text)
            
            # Process spaCy analysis
            doc = self.nlp(text)
            
            # Gather results
            sentiment_scores = sentiment_future.result()
            emotions = emotion_future.result()[0]
            readability_score = readability_future.result()

            rhetorical_analysis = self.analyze_rhetorical_devices(doc)
            #persuasion_analysis = self.analyze_persuasive_elements(doc)
            
            result = {
                "sentiment": {
                    "label": max(sentiment_scores, key=sentiment_scores.get),
                    "confidence": max(sentiment_scores.values()),
                },
                "readability": {
                    "score": readability_score,
                    "interpretation": self._interpret_readability(readability_score)
                },
                "emotions": emotions,
                "rhetorical_devices": rhetorical_analysis,
                #"persuasion_metrics": persuasion_analysis,
                "text_stats": {
                    "word_count": len([token for token in doc if not token.is_punct]),
                    "sentence_count": len(list(doc.sents)),
                    "average_word_length": sum(len(token.text) for token in doc if not token.is_punct) / 
                                        len([token for token in doc if not token.is_punct]) if doc else 0
                }
            }
            
            if include_raw_scores:
                result["sentiment"]["raw_scores"] = sentiment_scores
            
            return result
            
        except Exception as e:
            logger.error(f"Error in response evaluation: {str(e)}")
            return {"error": str(e)}

    @staticmethod
    def _interpret_readability(score: float) -> str:
        """Interpret Flesch Reading Ease score"""
        if score >= 90:
            return "Very Easy"
        elif score >= 80:
            return "Easy"
        elif score >= 70:
            return "Fairly Easy"
        elif score >= 60:
            return "Standard"
        elif score >= 50:
            return "Fairly Difficult"
        elif score >= 30:
            return "Difficult"
        else:
            return "Very Difficult"


# Example usage
if __name__ == "__main__":
    # Initialize analyzer with default configuration
    analyzer = TextAnalyzer()
    
    # Example text
    sample_text = """
    URGENT: ED needs immediate supply reallocation. 
    Sending 20 trauma kits and 10 units of O-neg blood from Central Storage to ED. 
    ICU ventilator 3 being transferred to ED Bay 2. Please confirm receipt within 5 minutes. 
    Outstanding work maintaining sterile protocols.
    """

    results = analyzer.evaluate_response(sample_text, include_raw_scores=True)
    print(json.dumps(results, indent=2))