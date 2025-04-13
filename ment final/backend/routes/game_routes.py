from flask import Blueprint, request, jsonify
import os
import sys
import json
import random
from datetime import datetime

# Add the parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import service modules
from services.ai_service import setup_ai_models
from services.auth_service import get_user_profile, store_user_learning_data

# Initialize AI models
ai_service = setup_ai_models()

# Create a Blueprint for game routes
game_bp = Blueprint('games', __name__)

@game_bp.route('/list', methods=['GET'])
def list_games():
    """Get list of available educational games"""
    try:
        # For now, we'll return a hardcoded list of games
        # In a real application, this would be fetched from a database
        games = [
            {
                'id': 'math-challenge',
                'title': 'Math Challenge',
                'description': 'Test your math skills with fun puzzles',
                'image': 'https://source.unsplash.com/random/300x200/?math',
                'category': 'mathematics',
                'difficulty_levels': ['beginner', 'intermediate', 'advanced']
            },
            {
                'id': 'word-wizard',
                'title': 'Word Wizard',
                'description': 'Expand your vocabulary through play',
                'image': 'https://source.unsplash.com/random/300x200/?words',
                'category': 'language',
                'difficulty_levels': ['beginner', 'intermediate', 'advanced']
            },
            {
                'id': 'science-explorer',
                'title': 'Science Explorer',
                'description': 'Discover scientific concepts through interactive experiments',
                'image': 'https://source.unsplash.com/random/300x200/?science',
                'category': 'science',
                'difficulty_levels': ['beginner', 'intermediate', 'advanced']
            },
            {
                'id': 'knowledge-quiz',
                'title': 'Knowledge Quiz',
                'description': 'Test your knowledge across various subjects',
                'image': 'https://source.unsplash.com/random/300x200/?quiz',
                'category': 'general',
                'difficulty_levels': ['beginner', 'intermediate', 'advanced']
            },
            {
                'id': 'code-master',
                'title': 'Code Master',
                'description': 'Solve programming challenges and learn to code',
                'image': 'https://source.unsplash.com/random/300x200/?programming',
                'category': 'programming',
                'difficulty_levels': ['beginner', 'intermediate', 'advanced']
            },
            {
                'id': 'memory-master',
                'title': 'Memory Master',
                'description': 'Boost cognitive skills with memory and pattern exercises',
                'image': 'https://source.unsplash.com/random/300x200/?brain',
                'category': 'cognitive',
                'difficulty_levels': ['beginner', 'intermediate', 'advanced']
            },
            {
                'id': 'history-quest',
                'title': 'History Quest',
                'description': 'Explore historical events through interactive scenarios',
                'image': 'https://source.unsplash.com/random/300x200/?history',
                'category': 'history',
                'difficulty_levels': ['beginner', 'intermediate', 'advanced']
            },
            {
                'id': 'language-lab',
                'title': 'Language Lab',
                'description': 'Learn new languages through interactive exercises',
                'image': 'https://source.unsplash.com/random/300x200/?language',
                'category': 'languages',
                'difficulty_levels': ['beginner', 'intermediate', 'advanced']
            }
        ]
        
        return jsonify({'games': games})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@game_bp.route('/math-challenge', methods=['POST'])
def math_challenge():
    """Generate math challenge questions"""
    try:
        data = request.json or {}
        difficulty = data.get('difficulty', 'intermediate')
        count = data.get('count', 5)
        topic = data.get('topic', 'general math')
        user_id = data.get('uid')
        
        # Generate math questions based on difficulty and topic
        if difficulty == 'beginner':
            questions = generate_beginner_math_questions(count, topic)
        elif difficulty == 'advanced':
            questions = generate_advanced_math_questions(count, topic)
        else:  # intermediate
            questions = generate_intermediate_math_questions(count, topic)
        
        # Store game session in user history if user_id is provided
        if user_id:
            game_data = {
                'timestamp': datetime.now().isoformat(),
                'game': 'math-challenge',
                'difficulty': difficulty,
                'topic': topic,
                'type': 'game-session'
            }
            
            store_user_learning_data(user_id, game_data)
        
        return jsonify({'questions': questions})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@game_bp.route('/word-wizard', methods=['POST'])
