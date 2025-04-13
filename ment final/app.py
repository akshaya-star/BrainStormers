from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import google.generativeai as genai
from google.cloud import speech, texttospeech
import openai
import base64
import os
import numpy as np
import cv2
import pytesseract
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, ServiceContext
from config import AIConfig
import time

# Initialize Flask app
app = Flask(__name__)

# Use simpler CORS configuration to avoid header duplication
CORS(app, 
     origins=["http://localhost:8000"],
     supports_credentials=True,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"])

# Add after_request handler to ensure CORS headers are properly set
@app.after_request
def after_request(response):
    # Only add headers if they don't already exist
    if 'Access-Control-Allow-Origin' not in response.headers:
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:8000')
    if 'Access-Control-Allow-Credentials' not in response.headers:
        response.headers.add('Access-Control-Allow-Credentials', 'true')
    if 'Access-Control-Allow-Headers' not in response.headers:
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    if 'Access-Control-Allow-Methods' not in response.headers:
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Special route for OPTIONS requests for all routes
@app.route('/<path:path>', methods=['OPTIONS'])
@app.route('/', methods=['OPTIONS'])
def options_handler(path=""):
    """Handle OPTIONS requests to all paths"""
    resp = jsonify({})
    # The after_request handler will add the CORS headers
    return resp, 200

# ✅ Initialize Firebase
try:
    cred = credentials.Certificate("mentaura-75fa0-firebase-adminsdk-fbsvc-e0c852c9ad.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Firebase initialized successfully")
except Exception as e:
    print(f"Firebase initialization error: {e}")
    print("Continuing without Firebase...")
    db = None

# ✅ Google Gemini API Setup - Use with rate limit handling
try:
    google_api_key = os.environ.get("GOOGLE_API_KEY", "")
    genai.configure(api_key=google_api_key)
    
    # Adding retry configuration for rate limits
    from google.api_core import retry
    retry_config = retry.Retry(
        initial=1.0,  # Initial backoff in seconds
        maximum=60.0,  # Maximum backoff in seconds
        multiplier=2.0,  # Backoff multiplier
        predicate=retry.if_exception_type(
            Exception
        ),
        deadline=300.0  # 5 minutes timeout
    )
    model = genai.GenerativeModel("gemini-1.5-pro")
    print("Google Gemini API initialized successfully")
except Exception as e:
    print(f"Google Gemini API initialization error: {str(e)}")
    print("Continuing without Gemini...")
    model = None

# ✅ Speech-to-Text & Text-to-Speech
try:
    speech_client = speech.SpeechClient()
    tts_client = texttospeech.TextToSpeechClient()
    print("Google Speech services initialized successfully")
except Exception as e:
    print(f"Google Speech services initialization error: {e}")
    print("Continuing without speech services...")
    speech_client = None
    tts_client = None

# ✅ OpenAI API Setup - Using the new OpenAI API (v1.0+)
openai_api_key = os.environ.get("OPENAI_API_KEY", "")
os.environ["OPENAI_API_KEY"] = openai_api_key

# ✅ Initialize OpenAI client with proper configuration
try:
    from openai import OpenAI
    openai_client = OpenAI(api_key=openai_api_key)
    # Validate API key with a simple test request
    test_response = openai_client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": "Hello"}],
        max_tokens=5
    )
    print("OpenAI client initialized successfully")
except Exception as e:
    print(f"OpenAI API key authentication error: {str(e)}")
    print("The provided API key appears to be invalid. Using fallback error handling.")
    openai_client = None

# ✅ Health check endpoint
@app.route("/health", methods=['GET', 'OPTIONS'])
def health_check():
    """Health check endpoint to verify server status"""
    if request.method == 'OPTIONS':
        return options_handler()
        
    return jsonify({
        "status": "ok", 
        "version": "1.0.0",
        "services": {
            "firebase": db is not None,
            "gemini": model is not None,
            "openai": openai_client is not None,
            "speech": speech_client is not None and tts_client is not None
        }
    }), 200

# ✅ Homepage Route (Fix 404)
@app.route("/")
def home():
    return "🔥 Mentaura AI Backend is Running!"

# ✅ Function to process user input (text, image, voice)
@app.route("/process_input", methods=["POST"])
def process_input():
    data = request.json
    if "text" in data:
        return handle_text_input(data["text"])
    elif "image" in data:
        return handle_image_input(data["image"])
    elif "voice" in data:
        return handle_voice_input(data["voice"])
    return jsonify({"error": "Invalid input format"})

