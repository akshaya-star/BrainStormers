from flask import Flask, request, jsonify, session, make_response
from flask_cors import CORS
from flask_socketio import SocketIO
import os
from dotenv import load_dotenv
import logging
from services.ai_service import AIService
from services.speech_service import SpeechService
import json

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'your-secret-key')  # Required for session
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_DOMAIN'] = None  # Allow localhost

# Configure CORS properly
CORS(app, resources={r"/*": {
    "origins": ["http://localhost:8000", "http://127.0.0.1:8000"],
    "supports_credentials": True,
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
    "expose_headers": ["Set-Cookie"]
}})

# Add after_request handler to ensure CORS headers are properly set
@app.after_request
def after_request(response):
    origin = request.headers.get('Origin', '')
    if origin in ['http://localhost:8000', 'http://127.0.0.1:8000']:
        response.headers.add('Access-Control-Allow-Origin', origin)
    else:
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:8000')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Configure SocketIO with CORS
socketio = SocketIO(app, cors_allowed_origins=["http://localhost:8000"], supports_credentials=True)

# Global variable to track if services are loaded
services_loaded = False

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('mentaura')

# Initialize services
ai_service = AIService()
speech_service = SpeechService()

# ✅ OpenAI API Setup - Using the new OpenAI API (v1.0+)
try:
    openai_api_key = os.environ.get("OPENAI_API_KEY")
    if not openai_api_key:
        logger.warning("OPENAI_API_KEY not found in environment variables")
        openai_client = None
    else:
        # Initialize OpenAI client with proper configuration
        from openai import OpenAI
        from openai import BadRequestError, AuthenticationError, RateLimitError
        
        # Validate API key format before initializing client
        if openai_api_key.startswith('sk-') and len(openai_api_key) > 20:
            openai_client = OpenAI(api_key=openai_api_key)
            # Test the API key with a minimal request
            try:
                # Simple models.list request to verify API key works
                openai_client.models.list(limit=1)
                logger.info("OpenAI client initialized and API key validated successfully")
            except AuthenticationError as auth_err:
                logger.error(f"OpenAI API key authentication error: {auth_err}")
                openai_client = None
            except RateLimitError as rate_err:
                logger.warning(f"OpenAI API rate limit error during initialization: {rate_err}")
                # Still initialize the client, we'll handle rate limits during requests
        else:
            logger.error("Invalid OpenAI API key format")
            openai_client = None
except Exception as e:
    logger.error(f"Error initializing OpenAI: {e}")
    openai_client = None

# Add rate limit handling with proper error response
def handle_rate_limit(api_call_func, *args, **kwargs):
    """
    Handle rate limit errors with exponential backoff
    
    Args:
        api_call_func: The API call function to execute
        *args, **kwargs: Arguments to pass to the API call function
        
    Returns:
        API response or error information dictionary
    """
    import time
    from openai import RateLimitError, AuthenticationError, BadRequestError
    
    retry_delay = 30  # Start with 30 seconds
    max_retries = 3
    
    for attempt in range(max_retries):
        try:
            # Execute the API call function
            return api_call_func(*args, **kwargs)
        except RateLimitError as e:
            error_msg = f"Rate limit hit, waiting {retry_delay} seconds before retry {attempt + 1}/{max_retries}"
            logger.warning(error_msg)
            
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            else:
                return {
                    "error": True,
                    "error_type": "rate_limit",
                    "message": str(e),
                    "retry_after": retry_delay,
                    "code": 429
                }
        except AuthenticationError as e:
            logger.error(f"Authentication error: {e}")
            return {
                "error": True,
                "error_type": "authentication",
                "message": str(e),
                "code": 401
            }
        except BadRequestError as e:
            logger.error(f"Bad request error: {e}")
            return {
                "error": True,
                "error_type": "bad_request",
                "message": str(e),
                "code": 400
            }
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return {
                "error": True,
                "error_type": "unexpected",
                "message": str(e),
                "code": 500
            }
    
    return {
        "error": True,
        "error_type": "max_retries",
        "message": "Maximum retries exceeded",
        "code": 429
    }

# Special route for root path OPTIONS requests
@app.route('/', methods=['OPTIONS'])
def options_handler():
    """Handle OPTIONS requests to root path"""
    resp = make_response()
    resp.headers.add('Access-Control-Allow-Origin', 'http://localhost:8000')
    resp.headers.add('Access-Control-Allow-Credentials', 'true')
    resp.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    resp.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return resp

# Homepage Route - this is a simple health check endpoint
@app.route("/")
def home():
    return "🔥 Mentaura AI Backend is Running!"

