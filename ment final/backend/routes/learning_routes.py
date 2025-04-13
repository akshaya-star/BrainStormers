from flask import Blueprint, request, jsonify, make_response, session
import os
import sys
import json
from datetime import datetime
import asyncio
import requests

# Add the parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import service modules
from services.ai_service import setup_ai_models
from services.auth_service import (
    get_user_profile, store_user_learning_data, get_user_learning_history,
    get_user_learning_data
)

# Initialize AI models
ai_service = setup_ai_models()

# Create a Blueprint for learning routes
learning_bp = Blueprint('learning', __name__)

@learning_bp.route('/courses', methods=['GET'])
def get_courses():
    """Get available courses"""
    try:
        # For now, we'll return a hardcoded list of courses
        # In a real application, this would be fetched from a database
        courses = [
            {
                'id': 'cs101',
                'title': 'Computer Science Fundamentals',
                'description': 'An introduction to basic computer science concepts',
                'image': 'https://source.unsplash.com/random/300x200/?computer',
                'topics': [
                    'Introduction to Programming',
                    'Data Structures',
                    'Algorithms',
                    'Computer Architecture'
                ],
                'difficulty': 'beginner',
                'duration': '8 weeks'
            },
            {
                'id': 'math101',
                'title': 'Mathematics Fundamentals',
                'description': 'Learn essential mathematical concepts',
                'image': 'https://source.unsplash.com/random/300x200/?math',
                'topics': [
                    'Algebra',
                    'Geometry',
                    'Calculus',
                    'Statistics'
                ],
                'difficulty': 'intermediate',
                'duration': '10 weeks'
            },
            {
                'id': 'phys101',
                'title': 'Physics Fundamentals',
                'description': 'Explore the laws of nature and physics principles',
                'image': 'https://source.unsplash.com/random/300x200/?physics',
                'topics': [
                    'Mechanics',
                    'Thermodynamics',
                    'Electromagnetism',
                    'Modern Physics'
                ],
                'difficulty': 'intermediate',
                'duration': '12 weeks'
            },
            {
                'id': 'webdev',
                'title': 'Full Stack Web Development',
                'description': 'Build modern web applications from scratch',
                'image': 'https://source.unsplash.com/random/300x200/?website',
                'topics': [
                    'HTML & CSS',
                    'JavaScript',
                    'React',
                    'Node.js',
                    'Databases'
                ],
                'difficulty': 'intermediate',
                'duration': '16 weeks'
            }
        ]
        
        return jsonify({'courses': courses})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@learning_bp.route('/course/<course_id>', methods=['GET'])
def get_course(course_id):
    """Get course details by ID"""
    try:
        # For now, we'll return hardcoded course details
        # In a real application, this would be fetched from a database based on course_id
        
        courses = {
            'cs101': {
                'id': 'cs101',
                'title': 'Computer Science Fundamentals',
                'description': 'An introduction to basic computer science concepts',
                'image': 'https://source.unsplash.com/random/300x200/?computer',
                'topics': [
                    {
                        'id': 'cs101-intro',
                        'title': 'Introduction to Programming',
                        'subtopics': [
                            'What is Programming?',
                            'Programming Languages',
                            'Basic Syntax and Variables',
                            'Control Structures'
                        ]
                    },
                    {
                        'id': 'cs101-data',
                        'title': 'Data Structures',
                        'subtopics': [
                            'Arrays and Lists',
                            'Stacks and Queues',
                            'Trees and Graphs',
                            'Hash Tables'
                        ]
                    },
                    {
                        'id': 'cs101-algo',
                        'title': 'Algorithms',
                        'subtopics': [
                            'Sorting Algorithms',
                            'Searching Algorithms',
                            'Recursion',
                            'Complexity Analysis'
                        ]
                    },
                    {
                        'id': 'cs101-arch',
                        'title': 'Computer Architecture',
                        'subtopics': [
                            'CPU and Memory',
                            'Input/Output Systems',
                            'Operating Systems',
                            'Networking Basics'
                        ]
                    }
                ],
                'difficulty': 'beginner',
                'duration': '8 weeks'
            },
            'math101': {
                'id': 'math101',
                'title': 'Mathematics Fundamentals',
                'description': 'Learn essential mathematical concepts',
                'image': 'https://source.unsplash.com/random/300x200/?math',
                'topics': [
                    {
                        'id': 'math101-algebra',
                        'title': 'Algebra',
                        'subtopics': [
                            'Equations and Inequalities',
                            'Functions and Graphs',
                            'Polynomials',
                            'Systems of Equations'
                        ]
                    },
                    {
                        'id': 'math101-geo',
                        'title': 'Geometry',
                        'subtopics': [
                            'Euclidean Geometry',
                            'Triangles and Circles',
                            'Coordinate Geometry',
                            'Transformations'
                        ]
                    },
                    {
                        'id': 'math101-calc',
                        'title': 'Calculus',
                        'subtopics': [
                            'Limits and Continuity',
                            'Derivatives',
                            'Integrals',
                            'Applications of Calculus'
                        ]
                    },
                    {
                        'id': 'math101-stats',
                        'title': 'Statistics',
                        'subtopics': [
                            'Descriptive Statistics',
                            'Probability',
                            'Distributions',
                            'Hypothesis Testing'
                        ]
                    }
                ],
                'difficulty': 'intermediate',
                'duration': '10 weeks'
            }
        }
        
        if course_id not in courses:
            return jsonify({'error': 'Course not found'}), 404
        
        return jsonify({'course': courses[course_id]})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@learning_bp.route('/topics', methods=['GET'])