# ✅ Function to handle text input (Fixed Gemini API call)
def handle_text_input(user_input):
    # Special handling for greetings
    if user_input.lower().strip() in ["hi", "hello"]:
        # Only generate voice response for greetings without text response
        greeting_text = "Hi, I'm Mentaura. How can I help you today? What are you interested in learning about?"
        voice_response = generate_speech(greeting_text)
        return jsonify({"text": "", "audio": voice_response, "is_greeting": True})
    
    try:
        if model is None:
            return jsonify({"text": "Sorry, the AI service is currently unavailable.", "error": "Gemini API not available"})
        
        # Use retry logic to handle rate limits
        max_retries = 3
        current_retry = 0
        last_error = None
        
        while current_retry < max_retries:
            try:
                response = model.generate_content(user_input)
                text_response = response.text
                voice_response = generate_speech(text_response)
                
                # Return voice-only response by setting text to empty string
                return jsonify({"text": "", "audio": voice_response, "voice_only": True})
            except Exception as e:
                if "429" in str(e) and current_retry < max_retries - 1:
                    # This is a rate limit error, let's wait and retry
                    wait_time = (2 ** current_retry) * 5  # Exponential backoff: 5, 10, 20 seconds
                    print(f"Rate limit hit, waiting {wait_time} seconds before retry {current_retry + 1}/{max_retries}")
                    time.sleep(wait_time)
                    current_retry += 1
                    last_error = e
                else:
                    # Not a rate limit error or final retry failed
                    raise e
        
        # If we've exhausted retries
        raise last_error
    except Exception as e:
        print(f"Error in handle_text_input: {e}")
        # Try to use OpenAI as fallback
        if openai_client is not None:
            try:
                openai_response = openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": user_input}],
                    max_tokens=500
                )
                fallback_text = openai_response.choices[0].message.content
                fallback_voice = generate_speech(fallback_text)
                print(f"Generated fallback response with OpenAI (length: {len(fallback_text)})")
                return jsonify({"text": "", "audio": fallback_voice, "voice_only": True})
            except Exception as openai_err:
                print(f"OpenAI fallback also failed: {openai_err}")
        
        return jsonify({"text": f"I'm having trouble processing your request: {str(e)}", "error": str(e)})

# ✅ Function to extract text from an image
def handle_image_input(image_base64):
    image_data = base64.b64decode(image_base64)
    nparr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    extracted_text = pytesseract.image_to_string(img)
    return handle_text_input(extracted_text)

# ✅ Function to process voice input
def handle_voice_input(audio_base64):
    if speech_client is None:
        return jsonify({"text": "Sorry, voice recognition is currently unavailable.", "error": "Speech services not available"})
        
    try:
        audio_data = base64.b64decode(audio_base64)
        audio_file = "user_audio.wav"
        
        with open(audio_file, "wb") as f:
            f.write(audio_data)

        with open(audio_file, "rb") as f:
            audio = speech.RecognitionAudio(content=f.read())

        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            language_code="en-US"
        )

        response = speech_client.recognize(config=config, audio=audio)
        text_input = response.results[0].alternatives[0].transcript
        return handle_text_input(text_input)
    except Exception as e:
        print(f"Error in handle_voice_input: {e}")
        return jsonify({"text": f"I'm having trouble processing your voice input: {str(e)}", "error": str(e)})

# ✅ Function to generate human-like speech (with robust fallback)
def generate_speech(text):
    print(f"Generating speech for text of length: {len(text)}")
    
    # Try to use the external TTS service first
    try:
        # If TTS client isn't available, try initializing it again
        global tts_client
        
        if tts_client is None:
            # Try initializing with Firebase credentials
            try:
                print("Trying to initialize speech services using Firebase credentials...")
                tts_client = texttospeech.TextToSpeechClient.from_service_account_json(
                    "mentaura-75fa0-firebase-adminsdk-fbsvc-e0c852c9ad.json"
                )
                print("Google Speech services initialized successfully using Firebase credentials")
            except Exception as e:
                print(f"Failed to initialize TTS with Firebase credentials: {e}")
                raise Exception("TTS client not available")
            
        # Configure the voice request
        synthesis_input = texttospeech.SynthesisInput(text=text)
        
        # Build the voice request
        voice = texttospeech.VoiceSelectionParams(
            language_code="en-US",
            name="en-US-Neural2-F",
            ssml_gender=texttospeech.SsmlVoiceGender.FEMALE
        )
        
        # Select the type of audio file
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=0.92,  # Slightly slower for better comprehension
            pitch=0.0,  # Neutral pitch
            volume_gain_db=0.0  # Default volume
        )
        
        # Implement retry logic for TTS
        max_retries = 3
        current_retry = 0
        
        while current_retry < max_retries:
            try:
                # Perform the text-to-speech request
                response = tts_client.synthesize_speech(
                    input=synthesis_input, voice=voice, audio_config=audio_config
                )
                
                # Return the audio content as base64
                return base64.b64encode(response.audio_content).decode('utf-8')
            except Exception as e:
                # Check if it's a rate limit or quota error
                if "429" in str(e) and current_retry < max_retries - 1:
                    wait_time = (2 ** current_retry) * 3  # Exponential backoff
                    print(f"TTS rate limit hit, waiting {wait_time} seconds before retry {current_retry + 1}/{max_retries}")
                    time.sleep(wait_time)
                    current_retry += 1
                else:
                    # Not a rate limit or final retry failed
                    raise e
                    
    except Exception as e:
        print(f"Error in generate_speech: {str(e)}")
        # Return a special flag to indicate client-side speech synthesis should be used
        print("Using client-side TTS for response")
        return {
            "use_client_tts": True,
            "text": text,
            "rate": 0.8,  # Slower rate for better clarity
            "pitch": 1.0   # Neutral pitch
        }

