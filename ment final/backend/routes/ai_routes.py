from flask import Blueprint, request, jsonify
import os
import sys
import json
import base64
from datetime import datetime
import asyncio

# Add the parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import service modules
from services.ai_service import setup_ai_models
from services.speech_service import setup_speech_services
from services.auth_service import get_user_profile, store_user_learning_data

# Initialize AI models
ai_service = setup_ai_models()

# Initialize speech services
speech_service = setup_speech_services()

# Create a Blueprint for AI routes
ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/process-text', methods=['POST'])
def process_text():
    """Process user's text message and generate AI response"""
    try:
        data = request.json
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Text input is required'}), 400
        
        text_input = data['text']
        user_id = data.get('uid')
        context = data.get('context', '')
        settings = data.get('settings')
        
        # Get user settings if available
        if user_id and not settings:
            user_profile = get_user_profile(user_id)
            if user_profile and 'preferences' in user_profile:
                settings = user_profile['preferences']
        
        # Generate AI response
        response_text = ai_service.query_gemini(text_input, user_settings=settings)
        
        # Generate speech if requested
        audio_response = None
        if 'generateSpeech' in data and data['generateSpeech']:
            audio_response = asyncio.run(speech_service.text_to_speech(response_text, voice_settings=settings))
        
        # Store interaction in user history if user_id is provided
        if user_id:
            # Extract topic from conversation
            topic = extract_topic(text_input, response_text)
            
            # Store interaction in history
            interaction_data = {
                'timestamp': datetime.now().isoformat(),
                'userInput': text_input,
                'aiResponse': response_text,
                'topic': topic,
                'type': 'text'
            }
            
            store_user_learning_data(user_id, interaction_data)
        
        # Return response
        response = {
            'text': response_text
        }
        
        if audio_response:
            response['audio'] = audio_response
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/process-voice', methods=['POST'])
async def process_voice():
    """Process user's voice input and generate AI response with voice"""
    try:
        data = request.json
        
        if not data or 'audio' not in data:
            return jsonify({'error': 'Audio input is required'}), 400
        
        audio_input = data['audio']
        user_id = data.get('uid')
        settings = data.get('settings')
        
        # Get user settings if available
        if user_id and not settings:
            user_profile = get_user_profile(user_id)
            if user_profile and 'preferences' in user_profile:
                settings = user_profile['preferences']
        
        # Convert speech to text
        text_input = await speech_service.speech_to_text(audio_input)
        
        if not text_input or text_input.startswith('Failed to convert'):
            return jsonify({'error': 'Failed to transcribe audio'}), 400
        
        # Generate AI response
        response_text = ai_service.query_gemini(text_input, user_settings=settings)
        
        # Generate speech response
        audio_response = await speech_service.text_to_speech(response_text, voice_settings=settings)
        
        # Store interaction in user history if user_id is provided
        if user_id:
            # Extract topic from conversation
            topic = extract_topic(text_input, response_text)
            
            # Store interaction in history
            interaction_data = {
                'timestamp': datetime.now().isoformat(),
                'userInput': text_input,
                'aiResponse': response_text,
                'topic': topic,
                'type': 'voice'
            }
            
            store_user_learning_data(user_id, interaction_data)
        
        return jsonify({
            'text': response_text,
            'transcribed': text_input,
            'audio': audio_response
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/process-image', methods=['POST'])
def process_image():
    """Process user's image input and generate AI response"""
    try:
        data = request.json
        
        if not data or 'image' not in data:
            return jsonify({'error': 'Image input is required'}), 400
        
        image_input = data['image']
        text_input = data.get('text', 'What is shown in this image?')
        user_id = data.get('uid')
        settings = data.get('settings')
        
        # Get user settings if available
        if user_id and not settings:
            user_profile = get_user_profile(user_id)
            if user_profile and 'preferences' in user_profile:
                settings = user_profile['preferences']
        
        # Generate AI response
        response_text = ai_service.query_gemini(text_input, image=image_input, user_settings=settings)
        
        # Generate speech if requested
        audio_response = None
        if 'generateSpeech' in data and data['generateSpeech']:
            audio_response = asyncio.run(speech_service.text_to_speech(response_text, voice_settings=settings))
        
        # Store interaction in user history if user_id is provided
        if user_id:
            # Extract topic from conversation
            topic = extract_topic(text_input, response_text)
            
            # Store interaction in history
            interaction_data = {
                'timestamp': datetime.now().isoformat(),
                'userInput': text_input,
                'aiResponse': response_text,
                'topic': topic,
                'type': 'image',
                'hasImage': True
            }
            
            store_user_learning_data(user_id, interaction_data)
        
        # Return response
        response = {
            'text': response_text
        }
        
        if audio_response:
            response['audio'] = audio_response
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/generate-notes', methods=['POST'])
def generate_notes():
    """Generate structured notes for a topic"""
    try:
        data = request.json
        
        if not data or 'topic' not in data:
            return jsonify({'error': 'Topic is required'}), 400
        
        topic = data['topic']
        include_diagrams = data.get('includeDiagrams', True)
        user_id = data.get('uid')
        
        # Generate notes
        notes_data = ai_service.generate_notes(topic, include_diagrams)
        
        # Store notes in user history if user_id is provided
        if user_id:
            # Store notes in history
            notes_data_history = {
                'timestamp': datetime.now().isoformat(),
                'topic': topic,
                'notes': notes_data['notes'],
                'type': 'notes',
                'hasDiagram': 'diagram_url' in notes_data and notes_data['diagram_url'] is not None
            }
            
            store_user_learning_data(user_id, notes_data_history)
        
        return jsonify(notes_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/generate-practice-questions', methods=['POST'])
def generate_practice_questions():
    """Generate practice questions for a topic"""
    try:
        data = request.json
        
        if not data or 'topic' not in data:
            return jsonify({'error': 'Topic is required'}), 400
        
        topic = data['topic']
        difficulty = data.get('difficulty', 'intermediate')
        count = data.get('count', 5)
        user_id = data.get('uid')
        
        # Generate practice questions
        questions = ai_service.generate_practice_questions(topic, difficulty, count)
        
        # Store questions in user history if user_id is provided
        if user_id:
            # Store questions in history
            questions_data = {
                'timestamp': datetime.now().isoformat(),
                'topic': topic,
                'questions': questions,
                'difficulty': difficulty,
                'type': 'practice-questions'
            }
            
            store_user_learning_data(user_id, questions_data)
        
        return jsonify({'questions': questions})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/evaluate-answer', methods=['POST'])
def evaluate_answer():
    """Evaluate user's answer to a question"""
    try:
        data = request.json
        
        if not data or 'question' not in data or 'answer' not in data:
            return jsonify({'error': 'Question and answer are required'}), 400
        
        question = data['question']
        answer = data['answer']
        correct_answer = data.get('correctAnswer')
        user_id = data.get('uid')
        
        # Evaluate answer
        evaluation = ai_service.evaluate_answer(question, answer, correct_answer)
        
        # Store evaluation in user history if user_id is provided
        if user_id:
            # Store evaluation in history
            evaluation_data = {
                'timestamp': datetime.now().isoformat(),
                'question': question,
                'userAnswer': answer,
                'evaluation': evaluation,
                'type': 'answer-evaluation'
            }
            
            store_user_learning_data(user_id, evaluation_data)
        
        return jsonify({'evaluation': evaluation})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/suggest-related-topics', methods=['POST'])
def suggest_related_topics():
    """Suggest related topics based on current topic"""
    try:
        data = request.json
        
        if not data or 'topic' not in data:
            return jsonify({'error': 'Topic is required'}), 400
        
        topic = data['topic']
        user_id = data.get('uid')
        
        # Suggest related topics
        suggestions = ai_service.suggest_related_topics(topic)
        
        # Store suggestions in user history if user_id is provided
        if user_id:
            # Store suggestions in history
            suggestions_data = {
                'timestamp': datetime.now().isoformat(),
                'topic': topic,
                'suggestions': suggestions,
                'type': 'related-topics'
            }
            
            store_user_learning_data(user_id, suggestions_data)
        
        return jsonify({'suggestions': suggestions})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/generate-image', methods=['POST'])
def generate_image():
    """Generate image based on prompt"""
    try:
        data = request.json
        
        if not data or 'prompt' not in data:
            return jsonify({'error': 'Prompt is required'}), 400
        
        prompt = data['prompt']
        user_id = data.get('uid')
        
        # Generate image
        image_data = ai_service.generate_image(prompt)
        
        if not image_data:
            return jsonify({'error': 'Failed to generate image'}), 500
        
        # Store image generation in user history if user_id is provided
        if user_id:
            # Store image generation in history
            image_data_history = {
                'timestamp': datetime.now().isoformat(),
                'prompt': prompt,
                'type': 'image-generation',
                'hasImage': True
            }
            
            store_user_learning_data(user_id, image_data_history)
        
        return jsonify({'image': image_data})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Helper functions
def extract_topic(user_input, ai_response):
    """Extract topic from conversation"""
    try:
        # Use a simple heuristic to extract topic from user input
        # In a real application, you might want to use NLP techniques to extract topic
        
        # Split user input into words
        words = user_input.lower().split()
        
        # Remove common words
        common_words = {'what', 'is', 'are', 'how', 'why', 'when', 'where', 'who', 'which', 
                       'can', 'could', 'would', 'should', 'do', 'does', 'did', 'has', 'have', 
                       'had', 'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 
                       'about', 'like', 'of', 'and', 'or', 'but', 'if', 'then', 'than', 'so', 
                       'because', 'since', 'while', 'though', 'although'}
        
        filtered_words = [word for word in words if word not in common_words]
        
        # If we have filtered words, use the first few as topic
        if filtered_words:
            return ' '.join(filtered_words[:3])
        
        # Use a default topic
        return 'General Knowledge'
        
    except Exception as e:
        print(f"Error extracting topic: {e}")
        return 'General Knowledge' 