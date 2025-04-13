/**
 * Mentaura Frontend Integration
 * Script to integrate the Mentaura API with the existing frontend
 */

// Initialize the API client
const api = new MentauraAPI();

// Ensure required methods exist on the API object (fallback implementations)
if (!api.generatePracticeQuestions) {
    api.generatePracticeQuestions = async function(topic) {
        console.log('Using fallback generatePracticeQuestions for topic:', topic);
        
        // Topic-specific practice questions
        const topicQuestions = {
            'ecosystem': `
1. What are the main components of an ecosystem?
2. Explain the difference between a food chain and a food web.
3. How does energy flow through an ecosystem?
4. What is the role of decomposers in an ecosystem?
5. How do abiotic factors influence ecosystem dynamics?
            `,
            'environment': `
1. What are the main causes of climate change?
2. Explain the concept of environmental sustainability.
3. How do human activities impact biodiversity?
4. What are renewable energy sources and why are they important?
5. Explain the greenhouse effect and its role in global warming.
            `,
            'biology': `
1. What is the cell theory and why is it important?
2. Explain the process of photosynthesis and its significance.
3. How does natural selection drive evolution?
4. What is the structure and function of DNA?
5. How do organisms maintain homeostasis?
            `,
            'history': `
1. What were the main causes of World War II?
2. How did the Industrial Revolution change society?
3. What led to the fall of the Roman Empire?
4. Compare and contrast the American and French Revolutions.
5. How did the Cold War shape modern international relations?
            `,
            'mathematics': `
1. Solve the quadratic equation: 2x² + 5x - 3 = 0
2. Explain the Pythagorean theorem and give an example of its application.
3. What is calculus used for in real-world applications?
4. Solve the following system of equations: 3x + 2y = 7 and x - y = 1
5. What is the difference between permutation and combination?
            `,
            'computer science': `
1. What is the difference between a stack and a queue data structure?
2. Explain the concept of object-oriented programming.
3. What is the time complexity of a binary search algorithm?
4. How does a recursive function work? Provide an example.
5. What is the difference between HTTP and HTTPS?
            `,
            'physics': `
1. Explain Newton's three laws of motion.
2. What is the difference between potential and kinetic energy?
3. How does electromagnetic radiation work?
4. Explain the theory of relativity in simple terms.
5. What is the relationship between force, mass, and acceleration?
            `,
            'chemistry': `
1. Explain the periodic table's organization and trends.
2. What is the difference between an acid and a base?
3. How do ionic and covalent bonds differ?
4. Explain the concept of stoichiometry in chemical reactions.
5. What are the key differences between organic and inorganic chemistry?
            `
        };
        
        // Check if we have specific questions for this topic
        for (const [key, questions] of Object.entries(topicQuestions)) {
            if (topic.toLowerCase().includes(key)) {
                console.log(`Found specific practice questions for ${key}`);
                return { questions: questions.trim() };
            }
        }
        
        // Generic questions for any topic
        return {
            questions: `
1. What are the key components of ${topic}?
2. Explain the main principles behind ${topic}.
3. How does ${topic} relate to real-world applications?
4. What are the advantages and disadvantages of ${topic}?
5. How has ${topic} evolved over time?
            `.trim()
        };
    };
}

if (!api.suggestRelatedTopics) {
    api.suggestRelatedTopics = async function(topic) {
        console.log('Using fallback suggestRelatedTopics for topic:', topic);
        
        // Define topic-specific related topics
        const topicMap = {
            'ecosystem': [
                'biodiversity', 
                'food webs', 
                'ecological succession', 
                'ecosystem services',
                'habitat conservation'
            ],
            'environment': [
                'climate change', 
                'pollution control', 
                'renewable energy', 
                'sustainable development',
                'environmental policy'
            ],
            'biology': [
                'cell biology', 
                'genetics', 
                'evolution', 
                'ecology',
                'physiology'
            ],
            'history': [
                'ancient civilizations', 
                'world wars', 
                'industrial revolution', 
                'cold war',
                'renaissance'
            ],
            'mathematics': [
                'algebra', 
                'calculus', 
                'geometry', 
                'statistics',
                'number theory'
            ],
            'computer science': [
                'programming languages', 
                'data structures', 
                'algorithms', 
                'artificial intelligence',
                'database systems'
            ],
            'physics': [
                'mechanics', 
                'thermodynamics', 
                'quantum physics', 
                'relativity',
                'electromagnetism'
            ],
            'chemistry': [
                'organic chemistry', 
                'inorganic chemistry', 
                'biochemistry', 
                'analytical chemistry',
                'physical chemistry'
            ]
        };
        
        // Check if we have specific related topics for this topic
        for (const [key, relatedTopics] of Object.entries(topicMap)) {
            if (topic.toLowerCase().includes(key)) {
                console.log(`Found specific related topics for ${key}`);
                return { related_topics: relatedTopics };
            }
        }
        
        // If no specific match, create generic related topics
        return {
            related_topics: [
                `${topic} fundamentals`,
                `advanced ${topic}`,
                `${topic} applications`,
                `history of ${topic}`,
                `future trends in ${topic}`
            ]
        };
    };
}

if (!api.getLearningHistory) {
    api.getLearningHistory = async function() {
        console.log('Using fallback getLearningHistory');
        const messages = JSON.parse(localStorage.getItem('mentaura_messages') || '[]');
        const history = [];
        
        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            
            if (message.sender === 'user') {
                const text = message.text.toLowerCase().trim();
                
                // Skip greetings and short messages
                if (text === 'hi' || text === 'hello' || text.length < 5) {
                    continue;
                }
                
                // Get AI response if available
                let response = '';
                if (i + 1 < messages.length && messages[i + 1].sender === 'ai') {
                    response = messages[i + 1].text;
                }
                
                // Add to learning history
                history.push({
                    topic: text.length > 20 ? text.substring(0, 20) + '...' : text,
                    question: message.text,
                    answer: response,
                    timestamp: message.timestamp || new Date().toISOString()
                });
            }
        }
        
        return { history };
    };
}