# ✅ Function to generate practice questions
@app.route("/practice_questions", methods=["POST"])
def practice_questions():
    try:
        data = request.json
        topic = data.get("topic")
        
        if not topic:
            return jsonify({"error": "No topic provided", "questions": ""})
        
        # Try to use Gemini API
        if model is not None:
            try:
                prompt = f"Generate 5 practice questions about {topic}. Format each question as a numbered list."
                response = model.generate_content(prompt)
                questions = response.text
                
                # Validate response
                if not questions or len(questions.strip()) < 10:
                    raise Exception("Generated questions are too short or invalid")
                
                return jsonify({"questions": questions})
            except Exception as gemini_error:
                print(f"Error generating questions with Gemini: {gemini_error}")
                # Fall through to OpenAI fallback
        
        # Try to use OpenAI as fallback
        if openai_client is not None:
            try:
                openai_response = openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant that generates practice questions."},
                        {"role": "user", "content": f"Generate 5 practice questions about {topic}. Format each question as a numbered list."}
                    ],
                    max_tokens=500
                )
                questions = openai_response.choices[0].message.content
                return jsonify({"questions": questions})
            except Exception as openai_error:
                print(f"Error generating questions with OpenAI: {openai_error}")
                # Fall through to the local fallback
        
        # Local fallback if both APIs fail
        fallback_questions = f"""
1. What are the key components of {topic}?
2. How does {topic} relate to real-world applications?
3. What are the main challenges in understanding {topic}?
4. How has {topic} evolved over time?
5. What are the future implications or developments related to {topic}?
"""
        return jsonify({"questions": fallback_questions})
    
    except Exception as e:
        print(f"Error in practice_questions endpoint: {e}")
        fallback_questions = f"""
1. What are the fundamental concepts of {topic}?
2. How is {topic} applied in practice?
3. What are the advantages and disadvantages of {topic}?
4. How does {topic} compare to similar concepts?
5. What recent developments have occurred in {topic}?
"""
        return jsonify({"questions": fallback_questions})

# ✅ Function to recommend a new topic
@app.route("/new_topic", methods=["POST"])
def new_topic():
    try:
        data = request.json
        topic = data.get("topic")
        
        if not topic:
            return jsonify({"error": "No topic provided", "new_topic": ""})
        
        # Try to use Gemini API
        if model is not None:
            try:
                prompt = f"Based on an interest in '{topic}', suggest one related topic that a person might want to learn about next. Respond with just the name of the topic, no additional text."
                response = model.generate_content(prompt)
                new_topic = response.text.strip()
                
                # Validate response
                if not new_topic or len(new_topic) < 3 or len(new_topic) > 100:
                    raise Exception("Generated topic is too short, too long, or invalid")
                
                return jsonify({"new_topic": new_topic})
            except Exception as gemini_error:
                print(f"Error generating new topic with Gemini: {gemini_error}")
                # Fall through to OpenAI fallback
        
        # Try to use OpenAI as fallback
        if openai_client is not None:
            try:
                openai_response = openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant that suggests related topics."},
                        {"role": "user", "content": f"Based on an interest in '{topic}', suggest one related topic that a person might want to learn about next. Respond with just the name of the topic, no additional text."}
                    ],
                    max_tokens=50
                )
                new_topic = openai_response.choices[0].message.content.strip()
                return jsonify({"new_topic": new_topic})
            except Exception as openai_error:
                print(f"Error generating new topic with OpenAI: {openai_error}")
                # Fall through to the local fallback
        
        # Generate a simple related topic based on common relationships
        related_topics = {
            'data': 'data science',
            'data science': 'machine learning',
            'machine learning': 'neural networks',
            'artificial intelligence': 'machine learning ethics',
            'programming': 'software development',
            'software': 'software engineering',
            'ecosystem': 'biodiversity',
            'environment': 'climate change',
            'physics': 'quantum mechanics',
            'chemistry': 'organic chemistry',
            'biology': 'genetics',
            'history': 'world war II',
            'math': 'calculus',
            'mathematics': 'linear algebra',
            'computer': 'computer architecture',
            'network': 'cybersecurity',
            'security': 'encryption',
            'web': 'web development'
        }
        
        # Check for direct matches
        topic_lower = topic.lower()
        for key, value in related_topics.items():
            if key in topic_lower:
                return jsonify({"new_topic": value})
        
        # Default fallback topics
        default_topics = [
            'artificial intelligence applications',
            'data science in healthcare',
            'machine learning algorithms',
            'environmental sustainability',
            'renewable energy'
        ]
        import random
        return jsonify({"new_topic": random.choice(default_topics)})
        
    except Exception as e:
        print(f"Error in new_topic endpoint: {e}")
        return jsonify({"new_topic": "machine learning applications"})

# ✅ Function to fetch learning history
@app.route("/learning_history", methods=["POST"])
def learning_history():
    if db is None:
        return jsonify({"error": "Firebase database is not available", "history": []})

    data = request.json
    username = data["username"]

    try:
        user_doc = db.collection("users").document(username).get()
        if user_doc.exists:
            return jsonify({"history": user_doc.to_dict()})
        return jsonify({"history": []})
    except Exception as e:
        print(f"Error getting learning history: {e}")
        return jsonify({"error": str(e), "history": []})

# ✅ Function to track learning progress
@app.route("/save_progress", methods=["POST"])
def save_progress():
    if db is None:
        return jsonify({"error": "Firebase database is not available", "message": "Progress not saved"})
        
    data = request.json
    username = data["username"]
    topic = data["topic"]
    progress = data["progress"]

    try:
        db.collection("users").document(username).set({"topic": topic, "progress": progress}, merge=True)
        return jsonify({"message": "Progress saved successfully"})
    except Exception as e:
        print(f"Error saving progress: {e}")
        return jsonify({"error": str(e), "message": "Failed to save progress"})

