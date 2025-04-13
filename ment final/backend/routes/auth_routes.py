from flask import Blueprint, request, jsonify, session, make_response
import firebase_admin
from firebase_admin import auth
import os
import sys
import json
from datetime import datetime

# Add the parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import service modules
from services.auth_service import (
    get_user_by_email, create_user, update_user_profile, 
    get_user_profile, get_user_learning_history
)

# Create a Blueprint for authentication routes
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login a user with email and password"""
    try:
        data = request.json
        
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = data['email']
        password = data['password']
        
        # Get user from Firebase Authentication
        user = get_user_by_email(email)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # For simplicity, we're not verifying the password here
        # In a real application, you would use Firebase Authentication to verify the password
        
        # Get user profile from Firestore
        user_profile = get_user_profile(user.uid)
        
        if not user_profile:
            user_profile = {
                'uid': user.uid,
                'email': user.email,
                'displayName': user.display_name,
                'createdAt': datetime.now().isoformat()
            }
            update_user_profile(user.uid, user_profile)
        
        # Store user ID in session
        session['user_id'] = user.uid
        
        # Create a custom token for the user
        try:
            custom_token = auth.create_custom_token(user.uid)
            
            response = jsonify({
                'token': custom_token.decode('utf-8'),
                'user': {
                    'uid': user.uid,
                    'email': user.email,
                    'displayName': user.display_name,
                    'profile': user_profile
                }
            })
            
            # Set CORS headers for the response
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:8000')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            
            return response
        except Exception as e:
            return jsonify({'error': f'Error creating token: {str(e)}'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user with email and password"""
    try:
        data = request.json
        
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = data['email']
        password = data['password']
        display_name = data.get('displayName', '')
        
        # Create user in Firebase Authentication
        try:
            user = create_user(email, password, display_name)
        except Exception as e:
            return jsonify({'error': f'Error creating user: {str(e)}'}), 400
        
        # Create user profile in Firestore
        user_profile = {
            'uid': user.uid,
            'email': user.email,
            'displayName': user.display_name or display_name,
            'createdAt': datetime.now().isoformat(),
            'preferences': {
                'voice': 'female',
                'teachingStyle': 'detailed',
                'personality': 'friendly',
                'difficulty': 'intermediate',
                'speed': 1.0,
                'pitch': 1.0
            }
        }
        
        update_user_profile(user.uid, user_profile)
        
        # Store user ID in session
        session['user_id'] = user.uid
        
        # Create a custom token for the user
        try:
            custom_token = auth.create_custom_token(user.uid)
            
            response = jsonify({
                'token': custom_token.decode('utf-8'),
                'user': {
                    'uid': user.uid,
                    'email': user.email,
                    'displayName': user.display_name or display_name,
                    'profile': user_profile
                }
            })
            
            # Set CORS headers for the response
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:8000')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            
            return response
        except Exception as e:
            return jsonify({'error': f'Error creating token: {str(e)}'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile', methods=['GET'])
def get_profile():
    """Get user profile"""
    try:
        # Get user ID from request
        user_id = request.args.get('uid')
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        # Get user profile from Firestore
        user_profile = get_user_profile(user_id)
        
        if not user_profile:
            return jsonify({'error': 'User profile not found'}), 404
        
        return jsonify({'profile': user_profile})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile', methods=['PUT'])
def update_profile():
    """Update user profile"""
    try:
        data = request.json
        
        if not data or 'uid' not in data:
            return jsonify({'error': 'User ID is required'}), 400
        
        user_id = data['uid']
        
        # Remove uid from data to avoid overwriting it
        profile_data = {k: v for k, v in data.items() if k != 'uid'}
        
        # Update user profile in Firestore
        success = update_user_profile(user_id, profile_data)
        
        if not success:
            return jsonify({'error': 'Failed to update profile'}), 500
        
        # Get updated user profile
        user_profile = get_user_profile(user_id)
        
        return jsonify({'profile': user_profile})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/learning-history', methods=['GET'])
def learning_history():
    """Get user learning history"""
    try:
        # Get user ID from request
        user_id = request.args.get('uid')
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        # Get user learning history from Firestore
        history = get_user_learning_history(user_id)
        
        return jsonify({'history': history})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/sync-session', methods=['POST', 'OPTIONS'])
def sync_session():
    """Sync user session with Firebase authentication"""
    if request.method == 'OPTIONS':
        return make_response()
        
    try:
        data = request.json
        
        if not data or 'uid' not in data:
            return jsonify({'error': 'User ID is required'}), 400
        
        user_id = data['uid']
        
        # Store user ID in session
        session['user_id'] = user_id
        
        # Set session cookie properties
        session.permanent = True
        
        response = jsonify({'message': 'Session synchronized successfully'})
        return response
        
    except Exception as e:
        print(f"Error syncing session: {str(e)}")
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/check-session', methods=['GET', 'OPTIONS'])
def check_session():
    """Check if user has an active session"""
    if request.method == 'OPTIONS':
        return make_response()
        
    try:
        # Get user ID from session
        user_id = session.get('user_id')
        
        response = jsonify({
            'authenticated': user_id is not None,
            'user_id': user_id
        })
        return response
        
    except Exception as e:
        print(f"Error checking session: {str(e)}")
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST', 'OPTIONS'])
def logout():
    """Clear user session"""
    if request.method == 'OPTIONS':
        return make_response()
        
    try:
        # Clear session
        session.clear()
        
        response = jsonify({'message': 'Logged out successfully'})
        return response
        
    except Exception as e:
        print(f"Error logging out: {str(e)}")
        return jsonify({'error': str(e)}), 500 