def word_wizard():
    """Generate word wizard game content"""
    try:
        data = request.json or {}
        difficulty = data.get('difficulty', 'intermediate')
        count = data.get('count', 5)
        category = data.get('category', 'general')
        user_id = data.get('uid')
        
        # Generate word challenges based on difficulty and category
        challenges = generate_word_challenges(difficulty, count, category)
        
        # Store game session in user history if user_id is provided
        if user_id:
            game_data = {
                'timestamp': datetime.now().isoformat(),
                'game': 'word-wizard',
                'difficulty': difficulty,
                'category': category,
                'type': 'game-session'
            }
            
            store_user_learning_data(user_id, game_data)
        
        return jsonify({'challenges': challenges})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@game_bp.route('/science-explorer', methods=['POST'])
def science_explorer():
    """Generate science explorer game content"""
    try:
        data = request.json or {}
        topic = data.get('topic', 'physics')
        difficulty = data.get('difficulty', 'intermediate')
        user_id = data.get('uid')
        
        # Generate experiment based on topic and difficulty
        experiment = generate_science_experiment(topic, difficulty)
        
        # Store game session in user history if user_id is provided
        if user_id:
            game_data = {
                'timestamp': datetime.now().isoformat(),
                'game': 'science-explorer',
                'topic': topic,
                'difficulty': difficulty,
                'type': 'game-session'
            }
            
            store_user_learning_data(user_id, game_data)
        
        return jsonify({'experiment': experiment})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@game_bp.route('/knowledge-quiz', methods=['POST'])
def knowledge_quiz():
    """Generate knowledge quiz questions"""
    try:
        data = request.json or {}
        topic = data.get('topic', 'general knowledge')
        difficulty = data.get('difficulty', 'intermediate')
        count = data.get('count', 10)
        user_id = data.get('uid')
        
        # Generate quiz questions based on topic, difficulty, and count
        questions = generate_quiz_questions(topic, difficulty, count)
        
        # Store game session in user history if user_id is provided
        if user_id:
            game_data = {
                'timestamp': datetime.now().isoformat(),
                'game': 'knowledge-quiz',
                'topic': topic,
                'difficulty': difficulty,
                'type': 'game-session'
            }
            
            store_user_learning_data(user_id, game_data)
        
        return jsonify({'questions': questions})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@game_bp.route('/code-master', methods=['POST'])
def code_master():
    """Generate programming challenges"""
    try:
        data = request.json or {}
        difficulty = data.get('difficulty', 'intermediate')
        language = data.get('language', 'python')
        count = data.get('count', 3)
        user_id = data.get('uid')
        
        # Generate programming challenges
        challenges = generate_programming_challenges(difficulty, language, count)
        
        # Store game session in user history if user_id is provided
        if user_id:
            game_data = {
                'timestamp': datetime.now().isoformat(),
                'game': 'code-master',
                'difficulty': difficulty,
                'language': language,
                'type': 'game-session'
            }
            
            store_user_learning_data(user_id, game_data)
        
        return jsonify({'challenges': challenges})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@game_bp.route('/business-tycoon', methods=['POST'])
def business_tycoon():
    """Generate business simulation scenarios"""
    try:
        data = request.json or {}
        difficulty = data.get('difficulty', 'intermediate')
        business_type = data.get('business_type', 'retail')
        user_id = data.get('uid')
        
        # Generate business scenario
        scenario = generate_business_scenario(difficulty, business_type)
        
        # Store game session in user history if user_id is provided
        if user_id:
            game_data = {
                'timestamp': datetime.now().isoformat(),
                'game': 'business-tycoon',
                'difficulty': difficulty,
                'business_type': business_type,
                'type': 'game-session'
            }
            
            store_user_learning_data(user_id, game_data)
        
        return jsonify({'scenario': scenario})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@game_bp.route('/history-quest', methods=['POST'])
def history_quest():
    """Generate historical scenarios and challenges"""
    try:
        data = request.json or {}
        period = data.get('period', 'ancient')
        difficulty = data.get('difficulty', 'intermediate')
        user_id = data.get('uid')
        
        # Generate historical scenario
        scenario = generate_historical_scenario(period, difficulty)
        
        # Store game session in user history if user_id is provided
        if user_id:
            game_data = {
                'timestamp': datetime.now().isoformat(),
                'game': 'history-quest',
                'period': period,
                'difficulty': difficulty,
                'type': 'game-session'
            }
            
            store_user_learning_data(user_id, game_data)
        
        return jsonify({'scenario': scenario})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@game_bp.route('/language-lab', methods=['POST'])