# Lazy-load services to prevent circular imports
def load_services():
    global services_loaded
    if services_loaded:
        return
        
    # Import service modules
    try:
        from services.auth_service import init_firebase
        from services.ai_service import setup_ai_models
        from services.speech_service import setup_speech_services

        # Import route modules
        from routes.auth_routes import auth_bp
        from routes.learning_routes import learning_bp
        from routes.ai_routes import ai_bp
        from routes.game_routes import game_bp

        # Initialize Firebase
        try:
            db = init_firebase()
        except Exception as e:
            print(f"Firebase initialization error: {e}")
            
        # Setup AI models
        try:
            ai_models = setup_ai_models()
        except Exception as e:
            print(f"AI model setup error: {e}")
            
        # Setup Speech Services
        try:
            speech_services = setup_speech_services()
        except Exception as e:
            print(f"Speech service setup error: {e}")

        # Register blueprints
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(learning_bp, url_prefix='/api/learning')
        app.register_blueprint(ai_bp, url_prefix='/api/ai')
        app.register_blueprint(game_bp, url_prefix='/api/games')
        
        services_loaded = True
    except Exception as e:
        print(f"Error loading services: {e}")

# Call load_services() to initialize everything when the app starts
load_services()

# Health check endpoint
@app.route("/health", methods=['GET', 'OPTIONS'])
def health_check():
    """
    Health check endpoint to verify server status
    """
    if request.method == 'OPTIONS':
        # Handle preflight request
        resp = make_response()
        resp.headers.add('Access-Control-Allow-Origin', 'http://localhost:8000')
        resp.headers.add('Access-Control-Allow-Credentials', 'true')
        resp.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
        resp.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return resp

    response = jsonify({
        "status": "ok", 
        "version": "1.0.0",
        "services_loaded": services_loaded
    })
    return response, 200

# Error handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({
        "error": "Resource not found",
        "status": 404
    }), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({
        "error": "Internal server error",
        "status": 500
    }), 500

# Socket.IO events for real-time communication
@socketio.on('connect')
def handle_connect():
    print('Client connected')
    # Try to load services when a client connects
    load_services()

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('message')
def handle_message(data):
    # Process message and emit response
    print(f"Received message: {data}")
    # You can call your AI service here and emit the response
    # socketio.emit('response', response_data)

@app.route('/api/ai/process-text', methods=['POST'])
def process_text():
    """Process text input for AI responses"""
    try:
        # Get request data
        data = request.json
        text = data.get('text', '')
        user_id = data.get('userId', 'anonymous')
        learning_type = data.get('learningType', 'General')
        generate_notes = data.get('generateStructuredNotes', False)
        generate_emotion = data.get('generateEmotionalSpeech', True)
        include_images = data.get('includeImages', False)
        
        logger.info(f"Processing text request for user {user_id}: {text[:30]}...")
        
        # Process the text with AI service
        response_text = ai_service.query_gemini(text)
        
        # Prepare response
        response = {
            "text": response_text,
            "isOnline": True
        }
        
        # Add emotion if requested
        if generate_emotion:
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
        
        # Generate structured notes if requested
        if generate_notes:
            structured_notes = {
                "title": ai_service._extract_title(response_text),
                "keyPoints": ai_service._extract_key_points(response_text, 3),
                "details": ai_service._extract_details(response_text)
            }
            response["structuredNotes"] = structured_notes
            
            # Add images if requested
            if include_images:
                response["images"] = [
                    {"url": "https://via.placeholder.com/500x300?text=Mentaura+Learning+Visual", 
                     "caption": "Illustrative image for " + structured_notes["title"]}
                ]
        
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error in process_text: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/services', methods=['GET'])
def get_services():
    """Return available services and their status"""
    services = {
        "ai": {
            "gemini": ai_service.gemini_model is not None,
            "openai": bool(os.environ.get("OPENAI_API_KEY"))
        },
        "speech": {
            "googleTTS": speech_service.tts_client is not None,
            "edgeTTS": True,  # Edge TTS is always available as fallback
            "elevenlabs": bool(speech_service.elevenlabs_api_key)
        }
    }
    return jsonify(services)

@app.route('/api/speech-to-text', methods=['POST'])
async def speech_to_text():
    """Convert speech to text"""
    try:
        data = request.json
        audio_data = data.get('audio')
        
        if not audio_data:
            return jsonify({"error": "No audio data provided"}), 400
        
        # Initialize speech service if needed
        if not speech_service.stt_client:
            speech_service.init_google_speech()
        
        # Process speech to text
        transcript = await speech_service.speech_to_text(audio_data)
        
        return jsonify({"text": transcript})
    except Exception as e:
        logger.error(f"Error in speech_to_text: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/text-to-speech', methods=['POST'])
async def text_to_speech():
    """Convert text to speech"""
    try:
        data = request.json
        text = data.get('text')
        voice_settings = data.get('voiceSettings')
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        # Initialize TTS service if needed
        if not speech_service.tts_client:
            speech_service.init_google_tts()
        
        # Process text to speech
        audio_base64 = await speech_service.text_to_speech(text, voice_settings)
        
        if not audio_base64:
            return jsonify({"error": "Failed to generate speech"}), 500
        
        return jsonify({"audio": audio_base64})
    except Exception as e:
        logger.error(f"Error in text_to_speech: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Run the app
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Mentaura backend server on http://localhost:{port} and http://127.0.0.1:{port}")
    socketio.run(app, host='0.0.0.0', port=port, debug=True, allow_unsafe_werkzeug=True) 