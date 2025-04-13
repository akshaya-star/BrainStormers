from flask import Blueprint, request, jsonify
from services.ai_service import AIService
import os
import logging
from openai import AuthenticationError, RateLimitError, BadRequestError

# Initialize Blueprint
ai_bp = Blueprint('ai', __name__)

# Setup logging
logger = logging.getLogger('mentaura.ai_routes')

# Initialize AI service
ai_service = AIService()

@ai_bp.route('/process_text', methods=['POST'])
def process_text():
    """Process text input and return AI response"""
    try:
        # Get request data
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        text = data.get('text', '')
        if not text:
            return jsonify({"error": "No text provided"}), 400
            
        user_id = data.get('userId', 'anonymous')
        learning_type = data.get('learningType', 'General')
        context = data.get('context', {})
        
        logger.info(f"Processing text request for user {user_id}: {text[:30]}...")
        
        try:
            # Process the text with AI service
            response = ai_service.process_text(text, user_id, learning_type, context)
            
            # If response is an error dictionary
            if isinstance(response, dict) and response.get('error'):
                error_type = response.get('error_type', 'unknown')
                error_code = response.get('code', 500)
                error_msg = response.get('message', 'Unknown error')
                
                if error_type == 'authentication':
                    # API key error
                    error_text = f"I'm having trouble generating a response. Error code: {error_code} - {error_msg}"
                    return jsonify({
                        "text": error_text,
                        "isOnline": True,
                        "emotion": "concerned",
                        "client_tts": {
                            "use_client_tts": True,
                            "rate": 0.8
                        }
                    })
                elif error_type == 'rate_limit':
                    # Rate limit error
                    retry_after = response.get('retry_after', 60)
                    error_text = f"I'm currently experiencing high demand. Please try again in {retry_after} seconds."
                    return jsonify({
                        "text": error_text,
                        "isOnline": True,
                        "emotion": "concerned",
                        "client_tts": {
                            "use_client_tts": True,
                            "rate": 0.8
                        }
                    })
                else:
                    # Other errors
                    error_text = f"I encountered an issue while processing your request. Please try again later."
                    return jsonify({
                        "text": error_text,
                        "isOnline": True,
                        "emotion": "concerned",
                        "client_tts": {
                            "use_client_tts": True,
                            "rate": 0.8
                        }
                    })
            
            return jsonify(response)
            
        except AuthenticationError as auth_err:
            logger.error(f"Authentication error: {auth_err}")
            return jsonify({
                "text": "There's an issue with the API authentication. Please contact support.",
                "isOnline": True,
                "emotion": "concerned",
                "client_tts": {
                    "use_client_tts": True,
                    "rate": 0.8
                }
            })
        except RateLimitError as rate_err:
            logger.warning(f"Rate limit error: {rate_err}")
            return jsonify({
                "text": "I'm currently experiencing high demand. Please try again in a minute.",
                "isOnline": True,
                "emotion": "concerned",
                "client_tts": {
                    "use_client_tts": True,
                    "rate": 0.8
                }
            })
        except Exception as e:
            logger.error(f"Error processing text: {str(e)}")
            return jsonify({
                "text": "I encountered an issue while processing your request. Please try again.",
                "isOnline": True,
                "emotion": "concerned",
                "client_tts": {
                    "use_client_tts": True,
                    "rate": 0.8
                }
            })
            
    except Exception as e:
        logger.error(f"Error in process_text route: {str(e)}")
        return jsonify({
            "error": str(e)
        }), 500

@ai_bp.route('/generate_image', methods=['POST'])
def generate_image():
    """Generate an image based on text prompt"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        prompt = data.get('prompt', '')
        if not prompt:
            return jsonify({"error": "No prompt provided"}), 400
            
        # Generate image
        result = ai_service.generate_image(prompt)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in generate_image: {str(e)}")
        return jsonify({
            "error": str(e)
        }), 500 