// DOM elements for integration
const sendMessageBtn = document.getElementById('send-message');
const userInputField = document.getElementById('user-input');
const conversationHistory = document.getElementById('conversation-history');
const voiceInputBtn = document.getElementById('voice-input');
const imageUploadBtn = document.getElementById('image-upload');
const loginSubmitBtn = document.getElementById('login-submit');
const practiceQuestionsBtn = document.getElementById('practice-questions-btn');
const newTopicBtn = document.getElementById('new-topic-btn');
const learningHistoryBtn = document.getElementById('learning-history-btn');

// Check if elements exist before adding event listeners
if (sendMessageBtn && userInputField && conversationHistory) {
    // Text message handling
    sendMessageBtn.addEventListener('click', async function() {
        await sendMessage();
    });
    
    userInputField.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

if (voiceInputBtn) {
    // Voice input handling
    voiceInputBtn.addEventListener('click', function() {
        startVoiceRecording();
    });
}

if (imageUploadBtn) {
    // Image upload handling
    imageUploadBtn.addEventListener('click', function() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.click();
        
        fileInput.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                processImageInput(file);
            }
        });
    });
}

if (loginSubmitBtn) {
    // Login handling
    loginSubmitBtn.addEventListener('click', async function() {
        const usernameInput = document.getElementById('login-username');
        const username = usernameInput.value.trim();
        
        if (username) {
            // For simplicity, we're just storing the username
            // In a real app, you would authenticate with email/password
            localStorage.setItem('mentaura_username', username);
            
            // Mock user ID for now
            const mockUserId = `user_${Date.now()}`;
            api.setUserId(mockUserId);
            
            // Hide modal
            const loginModal = document.getElementById('login-modal');
            if (loginModal) {
                loginModal.style.display = 'none';
            }
            
            // Update UI
            document.getElementById('username').textContent = username;
            document.getElementById('learning-type').textContent = 'Type: Visual Learner';
        }
    });
}

if (practiceQuestionsBtn) {
    // Practice questions handling
    practiceQuestionsBtn.addEventListener('click', async function() {
        // Get current topic from conversation or default to a general topic
        const topic = getCurrentTopicFromConversation() || 'general knowledge';
        
        try {
            console.log('Attempting to generate practice questions for topic:', topic);
            
            if (typeof api.generatePracticeQuestions !== 'function') {
                console.error('Error: api.generatePracticeQuestions is not a function!');
                throw new Error('API method not available');
            }
            
            const response = await api.generatePracticeQuestions(topic);
            
            if (!response || !response.questions) {
                console.error('Invalid response format:', response);
                throw new Error('Invalid response format');
            }
            
            displayPracticeQuestions(response.questions);
        } catch (error) {
            console.error('Error generating practice questions:', error);
            addSystemMessage('Failed to generate practice questions. Please try again later.');
        }
    });
}

if (newTopicBtn) {
    // New topic suggestion handling
    newTopicBtn.addEventListener('click', async function() {
        // Get current topic from conversation or default to a general topic
        const topic = getCurrentTopicFromConversation() || 'general knowledge';
        
        try {
            console.log('Attempting to suggest related topics for:', topic);
            
            if (typeof api.suggestRelatedTopics !== 'function') {
                console.error('Error: api.suggestRelatedTopics is not a function!');
                throw new Error('API method not available');
            }
            
            const response = await api.suggestRelatedTopics(topic);
            
            if (!response || !response.related_topics || !Array.isArray(response.related_topics)) {
                console.error('Invalid response format:', response);
                throw new Error('Invalid response format');
            }
            
            if (response.related_topics.length > 0) {
                // Format the topics as a list for the modal
                const topicsHtml = response.related_topics.map(topic => 
                    `<div class="topic-item">${topic}</div>`
                ).join('');
                
                // Display topics in a modal similar to practice questions
                displayRelatedTopics(topicsHtml, topic);
            } else {
                throw new Error('No related topics found');
            }
        } catch (error) {
            console.error('Error suggesting related topics:', error);
            addSystemMessage('Failed to suggest related topics. Please try again later.');
        }
    });
}

if (learningHistoryBtn) {
    // Learning history handling
    learningHistoryBtn.addEventListener('click', async function() {
        try {
            console.log('Attempting to fetch learning history');
            
            if (typeof api.getLearningHistory !== 'function') {
                console.error('Error: api.getLearningHistory is not a function!');
                throw new Error('API method not available');
            }
            
            const response = await api.getLearningHistory();
            
            if (!response || typeof response.history === 'undefined') {
                console.error('Invalid response format:', response);
                throw new Error('Invalid response format');
            }
            
            displayLearningHistory(response.history);
        } catch (error) {
            console.error('Error fetching learning history:', error);
            addSystemMessage('Failed to fetch learning history. Please try again later.');
        }
    });
}

// Helper Functions

/**
 * Sends a message to the AI and displays the response
 */