# ✅ Function to generate images & time-lapse videos
@app.route("/generate_image", methods=["POST"])
def generate_time_lapse():
    data = request.json
    prompt = data["text"]
    
    try:
        # Use the legacy/direct approach without client
        import requests
        response = requests.post(
            "https://api.openai.com/v1/images/generations",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {openai_api_key}"
            },
            json={
                "model": "dall-e-3",
                "prompt": prompt,
                "n": 1,
                "size": "1024x1024"
            }
        )
        if response.status_code == 200:
            result = response.json()
            image_url = result["data"][0]["url"]
            return jsonify({"video_url": image_url})
        else:
            return jsonify({"error": f"API request failed with status {response.status_code}", "video_url": None})
    except Exception as e:
        print(f"Error generating image: {e}")
        return jsonify({"error": str(e), "video_url": None})

def setup_ai_models():
    print("Setting up AI models...")
    return True

# ✅ Function to generate AI response with better error handling
def generate_ai_response(text, user_id, context=None):
    """Generate AI response using OpenAI or Gemini API with fallback mechanism"""
    try:
        # Try Gemini first if available
        if model is not None:
            try:
                prompt = f"""You are Mentaura, a personalized AI tutor. 
                Answer the following question or request in a teacher-like way: {text}"""
                response = model.generate_content(prompt)
                return response.text
            except Exception as e:
                print(f"Error using Gemini for response: {str(e)}")
                # Continue to OpenAI fallback
        
        # Use OpenAI as fallback
        if openai_client is not None:
            try:
                response = openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are Mentaura, a personalized AI tutor."},
                        {"role": "user", "content": text}
                    ],
                    temperature=0.7,
                    max_tokens=500
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                print(f"Error using OpenAI for response: {str(e)}")
                # If both APIs fail, use a generic fallback response
                
        # Ultimate fallback if all APIs fail
        return f"I'm having trouble generating a response due to technical issues. Please try asking a different question or try again later."
    except Exception as e:
        print(f"Error in generate_ai_response: {str(e)}")
        return f"I'm having trouble generating a response. {str(e)}"

# ✅ API route for auth session sync
@app.route("/api/auth/sync-session", methods=["POST", "OPTIONS"])
def sync_session():
    """Synchronize user session with backend"""
    if request.method == 'OPTIONS':
        return options_handler()
    
    data = request.json
    user_id = data.get("userId")
    
    # Just return success for now - in a real app you would do actual session sync
    return jsonify({
        "success": True,
        "userId": user_id,
        "sessionActive": True
    })

# ✅ Add API services endpoint
@app.route("/api/services", methods=["GET", "OPTIONS"])
def get_services():
    """Return available services and their status"""
    if request.method == 'OPTIONS':
        return options_handler()
        
    services = {
        "ai": {
            "gemini": model is not None,
            "openai": openai_client is not None
        },
        "speech": {
            "googleTTS": tts_client is not None,
            "edgeTTS": True,  # Edge TTS is always available as fallback
            "elevenlabs": False  # Not configured in this implementation
        }
    }
    return jsonify(services)

# ✅ Function to generate structured notes for learning questions
def generate_structured_notes(text, topic):
    """Generate structured notes for learning-related questions"""
    print(f"Generated structured notes for learning question about: {topic}")
    
    try:
        # Determine if this is a learning question
        is_learning_question = any(q in text.lower() for q in [
            'what is', 'how does', 'why is', 'explain', 'definition', 'define', 'concept of', 'tell me about',
            'describe', 'elaborate', 'clarify', 'teach me', 'learn about'
        ])
        
        # If not a learning question, return None
        if not is_learning_question:
            return None
            
        # For learning questions, generate structured notes using Google Gemini or OpenAI
        if model is not None:
            # Create a prompt specifically for structured notes
            notes_prompt = f"""Create structured notes about "{topic}" for a student.
            
            Structure the notes as follows:
            1. Definition/Overview (1-2 sentences)
            2. Key Points (3-5 bullet points)
            3. Examples or Applications (1-2 concrete examples)
            4. Visual Description (describe a diagram or illustration that would help understand the concept)
            
            Format the notes with clear section headings, bullet points, and numbered lists.
            Use markdown formatting for emphasis where appropriate.
            Keep the notes concise, clear, and visually organized.
            """
            
            # Generate the notes with retry logic
            max_retries = 2
            current_retry = 0
            last_error = None
            
            while current_retry <= max_retries:
                try:
                    # Generate the notes
                    notes_response = model.generate_content(notes_prompt)
                    notes_text = notes_response.text
                    return notes_text
                except Exception as e:
                    error_str = str(e)
                    if "429" in error_str and current_retry < max_retries:
                        # Rate limit error, apply exponential backoff
                        wait_time = (2 ** current_retry) * 2  # 2, 4 seconds (shorter for notes)
                        print(f"Rate limit hit in notes generation, waiting {wait_time}s before retry {current_retry+1}/{max_retries}")
                        time.sleep(wait_time)
                        current_retry += 1
                        last_error = e
                    else:
                        # Other error or final retry, fall back to OpenAI
                        print(f"Error generating structured notes: {error_str}")
                        # Break out to fallback
                        break
            
            # If we're here, either we exceeded retries or had non-rate-limit error
            # Fall back to OpenAI
            print("Falling back to OpenAI for structured notes generation")
            
        # Try OpenAI if Gemini failed or is not available
        if openai_client is not None:
            # Fallback to OpenAI if Gemini is not available
            notes_prompt = f"""Create structured notes about "{topic}" for a student.
            
            Structure the notes as follows:
            1. Definition/Overview (1-2 sentences)
            2. Key Points (3-5 bullet points)
            3. Examples or Applications (1-2 concrete examples)
            4. Visual Description (describe a diagram or illustration that would help understand the concept)
            
            Format the notes with clear section headings, bullet points, and numbered lists.
            Use markdown formatting for emphasis where appropriate.
            Keep the notes concise, clear, and visually organized.
            """
            
            try:
                # Using the OpenAI client instead of the legacy API
                response = openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are an educational assistant creating structured notes for students."},
                        {"role": "user", "content": notes_prompt}
                    ],
                    temperature=0.7,
                    max_tokens=600
                )
                
                notes_text = response.choices[0].message.content
                return notes_text
            except Exception as openai_err:
                print(f"OpenAI fallback for notes also failed: {openai_err}")
                # Continue to the generic fallback notes
        
        # If neither model is available or both failed, return simple structured notes
        return f"""
        # {topic.title()}
        
        ## Definition
        A concept or topic in learning that requires explanation.
        
        ## Key Points
        • Important points about {topic} would be listed here
        • Additional key concepts would be described
        • Relationships between ideas would be explained
        
        ## Examples
        1. Practical application of {topic} in real life
        2. How {topic} relates to other concepts
        
        ## Visual Reference
        Imagine a diagram showing the relationship between {topic} and related concepts, with clear labels and connecting lines.
        """
    except Exception as e:
        print(f"Error generating structured notes: {e}")
        return None  # Return None on error rather than error text