def language_lab():
    """Generate language learning exercises"""
    try:
        data = request.json or {}
        language = data.get('language', 'spanish')
        difficulty = data.get('difficulty', 'intermediate')
        exercise_type = data.get('exercise_type', 'vocabulary')
        user_id = data.get('uid')
        
        # Generate language exercises
        exercises = generate_language_exercises(language, difficulty, exercise_type)
        
        # Store game session in user history if user_id is provided
        if user_id:
            game_data = {
                'timestamp': datetime.now().isoformat(),
                'game': 'language-lab',
                'language': language,
                'difficulty': difficulty,
                'exercise_type': exercise_type,
                'type': 'game-session'
            }
            
            store_user_learning_data(user_id, game_data)
        
        return jsonify({'exercises': exercises})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@game_bp.route('/memory-master', methods=['POST'])
def memory_master():
    """Generate memory game content"""
    try:
        data = request.json or {}
        difficulty = data.get('difficulty', 'intermediate')
        category = data.get('category', 'general')
        count = data.get('count', 10)
        user_id = data.get('uid')
        
        # Generate memory exercise content
        memory_content = generate_memory_content(difficulty, category, count)
        
        # Store game session in user history if user_id is provided
        if user_id:
            game_data = {
                'timestamp': datetime.now().isoformat(),
                'game': 'memory-master',
                'difficulty': difficulty,
                'category': category,
                'type': 'game-session'
            }
            
            store_user_learning_data(user_id, game_data)
        
        return jsonify({'content': memory_content})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Helper functions for math challenge
def generate_beginner_math_questions(count, topic):
    """Generate beginner-level math questions"""
    questions = []
    
    # Generate addition, subtraction, and multiplication questions
    operations = ['+', '-', '*']
    
    for i in range(count):
        operation = random.choice(operations)
        num1 = random.randint(1, 20)
        num2 = random.randint(1, 10)
        
        if operation == '+':
            question = f"What is {num1} + {num2}?"
            answer = num1 + num2
        elif operation == '-':
            # Ensure positive result for beginners
            if num1 < num2:
                num1, num2 = num2, num1
            question = f"What is {num1} - {num2}?"
            answer = num1 - num2
        else:  # multiplication
            question = f"What is {num1} × {num2}?"
            answer = num1 * num2
        
        questions.append({
            'id': f"math-{i+1}",
            'question': question,
            'type': 'number',
            'answer': str(answer)
        })
    
    return questions

def generate_intermediate_math_questions(count, topic):
    """Generate intermediate-level math questions"""
    questions = []
    
    # Generate more complex operations including division and exponents
    operations = ['+', '-', '*', '/', 'exponent']
    
    for i in range(count):
        operation = random.choice(operations)
        
        if operation == '+':
            num1 = random.randint(10, 100)
            num2 = random.randint(10, 100)
            question = f"Calculate {num1} + {num2}"
            answer = num1 + num2
        elif operation == '-':
            num1 = random.randint(50, 150)
            num2 = random.randint(10, 50)
            question = f"Calculate {num1} - {num2}"
            answer = num1 - num2
        elif operation == '*':
            num1 = random.randint(5, 20)
            num2 = random.randint(5, 20)
            question = f"Calculate {num1} × {num2}"
            answer = num1 * num2
        elif operation == '/':
            # Ensure clean division for intermediate level
            num2 = random.randint(2, 10)
            num1 = num2 * random.randint(2, 10)
            question = f"Calculate {num1} ÷ {num2}"
            answer = num1 // num2
        else:  # exponent
            base = random.randint(2, 10)
            exponent = random.randint(2, 3)
            question = f"Calculate {base}^{exponent} (power)"
            answer = base ** exponent
        
        questions.append({
            'id': f"math-{i+1}",
            'question': question,
            'type': 'number',
            'answer': str(answer)
        })
    
    return questions

def generate_advanced_math_questions(count, topic):
    """Generate advanced-level math questions using AI"""
    questions = []
    
    # Use AI to generate advanced math questions based on topic
    prompt = f"""Generate {count} advanced-level math questions about {topic}.
    For each question, provide:
    1. A clear and concise question
    2. The correct answer (must be a numerical value)
    
    Example format:
    [
      {{
        "id": "math-1",
        "question": "Calculate the derivative of f(x) = x^3 + 2x^2 - 4x + 7 at x = 2",
        "type": "number",
        "answer": "22"
      }}
    ]"""
    
    try:
        response = ai_service.query_gemini(prompt)
        
        # Try to parse the response as JSON
        try:
            parsed_questions = json.loads(response)
            
            if isinstance(parsed_questions, list) and len(parsed_questions) > 0:
                questions = parsed_questions
            else:
                # Fallback to manually generated questions
                questions = generate_intermediate_math_questions(count, topic)
                
        except json.JSONDecodeError:
            # Fallback to manually generated questions
            questions = generate_intermediate_math_questions(count, topic)
            
    except Exception as e:
        print(f"Error generating math questions: {e}")
        questions = generate_intermediate_math_questions(count, topic)
    
    return questions