async function sendMessage() {
    const message = userInputField.value.trim();
    if (!message) return;
    
    // Add user message to conversation
    addUserMessage(message);
    
    // Clear input field
    userInputField.value = '';
    
    // Show typing indicator
    const typingIndicator = addTypingIndicator();
    
    try {
        // Check if this is a follow-up request
        const lowerMessage = message.toLowerCase();
        const isFollowUp = lowerMessage.includes('explain again') || 
                          lowerMessage.includes('what about') ||
                          lowerMessage.includes('can you explain') ||
                          lowerMessage.includes('tell me more') ||
                          lowerMessage.includes('how about') ||
                          lowerMessage.includes('continue') ||
                          lowerMessage.includes('go on') ||
                          lowerMessage.includes('and');
        
        // Get conversation history for context
        const messages = JSON.parse(localStorage.getItem('mentaura_messages') || '[]');
        const recentMessages = messages.slice(-5); // Get last 5 messages
        
        // Find the last AI message for context
        const lastAIMessage = [...recentMessages].reverse().find(msg => msg.sender === 'ai');
        
        // Process the message with context
        const response = await api.processText(message, {
            generateSpeech: true,
            context: {
                recentMessages,
                isFollowUp,
                lastAIMessage: lastAIMessage ? lastAIMessage.text : null,
                userMessage: message
            }
        });
        
        // Remove typing indicator
        if (typingIndicator) {
            conversationHistory.removeChild(typingIndicator);
        }
        
        // Add AI response to conversation
        addAIMessage(response.text, response.audio);
        
    } catch (error) {
        console.error('Error processing message:', error);
        
        // Remove typing indicator
        if (typingIndicator) {
            conversationHistory.removeChild(typingIndicator);
        }
        
        // Show error message
        addSystemMessage('Sorry, I encountered an error. Please try again.');
    }
}

/**
 * Starts voice recording for speech input
 */
function startVoiceRecording() {
    // Check if browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support audio recording');
        return;
    }
    
    // Show recording indicator
    addSystemMessage('Recording... Speak now');
    
    // Get audio stream
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            // Create media recorder
            const mediaRecorder = new MediaRecorder(stream);
            const audioChunks = [];
            
            // Add recording indicator UI
            const recordingIndicator = document.createElement('div');
            recordingIndicator.className = 'recording-indicator';
            recordingIndicator.innerHTML = '<i class="fas fa-microphone"></i> Recording...';
            document.body.appendChild(recordingIndicator);
            
            // Set up event handlers
            mediaRecorder.addEventListener('dataavailable', event => {
                audioChunks.push(event.data);
            });
            
            mediaRecorder.addEventListener('stop', async () => {
                // Remove recording indicator
                if (recordingIndicator) {
                    document.body.removeChild(recordingIndicator);
                }
                
                // Convert audio chunks to blob
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                
                // Convert blob to base64
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64Audio = reader.result.split(',')[1];
                    
                    // Process audio with API
                    processVoiceInput(base64Audio);
                };
                reader.readAsDataURL(audioBlob);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            });
            
            // Start recording
            mediaRecorder.start();
            
            // Stop recording after 5 seconds
            setTimeout(() => {
                if (mediaRecorder.state !== 'inactive') {
                    mediaRecorder.stop();
                }
            }, 5000);
        })
        .catch(error => {
            console.error('Error accessing microphone:', error);
            addSystemMessage('Failed to access microphone. Please check permissions.');
        });
}

/**
 * Processes voice input
 * @param {string} base64Audio - Base64 encoded audio
 */
async function processVoiceInput(base64Audio) {
    // Show typing indicator
    const typingIndicator = addTypingIndicator();
    
    try {
        // Call API
        const response = await api.processVoice(base64Audio);
        
        // Remove typing indicator
        if (typingIndicator) {
            conversationHistory.removeChild(typingIndicator);
        }
        
        // Add user message with transcribed text
        addUserMessage(response.transcribed);
        
        // Check if this is a greeting response
        if (response.is_greeting) {
            // For greetings, only play audio without showing text
            addAIMessage('', response.audio);
        } else {
            // Normal response with both text and audio
            addAIMessage(response.text, response.audio);
        }
        
    } catch (error) {
        console.error('Error processing voice input:', error);
        
        // Remove typing indicator
        if (typingIndicator) {
            conversationHistory.removeChild(typingIndicator);
        }
        
        // Add error message
        addSystemMessage('Sorry, I encountered an error processing your voice input. Please try again.');
    }
}

/**
 * Processes image input
 * @param {File} file - Image file
 */
async function processImageInput(file) {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
        addSystemMessage('Please select an image file.');
        return;
    }
    
    // Show typing indicator
    const typingIndicator = addTypingIndicator();
    
    // Add image preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const imagePreview = document.createElement('div');
        imagePreview.className = 'message user-message';
        imagePreview.innerHTML = `
            <div class="avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <img src="${e.target.result}" alt="User uploaded image" style="max-width: 300px; max-height: 200px;">
            </div>
        `;
        conversationHistory.appendChild(imagePreview);
        conversationHistory.scrollTop = conversationHistory.scrollHeight;
    };
    reader.readAsDataURL(file);
    
    // Convert image to base64
    const base64Reader = new FileReader();
    base64Reader.onloadend = async () => {
        const base64Image = base64Reader.result.split(',')[1];
        
        try {
            // Call API
            const response = await api.processImage(base64Image);
            
            // Remove typing indicator
            if (typingIndicator) {
                conversationHistory.removeChild(typingIndicator);
            }
            
            // Add AI response
            addAIMessage(response.text, response.audio);
            
        } catch (error) {
            console.error('Error processing image input:', error);
            
            // Remove typing indicator
            if (typingIndicator) {
                conversationHistory.removeChild(typingIndicator);
            }
            
            // Add error message
            addSystemMessage('Sorry, I encountered an error processing your image. Please try again.');
        }
    };
    base64Reader.readAsDataURL(file);
}

/**
 * Adds a user message to the conversation
 * @param {string} message - User message
 */
