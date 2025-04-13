import os
import openai
import base64
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Conditional imports to avoid circular imports
try:
    import google.generativeai as genai
except ImportError:
    print("Google Generative AI library not installed, Gemini features will be disabled")
    genai = None

class AIService:
    def __init__(self):
        # AI model instances
        self.gemini_model = None
        self.rag_engine = None
        
        # User customization settings
        self.default_settings = {
            "voice": "female",
            "teaching_style": "detailed",
            "personality": "friendly",
            "difficulty": "intermediate",
            "speed": 1.0,
            "pitch": 1.0
        }
        
        # Initialize OpenAI client with the new API (v1.x)
        try:
            # Import the OpenAI class directly for the new API (v1.x)
            from openai import OpenAI
            self.openai_api_key = os.environ.get("OPENAI_API_KEY")
            if self.openai_api_key:
                self.openai_client = OpenAI(api_key=self.openai_api_key)
                print("Using OpenAI API v1.x")
            else:
                print("OpenAI API key not found")
                self.openai_client = None
        except Exception as e:
            print(f"Error initializing OpenAI: {e}")
            self.openai_client = None
    
    def setup_gemini(self):
        """Set up Google Gemini Pro model"""
        if genai is None:
            print("Gemini features are disabled: library not installed")
            return None
            
        try:
            api_key = os.environ.get("GEMINI_API_KEY")
            if not api_key:
                print("Gemini API key not found")
                return None
                
            genai.configure(api_key=api_key)
            self.gemini_model = genai.GenerativeModel("gemini-1.5-pro")
            return self.gemini_model
        except Exception as e:
            print(f"Error setting up Gemini: {e}")
            return None
    
    def query_gemini(self, prompt, image=None, user_settings=None):
        """Query Gemini model with text and optional image"""
        if self.gemini_model is None:
            return self.query_openai(prompt, user_settings)
            
        try:
            # Apply user settings to prompt
            settings = user_settings or self.default_settings
            
            # Adjust prompt based on teaching style and personality
            prompt_prefix = ""
            if settings["teaching_style"] == "detailed":
                prompt_prefix += "Provide a detailed explanation with examples. "
            elif settings["teaching_style"] == "concise":
                prompt_prefix += "Provide a concise explanation focusing on key points. "
            elif settings["teaching_style"] == "interactive":
                prompt_prefix += "Explain this interactively with questions and answers. "
            elif settings["teaching_style"] == "socratic":
                prompt_prefix += "Use the Socratic method to guide through this concept. "
            
            if settings["personality"] == "friendly":
                prompt_prefix += "Be friendly and encouraging. "
            elif settings["personality"] == "formal":
                prompt_prefix += "Maintain a formal and professional tone. "
            elif settings["personality"] == "humorous":
                prompt_prefix += "Be playful and use appropriate humor. "
            elif settings["personality"] == "motivational":
                prompt_prefix += "Be motivational and inspiring. "
            
            # Add difficulty level
            difficulty_guide = f"Explain at {settings['difficulty']} level. "
            
            # Combine all elements
            enhanced_prompt = f"{prompt_prefix}{difficulty_guide}{prompt}"
            
            # Process response based on input type
            if image:
                # Decode base64 image and create multimodal prompt
                image_bytes = base64.b64decode(image)
                response = self.gemini_model.generate_content([enhanced_prompt, image_bytes])
            else:
                response = self.gemini_model.generate_content(enhanced_prompt)
            
            return response.text
        except Exception as e:
            print(f"Error querying Gemini: {e}")
            # Fallback to OpenAI
            return self.query_openai(prompt, user_settings)
    
    def query_openai(self, prompt, user_settings=None):
        """Query OpenAI as a fallback"""
        try:
            # Apply user settings to prompt
            settings = user_settings or self.default_settings
            
            # Create system prompt based on settings
            system_prompt = ""
            if settings["teaching_style"] == "detailed":
                system_prompt += "You provide detailed explanations with examples. "
            elif settings["teaching_style"] == "concise":
                system_prompt += "You provide concise explanations focusing on key points. "
            elif settings["teaching_style"] == "interactive":
                system_prompt += "You explain concepts interactively with questions and answers. "
            elif settings["teaching_style"] == "socratic":
                system_prompt += "You use the Socratic method to guide through concepts. "
            
            if settings["personality"] == "friendly":
                system_prompt += "Your tone is friendly and encouraging. "
            elif settings["personality"] == "formal":
                system_prompt += "Your tone is formal and professional. "
            elif settings["personality"] == "humorous":
                system_prompt += "Your tone is playful and you use appropriate humor. "
            elif settings["personality"] == "motivational":
                system_prompt += "Your tone is motivational and inspiring. "
            
            system_prompt += f"You explain concepts at {settings['difficulty']} level."
            
            # Call OpenAI API using the client
            if not self.openai_client:
                return "OpenAI service is not available. Please check your API key configuration."
                
            try:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7
                )
                
                return response.choices[0].message.content
            except Exception as e:
                # Try with GPT 3.5 if GPT 4 fails
                print(f"Error with GPT-4, falling back to GPT-3.5: {e}")
                
                response = self.openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7
                )
                
                return response.choices[0].message.content
                
        except Exception as e:
            print(f"Error querying OpenAI: {e}")
            return f"I'm having trouble processing that request. {str(e)}"
    
    def generate_embedding(self, text):
        """Generate embedding for text"""
        try:
            if not self.openai_client:
                return None
                
            response = self.openai_client.embeddings.create(
                model="text-embedding-ada-002",
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return None
    
    def generate_image(self, prompt, size="1024x1024", n=1):
        """Generate an image based on a text prompt"""
        try:
            if not self.openai_client:
                return {"success": False, "error": "OpenAI service is not available"}
                
            response = self.openai_client.images.generate(
                prompt=prompt,
                model="dall-e-3",
                n=n,
                size=size
            )
            return {
                "success": True,
                "url": response.data[0].url
            }
        except Exception as e:
            print(f"Error generating image: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def summarize_text(self, text):
        """Summarize long text"""
        try:
            if not self.openai_client:
                return "OpenAI service is not available for text summarization."
                
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Summarize the following text concisely:"},
                    {"role": "user", "content": text}
                ],
                max_tokens=300
            )
            
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error summarizing text: {e}")
            return None
    
    def generate_practice_questions(self, topic, difficulty=3, count=5):
        """Generate practice questions for a topic"""
        try:
            prompt = f"""Generate {count} practice questions about {topic} at difficulty level {difficulty}/5. 
            For each question, provide:
            1. The question
            2. Multiple choice options (if applicable)
            3. The correct answer
            4. A brief explanation of why it's correct"""
            
            if self.gemini_model:
                response = self.query_gemini(prompt)
            else:
                response = self.query_openai(prompt)
                
            return response
        except Exception as e:
            print(f"Error generating practice questions: {e}")
            return f"I couldn't generate practice questions. {str(e)}"
    
    def evaluate_answer(self, question, user_answer, correct_answer=None):
        """Evaluate a user's answer to a question"""
        try:
            # If we don't have the correct answer, we need to generate it first
            eval_prompt = ""
            if correct_answer:
                eval_prompt = f"""Question: {question}
                User's answer: {user_answer}
                Correct answer: {correct_answer}
                
                Evaluate the user's answer. Is it correct? If it's partially correct, what's missing?
                Provide encouraging feedback and guidance."""
            else:
                eval_prompt = f"""Question: {question}
                User's answer: {user_answer}
                
                Evaluate if this answer is correct for the given question.
                Provide the correct answer and encouraging feedback."""
            
            if self.gemini_model:
                response = self.query_gemini(eval_prompt)
            else:
                response = self.query_openai(eval_prompt)
                
            return response
        except Exception as e:
            print(f"Error evaluating answer: {e}")
            return f"I couldn't evaluate your answer. {str(e)}"
    
    def suggest_related_topics(self, current_topic):
        """Suggest related topics based on current topic"""
        try:
            prompt = f"""Based on the topic '{current_topic}', suggest 3-5 related topics that would be 
            logical to learn next. For each topic, provide:
            1. The name of the topic
            2. A one-sentence description of why it's related and important
            3. How it builds upon the current knowledge of {current_topic}"""
            
            if self.gemini_model:
                response = self.query_gemini(prompt)
            else:
                response = self.query_openai(prompt)
                
            return response
        except Exception as e:
            print(f"Error suggesting related topics: {e}")
            return f"I couldn't suggest related topics. {str(e)}"
    
    def generate_notes(self, topic, include_diagrams=True):
        """Generate structured notes for a topic"""
        try:
            prompt = f"""Create comprehensive structured notes about {topic}. Include:
            1. Key concepts and definitions
            2. Important principles or formulas
            3. Real-world examples or applications
            4. Common misconceptions
            5. Summary of main points
            
            Format this as properly structured markdown with headings, subheadings, and bullet points."""
            
            if self.gemini_model:
                notes_text = self.query_gemini(prompt)
            else:
                notes_text = self.query_openai(prompt)
            
            # Generate diagram if requested
            diagram_url = None
            if include_diagrams:
                diagram_prompt = f"Educational diagram illustrating the key concepts of {topic}, labeled clearly and simple to understand"
                diagram_url = self.generate_image(diagram_prompt)
            
            return {
                "notes": notes_text,
                "diagram_url": diagram_url
            }
        except Exception as e:
            print(f"Error generating notes: {e}")
            return {"notes": f"I couldn't generate notes. {str(e)}", "diagram_url": None}
    
    # Extract a title from the text
    def _extract_title(self, text):
        """Extract a title from the text"""
        # Get the first sentence or first 50 characters
        first_sentence = text.split('\n')[0].strip()
        if len(first_sentence) > 60:
            # Truncate to a reasonable length
            words = first_sentence.split()
            if len(words) > 5:
                return ' '.join(words[:5]) + '...'
            else:
                return first_sentence[:50] + '...'
        return first_sentence
    
    # Extract key points from text
    def _extract_key_points(self, text, max_points=3):
        """Extract key points from text"""
        sentences = text.split('.')
        sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
        
        # If there are very few sentences, use them all as key points
        if len(sentences) <= max_points:
            return sentences
        
        # Otherwise, select sentences with key indicators
        key_indicators = ['important', 'key', 'note', 'remember', 'essential', 'fundamental', 'critical']
        key_points = []
        
        # First, look for sentences with key indicators
        for sentence in sentences:
            for indicator in key_indicators:
                if indicator in sentence.lower() and len(key_points) < max_points:
                    key_points.append(sentence + '.')
                    break
        
        # If we don't have enough, add from the beginning
        if len(key_points) < max_points:
            remaining = max_points - len(key_points)
            for i in range(min(remaining, len(sentences))):
                if sentences[i] + '.' not in key_points:
                    key_points.append(sentences[i] + '.')
        
        return key_points
    
    # Extract detailed content from text
    def _extract_details(self, text):
        """Extract detailed content from text"""
        paragraphs = text.split('\n\n')
        paragraphs = [p.strip() for p in paragraphs if len(p.strip()) > 0]
        
        # Return paragraphs after the first one (assuming first paragraph is introduction)
        if len(paragraphs) > 1:
            return paragraphs[1:]
        elif len(paragraphs) == 1:
            # If only one paragraph, split it and use the latter portion
            sentences = paragraphs[0].split('.')
            if len(sentences) > 3:
                return ['. '.join(sentences[3:]) + '.']
        
        return []

    def generate_response(self, message, context=None):
        try:
            if self.openai_client is not None:
                response = self.openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": self.system_prompt},
                        {"role": "user", "content": message}
                    ],
                    max_tokens=2000,  # Increased token limit
                    temperature=0.7
                )
                return response.choices[0].message.content
            else:
                # Fallback to direct API request
                response = requests.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {self.api_key}"
                    },
                    json={
                        "model": "gpt-3.5-turbo",
                        "messages": [
                            {"role": "system", "content": self.system_prompt},
                            {"role": "user", "content": message}
                        ],
                        "max_tokens": 2000,  # Increased token limit
                        "temperature": 0.7
                    }
                )
                if response.status_code == 200:
                    result = response.json()
                    return result["choices"][0]["message"]["content"]
                else:
                    print(f"Error from OpenAI API: {response.status_code} - {response.text}")
                    return "I'm having trouble accessing the AI service right now."
        except Exception as e:
            print(f"Error generating response: {e}")
            return "I'm having trouble processing your request right now."
    
    def analyze_text(self, text, analysis_type="sentiment"):
        """Analyze text"""
        try:
            # Use the OpenAI client for the new API format
            if not self.openai_client:
                return "OpenAI service is not available for text analysis."
                
            prompt = f"Analyze the following text for {analysis_type}:\n\n{text}"
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error analyzing text: {e}")
            return None

    def generate_chat_response(self, prompt, system_prompt="You are Mentaura, a friendly AI tutor."):
        """Generate chat response from Mentaura AI"""
        try:
            # Check if OpenAI client is available
            if not self.openai_client:
                return "OpenAI service is not available. Please check your API configuration."
                
            # Get system prompt from RAG if needed
            if not system_prompt:
                system_prompt = self._get_context_for_prompt(prompt)
            
            # Call OpenAI API using the client
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )
            
            # Use dot notation for the response
            response_text = response.choices[0].message.content
            
            # Add to recent memory if needed
            # self._add_to_memory(prompt, response_text)
            
            return response_text
        except Exception as e:
            print(f"Error generating chat response: {e}")
            return "I apologize, but I'm having trouble responding right now. Could you try again?"

# Create a singleton instance
_ai_service = None

def setup_ai_models():
    """Initialize and setup all AI models"""
    global _ai_service
    
    if _ai_service is None:
        _ai_service = AIService()
        
        # Setup Gemini (primary model)
        _ai_service.setup_gemini()
        
        print("AI models initialized")
    
    return _ai_service

# Convenience functions that use the singleton instance
def generate_ai_response(message, user_id=None, context=None):
    """Generate a response using AI"""
    global _ai_service
    
    if _ai_service is None:
        _ai_service = setup_ai_models()
        
    if _ai_service.gemini_model:
        return _ai_service.query_gemini(message)
    else:
        return _ai_service.query_openai(message)