def verify_math_answer(question, user_answer, correct_answer=None):
    """Verify user's answer to a math question"""
    try:
        # If correct_answer is provided, use it
        if correct_answer:
            correct = str(user_answer).strip() == str(correct_answer).strip()
            return {
                'isCorrect': correct,
                'correctAnswer': correct_answer,
                'explanation': get_math_explanation(question, correct_answer)
            }
        
        # Otherwise, try to extract the answer from the question
        # This is a simplified approach and would need more robust parsing in a real app
        
        # Extract the operation and numbers from the question
        parts = question.split()
        numbers = []
        operation = ''
        
        for part in parts:
            # Try to extract numbers
            try:
                numbers.append(int(part))
            except ValueError:
                # Check for operations
                if '+' in part:
                    operation = '+'
                elif '-' in part:
                    operation = '-'
                elif '×' in part or '*' in part:
                    operation = '*'
                elif '÷' in part or '/' in part:
                    operation = '/'
                elif '^' in part:
                    operation = '^'
        
        # Calculate the answer
        calculated_answer = None
        if len(numbers) >= 2:
            if operation == '+':
                calculated_answer = numbers[0] + numbers[1]
            elif operation == '-':
                calculated_answer = numbers[0] - numbers[1]
            elif operation == '*':
                calculated_answer = numbers[0] * numbers[1]
            elif operation == '/':
                calculated_answer = numbers[0] // numbers[1]
            elif operation == '^':
                calculated_answer = numbers[0] ** numbers[1]
        
        if calculated_answer is not None:
            correct = str(user_answer).strip() == str(calculated_answer).strip()
            return {
                'isCorrect': correct,
                'correctAnswer': str(calculated_answer),
                'explanation': get_math_explanation(question, calculated_answer)
            }
        
        # If we couldn't calculate the answer, use AI to evaluate
        prompt = f"""Question: {question}
        User's answer: {user_answer}
        
        Is the user's answer correct? Provide:
        1. Whether the answer is correct (true/false)
        2. The correct answer
        3. A brief explanation
        
        Format as JSON: {{"isCorrect": true/false, "correctAnswer": "answer", "explanation": "explanation"}}"""
        
        response = ai_service.query_gemini(prompt)
        
        try:
            result = json.loads(response)
            return result
        except json.JSONDecodeError:
            # Fallback response
            return {
                'isCorrect': False,
                'correctAnswer': 'Unknown',
                'explanation': 'Could not evaluate your answer.'
            }
        
    except Exception as e:
        print(f"Error verifying math answer: {e}")
        return {
            'isCorrect': False,
            'correctAnswer': 'Unknown',
            'explanation': 'Could not evaluate your answer due to an error.'
        }

def get_math_explanation(question, answer):
    """Generate explanation for a math question"""
    prompt = f"""Question: {question}
    Correct answer: {answer}
    
    Provide a brief, clear explanation for how to solve this math problem."""
    
    try:
        explanation = ai_service.query_gemini(prompt)
        return explanation
    except Exception:
        return "To solve this problem, apply the correct mathematical operation to the given numbers."

# Helper functions for other games can be implemented similarly
def generate_word_challenges(difficulty, count, category):
    """Generate word challenges for Word Wizard game"""
    # Simplified implementation - in a real app, you would use a more sophisticated approach
    return []