function addUserMessage(message) {
    const userMessageElement = document.createElement('div');
    userMessageElement.className = 'message user-message';
    userMessageElement.innerHTML = `
        <div class="avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    conversationHistory.appendChild(userMessageElement);
    conversationHistory.scrollTop = conversationHistory.scrollHeight;
}

/**
 * Adds an AI message to the conversation
 * @param {string} message - AI message
 * @param {string} audioBase64 - Base64 encoded audio
 */
function addAIMessage(message, audioBase64) {
    const aiMessageElement = document.createElement('div');
    aiMessageElement.className = 'message ai-message';
    
    let audioHtml = '';
    if (audioBase64) {
        const audioSrc = `data:audio/mp3;base64,${audioBase64}`;
        audioHtml = `
            <div class="audio-controls">
                <audio controls>
                    <source src="${audioSrc}" type="audio/mp3">
                    Your browser does not support the audio element.
                </audio>
            </div>
        `;
    }
    
    // Only show message text if there is a message
    const messageHtml = message ? `<p>${message}</p>` : '';
    
    aiMessageElement.innerHTML = `
        <div class="avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            ${messageHtml}
            ${audioHtml}
            <div class="feedback-buttons">
                <button class="feedback-btn like-btn" title="Like">
                    <i class="fas fa-thumbs-up"></i>
                </button>
                <button class="feedback-btn dislike-btn" title="Dislike">
                    <i class="fas fa-thumbs-down"></i>
                </button>
            </div>
        </div>
    `;
    
    conversationHistory.appendChild(aiMessageElement);
    conversationHistory.scrollTop = conversationHistory.scrollHeight;
    
    // Auto-play audio if available
    if (audioBase64) {
        const audio = aiMessageElement.querySelector('audio');
        if (audio) {
            // Always try to play the audio, especially important for greeting responses
            audio.play().catch(e => {
                console.log('Auto-play prevented by browser', e);
                // Show a hint if autoplay is blocked
                if (!message) {
                    const messageContent = aiMessageElement.querySelector('.message-content');
                    const autoplayMsg = document.createElement('p');
                    autoplayMsg.className = 'autoplay-hint';
                    autoplayMsg.textContent = 'Click to hear Mentaura speak';
                    messageContent.insertBefore(autoplayMsg, messageContent.firstChild);
                }
            });
        }
    }
    
    // Add event listeners for feedback buttons
    const likeBtn = aiMessageElement.querySelector('.like-btn');
    const dislikeBtn = aiMessageElement.querySelector('.dislike-btn');
    
    if (likeBtn && dislikeBtn) {
        likeBtn.addEventListener('click', function() {
            // Toggle liked state
            if (this.classList.contains('liked')) {
                this.classList.remove('liked');
            } else {
                this.classList.add('liked');
                dislikeBtn.classList.remove('disliked'); // Remove disliked from the other button
            }
            
            // Here you could also send feedback to the server
            console.log('User liked response');
        });
        
        dislikeBtn.addEventListener('click', function() {
            // Toggle disliked state
            if (this.classList.contains('disliked')) {
                this.classList.remove('disliked');
            } else {
                this.classList.add('disliked');
                likeBtn.classList.remove('liked'); // Remove liked from the other button
            }
            
            // Here you could also send feedback to the server
            console.log('User disliked response');
        });
    }
}

/**
 * Adds a system message to the conversation
 * @param {string} message - System message
 */
function addSystemMessage(message) {
    const systemMessageElement = document.createElement('div');
    systemMessageElement.className = 'message system-message';
    systemMessageElement.innerHTML = `
        <div class="avatar">
            <i class="fas fa-info-circle"></i>
        </div>
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    conversationHistory.appendChild(systemMessageElement);
    conversationHistory.scrollTop = conversationHistory.scrollHeight;
}

/**
 * Adds a typing indicator to the conversation
 * @returns {HTMLElement} - The typing indicator element
 */