# ✅ Function to process text input via AI endpoint
@app.route("/api/process_text", methods=['POST'])
def api_process_text():
    """Process text input for AI responses via the regular API endpoint"""
    if request.method == 'OPTIONS':
        return options_handler()
    
    try:
        # Extract data from the request
        data = request.get_json()
        text = data.get('text', '')
        user_id = data.get('userId', 'guest')
        isFollowUp = data.get('isFollowUp', False)
        isExplainAgain = data.get('isExplainAgain', False)
        
        # Check if this is a greeting
        isGreeting = text.lower().strip() in ["hi", "hello"]
        
        # Log the incoming request with critical explain again info
        app.logger.info(f"Processing text request: '{text}' for user {user_id}")
        app.logger.info(f"Request context - isFollowUp: {isFollowUp}, isExplainAgain: {isExplainAgain}")
        
        # Check if this is a greeting message
        if isGreeting:
            # For greeting, return a voice-only response
            greeting_text = "Hi, I'm Mentaura. How can I help you today? What are you interested in learning about?"
            voice_response = generate_speech(greeting_text)
            
            # Check if we're using client-side TTS
            if isinstance(voice_response, dict) and voice_response.get("use_client_tts"):
                print("Using client-side TTS for greeting")
                return jsonify({
                    "text": greeting_text,
                    "client_tts": voice_response,
                    "isOnline": True,
                    "emotion": "happy"
                })
            else:
                print("Using server-side audio for greeting")
                return jsonify({
                    "text": greeting_text,
                    "audio": voice_response,
                    "isOnline": True,
                    "emotion": "happy"
                })
        
        # Check if we're dealing with a specific "explain again" request from frontend
        if isExplainAgain:
            app.logger.info("CRITICAL: Detected 'explain again' request from frontend flag")
            # We don't need additional checks here as the frontend already did the detection
        else:
            # Backup check for explain again patterns in case frontend detection failed
            explain_again_patterns = [
                "explain again", "explain it again", "explain that again",
                "can you explain again", "please explain again", "one more time"
            ]
            if any(pattern in text.lower() for pattern in explain_again_patterns):
                isExplainAgain = True
                app.logger.info("CRITICAL: Detected 'explain again' request via backend pattern matching")
        
        # Process with Gemini if available, fall back to OpenAI
        response_text = None
        
        # Build context string with more detailed conversation history
        recent_messages = data.get('context', {}).get('recentMessages', [])
        topics = data.get('context', {}).get('topics', [])
        current_topic = data.get('context', {}).get('currentTopic', '')
        previous_topic = data.get('context', {}).get('previousTopic', '')
        
        print(f"Current topic from context: '{current_topic}'")
        print(f"Recent messages count: {len(recent_messages)}")
        
        context_str = ""
        if recent_messages:
            context_str += "Previous conversation:\n"
            for msg in recent_messages[-5:]:  # Last 5 messages for better context
                role = msg.get('role', 'user')
                msg_text = msg.get('text', '')
                # Add role-specific context markers
                if role == 'user':
                    context_str += f"Student: {msg_text}\n"
                else:
                    context_str += f"Mentaura: {msg_text}\n"
        
        if topics:
            context_str += f"\nCurrent topics: {', '.join(topics)}\n"
        
        if current_topic:
            context_str += f"\nCurrent topic being discussed: {current_topic}\n"
        
        # Special handling for "explain again" requests
        if isExplainAgain:
            print("Handling 'explain again' request")
            # Find the last AI message for reference
            last_ai_message = None
            for msg in reversed(recent_messages):
                if msg.get('role') == 'ai':
                    last_ai_message = msg.get('text', '')
                    print(f"Found last AI message: {last_ai_message[:50]}...")
                    break
            
            # Also check context for last response
            if not last_ai_message and data.get('context', {}).get('lastResponse'):
                last_ai_message = data.get('context', {}).get('lastResponse')
                print(f"Using lastResponse from context: {last_ai_message[:50]}...")
            
            # Always prioritize currentTopic from context for "explain again" requests
            topic_to_explain = current_topic
            print(f"Using current topic for 'explain again': {topic_to_explain}")
            
            if last_ai_message:
                if not topic_to_explain:
                    # If we still don't have a topic, try to extract from various sources
                    if data.get('context', {}).get('lastQuestion'):
                        topic_to_explain = data.get('context', {}).get('lastQuestion')
                        print(f"Using lastQuestion as topic: {topic_to_explain}")
                    else:
                        # Try to extract from the AI's last response
                        print("Attempting to extract topic from last AI message")
                        topic_extracted = False
                        
                        # Check for common subject patterns in the first sentence
                        first_sentence = last_ai_message.split('.')[0].strip()
                        if 'about' in first_sentence.lower():
                            topic_to_explain = first_sentence.split('about', 1)[1].strip()
                            topic_extracted = True
                            print(f"Extracted topic after 'about': {topic_to_explain}")
                            
                        # Check for mentions of specific topics
                        for topic in ['addition', 'subtraction', 'multiplication', 'division', 
                                     'fractions', 'algebra', 'geometry', 'chemistry', 'physics']:
                            if topic in last_ai_message.lower():
                                topic_to_explain = topic
                                topic_extracted = True
                                print(f"Found topic keyword: {topic}")
                                break
                        
                        # If we couldn't extract a topic, use a generic approach
                        if not topic_extracted:
                            # Use the first sentence as a fallback
                            topic_to_explain = first_sentence
                            print(f"Using first sentence as topic: {topic_to_explain}")
                
                # Focus on providing a new explanation of the SAME topic
                context_str += f"\nThis is an 'explain again' request. The topic to re-explain is: {topic_to_explain}\n"
                context_str += "CRITICAL INSTRUCTION: DO NOT explain what 'explain again' means. Instead, re-explain the previous concept with more detail or from a different angle.\n"
                context_str += "CRITICAL INSTRUCTION: You must ONLY explain the topic specified. DO NOT switch topics or explain what 'explain again' means.\n"
                context_str += "CRITICAL INSTRUCTION: The user is asking you to explain the SAME topic again, but differently.\n"
                context_str += "CRITICAL INSTRUCTION: NEVER start your response with 'explain again means'. ALWAYS start directly with the re-explanation.\n"
                context_str += f"CRITICAL INSTRUCTION: You must CONTINUE explaining {topic_to_explain}. The user wants to learn MORE about this SAME topic.\n"
                context_str += f"Your previous explanation was: {last_ai_message}\n"
                context_str += "Now provide a NEW explanation of the SAME topic, using different examples or a different approach.\n"
                context_str += "Start your explanation directly without any meta-commentary about 'explain again'.\n"
                context_str += "Begin your response with a phrase like 'Let me explain this differently...' or 'Another way to understand this is...'\n"
                
                # Also store these in the context
                data['context']['currentTopic'] = topic_to_explain
                data['context']['isExplainAgain'] = True
            else:
                context_str += "\nThis is an 'explain again' request, but I don't have a previous explanation to reference.\n"
                if topic_to_explain:
                    context_str += f"Please explain the topic: {topic_to_explain} again with new examples.\n"
        elif isFollowUp:
            print("Handling follow-up request")
            context_str += "\nThis is a follow-up request. Please maintain continuity with the previous conversation.\n"
            
            # Find the last AI message for reference
            last_ai_message = None
            for msg in reversed(recent_messages):
                if msg.get('role') == 'ai':
                    last_ai_message = msg.get('text', '')
                    break
            
            # Also check context for last response
            if not last_ai_message and data.get('context', {}).get('lastResponse'):
                last_ai_message = data.get('context', {}).get('lastResponse')
            
            if last_ai_message:
                context_str += f"\nYour last response was: {last_ai_message}\n"
        
        # Build the context string with very explicit explain again handling
        context_string = ""
        if 'context' in data and data['context']:
            context_data = data['context']
            
            # Add critical section for explain again handling
            if isExplainAgain:
                context_string += "\n\nCRITICAL INSTRUCTION FOR EXPLAIN AGAIN REQUEST:\n"
                context_string += "The student has specifically asked you to explain the topic again. This means:\n"
                context_string += "1. They did not understand your previous explanation\n"
                context_string += "2. You MUST re-explain the SAME topic you were just discussing\n"
                context_string += "3. Use different words, simpler terms, and more examples\n"
                context_string += "4. Do NOT acknowledge the 'explain again' request - just start your explanation directly\n"
                context_string += "5. Do NOT say phrases like 'As I mentioned before' or 'As I was saying'\n"
                context_string += "6. Start with phrases like 'Let me explain it differently:' or 'Here's another way to think about it:'\n\n"
                
                app.logger.info("CRITICAL: Added explicit 'explain again' instructions to context")
        
        # Create the prompt with enhanced context handling
        prompt = f"""You are Mentaura, a personalized AI tutor having a one-on-one conversation with a student. 
        Your goal is to EXPLAIN the following topic in a teacher-like way, not just read or state information.
        
        {context_str}
        
        IMPORTANT INSTRUCTIONS:
        1. For "explain again" requests:
           - DO NOT EXPLAIN WHAT "EXPLAIN AGAIN" MEANS
           - Instead, re-explain the previous concept with more detail or from a different angle
           - Reference your previous explanation and build upon it
           - Use new examples or analogies if possible
           - STAY FOCUSED ON THE SAME TOPIC - do not switch to a different topic
           - NEVER respond with anything about what "explain again" means
           - Always provide a complete new explanation of the original topic
           - NEVER start with "Explain again means..." or any variation of defining the phrase
           - Start DIRECTLY with your new explanation (e.g., "Let's look at this concept differently...")
        
        2. For simple questions or follow-ups:
           - Keep responses short and conversational
           - Acknowledge the student's answer if they provided one
           - Use phrases like "That's right!", "Good answer!", or "Let me clarify..."
           - Stay focused on the specific question asked
           - NEVER switch to a different topic - stay on the original topic
        
        3. For concept explanations:
           - Provide detailed, thorough explanations
           - Use real-life examples and analogies
           - Break down complex ideas
           - Include key points and definitions
        
        4. Always maintain conversation style:
           - Use a warm, conversational tone
           - Add thinking sounds like "hmm", "well", "let me think..."
           - Acknowledge previous context
           - End with a relevant follow-up question
        
        5. Response length guidelines:
           - Simple questions/follow-ups: 2-3 sentences
           - Concept explanations: 4-6 sentences
           - Always be concise and clear
        
        6. CRITICAL: Topic Continuity
           - When a student asks a follow-up question, ALWAYS stay on the original topic
           - If asked to "explain again", you must ONLY explain the original topic differently
           - If the student asked about addition, keep explaining addition
           - If the student asked about subtraction, keep explaining subtraction
           - NEVER switch to a different topic (like baking, cooking, etc.)
           - NEVER explain what "explain again" means - just explain the subject again
           - The student is asking for more information about the SAME topic
           
        7. FOR "EXPLAIN AGAIN" REQUESTS:
           - NEVER DEFINE THE PHRASE "EXPLAIN AGAIN"
           - Always start your response with a direct explanation like "Let me try a different approach..." 
           - or "Here's another way to understand..."
           - DO NOT START with "Explain again means..." or any similar phrasing
           - ONLY explain the original topic, nothing else
        
        Remember: You are having a PERSONAL CONVERSATION with ONE STUDENT. Be friendly, supportive, and explain things clearly.
        Don't just read information - EXPLAIN it in a way that helps the student truly understand.
        Always maintain conversation continuity by referencing previous context when relevant.
        
        Topic to explain: {text}"""
        
        # Try with Gemini first, fall back to OpenAI on error
        if model is not None:
            try:
                print(f"Sending prompt to Gemini (length: {len(prompt)})")
                
                # Implement retry logic for rate limits
                max_retries = 3
                current_retry = 0
                last_error = None
                
                while current_retry < max_retries:
                    try:
                        response = model.generate_content(prompt)
                        response_text = response.text
                        print(f"Generated response with Gemini (length: {len(response_text)})")
                        break  # Success, exit retry loop
                    except Exception as e:
                        error_str = str(e)
                        print(f"Error with Gemini API (attempt {current_retry+1}/{max_retries}): {error_str}")
                        
                        if "429" in error_str and current_retry < max_retries - 1:
                            # Rate limit error, apply exponential backoff
                            wait_time = (2 ** current_retry) * 5  # 5, 10, 20 seconds
                            print(f"Rate limit hit, waiting {wait_time} seconds before retry")
                            time.sleep(wait_time)
                            current_retry += 1
                            last_error = e
                        else:
                            # Other error or final retry, fall back to OpenAI
                            print(f"Error using Gemini for response: {error_str}")
                            print("Falling back to OpenAI for response generation")
                            response_text = generate_ai_response(text, user_id, data.get('context', {}))
                            print(f"Generated fallback response with OpenAI (length: {len(response_text) if response_text else 0})")
                            break  # Exit retry loop
                
            except Exception as e:
                print(f"Error with Gemini API: {str(e)}")
                print("Falling back to OpenAI for response generation")
                response_text = generate_ai_response(text, user_id, data.get('context', {}))
                print(f"Generated fallback response with OpenAI (length: {len(response_text) if response_text else 0})")
        
        # If Gemini failed or isn't available, use OpenAI
        if response_text is None:
            print("Using OpenAI for response generation")
            response_text = generate_ai_response(text, user_id, data.get('context', {}))
            print(f"Generated response with OpenAI (length: {len(response_text) if response_text else 0})")
        
        # Generate voice if available
        print("Generating speech for response")
        voice_response = generate_speech(response_text)
        
        # Extract the topic for structured notes
        topic_for_notes = text
        if current_topic:
            topic_for_notes = current_topic
        
        # Generate structured notes if this is a learning-related question (not for greetings)
        structured_notes = None
        if not text.lower().strip() in ["hi", "hello"]:
            structured_notes = generate_structured_notes(text, topic_for_notes)
        
        # Prepare response
        response = {
            "text": response_text,
            "isOnline": True
        }
        
        # If structured notes were generated, add them to the response
        if structured_notes:
            response["notes"] = structured_notes
        
        # Check if we're using client-side TTS
        if isinstance(voice_response, dict) and voice_response.get("use_client_tts"):
            print("Using client-side TTS for response")
            response["client_tts"] = voice_response
        else:
            print("Using server-side audio for response")
            response["audio"] = voice_response
        
        # Determine appropriate emotion
        if "error" in response_text.lower() or "sorry" in response_text.lower():
            response["emotion"] = "concerned"
        elif any(word in text.lower() for word in ["how", "why", "what", "explain"]):
            response["emotion"] = "thoughtful"
        elif any(word in text.lower() for word in ["thanks", "thank", "appreciate"]):
            response["emotion"] = "happy"
        elif any(word in text.lower() for word in ["amazing", "wow", "cool", "awesome"]):
            response["emotion"] = "excited"
        else:
            response["emotion"] = "neutral"
        
        print(f"Sending response with text length: {len(response_text)}")
        return jsonify(response)
    except Exception as e:
        print(f"Error in api_process_text: {str(e)}")
        # More robust error handling - try OpenAI as ultimate fallback
        try:
            fallback_text = "I'm having trouble processing your request through our primary system. Let me try a different approach."
            fallback_response = generate_ai_response(text, user_id, data.get('context', {}))
            voice_response = generate_speech(fallback_response)
            
            return jsonify({
                "text": fallback_response,
                "isOnline": True,
                "error": str(e),
                "emotion": "concerned",
                "client_tts": {
                    "use_client_tts": True,
                    "text": fallback_response,
                    "rate": 0.8,
                    "pitch": 1.1
                }
            })
        except:
            # If everything fails, return a simple error message
            return jsonify({
                "text": f"I'm having trouble processing your request. Please try again in a moment.",
                "error": str(e),
                "isOnline": True,
                "emotion": "concerned"
            }), 500