def get_topics():
    """Get all available learning topics"""
    try:
        # For now, we'll return a hardcoded list of topics
        # In a real application, this would be fetched from a database
        topics = [
            {
                'id': 'prog',
                'title': 'Programming',
                'description': 'Learn various programming languages and concepts',
                'subtopics': [
                    'Python Programming',
                    'JavaScript',
                    'Java Programming',
                    'C++ Programming',
                    'Functional Programming',
                    'Object-Oriented Programming'
                ]
            },
            {
                'id': 'math',
                'title': 'Mathematics',
                'description': 'Explore the world of numbers and mathematical concepts',
                'subtopics': [
                    'Algebra',
                    'Calculus',
                    'Geometry',
                    'Statistics',
                    'Discrete Mathematics',
                    'Linear Algebra'
                ]
            },
            {
                'id': 'science',
                'title': 'Science',
                'description': 'Discover scientific principles and phenomena',
                'subtopics': [
                    'Physics',
                    'Chemistry',
                    'Biology',
                    'Astronomy',
                    'Environmental Science',
                    'Earth Science'
                ]
            },
            {
                'id': 'webdev',
                'title': 'Web Development',
                'description': 'Build websites and web applications',
                'subtopics': [
                    'HTML & CSS',
                    'JavaScript',
                    'React',
                    'Angular',
                    'Vue.js',
                    'Backend Development',
                    'Database Design'
                ]
            },
            {
                'id': 'ai',
                'title': 'Artificial Intelligence',
                'description': 'Learn about AI and machine learning',
                'subtopics': [
                    'Machine Learning',
                    'Deep Learning',
                    'Natural Language Processing',
                    'Computer Vision',
                    'Reinforcement Learning',
                    'AI Ethics'
                ]
            }
        ]
        
        return jsonify({'topics': topics})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@learning_bp.route('/learn/<topic>', methods=['POST'])