def generate_memory_content(difficulty, category, count):
    """Generate memory game exercises based on difficulty and category"""
    content = {
        'pairs': [],
        'sequences': [],
        'patterns': []
    }
    
    if category == 'general' or category == 'visual':
        # Visual memory pairs (like card matching)
        emoji_pairs = [
            {'id': '1', 'content': '🍎', 'match': 'apple', 'category': 'fruit'},
            {'id': '2', 'content': '🍌', 'match': 'banana', 'category': 'fruit'},
            {'id': '3', 'content': '🍒', 'match': 'cherry', 'category': 'fruit'},
            {'id': '4', 'content': '🍇', 'match': 'grapes', 'category': 'fruit'},
            {'id': '5', 'content': '🐶', 'match': 'dog', 'category': 'animal'},
            {'id': '6', 'content': '🐱', 'match': 'cat', 'category': 'animal'},
            {'id': '7', 'content': '🐭', 'match': 'mouse', 'category': 'animal'},
            {'id': '8', 'content': '🐰', 'match': 'rabbit', 'category': 'animal'},
            {'id': '9', 'content': '🚗', 'match': 'car', 'category': 'transport'},
            {'id': '10', 'content': '✈️', 'match': 'airplane', 'category': 'transport'},
            {'id': '11', 'content': '🚢', 'match': 'ship', 'category': 'transport'},
            {'id': '12', 'content': '🚲', 'match': 'bicycle', 'category': 'transport'},
            {'id': '13', 'content': '🏠', 'match': 'house', 'category': 'building'},
            {'id': '14', 'content': '🏫', 'match': 'school', 'category': 'building'},
            {'id': '15', 'content': '🏥', 'match': 'hospital', 'category': 'building'}
        ]
        
        # Select a subset based on count
        selected_pairs = random.sample(emoji_pairs, min(count // 2, len(emoji_pairs)))
        content['pairs'] = selected_pairs
    
    if category == 'general' or category == 'sequence':
        # Sequence memory (like Simon Says game)
        if difficulty == 'beginner':
            length = 3
        elif difficulty == 'advanced':
            length = 7
        else:  # intermediate
            length = 5
            
        # Generate random sequences
        colors = ['red', 'blue', 'green', 'yellow']
        for i in range(3):  # Generate 3 sequences
            sequence = [random.choice(colors) for _ in range(length)]
            content['sequences'].append({
                'id': f'seq-{i+1}',
                'elements': sequence,
                'display_time': 1000 if difficulty == 'advanced' else 1500  # milliseconds
            })
    
    if category == 'general' or category == 'pattern':
        # Pattern recognition for advanced cognitive memory
        pattern_templates = [
            {'pattern': [1, 3, 5, 7, 9], 'rule': 'Add 2 to each number', 'next': 11},
            {'pattern': [2, 4, 8, 16, 32], 'rule': 'Multiply by 2', 'next': 64},
            {'pattern': [1, 1, 2, 3, 5, 8], 'rule': 'Fibonacci sequence (add previous two numbers)', 'next': 13},
            {'pattern': [3, 6, 9, 12, 15], 'rule': 'Add 3', 'next': 18},
            {'pattern': [1, 4, 9, 16, 25], 'rule': 'Square numbers', 'next': 36},
            {'pattern': [1, 8, 27, 64], 'rule': 'Cube numbers', 'next': 125}
        ]
        
        # Filter by difficulty
        if difficulty == 'beginner':
            pattern_templates = pattern_templates[:2]
        elif difficulty == 'intermediate':
            pattern_templates = pattern_templates[2:4]
        # Use all for advanced
        
        # Select patterns
        selected_patterns = random.sample(pattern_templates, min(3, len(pattern_templates)))
        content['patterns'] = selected_patterns
    
    return content

def generate_science_experiment(topic, difficulty):
    """Generate science experiment for Science Explorer game"""
    # Define science experiments by topic and difficulty
    experiments = {
        "physics": {
            "beginner": {
                "title": "Simple Pendulum Motion",
                "description": "Explore how the length of a pendulum affects its swing rate.",
                "materials": ["String", "Small weight", "Stopwatch", "Ruler"],
                "instructions": [
                    "Tie the weight to the end of the string",
                    "Measure and record different string lengths",
                    "For each length, time how long it takes for 10 complete swings",
                    "Calculate the period (time for one swing) by dividing by 10",
                    "Graph the relationship between length and period"
                ],
                "questions": [
                    {
                        "question": "What happens to the period when you double the pendulum length?",
                        "options": ["It doubles", "It increases by 1.4 times (√2)", "It stays the same", "It halves"],
                        "correctAnswer": 1,
                        "explanation": "The period of a pendulum is proportional to the square root of its length. So doubling the length increases the period by a factor of √2 ≈ 1.4."
                    },
                    {
                        "question": "Which of these factors affects a pendulum's period?",
                        "options": ["Weight of the bob", "Amplitude of swing (for small swings)", "Length of string", "Color of the string"],
                        "correctAnswer": 2,
                        "explanation": "For small swings, a pendulum's period depends primarily on its length and gravity, not on the weight or the amplitude."
                    }
                ]
            },
            "intermediate": {
                "title": "Electrical Circuits Lab",
                "description": "Build simple circuits and understand electrical components.",
                "materials": ["Batteries", "Light bulbs", "Wires", "Switches", "Resistors"],
                "instructions": [
                    "Create a simple circuit with one battery and one light bulb",
                    "Observe what happens when you add a switch to the circuit",
                    "Try connecting batteries in series vs. parallel and note the difference",
                    "Add resistors and observe their effect on bulb brightness"
                ],
                "questions": [
                    {
                        "question": "In a series circuit with two light bulbs, if one bulb burns out, what happens?",
                        "options": ["Only that bulb goes out", "Both bulbs go out", "The other bulb gets brighter", "The battery explodes"],
                        "correctAnswer": 1,
                        "explanation": "In a series circuit, all components share a single path. If that path is broken anywhere (like when a bulb burns out), the entire circuit stops working."
                    },
                    {
                        "question": "What happens to current flow when resistors are added to a circuit?",
                        "options": ["It increases", "It decreases", "It remains the same", "It reverses direction"],
                        "correctAnswer": 1,
                        "explanation": "Resistors limit the flow of current in a circuit. Adding more resistance decreases the current, following Ohm's Law (V=IR)."
                    }
                ]
            },
            "advanced": {
                "title": "Projectile Motion Analysis",
                "description": "Study the physics of objects launched into the air.",
                "materials": ["Ball launcher", "Measuring tape", "Stopwatch", "Protractor", "Graph paper"],
                "instructions": [
                    "Set up the launcher at a measured height",
                    "Launch the ball at different angles",
                    "Measure the distance traveled and time in air",
                    "Calculate initial velocity using the equations of motion",
                    "Graph the relationship between launch angle and distance"
                ],
                "questions": [
                    {
                        "question": "Which launch angle gives maximum horizontal distance?",
                        "options": ["30 degrees", "45 degrees", "60 degrees", "90 degrees"],
                        "correctAnswer": 1,
                        "explanation": "For a projectile launched from ground level, 45 degrees gives the maximum range. This is a result of the mathematics of projectile motion."
                    },
                    {
                        "question": "If you double the initial velocity of a projectile, how does the maximum height change?",
                        "options": ["It doubles", "It increases 4 times", "It increases by √2", "It remains the same"],
                        "correctAnswer": 1,
                        "explanation": "The maximum height is proportional to the square of the initial vertical velocity. Doubling the initial velocity increases the maximum height by a factor of 4."
                    }
                ]
            }
        },
        "chemistry": {
            "beginner": {
                "title": "Acid-Base Indicators",
                "description": "Learn how indicators change color based on pH levels.",
                "materials": ["Red cabbage juice", "Vinegar", "Baking soda", "Lemon juice", "Clear cups"],
                "instructions": [
                    "Create red cabbage juice by boiling chopped red cabbage",
                    "Pour small amounts into clear cups",
                    "Add different household substances (vinegar, soap, etc.)",
                    "Observe and record color changes",
                    "Classify substances as acidic, neutral, or basic"
                ],
                "questions": [
                    {
                        "question": "What color does red cabbage indicator turn in an acid?",
                        "options": ["Blue", "Green", "Purple", "Pink/Red"],
                        "correctAnswer": 3,
                        "explanation": "Red cabbage contains a natural indicator called anthocyanin that turns pink or red in acids."
                    },
                    {
                        "question": "Which of these is basic (not acidic)?",
                        "options": ["Lemon juice", "Vinegar", "Baking soda solution", "Cola"],
                        "correctAnswer": 2,
                        "explanation": "Baking soda (sodium bicarbonate) forms a basic solution when dissolved in water, with a pH greater than 7."
                    }
                ]
            },
            "intermediate": {
                "title": "Reaction Rates Experiment",
                "description": "Investigate factors that affect chemical reaction speeds.",
                "materials": ["Alka-Seltzer tablets", "Water at different temperatures", "Beakers", "Stopwatch", "Thermometer"],
                "instructions": [
                    "Measure equal volumes of water at different temperatures",
                    "Drop identical pieces of Alka-Seltzer into each beaker",
                    "Time how long it takes for the tablet to completely dissolve",
                    "Graph the relationship between temperature and dissolution time",
                    "Repeat with different sized tablet pieces to test surface area effects"
                ],
                "questions": [
                    {
                        "question": "How does increasing temperature typically affect reaction rate?",
                        "options": ["Decreases it", "No effect", "Increases it", "Changes the products formed"],
                        "correctAnswer": 2,
                        "explanation": "Higher temperatures give molecules more kinetic energy, making collisions more frequent and energetic, which increases reaction rates."
                    },
                    {
                        "question": "Why does crushing an Alka-Seltzer tablet make it dissolve faster?",
                        "options": ["It changes the chemical composition", "It increases surface area", "It generates heat", "It creates a catalyst"],
                        "correctAnswer": 1,
                        "explanation": "Crushing increases the surface area exposed to water, allowing more simultaneous reactions at the solid-liquid interface."
                    }
                ]
            },
            "advanced": {
                "title": "Electrochemistry: Metal Plating",
                "description": "Create an electrochemical cell to plate one metal onto another.",
                "materials": ["Copper sulfate solution", "Zinc strip", "Copper strip", "Battery", "Wires with alligator clips", "Beaker"],
                "instructions": [
                    "Create a copper sulfate solution",
                    "Connect the copper strip to the battery's positive terminal",
                    "Connect the object to be plated to the negative terminal",
                    "Place both in the solution (not touching)",
                    "Observe the plating process over time",
                    "Weigh objects before and after to calculate mass transfer"
                ],
                "questions": [
                    {
                        "question": "In copper electroplating, which electrode gains mass?",
                        "options": ["Anode (positive)", "Cathode (negative)", "Both", "Neither"],
                        "correctAnswer": 1,
                        "explanation": "The cathode (negative electrode) gains mass as copper ions from the solution are reduced to copper metal and deposited on it."
                    },
                    {
                        "question": "What determines the amount of metal plated in electroplating?",
                        "options": ["Temperature only", "Current, time, and molar mass", "Volume of solution", "Color of solution"],
                        "correctAnswer": 1,
                        "explanation": "According to Faraday's laws of electrolysis, the mass deposited is proportional to current × time × molar mass / charge."
                    }
                ]
            }
        },
        "biology": {
            "beginner": {
                "title": "Photosynthesis Investigation",
                "description": "Explore how light affects plant oxygen production.",
                "materials": ["Elodea (water plant)", "Clear containers", "Baking soda", "Light source", "Ruler"],
                "instructions": [
                    "Place Elodea sprigs in water with baking soda (CO2 source)",
                    "Position containers at different distances from light",
                    "Count oxygen bubbles produced per minute",
                    "Graph relationship between light intensity and bubble production",
                    "Try different colors of light to test wavelength effects"
                ],
                "questions": [
                    {
                        "question": "What gas do plants release during photosynthesis?",
                        "options": ["Carbon dioxide", "Nitrogen", "Oxygen", "Hydrogen"],
                        "correctAnswer": 2,
                        "explanation": "During photosynthesis, plants use carbon dioxide and water to produce glucose and oxygen. The oxygen is released as a byproduct."
                    },
                    {
                        "question": "Why is baking soda added to the water in this experiment?",
                        "options": ["To change the water pH", "To provide carbon dioxide", "To make the water clearer", "To kill bacteria"],
                        "correctAnswer": 1,
                        "explanation": "Baking soda (sodium bicarbonate) dissolves in water to release carbon dioxide, which plants need for photosynthesis."
                    }
                ]
            },
            "intermediate": {
                "title": "Enzyme Activity Lab",
                "description": "Study how enzymes are affected by temperature and pH.",
                "materials": ["Liver tissue (source of catalase)", "Hydrogen peroxide", "Test tubes", "Water bath", "pH buffers"],
                "instructions": [
                    "Set up test tubes with hydrogen peroxide at different temperatures",
                    "Add equal amounts of liver tissue to each tube",
                    "Measure the height of oxygen bubbles produced",
                    "Repeat with solutions of different pH levels",
                    "Graph enzyme activity vs. temperature and pH"
                ],
                "questions": [
                    {
                        "question": "What happens to enzyme activity when temperature exceeds the optimal range?",
                        "options": ["It continues increasing", "It remains constant", "It decreases due to denaturation", "It becomes more specific"],
                        "correctAnswer": 2,
                        "explanation": "High temperatures cause enzymes to denature (lose their 3D structure), which reduces or eliminates their catalytic activity."
                    },
                    {
                        "question": "What is catalase breaking down in this experiment?",
                        "options": ["Water", "Oxygen", "Hydrogen peroxide", "Liver cells"],
                        "correctAnswer": 2,
                        "explanation": "Catalase is an enzyme that breaks down hydrogen peroxide (H₂O₂) into water and oxygen. The bubbles observed are oxygen gas."
                    }
                ]
            },
            "advanced": {
                "title": "DNA Extraction",
                "description": "Extract DNA from fruit cells using household materials.",
                "materials": ["Fruits (strawberries/bananas)", "Dish soap", "Salt", "Rubbing alcohol", "Blender", "Coffee filter"],
                "instructions": [
                    "Blend fruit with salt and water",
                    "Add dish soap to break down cell membranes",
                    "Filter the mixture to remove solid materials",
                    "Layer cold alcohol on top of the filtered mixture",
                    "Observe DNA precipitating at the interface",
                    "Use a stick to collect the DNA strands"
                ],
                "questions": [
                    {
                        "question": "What is the purpose of dish soap in DNA extraction?",
                        "options": ["To clean the equipment", "To break down cell and nuclear membranes", "To dissolve the DNA", "To improve the taste"],
                        "correctAnswer": 1,
                        "explanation": "Dish soap contains detergents that disrupt the lipid bilayers of cell and nuclear membranes, releasing DNA into solution."
                    },
                    {
                        "question": "Why is cold alcohol used in DNA extraction?",
                        "options": ["To freeze the cells", "To kill bacteria", "To make DNA less soluble so it precipitates", "To improve visibility"],
                        "correctAnswer": 2,
                        "explanation": "DNA is soluble in water but not in alcohol. The cold temperature helps the DNA precipitate more effectively as visible strands."
                    }
                ]
            }
        }
    }
    
    # Default to physics if unknown topic
    if topic not in experiments:
        topic = "physics"
    
    # Default to intermediate if unknown difficulty
    if difficulty not in ["beginner", "intermediate", "advanced"]:
        difficulty = "intermediate"
    
    # Return the experiment data
    experiment_data = experiments[topic][difficulty]
    
    # Add topic and difficulty to the returned data
    experiment_data["topic"] = topic
    experiment_data["difficulty"] = difficulty
    
    return experiment_data

def generate_quiz_questions(topic, difficulty, count):
    """Generate quiz questions for Knowledge Quiz game"""
    # Simplified implementation - in a real app, you would use a more sophisticated approach
    return []

def verify_word_answer(question, user_answer, correct_answer):
    """Verify user's answer to a word challenge"""
    # Simplified implementation - in a real app, you would use a more sophisticated approach
    return {}

def verify_science_answer(question, user_answer, correct_answer):
    """Verify user's answer to a science experiment question"""
    try:
        # If correct_answer is provided, use it to check
        if correct_answer is not None:
            # Convert to appropriate type for comparison
            if isinstance(correct_answer, (int, float)):
                user_answer = float(user_answer) if user_answer else 0
                is_correct = abs(user_answer - float(correct_answer)) < 0.01  # Allow small rounding differences
            else:
                # Case-insensitive string comparison for text answers
                is_correct = str(user_answer).lower().strip() == str(correct_answer).lower().strip()
        else:
            # Handle multiple choice questions provided as index
            if isinstance(user_answer, (int, str)) and str(user_answer).isdigit():
                user_idx = int(user_answer)
                # Check if the question itself contains the correct answer index
                if isinstance(question, dict) and 'correctAnswer' in question:
                    is_correct = user_idx == question['correctAnswer']
                else:
                    # Default behavior if we can't determine correctness
                    is_correct = False
            else:
                # For open-ended questions where exact matching isn't possible
                # In a real implementation, this would use AI to evaluate answers
                is_correct = False
        
        # Generate appropriate feedback
        if is_correct:
            feedback = "Correct! "
            if isinstance(question, dict) and 'explanation' in question:
                feedback += question['explanation']
            else:
                feedback += "Your understanding of this scientific concept is spot on."
        else:
            feedback = "Incorrect. "
            if isinstance(question, dict) and 'explanation' in question:
                feedback += question['explanation']
            else:
                feedback += "Review the scientific principles involved and try again."
        
        return {
            'isCorrect': is_correct,
            'feedback': feedback,
            'correctAnswer': correct_answer
        }
    except Exception as e:
        # Handle any errors that occur during verification
        return {
            'isCorrect': False,
            'feedback': f"We couldn't verify your answer due to a technical issue: {str(e)}",
            'error': str(e)
        }

def verify_quiz_answer(question, user_answer, correct_answer):
    """Verify user's answer to a quiz question"""
    # Simplified implementation - in a real app, you would use a more sophisticated approach
    return {}

def recommend_games_for_user(user_profile):
    """Recommend games based on user's learning history"""
    # Simplified implementation - in a real app, you would use a more sophisticated approach
    return []

def recommend_games_for_topic(topic):
    """Recommend games based on topic"""
    # Simplified implementation - in a real app, you would use a more sophisticated approach
    return [] 