# ✅ Process voice input endpoint
@app.route("/api/process_voice", methods=["POST"])
def api_process_voice():
    """Process voice input and generate AI response with structured notes"""
    if request.method == 'OPTIONS':
        return options_handler()
    
    try:
        data = request.get_json()
        audio = data.get("audio")
        user_id = data.get("userId", "guest")
        
        if not audio:
            return jsonify({"error": "No audio data provided"}), 400
        
        # Decode base64 audio
        audio_data = base64.b64decode(audio)
        audio_file = "temp_voice_input.wav"
        
        with open(audio_file, "wb") as f:
            f.write(audio_data)
        
        # Process audio to text
        transcribed_text = ""
        
        if speech_client:
            # Use Google Speech-to-Text
            with open(audio_file, "rb") as f:
                audio = speech.RecognitionAudio(content=f.read())
            
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                language_code="en-US"
            )
            
            response = speech_client.recognize(config=config, audio=audio)
            if response.results:
                transcribed_text = response.results[0].alternatives[0].transcript
        else:
            # Fallback for testing
            transcribed_text = "What is a dataset"
        
        # Check if this is a greeting
        isGreeting = transcribed_text.lower().strip() in ["hi", "hello"]
        
        if isGreeting:
            # For greeting, return a voice-only response
            greeting_text = "Hi, I'm Mentaura. How can I help you today? What are you interested in learning about?"
            voice_response = generate_speech(greeting_text)
            
            # Check if we're using client-side TTS
            if isinstance(voice_response, dict) and voice_response.get("use_client_tts"):
                return jsonify({
                    "transcribed": transcribed_text,
                    "text": greeting_text,
                    "client_tts": voice_response,
                    "isOnline": True,
                    "emotion": "happy",
                    "is_greeting": True
                })
            else:
                return jsonify({
                    "transcribed": transcribed_text,
                    "text": greeting_text,
                    "audio": voice_response,
                    "isOnline": True,
                    "emotion": "happy",
                    "is_greeting": True
                })
        
        # Process with Gemini if available, fall back to OpenAI
        if model is not None:
            try:
                prompt = f"""As Mentaura, the AI tutor, explain this concept in a teacher-like way: {transcribed_text}"""
                response = model.generate_content(prompt)
                response_text = response.text
            except Exception as e:
                print(f"Error with Gemini API: {str(e)}")
                response_text = generate_ai_response(transcribed_text, user_id, {})
        else:
            response_text = generate_ai_response(transcribed_text, user_id, {})
        
        # Generate voice if available
        voice_response = generate_speech(response_text)
        
        # Generate structured notes for learning questions
        structured_notes = generate_structured_notes(transcribed_text, transcribed_text)
        
        # Prepare response
        response = {
            "transcribed": transcribed_text,
            "text": response_text,
            "isOnline": True,
            "emotion": "thoughtful"
        }
        
        # Add notes if they were generated
        if structured_notes:
            response["notes"] = structured_notes
        
        # Add audio if available
        if isinstance(voice_response, dict) and voice_response.get("use_client_tts"):
            response["client_tts"] = voice_response
        else:
            response["audio"] = voice_response
        
        return jsonify(response)
    
    except Exception as e:
        print(f"Error in api_process_voice: {str(e)}")
        return jsonify({
            "transcribed": "Error transcribing audio",
            "text": f"I'm sorry, I encountered an error processing your voice input: {str(e)}",
            "isOnline": True,
            "emotion": "concerned"
        }), 500

# Start the Flask app
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting Mentaura backend server on http://localhost:{port}")
    # Important: Use 0.0.0.0 to make it accessible from other machines
    app.run(host="0.0.0.0", port=port, debug=True)