def learn_topic(topic):
    """Learn about a specific topic"""
    try:
        data = request.json or {}
        user_id = data.get('uid')
        subtopic = data.get('subtopic', '')
        difficulty = data.get('difficulty', 'intermediate')
        
        # Format the query based on topic and subtopic
        if subtopic:
            query = f"Teach me about {subtopic} in {topic} at {difficulty} level"
        else:
            query = f"Teach me about {topic} at {difficulty} level"
        
        # Get user settings if available
        settings = data.get('settings')
        if user_id and not settings:
            user_profile = get_user_profile(user_id)
            if user_profile and 'preferences' in user_profile:
                settings = user_profile['preferences']
        
        # Generate learning content
        content = ai_service.query_gemini(query, user_settings=settings)
        
        # Generate practice questions
        practice_questions = ai_service.generate_practice_questions(
            topic if not subtopic else f"{subtopic} in {topic}", 
            difficulty
        )
        
        # Suggest related topics
        related_topics = ai_service.suggest_related_topics(
            topic if not subtopic else f"{subtopic} in {topic}"
        )
        
        # Store learning session in user history if user_id is provided
        if user_id:
            learning_data = {
                'timestamp': datetime.now().isoformat(),
                'topic': topic,
                'subtopic': subtopic if subtopic else None,
                'difficulty': difficulty,
                'content': content,
                'type': 'learning-session'
            }
            
            store_user_learning_data(user_id, learning_data)
        
        return jsonify({
            'content': content,
            'practice_questions': practice_questions,
            'related_topics': related_topics
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@learning_bp.route('/progress', methods=['GET'])
def get_learning_progress():
    """Get user's learning progress"""
    try:
        user_id = request.args.get('uid')
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        # Get user's learning history
        learning_history = get_user_learning_history(user_id)
        
        # Process history to calculate progress
        # This is a simplified implementation, in a real application you would
        # have a more sophisticated algorithm to calculate progress
        
        topics = {}
        for entry in learning_history:
            if entry.get('type') == 'learning-session':
                topic = entry.get('topic')
                if topic and topic not in topics:
                    topics[topic] = {
                        'sessions': 1,
                        'last_activity': entry.get('timestamp')
                    }
                elif topic:
                    topics[topic]['sessions'] += 1
                    # Update last activity if newer
                    if entry.get('timestamp') > topics[topic]['last_activity']:
                        topics[topic]['last_activity'] = entry.get('timestamp')
        
        # Convert to list of progress objects
        progress = []
        for topic, data in topics.items():
            # Calculate completion percentage (simplified)
            # In a real application, you would need a more sophisticated algorithm
            completion = min(100, data['sessions'] * 10)  # 10% per session, max 100%
            
            progress.append({
                'topic': topic,
                'completion': completion,
                'last_activity': data['last_activity'],
                'sessions': data['sessions']
            })
        
        # Sort by last activity, most recent first
        progress.sort(key=lambda x: x['last_activity'], reverse=True)
        
        return jsonify({'progress': progress})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@learning_bp.route('/save-progress', methods=['POST'])
def save_learning_progress():
    """Save user's learning progress"""
    try:
        data = request.json
        
        if not data or 'uid' not in data or 'topic' not in data or 'progress' not in data:
            return jsonify({'error': 'User ID, topic, and progress are required'}), 400
        
        user_id = data['uid']
        topic = data['topic']
        progress = data['progress']
        subtopic = data.get('subtopic')
        
        # Store progress in user history
        progress_data = {
            'timestamp': datetime.now().isoformat(),
            'topic': topic,
            'subtopic': subtopic,
            'progress': progress,
            'type': 'progress-update'
        }
        
        store_user_learning_data(user_id, progress_data)
        
        return jsonify({'message': 'Progress saved successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@learning_bp.route('/resources', methods=['GET'])
def get_learning_resources():
    """Get recommended learning resources"""
    try:
        topic = request.args.get('topic', '')
        
        # For now, we'll return a hardcoded list of resources
        # In a real application, this would be fetched from a database
        # or generated dynamically based on the topic
        
        if not topic:
            # Return general resources if no topic specified
            resources = [
                {
                    'id': 'res1',
                    'title': 'Programming Fundamentals',
                    'description': 'Learn the basics of programming with Python',
                    'type': 'book',
                    'image': 'https://source.unsplash.com/random/300x200/?programming'
                },
                {
                    'id': 'res2',
                    'title': 'Mathematics for Beginners',
                    'description': 'A comprehensive guide to essential math concepts',
                    'type': 'book',
                    'image': 'https://source.unsplash.com/random/300x200/?mathematics'
                },
                {
                    'id': 'res3',
                    'title': 'Introduction to Physics',
                    'description': 'Explore the fundamental laws of physics',
                    'type': 'book',
                    'image': 'https://source.unsplash.com/random/300x200/?physics'
                }
            ]
        else:
            # Generate AI-recommended resources based on topic
            prompt = f"""Recommend 3 learning resources (books, courses, or websites) for the topic: {topic}.
            For each resource, provide:
            1. A title
            2. A short description
            3. The type of resource (book, course, website)
            
            Format as a JSON array with objects having these fields:
            id, title, description, type"""
            
            try:
                response = ai_service.query_gemini(prompt)
                
                # Try to parse the response as JSON
                try:
                    parsed_resources = json.loads(response)
                    
                    # Add image URLs
                    for resource in parsed_resources:
                        resource['image'] = f"https://source.unsplash.com/random/300x200/?{topic.replace(' ', '')}"
                    
                    resources = parsed_resources
                except json.JSONDecodeError:
                    # If parsing fails, use default resources
                    resources = [
                        {
                            'id': f"res-{topic.replace(' ', '-')}-1",
                            'title': f"{topic} Fundamentals",
                            'description': f"Learn the basics of {topic}",
                            'type': 'book',
                            'image': f"https://source.unsplash.com/random/300x200/?{topic.replace(' ', '')}"
                        },
                        {
                            'id': f"res-{topic.replace(' ', '-')}-2",
                            'title': f"Advanced {topic}",
                            'description': f"Deep dive into {topic} concepts",
                            'type': 'course',
                            'image': f"https://source.unsplash.com/random/300x200/?{topic.replace(' ', '')}"
                        },
                        {
                            'id': f"res-{topic.replace(' ', '-')}-3",
                            'title': f"{topic} in Practice",
                            'description': f"Apply {topic} knowledge in real-world scenarios",
                            'type': 'website',
                            'image': f"https://source.unsplash.com/random/300x200/?{topic.replace(' ', '')}"
                        }
                    ]
            except Exception as e:
                print(f"Error generating resources: {e}")
                # Use default resources if AI generation fails
                resources = [
                    {
                        'id': f"res-{topic.replace(' ', '-')}-1",
                        'title': f"{topic} Fundamentals",
                        'description': f"Learn the basics of {topic}",
                        'type': 'book',
                        'image': f"https://source.unsplash.com/random/300x200/?{topic.replace(' ', '')}"
                    },
                    {
                        'id': f"res-{topic.replace(' ', '-')}-2",
                        'title': f"Advanced {topic}",
                        'description': f"Deep dive into {topic} concepts",
                        'type': 'course',
                        'image': f"https://source.unsplash.com/random/300x200/?{topic.replace(' ', '')}"
                    },
                    {
                        'id': f"res-{topic.replace(' ', '-')}-3",
                        'title': f"{topic} in Practice",
                        'description': f"Apply {topic} knowledge in real-world scenarios",
                        'type': 'website',
                        'image': f"https://source.unsplash.com/random/300x200/?{topic.replace(' ', '')}"
                    }
                ]
        
        return jsonify({'resources': resources})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@learning_bp.route('/search-books', methods=['GET', 'OPTIONS'])
def search_books():
    """Search for books using Open Library API"""
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:8000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'GET')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    try:
        query = request.args.get('q', '')
        if not query:
            return jsonify({'error': 'Search query is required'}), 400
            
        # Make request to Open Library API
        response = requests.get(
            f'https://openlibrary.org/search.json',
            params={
                'q': query,
                'fields': 'title,author_name,cover_i,first_publish_year,key',
                'limit': 10
            }
        )
        
        if response.status_code != 200:
            return jsonify({'error': 'Failed to search books'}), 500
            
        data = response.json()
        books = []
        
        for doc in data.get('docs', []):
            book = {
                'id': doc.get('key', '').replace('/works/', ''),
                'title': doc.get('title', ''),
                'author': doc.get('author_name', ['Unknown'])[0],
                'year': doc.get('first_publish_year', ''),
                'coverUrl': f"https://covers.openlibrary.org/b/id/{doc.get('cover_i', '')}-M.jpg" if doc.get('cover_i') else None
            }
            books.append(book)
        
        response = jsonify({'books': books})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:8000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@learning_bp.route('/library/remove', methods=['POST', 'OPTIONS'])
def remove_from_library():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:8000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
        
    try:
        # Get user ID from session
        user_id = session.get('user_id')
        if not user_id:
            print("No user ID in session")
            return jsonify({'error': 'User not logged in'}), 401
            
        data = request.get_json()
        item_id = data.get('id')
        item_type = data.get('type')
        
        if not item_id or not item_type:
            return jsonify({'error': 'Missing item ID or type'}), 400
            
        # Get user's learning data from storage
        learning_data = get_user_learning_data(user_id)
        if not learning_data:
            return jsonify({'error': 'No learning data found'}), 404
            
        # Remove the item from the appropriate list
        if item_type == 'book':
            learning_data['books'] = [book for book in learning_data.get('books', []) if book.get('id') != item_id]
        elif item_type == 'course':
            learning_data['courses'] = [course for course in learning_data.get('courses', []) if course.get('id') != item_id]
        else:
            return jsonify({'error': 'Invalid item type'}), 400
            
        # Save the updated data
        store_user_learning_data(user_id, learning_data)
        
        response = jsonify({'message': f'{item_type} removed successfully'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:8000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
        
    except Exception as e:
        print(f"Error removing item from library: {str(e)}")
        response = jsonify({'error': 'Failed to remove item from library'}), 500
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:8000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response 