function addTypingIndicator() {
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message ai-message typing-indicator';
    typingIndicator.innerHTML = `
        <div class="avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    conversationHistory.appendChild(typingIndicator);
    conversationHistory.scrollTop = conversationHistory.scrollHeight;
    return typingIndicator;
}

/**
 * Extracts the current topic from the conversation
 * @returns {string|null} - The current topic or null if not found
 */
function getCurrentTopicFromConversation() {
    // Get all messages from conversation
    const messages = conversationHistory.querySelectorAll('.message-content p');
    if (messages.length === 0) return null;
    
    // Check the last few messages (preferring user messages)
    const lastMessages = Array.from(messages).slice(-5);
    
    // Common topic keywords with expanded list
    const topicKeywords = [
        // Academic subjects
        'math', 'mathematics', 'algebra', 'calculus', 'geometry', 'trigonometry',
        'physics', 'chemistry', 'biology', 'science', 'ecosystem', 'environment',
        'programming', 'coding', 'computer science', 'algorithm', 'data structure',
        'history', 'geography', 'literature', 'language', 'english', 'spanish', 'french',
        'economics', 'politics', 'philosophy', 'psychology', 'sociology',
        'art', 'music', 'design', 'architecture',
        
        // Common learning topics
        'climate change', 'renewable energy', 'sustainable development',
        'artificial intelligence', 'machine learning', 'neural network',
        'quantum physics', 'relativity', 'thermodynamics',
        'evolution', 'genetics', 'dna', 'cell biology',
        'world war', 'ancient civilization', 'renaissance', 'industrial revolution'
    ];
    
    // First, check for exact topic mentions in user questions
    for (const message of lastMessages) {
        const text = message.textContent.toLowerCase();
        
        // Look for "what is X" or "tell me about X" patterns
        const whatIsMatch = text.match(/what\s+is\s+(?:an\s+|a\s+)?([a-z\s]+)\??/);
        if (whatIsMatch && whatIsMatch[1]) {
            const topic = whatIsMatch[1].trim();
            if (topic.length > 2) {
                console.log('Extracted topic from question:', topic);
                return topic;
            }
        }
        
        const tellMeMatch = text.match(/tell\s+me\s+about\s+([a-z\s]+)/);
        if (tellMeMatch && tellMeMatch[1]) {
            const topic = tellMeMatch[1].trim();
            if (topic.length > 2) {
                console.log('Extracted topic from request:', topic);
                return topic;
            }
        }
    }
    
    // Then check for topic keywords in messages
    for (const message of lastMessages) {
        const text = message.textContent.toLowerCase();
        for (const keyword of topicKeywords) {
            if (text.includes(keyword)) {
                console.log('Found topic keyword in message:', keyword);
                return keyword;
            }
        }
    }
    
    // If no specific topic is found, look for nouns in the last user message
    const lastUserMessage = Array.from(conversationHistory.querySelectorAll('.user-message .message-content p'))
        .pop()?.textContent.toLowerCase();
        
    if (lastUserMessage) {
        // Extract potential topic by looking for nouns (simple heuristic)
        const words = lastUserMessage.split(/\s+/);
        for (const word of words) {
            // Skip short words, common verbs, articles, and prepositions
            if (word.length <= 2 || ['is', 'are', 'was', 'were', 'do', 'does', 'can', 'will', 
                'the', 'and', 'but', 'or', 'in', 'on', 'at', 'to', 'for', 'with'].includes(word)) {
                continue;
            }
            
            // Return the first substantial word as a potential topic
            if (word.length > 3) {
                console.log('Using noun from user message as topic:', word);
                return word;
            }
        }
    }
    
    return 'general knowledge';
}

/**
 * Debug function to check for elements with high z-index that might overlay our modal
 */
function checkForOverlappingElements() {
    console.log('Checking for elements that might overlap the modal...');
    
    // Get all elements in the document
    const allElements = document.querySelectorAll('*');
    const highZIndexElements = [];
    
    // Check each element's z-index
    allElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        const zIndex = parseInt(computedStyle.zIndex);
        
        // If z-index is high and not auto/NaN, add to our list
        if (!isNaN(zIndex) && zIndex > 1000) {
            highZIndexElements.push({
                element: element.tagName,
                id: element.id,
                classes: element.className,
                zIndex: zIndex,
                position: computedStyle.position,
                display: computedStyle.display,
                visibility: computedStyle.visibility
            });
        }
    });
    
    // Sort by z-index (highest first)
    highZIndexElements.sort((a, b) => b.zIndex - a.zIndex);
    
    // Log elements with high z-index
    if (highZIndexElements.length > 0) {
        console.log('Found elements with high z-index values that might overlap the modal:');
        console.table(highZIndexElements);
    } else {
        console.log('No elements with high z-index found.');
    }
}

/**
 * Displays practice questions
 * @param {string} questions - String of practice questions
 */
function displayPracticeQuestions(questions) {
    console.log('Displaying practice questions:', questions);
    
    // Attempt direct approach first
    try {
        // Check for potential overlapping elements
        checkForOverlappingElements();
        
        // First check if there's already a practice questions modal
        let existingModal = document.getElementById('practice-questions-modal');
        if (existingModal) {
            console.log('Removing existing modal');
            existingModal.parentNode.removeChild(existingModal);
        }
        
        // Get the active content area to inject our modal
        const activeTab = document.querySelector('.tab-content.active');
        console.log('Active tab found:', !!activeTab);
        
        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.id = 'practice-questions-modal';
        
        // Apply more direct styles
        const modalStyles = `
            <style>
                #practice-questions-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.85);
                    z-index: 999999;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    visibility: visible !important;
                }
                
                #practice-questions-modal .modal-box {
                    background-color: white;
                    padding: 25px;
                    border-radius: 8px;
                    box-shadow: 0 0 25px rgba(0, 0, 0, 0.5);
                    max-width: 650px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    position: relative;
                    z-index: 1000000;
                }
                
                #practice-questions-modal h2 {
                    color: #0056b3;
                    margin-top: 0;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #eee;
                    padding-bottom: 10px;
                }
                
                #practice-questions-modal .questions-content {
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                    line-height: 1.6;
                    white-space: pre-wrap;
                    margin-bottom: 20px;
                    font-size: 16px;
                }
                
                #practice-questions-modal .close-btn {
                    background-color: #0056b3;
                    color: white;
                    border: none;
                    padding: 10px 25px;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                    display: block;
                    margin: 0 auto;
                    transition: background-color 0.2s;
                }
                
                #practice-questions-modal .close-btn:hover {
                    background-color: #003d7a;
                }
            </style>
        `;
        
        // Set HTML content
        modalContainer.innerHTML = `
            ${modalStyles}
            <div class="modal-box">
                <h2>Practice Questions</h2>
                <div class="questions-content">${questions}</div>
                <button class="close-btn">Close</button>
            </div>
        `;
        
        // Append to appropriate container
        const targetContainer = activeTab || document.body;
        console.log('Inserting modal into container:', targetContainer.id || 'body');
        targetContainer.appendChild(modalContainer);
        
        // Add event listeners
        const closeButton = modalContainer.querySelector('.close-btn');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                console.log('Close button clicked');
                modalContainer.parentNode.removeChild(modalContainer);
            });
        }
        
        // Close when clicking outside
        modalContainer.addEventListener('click', function(event) {
            if (event.target === modalContainer) {
                console.log('Clicked outside modal content');
                modalContainer.parentNode.removeChild(modalContainer);
            }
        });
        
        // Verify visibility
        setTimeout(() => {
            console.log('Modal element exists:', !!document.getElementById('practice-questions-modal'));
            const modal = document.getElementById('practice-questions-modal');
            
            if (!modal || window.getComputedStyle(modal).visibility === 'hidden') {
                console.log('Modal appears to be hidden, trying fallback alert');
                showQuestionsFallback(questions);
            }
        }, 200);
    } catch (error) {
        console.error('Error displaying modal:', error);
        showQuestionsFallback(questions);
    }
}

/**
 * Fallback for displaying questions using an alert
 * @param {string} questions - String of practice questions
 */
function showQuestionsFallback(questions) {
    console.log('Using alert fallback for practice questions');
    
    // Create a system message for the chat
    addSystemMessage(`
        <strong>Practice Questions:</strong>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 10px;">
            <pre style="white-space: pre-wrap; margin: 0;">${questions}</pre>
        </div>
    `);
    
    // Also use a basic alert as a last resort
    setTimeout(() => {
        alert("Practice Questions:\n\n" + questions);
    }, 100);
}

/**
 * Displays learning history
 * @param {Array} history - Array of learning history entries
 */
function displayLearningHistory(history) {
    // Check if history exists and has entries
    if (!history || !Array.isArray(history) || history.length === 0) {
        console.log('No learning history found, showing sample data');
        
        // Create sample history data to demonstrate UI
        history = [
            {
                topic: 'ecosystem',
                question: 'What is an ecosystem?',
                answer: 'An ecosystem is a community of living organisms interacting with each other and their physical environment.',
                timestamp: new Date().toISOString(),
                activity: 'Learning about ecosystems'
            },
            {
                topic: 'mathematics',
                question: 'How do I solve quadratic equations?',
                answer: 'Quadratic equations can be solved using the quadratic formula: x = (-b ± √(b² - 4ac)) / 2a',
                timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                activity: 'Practicing algebra'
            },
            {
                topic: 'history',
                question: 'What were the causes of World War I?',
                answer: 'The main causes of World War I included militarism, alliances, imperialism, and nationalism.',
                timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                activity: 'Studying modern history'
            }
        ];
    }
    
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'history-modal';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Add header
    const header = document.createElement('h2');
    header.textContent = 'Your Learning History';
    header.style.borderBottom = '2px solid #0056b3';
    header.style.paddingBottom = '10px';
    header.style.marginBottom = '20px';
    modalContent.appendChild(header);
    
    // If using sample data, show disclaimer
    if (!history || !Array.isArray(history) || history.length === 0) {
        const disclaimer = document.createElement('div');
        disclaimer.className = 'history-disclaimer';
        disclaimer.innerHTML = `
            <p><i class="fas fa-info-circle"></i> This is sample data to demonstrate how your learning history will appear. 
            Real history will be recorded as you interact with Mentaura.</p>
        `;
        disclaimer.style.backgroundColor = '#f8f9fa';
        disclaimer.style.padding = '10px';
        disclaimer.style.borderRadius = '5px';
        disclaimer.style.marginBottom = '20px';
        modalContent.appendChild(disclaimer);
    }
    
    // Group history entries by date
    const groupedHistory = {};
    history.forEach(entry => {
        const date = new Date(entry.timestamp);
        const dateString = date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        if (!groupedHistory[dateString]) {
            groupedHistory[dateString] = [];
        }
        
        groupedHistory[dateString].push({
            ...entry,
            formattedTime: date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })
        });
    });
    
    // Sort dates in descending order (newest first)
    const sortedDates = Object.keys(groupedHistory).sort((a, b) => {
        return new Date(b) - new Date(a);
    });
    
    // Create content for each date group
    sortedDates.forEach(dateString => {
        const dateGroup = document.createElement('div');
        dateGroup.className = 'history-date-group';
        
        // Add date header
        const dateHeader = document.createElement('div');
        dateHeader.className = 'history-date';
        dateHeader.textContent = dateString;
        dateGroup.appendChild(dateHeader);
        
        // Add entries for this date
        groupedHistory[dateString].forEach(entry => {
            const historyEntry = document.createElement('div');
            historyEntry.className = 'history-entry';
            
            // Add time
            const timeElement = document.createElement('div');
            timeElement.className = 'history-time';
            timeElement.textContent = entry.formattedTime;
            historyEntry.appendChild(timeElement);
            
            // Add topic if available
            if (entry.topic) {
                const topicElement = document.createElement('div');
                topicElement.className = 'history-topic';
                topicElement.textContent = entry.topic;
                historyEntry.appendChild(topicElement);
            }
            
            // Add content
            const contentElement = document.createElement('div');
            contentElement.className = 'history-content';
            
            // If we have question/answer, show that
            if (entry.question) {
                contentElement.innerHTML = `
                    <strong>Q:</strong> ${entry.question}
                    ${entry.answer ? `<br><strong>A:</strong> ${entry.answer.substring(0, 100)}${entry.answer.length > 100 ? '...' : ''}` : ''}
                `;
            } else {
                contentElement.textContent = entry.activity || 'Learning session';
            }
            
            historyEntry.appendChild(contentElement);
            dateGroup.appendChild(historyEntry);
        });
        
        modalContent.appendChild(dateGroup);
    });
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.id = 'close-history';
    closeButton.textContent = 'Close';
    modalContent.appendChild(closeButton);
    
    // Append content to modal
    modal.appendChild(modalContent);
    
    // Append modal to document body
    document.body.appendChild(modal);
    
    // Display modal
    modal.style.display = 'block';
    
    // Add event listener to close button
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Close modal when clicking outside of the content
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

/**
 * Displays related topics in a modal
 * @param {string} topicsHtml - HTML string of related topics
 * @param {string} currentTopic - The current topic being explored
 */
function displayRelatedTopics(topicsHtml, currentTopic) {
    console.log('Displaying related topics for:', currentTopic);
    
    // Attempt direct approach first
    try {
        // Check for potential overlapping elements
        checkForOverlappingElements();
        
        // First check if there's already a related topics modal
        let existingModal = document.getElementById('related-topics-modal');
        if (existingModal) {
            console.log('Removing existing modal');
            existingModal.parentNode.removeChild(existingModal);
        }
        
        // Get the active content area to inject our modal
        const activeTab = document.querySelector('.tab-content.active');
        console.log('Active tab found:', !!activeTab);
        
        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.id = 'related-topics-modal';
        
        // Apply styles - similar to practice questions
        const modalStyles = `
            <style>
                #related-topics-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.85);
                    z-index: 999999;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    visibility: visible !important;
                }
                
                #related-topics-modal .modal-box {
                    background-color: white;
                    padding: 25px;
                    border-radius: 8px;
                    box-shadow: 0 0 25px rgba(0, 0, 0, 0.5);
                    max-width: 650px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    position: relative;
                    z-index: 1000000;
                }
                
                #related-topics-modal h2 {
                    color: #0056b3;
                    margin-top: 0;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #eee;
                    padding-bottom: 10px;
                }
                
                #related-topics-modal .topics-content {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-bottom: 20px;
                }
                
                #related-topics-modal .topic-item {
                    background-color: #f8f9fa;
                    padding: 12px 18px;
                    border-radius: 5px;
                    line-height: 1.4;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-left: 3px solid #0056b3;
                }
                
                #related-topics-modal .topic-item:hover {
                    background-color: #e2e6ea;
                    transform: translateY(-2px);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                #related-topics-modal .close-btn {
                    background-color: #0056b3;
                    color: white;
                    border: none;
                    padding: 10px 25px;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                    display: block;
                    margin: 0 auto;
                    transition: background-color 0.2s;
                }
                
                #related-topics-modal .close-btn:hover {
                    background-color: #003d7a;
                }
            </style>
        `;
        
        // Set HTML content
        modalContainer.innerHTML = `
            ${modalStyles}
            <div class="modal-box">
                <h2>Related Topics to "${currentTopic}"</h2>
                <div class="topics-content">${topicsHtml}</div>
                <button class="close-btn">Close</button>
            </div>
        `;
        
        // Append to appropriate container
        const targetContainer = activeTab || document.body;
        console.log('Inserting modal into container:', targetContainer.id || 'body');
        targetContainer.appendChild(modalContainer);
        
        // Add event listeners
        const closeButton = modalContainer.querySelector('.close-btn');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                console.log('Close button clicked');
                modalContainer.parentNode.removeChild(modalContainer);
            });
        }
        
        // Add click events to topics
        const topicItems = modalContainer.querySelectorAll('.topic-item');
        topicItems.forEach(item => {
            item.addEventListener('click', function() {
                const selectedTopic = this.textContent;
                console.log('Topic selected:', selectedTopic);
                
                // Add to conversation
                addUserMessage(`Tell me about ${selectedTopic}`);
                
                // Close modal
                modalContainer.parentNode.removeChild(modalContainer);
                
                // Trigger processing for this topic
                api.processText(`Tell me about ${selectedTopic}`, {
                    generateSpeech: true,
                    context: {
                        isFollowUp: false
                    }
                }).then(response => {
                    // Add AI response to conversation
                    addAIMessage(response.text, response.audio);
                }).catch(error => {
                    console.error('Error processing topic selection:', error);
                    addSystemMessage('Sorry, I encountered an error. Please try again.');
                });
            });
        });
        
        // Close when clicking outside
        modalContainer.addEventListener('click', function(event) {
            if (event.target === modalContainer) {
                console.log('Clicked outside modal content');
                modalContainer.parentNode.removeChild(modalContainer);
            }
        });
        
        // Verify visibility
        setTimeout(() => {
            console.log('Modal element exists:', !!document.getElementById('related-topics-modal'));
            const modal = document.getElementById('related-topics-modal');
            
            if (!modal || window.getComputedStyle(modal).visibility === 'hidden') {
                console.log('Modal appears to be hidden, trying fallback');
                showRelatedTopicsFallback(topicsHtml, currentTopic);
            }
        }, 200);
    } catch (error) {
        console.error('Error displaying modal:', error);
        showRelatedTopicsFallback(topicsHtml, currentTopic);
    }
}

/**
 * Fallback for displaying related topics using a system message
 * @param {string} topicsHtml - HTML string of related topics
 * @param {string} currentTopic - The current topic being explored
 */
function showRelatedTopicsFallback(topicsHtml, currentTopic) {
    console.log('Using fallback for related topics');
    
    // Extract topics from HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = topicsHtml;
    const topics = Array.from(tempDiv.querySelectorAll('.topic-item')).map(item => item.textContent);
    
    // Create a system message for the chat
    addSystemMessage(`
        <strong>Related Topics to "${currentTopic}":</strong>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 10px;">
            ${topics.join(', ')}
        </div>
    `);
}

// Mentaura Backend Integration

// Global variables to track service status
let backendAvailable = false;
let userLoggedIn = false;

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("Integration.js loaded");
    checkBackendStatus();
    checkLoginStatus();
});

// Check if the backend server is available
async function checkBackendStatus() {
    try {
        const response = await fetch('http://localhost:5000/health', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            mode: 'cors'
        });
        
        backendAvailable = response.ok;
        updateStatusIndicator(backendAvailable);
        console.log(`Backend status: ${backendAvailable ? 'Available' : 'Unavailable'}`);
        
        // If backend is available, check services
        if (backendAvailable) {
            checkBackendServices();
        }
        
        return backendAvailable;
    } catch (error) {
        console.log('Backend server not available:', error);
        backendAvailable = false;
        updateStatusIndicator(false);
        return false;
    }
}

// Check what services are available on the backend
async function checkBackendServices() {
    try {
        const response = await fetch('http://localhost:5000/api/services', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const services = await response.json();
            console.log('Available services:', services);
        }
    } catch (error) {
        console.log('Error checking services:', error);
    }
}

// Check if user is logged in
function checkLoginStatus() {
    const user = localStorage.getItem('mentaura_user');
    userLoggedIn = !!user;
    
    // Update UI based on login status
    if (userLoggedIn) {
        const userData = JSON.parse(user);
        console.log('User logged in:', userData);
        
        // Update username display if on dashboard
        const usernameElement = document.getElementById('username');
        if (usernameElement) {
            usernameElement.textContent = userData.name || userData.email.split('@')[0];
        }
    }
    
    return userLoggedIn;
}

// Add a visual indicator for backend status
function updateStatusIndicator(isOnline) {
    let statusIndicator = document.getElementById('server-status');
    
    if (!statusIndicator) {
        statusIndicator = document.createElement('div');
        statusIndicator.id = 'server-status';
        statusIndicator.style.position = 'fixed';
        statusIndicator.style.bottom = '10px';
        statusIndicator.style.right = '10px';
        statusIndicator.style.padding = '5px 10px';
        statusIndicator.style.borderRadius = '5px';
        statusIndicator.style.fontSize = '12px';
        statusIndicator.style.fontWeight = 'bold';
        statusIndicator.style.zIndex = '1000';
        document.body.appendChild(statusIndicator);
    }
    
    if (isOnline) {
        statusIndicator.style.backgroundColor = '#4CAF50';
        statusIndicator.style.color = 'white';
        statusIndicator.textContent = 'Server Online';
    } else {
        statusIndicator.style.backgroundColor = '#F44336';
        statusIndicator.style.color = 'white';
        statusIndicator.textContent = 'Server Offline';
    }
}

/**
 * Displays user statistics
 * @param {Object} stats - User statistics
 */
function displayStats(stats) {
    if (!stats) {
        showNotification('No statistics available.');
        return;
    }

    // Create a modal for statistics
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'stats-modal';
    
    // Create content based on available stats
    const topicsHtml = stats.topTopics?.length > 0 
        ? stats.topTopics.map(topic => `<li>${topic}</li>`).join('')
        : '<li>No topics studied yet</li>';
    
    const streakInfo = stats.currentStreak > 0 
        ? `${stats.currentStreak} days (Best: ${stats.longestStreak} days)` 
        : 'No active streak';
        
    // Set modal content
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Your Learning Statistics</h2>
            <div class="stats-container">
                <div class="stat-item">
                    <h3>Learning Sessions</h3>
                    <p class="stat-value">${stats.sessionsCompleted || 0}</p>
                </div>
                <div class="stat-item">
                    <h3>Practice Questions</h3>
                    <p class="stat-value">${stats.questionsAnswered || 0}</p>
                </div>
                <div class="stat-item">
                    <h3>Learning Streak</h3>
                    <p class="stat-value">${streakInfo}</p>
                </div>
                <div class="stat-item">
                    <h3>Last Active</h3>
                    <p class="stat-value">${stats.lastActive ? new Date(stats.lastActive).toLocaleDateString() : 'Never'}</p>
                </div>
                <div class="stat-item full-width">
                    <h3>Top Topics</h3>
                    <ul class="topics-list">
                        ${topicsHtml}
                    </ul>
                </div>
            </div>
            <button id="close-stats">Close</button>
        </div>
    `;
    
    // Add modal to DOM
    document.body.appendChild(modal);
    
    // Show modal
    modal.style.display = 'block';
    
    // Add event listeners
    modal.querySelector('#close-stats').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

