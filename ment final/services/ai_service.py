import os
import logging
from dotenv import load_dotenv
import sys
import json
from openai import OpenAI, AuthenticationError, RateLimitError, BadRequestError

# Load environment variables
load_dotenv()

# Set up logging
logger = logging.getLogger('mentaura.ai_service')

class AIService:
    """Service for handling AI operations"""
    
    def __init__(self):
        """Initialize AI Service with available models"""
        try:
            # Initialize OpenAI
            openai_api_key = os.environ.get("OPENAI_API_KEY")
            self.openai_client = None
            if openai_api_key:
                self.openai_client = OpenAI(api_key=openai_api_key)
                logger.info("OpenAI client initialized")
            else:
                logger.warning("OpenAI API key not found")
                
            # Initialize Gemini
            try:
                import google.generativeai as genai
                google_api_key = os.environ.get("GOOGLE_API_KEY")
                if google_api_key:
                    genai.configure(api_key=google_api_key)
                    self.gemini_model = genai.GenerativeModel('gemini-pro')
                    logger.info("Gemini model initialized")
                else:
                    logger.warning("Google API key not found")
                    self.gemini_model = None
            except ImportError:
                logger.warning("Google generative AI package not installed")
                self.gemini_model = None
        except Exception as e:
            logger.error(f"Error initializing AI Service: {e}")
            self.openai_client = None
            self.gemini_model = None
    
    def process_text(self, text, user_id="anonymous", learning_type="General", context=None):
        """
        Process text input and generate response
        
        Args:
            text (str): User input text
            user_id (str): User ID for personalization
            learning_type (str): Type of learning (e.g., "General", "Personal Growth")
            context (dict): Additional context information
            
        Returns:
            dict: Response with generated text and metadata
        """
        try:
            # Log request
            logger.info(f"Processing text for user {user_id}: {text[:30]}...")
            
            # First try OpenAI (preferred for accuracy)
            if self.openai_client:
                try:
                    return self._query_openai(text, context)
                except AuthenticationError as auth_err:
                    logger.error(f"OpenAI authentication error: {auth_err}")
                    return {
                        "error": True,
                        "error_type": "authentication",
                        "message": str(auth_err),
                        "code": 401
                    }
                except RateLimitError as rate_err:
                    logger.warning(f"OpenAI rate limit error: {rate_err}")
                    # Fall back to Gemini if available
                    if self.gemini_model:
                        logger.info("Falling back to Gemini due to OpenAI rate limit")
                        return self._query_gemini(text, context)
                    else:
                        return {
                            "error": True,
                            "error_type": "rate_limit",
                            "message": str(rate_err),
                            "retry_after": 60,
                            "code": 429
                        }
                except Exception as e:
                    logger.error(f"OpenAI error: {e}")
                    # Fall back to Gemini if available
                    if self.gemini_model:
                        logger.info("Falling back to Gemini due to OpenAI error")
                        return self._query_gemini(text, context)
                    else:
                        return {
                            "error": True,
                            "error_type": "openai_error",
                            "message": str(e),
                            "code": 500
                        }
            
            # If OpenAI not available or failed, try Gemini
            if self.gemini_model:
                return self._query_gemini(text, context)
            
            # If no AI services available
            logger.error("No AI models available")
            return {
                "error": True,
                "error_type": "no_ai_service",
                "message": "No AI service is currently available",
                "code": 503
            }
        except Exception as e:
            logger.error(f"Error in process_text: {e}")
            return {
                "error": True,
                "error_type": "unexpected",
                "message": str(e),
                "code": 500
            }
    
    def _query_openai(self, text, context=None):
        """
        Query OpenAI API with error handling
        
        Args:
            text (str): User input text
            context (dict): Additional context
            
        Returns:
            dict: Processed response with metadata
        """
        if not self.openai_client:
            return {
                "error": True,
                "error_type": "no_openai",
                "message": "OpenAI client not initialized",
                "code": 503
            }
        
        try:
            # Construct system message with context
            system_message = "You are Mentaura, an AI learning assistant designed to help users understand complex topics."
            
            if context:
                # Include additional context if available
                if context.get('currentTopic'):
                    system_message += f" Current topic: {context['currentTopic']}."
                if context.get('lastQuestion') and context.get('lastResponse'):
                    system_message += f" Previous question: {context['lastQuestion']}. Previous response summary: {context['lastResponse'][:100]}..."
            
            # Call OpenAI API
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": text}
                ],
                max_tokens=800,
                temperature=0.7
            )
            
            # Extract response text
            response_text = response.choices[0].message.content
            
            # Generate structured notes
            try:
                structured_notes = self._generate_structured_notes(response_text)
            except Exception as note_err:
                logger.error(f"Error generating structured notes: {note_err}")
                structured_notes = None
            
            # Determine emotion based on content
            emotion = self._determine_emotion(text, response_text)
            
            # Prepare client-side TTS settings
            client_tts = {
                "use_client_tts": True,
                "rate": 0.8,
                "pitch": 1.1
            }
            
            return {
                "text": response_text,
                "isOnline": True,
                "emotion": emotion,
                "structuredNotes": structured_notes,
                "client_tts": client_tts
            }
            
        except Exception as e:
            logger.error(f"Error in _query_openai: {e}")
            raise
    
    def _query_gemini(self, text, context=None):
        """
        Query Google's Gemini API with error handling
        
        Args:
            text (str): User input text
            context (dict): Additional context
            
        Returns:
            dict: Processed response with metadata
        """
        if not self.gemini_model:
            return {
                "error": True,
                "error_type": "no_gemini",
                "message": "Gemini model not initialized",
                "code": 503
            }
        
        try:
            # Prepare prompt with context
            prompt = text
            if context:
                # Include additional context if available
                if context.get('currentTopic'):
                    prompt = f"Topic: {context['currentTopic']}\nQuestion: {text}"
                if context.get('isFollowUp') and context.get('lastResponse'):
                    prompt = f"Previous information: {context['lastResponse'][:200]}...\nFollow-up question: {text}"
            
            # Call Gemini API
            response = self.gemini_model.generate_content(prompt)
            
            if not response or not response.text:
                return {
                    "error": True,
                    "error_type": "empty_response",
                    "message": "Gemini returned an empty response",
                    "code": 500
                }
            
            response_text = response.text
            
            # Generate structured notes
            try:
                structured_notes = self._generate_structured_notes(response_text)
            except Exception as note_err:
                logger.error(f"Error generating structured notes: {note_err}")
                structured_notes = None
            
            # Determine emotion based on content
            emotion = self._determine_emotion(text, response_text)
            
            # Prepare client-side TTS settings
            client_tts = {
                "use_client_tts": True,
                "rate": 0.8,
                "pitch": 1.1
            }
            
            return {
                "text": response_text,
                "isOnline": True,
                "emotion": emotion,
                "structuredNotes": structured_notes,
                "client_tts": client_tts
            }
            
        except Exception as e:
            logger.error(f"Error in _query_gemini: {e}")
            return {
                "error": True,
                "error_type": "gemini_error",
                "message": str(e),
                "code": 500
            }
    
    def _generate_structured_notes(self, text):
        """Generate structured notes from a response text"""
        try:
            # Basic structure
            notes = {
                "title": self._extract_title(text),
                "keyPoints": self._extract_key_points(text, 3),
                "details": self._extract_details(text)
            }
            return notes
        except Exception as e:
            logger.error(f"Error generating structured notes: {e}")
            return None
    
    def _extract_title(self, text):
        """Extract a title from text"""
        # Simple approach: use first line or first sentence
        if not text:
            return "Notes"
        
        lines = text.split('\n')
        first_line = lines[0].strip()
        
        # Use first line if it's reasonably short
        if 3 < len(first_line) < 100:
            return first_line
            
        # Otherwise use first sentence
        sentences = text.split('.')
        if sentences:
            return sentences[0].strip()[:100]
            
        return "Notes"
    
    def _extract_key_points(self, text, count=3):
        """Extract key points from text"""
        if not text:
            return []
            
        # Look for bullet points or numbered lists
        lines = text.split('\n')
        bullet_points = []
        
        for line in lines:
            line = line.strip()
            # Match bullet points or numbered lists
            if line.startswith('•') or line.startswith('-') or line.startswith('*') or \
               (len(line) > 2 and line[0].isdigit() and line[1] == '.'):
                bullet_points.append(line)
                
        # If we found bullet points, use those
        if bullet_points and len(bullet_points) >= count:
            return bullet_points[:count]
            
        # Otherwise, use sentences
        sentences = text.split('.')
        key_sentences = []
        
        for sentence in sentences:
            sentence = sentence.strip()
            if 10 < len(sentence) < 150:  # Filter reasonable sentences
                key_sentences.append(sentence)
                
                if len(key_sentences) >= count:
                    break
                    
        return key_sentences
    
    def _extract_details(self, text):
        """Extract detailed content from text"""
        if not text:
            return []
            
        # Split text into paragraphs
        paragraphs = text.split('\n\n')
        
        # Filter out very short paragraphs
        detailed_paragraphs = []
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if len(paragraph) > 50:
                detailed_paragraphs.append(paragraph)
                
        return detailed_paragraphs
    
    def _determine_emotion(self, query, response):
        """Determine appropriate emotion based on query and response"""
        query_lower = query.lower()
        response_lower = response.lower()
        
        # Check for error conditions
        if "error" in response_lower or "sorry" in response_lower or "cannot" in response_lower:
            return "concerned"
            
        # Check for question types
        if any(word in query_lower for word in ["how", "why", "what", "explain"]):
            return "thoughtful"
            
        # Check for gratitude
        if any(word in query_lower for word in ["thanks", "thank", "appreciate"]):
            return "happy"
            
        # Check for excitement
        if any(word in query_lower for word in ["amazing", "wow", "cool", "awesome"]):
            return "excited"
            
        # Default emotion
        return "neutral"
    
    def generate_image(self, prompt):
        """Generate an image based on a text prompt"""
        # Implement image generation logic
        return {"error": "Image generation not implemented yet"}

# Setup function for app.py
def setup_ai_models():
    """Setup AI models for use in the application"""
    return AIService() 