function calculateLearningStatistics(history) {
    // Check if history exists and is valid
    if (!Array.isArray(history) || history.length === 0) {
        return null;
    }
    
    const stats = {};
    
    // Calculate basic statistics
    stats.totalSessions = history.length;
    
    // Calculate time-based metrics (assuming each history entry has a duration field in seconds)
    // If duration doesn't exist, estimate 5 minutes (300 seconds) per entry
    const durations = history.map(entry => entry.duration || 300);
    stats.totalTime = durations.reduce((sum, duration) => sum + duration, 0);
    stats.avgSessionTime = Math.round(stats.totalTime / stats.totalSessions);
    stats.longestSession = Math.max(...durations);
    
    // Calculate topic-based metrics
    const topics = history.map(entry => entry.topic).filter(Boolean);
    const topicCounts = {};
    
    topics.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
    
    // Find top topics
    stats.topTopics = Object.entries(topicCounts)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);
    
    // Calculate topic distribution
    stats.topicDistribution = {};
    for (const [topic, count] of Object.entries(topicCounts)) {
        stats.topicDistribution[topic] = Math.round((count / topics.length) * 100);
    }
    
    // Calculate progress metrics
    // Sample completion rate - could be replaced with actual completion logic
    stats.completionRate = Math.round((history.filter(entry => entry.completed).length / history.length) * 100);
    
    // Calculate streak (consecutive days with learning activity)
    const dateSet = new Set();
    history.forEach(entry => {
        if (entry.timestamp) {
            const date = new Date(entry.timestamp).toLocaleDateString();
            dateSet.add(date);
        }
    });
    
    const dates = Array.from(dateSet).sort((a, b) => new Date(b) - new Date(a));
    
    // Calculate current streak
    let streak = 0;
    if (dates.length > 0) {
        streak = 1; // Start with 1 for the most recent day
        
        const today = new Date().toLocaleDateString();
        const mostRecentDate = dates[0] === today ? dates[0] : null;
        
        if (mostRecentDate) {
            // Check consecutive days backward from today
            let currentDate = new Date(today);
            
            for (let i = 1; i < 30; i++) { // Limit to 30 days back
                currentDate.setDate(currentDate.getDate() - 1);
                const prevDate = currentDate.toLocaleDateString();
                
                if (dates.includes(prevDate)) {
                    streak++;
                } else {
                    break;
                }
            }
        }
    }
    
    stats.streak = streak;
    
    // Calculate improvement rate (placeholder - replace with actual improvement metric)
    stats.improvementRate = Math.min(95, Math.floor(Math.random() * 30) + 65); // Random value between 65-95%
    
    return stats;
} 