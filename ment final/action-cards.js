/**
 * Action Cards functionality for Mentaura Dashboard
 * Implements the Continue Learning, Practice Questions, New Topic, and Learning History features
 */

// Function to set up action cards
function setupActionCards() {
    console.log('Setting up action cards');
    
    // Get all action card elements
    const actionCards = document.querySelectorAll('.action-card');
    
    if (!actionCards.length) {
        console.log('No action cards found');
        return;
    }
    
    // Add click event listeners to each action card
    actionCards.forEach(card => {
        const cardText = card.querySelector('span').textContent.trim();
        
        card.addEventListener('click', () => {
            console.log(`Action card clicked: ${cardText}`);
            
            switch (cardText) {
                case 'Continue Learning':
                    handleContinueLearning();
                    break;
                case 'Practice Questions':
                    handlePracticeQuestions();
                    break;
                case 'New Topic':
                    handleNewTopic();
                    break;
                case 'Learning History':
                    handleLearningHistory();
                    break;
                case 'Explore Related Topics':
                    handleRelatedTopics();
                    break;
                default:
                    console.log('Unknown action card clicked');
            }
        });
    });
}

// Function to handle "Continue Learning" action
function handleContinueLearning() {
    console.log('Handling Continue Learning action');
    
    // Get conversation history
    const messageHistory = JSON.parse(localStorage.getItem('mentaura_messages') || '[]');
    
    // Find the most recent learning topic from message history
    let recentTopic = null;
    
    for (let i = messageHistory.length - 1; i >= 0; i--) {
        const message = messageHistory[i];
        if (message.role === 'user') {
            // Check if this message looks like a learning question
            const isLearningQuestion = message.text.toLowerCase().includes('what is') || 
                                       message.text.toLowerCase().includes('how does') || 
                                       message.text.toLowerCase().includes('explain') ||
                                       message.text.toLowerCase().includes('tell me about');
            
            if (isLearningQuestion) {
                // Extract the potential topic from the user's question
                const topic = message.text.replace(/what is|how does|explain|tell me about/i, '').trim();
                if (topic) {
                    recentTopic = topic;
                    break;
                }
            }
        }
    }
    
    if (recentTopic) {
        // Add a follow-up question in the conversation to continue learning
        const userInput = document.getElementById('user-input');
        userInput.value = `Tell me more about ${recentTopic}`;
        
        // Focus on the input field
        userInput.focus();
        
        // Show notification to the user
        showNotification(`Continuing your learning about ${recentTopic}`);
    } else {
        // If no recent topic found, prompt user to choose a topic
        showNotification('No recent learning topics found. Please ask a question to start learning.');
    }
}

// Function to handle "Practice Questions" action with improved reliability
function handlePracticeQuestions() {
    console.log('Handling Practice Questions action');
    
    // Get conversation history
    const messageHistory = JSON.parse(localStorage.getItem('mentaura_messages') || '[]');
    
    // Find the most recent learning topic from message history
    let recentTopic = null;
    
    for (let i = messageHistory.length - 1; i >= 0; i--) {
        const message = messageHistory[i];
        if (message.role === 'user') {
            const userText = message.text.toLowerCase().trim();
            
            // Skip greetings
            if (userText === 'hi' || userText === 'hello') {
                continue;
            }
            
            // Use any non-greeting message as a topic
            recentTopic = message.text;
            if (recentTopic.endsWith('?')) {
                recentTopic = recentTopic.substring(0, recentTopic.length - 1).trim();
            }
            break;
        }
    }
    
    if (recentTopic) {
        // Generate practice questions for this topic
        generateAndDisplayPracticeQuestions(recentTopic);
    } else {
        // If no recent topic found, prompt user to choose a topic
        showNotification('Please ask a question first to get practice questions.');
    }
}

// Function to generate fallback practice questions client-side
function generateFallbackQuestions(topic) {
    // Clean up topic if it ends with a question mark
    if (topic.endsWith('?')) {
        topic = topic.substring(0, topic.length - 1).trim();
    }
    
    // Generate topic-specific questions when possible
    if (topic.toLowerCase().includes('environment')) {
        return `
1. What are the main components of the environment?
2. How do human activities impact the environment?
3. What are some key environmental challenges facing our planet today?
4. Explain the concept of environmental sustainability and why it's important.
5. How can individuals contribute to environmental conservation?
`;
    } else if (topic.toLowerCase().includes('science')) {
        return `
1. What is the scientific method and how is it applied in research?
2. Explain the difference between a hypothesis and a theory in science.
3. How has science contributed to technological advancements in the past century?
4. What are some major unresolved questions in science today?
5. How do different branches of science (physics, biology, chemistry) overlap and interact?
`;
    } else {
        // Generic fallback questions for any topic
        return `
1. What are the key components of ${topic}?
2. Explain the main principles behind ${topic}.
3. How does ${topic} relate to real-world applications?
4. What are the advantages and disadvantages of ${topic}?
5. How has ${topic} evolved over time?
`;
    }
}

// Function to handle "New Topic" action with improved reliability
function handleNewTopic() {
    console.log('Handling New Topic action');
    
    // Get conversation history
    const messageHistory = JSON.parse(localStorage.getItem('mentaura_messages') || '[]');
    
    // Find the most recent learning topic from message history
    let recentTopic = null;
    
    for (let i = messageHistory.length - 1; i >= 0; i--) {
        const message = messageHistory[i];
        if (message.role === 'user') {
            const userText = message.text.toLowerCase().trim();
            
            // Skip greetings
            if (userText === 'hi' || userText === 'hello') {
                continue;
            }
            
            // Use any non-greeting message as a topic
            recentTopic = message.text;
            if (recentTopic.endsWith('?')) {
                recentTopic = recentTopic.substring(0, recentTopic.length - 1).trim();
            }
            break;
        }
    }
    
    if (recentTopic) {
        // Show loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finding related topics...';
        
        const convContainer = document.querySelector('.conversation-container');
        convContainer.appendChild(loadingIndicator);
        
        // Generate fallback topic immediately - it'll be used if API call fails
        const fallbackTopic = generateFallbackTopic(recentTopic);
        
        // Try first to see if the server is responsive
        fetch('http://localhost:5000/health', { 
            method: 'GET',
            signal: AbortSignal.timeout(2000) // 2 second timeout
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Server health check failed');
            }
            return response.json();
        })
        .then(healthData => {
            // Server is available, make the API request
            return fetch('http://localhost:5000/new_topic', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ topic: recentTopic }),
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Check if the response has the expected structure
            if (!data.new_topic || typeof data.new_topic !== 'string' || data.new_topic.trim() === '') {
                throw new Error('Invalid response format or empty topic');
            }
            
            // Remove loading indicator
            if (convContainer.contains(loadingIndicator)) {
                convContainer.removeChild(loadingIndicator);
            }
            
            // Get the suggested topic
            const newTopic = data.new_topic.trim();
            
            // Add AI message with the new topic suggestion
            const aiMessage = document.createElement('div');
            aiMessage.className = 'message ai-message';
            
            aiMessage.innerHTML = `
                <div class="message-bubble">
                    <div class="message-content">
                        <p>Based on your interest in <strong>${recentTopic}</strong>, you might want to explore <strong>${newTopic}</strong>.</p>
                        <button class="explore-topic-btn">Explore this topic</button>
                    </div>
                </div>
            `;
            
            // Add to conversation history
            const conversationHistory = document.getElementById('conversation-history');
            conversationHistory.appendChild(aiMessage);
            
            // Scroll to bottom of conversation
            conversationHistory.scrollTop = conversationHistory.scrollHeight;
            
            // Add event listener to the explore button
            const exploreBtn = aiMessage.querySelector('.explore-topic-btn');
            exploreBtn.addEventListener('click', () => {
                const userInput = document.getElementById('user-input');
                userInput.value = `Tell me about ${newTopic}`;
                
                // Simulate a click on the send button
                document.getElementById('send-message').click();
            });
            
            // Save this message to history
            const api = new MentauraAPI();
            api.addMessage('ai', `Based on your interest in ${recentTopic}, you might want to explore ${newTopic}.`);
        })
        .catch(error => {
            console.error('Error fetching new topic suggestion:', error);
            
            // Remove loading indicator
            if (convContainer.contains(loadingIndicator)) {
                convContainer.removeChild(loadingIndicator);
            }
            
            // Show notification that we're using a suggested topic
            showNotification('Suggesting a related topic based on your interests.');
            
            // Add AI message with fallback topic suggestion
            const aiMessage = document.createElement('div');
            aiMessage.className = 'message ai-message';
            
            aiMessage.innerHTML = `
                <div class="message-bubble">
                    <div class="message-content">
                        <p>Based on your interest in <strong>${recentTopic}</strong>, you might want to explore <strong>${fallbackTopic}</strong>.</p>
                        <button class="explore-topic-btn">Explore this topic</button>
                    </div>
                </div>
            `;
            
            // Add to conversation history
            const conversationHistory = document.getElementById('conversation-history');
            conversationHistory.appendChild(aiMessage);
            
            // Scroll to bottom of conversation
            conversationHistory.scrollTop = conversationHistory.scrollHeight;
            
            // Add event listener to the explore button
            const exploreBtn = aiMessage.querySelector('.explore-topic-btn');
            exploreBtn.addEventListener('click', () => {
                const userInput = document.getElementById('user-input');
                userInput.value = `Tell me about ${fallbackTopic}`;
                
                // Simulate a click on the send button
                document.getElementById('send-message').click();
            });
            
            // Save this message to history
            const api = new MentauraAPI();
            api.addMessage('ai', `Based on your interest in ${recentTopic}, you might want to explore ${fallbackTopic}.`);
        });
    } else {
        // If no recent topic found, prompt user to choose a topic
        showNotification('Please ask a question first to get related topics.');
    }
}

// Function to generate a fallback related topic
function generateFallbackTopic(topic) {
    // Clean up topic if it ends with a question mark
    if (topic.endsWith('?')) {
        topic = topic.substring(0, topic.length - 1).trim();
    }
    
    // Simple algorithm to suggest a related topic, enhanced with more specific relations
    const relatedTopics = {
        'environment': 'climate change',
        'climate': 'global warming',
        'global warming': 'renewable energy',
        'renewable energy': 'solar power',
        'solar': 'sustainable energy',
        'data': 'data science',
        'data science': 'machine learning',
        'machine learning': 'deep learning',
        'artificial intelligence': 'machine learning ethics',
        'programming': 'software development',
        'software': 'software engineering',
        'ecosystem': 'ecosystem conservation',
        'physics': 'quantum mechanics',
        'chemistry': 'organic chemistry',
        'biology': 'genetics',
        'history': 'world war II',
        'math': 'calculus',
        'mathematics': 'linear algebra',
        'computer': 'computer architecture',
        'network': 'network security',
        'security': 'cybersecurity',
        'web': 'web development',
        'science': 'scientific method'
    };
    
    // First check for an exact match
    const topicLower = topic.toLowerCase();
    if (relatedTopics[topicLower]) {
        return relatedTopics[topicLower];
    }
    
    // Then check for partial matches
    for (const key in relatedTopics) {
        if (topicLower.includes(key)) {
            return relatedTopics[key];
        }
    }
    
    // Default fallback topics if no match found
    const defaultTopics = [
        'artificial intelligence applications',
        'data science in healthcare',
        'machine learning algorithms',
        'programming best practices',
        'advanced mathematics concepts',
        'environmental sustainability',
        'renewable energy sources',
        'scientific breakthroughs'
    ];
    
    // Return a random default topic
    return defaultTopics[Math.floor(Math.random() * defaultTopics.length)];
}

// Function to handle "Learning History" action with improved reliability
function handleLearningHistory() {
    console.log('Learning History action clicked');
    
    // Get the user's learning history
    const learningHistory = getUserLearningHistory();
    
    // Display the learning history in the conversation
    displayLearningHistory(learningHistory);
}

// Helper function to generate and display practice questions for a topic
function generateAndDisplayPracticeQuestions(topic) {
    const convContainer = document.querySelector('.conversation-container');
    
    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating practice questions...';
    convContainer.appendChild(loadingIndicator);
    
    // Generate fallback questions immediately - they'll be used if API call fails
    const fallbackQuestions = generateFallbackQuestions(topic);
    
    // Try first to see if the server is responsive
    fetch('http://localhost:5000/health', {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 second timeout
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Server health check failed');
        }
        return response.json();
    })
    .then(healthData => {
        // Server is available, make the API request
        return fetch('http://localhost:5000/practice_questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ topic: topic }),
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Check if the response has the expected structure
        if (!data.questions || typeof data.questions !== 'string' || data.questions.trim() === '') {
            throw new Error('Invalid response format or empty questions');
        }
        
        // Remove loading indicator
        if (convContainer.contains(loadingIndicator)) {
            convContainer.removeChild(loadingIndicator);
        }
        
        // Add AI message with practice questions
        const aiMessage = document.createElement('div');
        aiMessage.className = 'message ai-message';
        
        // Format the questions with nice styling
        const formattedQuestions = data.questions.replace(/\n/g, '<br>');
        
        aiMessage.innerHTML = `
            <div class="message-bubble">
                <div class="message-content">
                    <p><strong>Practice Questions for ${topic}:</strong></p>
                    <div class="practice-questions">${formattedQuestions}</div>
                </div>
            </div>
        `;
        
        // Add to conversation history
        const conversationHistory = document.getElementById('conversation-history');
        conversationHistory.appendChild(aiMessage);
        
        // Scroll to bottom of conversation
        conversationHistory.scrollTop = conversationHistory.scrollHeight;
        
        // Save this message to history
        const api = new MentauraAPI();
        api.addMessage('ai', `Practice Questions for ${topic}:\n${data.questions}`);
    })
    .catch(error => {
        console.error('Error fetching practice questions:', error);
        
        // Remove loading indicator
        if (convContainer.contains(loadingIndicator)) {
            convContainer.removeChild(loadingIndicator);
        }
        
        // Show notification that we're using generated questions
        showNotification('Generated practice questions for this topic.');
        
        // Add AI message with fallback practice questions
        const aiMessage = document.createElement('div');
        aiMessage.className = 'message ai-message';
        
        aiMessage.innerHTML = `
            <div class="message-bubble">
                <div class="message-content">
                    <p><strong>Practice Questions for ${topic}:</strong></p>
                    <div class="practice-questions">${fallbackQuestions}</div>
                </div>
            </div>
        `;
        
        // Add to conversation history
        const conversationHistory = document.getElementById('conversation-history');
        conversationHistory.appendChild(aiMessage);
        
        // Scroll to bottom of conversation
        conversationHistory.scrollTop = conversationHistory.scrollHeight;
        
        // Save this message to history
        const api = new MentauraAPI();
        api.addMessage('ai', `Practice Questions for ${topic}:\n${fallbackQuestions}`);
    });
}

// Function to generate related topics for exploration
function generateRelatedTopics(topic) {
    // Clean up topic
    const cleanTopic = topic.trim().replace(/[?!.,;]/g, '').toLowerCase();
    
    // Map of topic to related topics
    const topicRelations = {
        'environment': [
            'climate change', 
            'renewable energy', 
            'sustainability', 
            'biodiversity', 
            'ocean conservation'
        ],
        'science': [
            'quantum physics', 
            'astronomy', 
            'chemistry', 
            'biology', 
            'artificial intelligence'
        ],
        'history': [
            'ancient civilizations', 
            'world war ii', 
            'industrial revolution', 
            'renaissance', 
            'cold war'
        ],
        'technology': [
            'machine learning', 
            'blockchain', 
            'virtual reality', 
            'internet of things', 
            'cybersecurity'
        ],
        'health': [
            'nutrition', 
            'mental health', 
            'fitness', 
            'preventive medicine', 
            'medical research'
        ],
        'art': [
            'contemporary art', 
            'renaissance art', 
            'impressionism', 
            'sculpture', 
            'digital art'
        ],
        'literature': [
            'classic novels', 
            'poetry', 
            'science fiction', 
            'world literature', 
            'creative writing'
        ],
        'philosophy': [
            'ethics', 
            'existentialism', 
            'logic', 
            'metaphysics', 
            'philosophy of mind'
        ],
        'economics': [
            'microeconomics', 
            'macroeconomics', 
            'international trade', 
            'financial markets', 
            'economic development'
        ],
        'psychology': [
            'cognitive psychology', 
            'developmental psychology', 
            'behavioral psychology', 
            'social psychology', 
            'neuropsychology'
        ]
    };
    
    // Check if we have predefined related topics
    for (const key in topicRelations) {
        if (cleanTopic.includes(key) || key.includes(cleanTopic)) {
            return topicRelations[key];
        }
    }
    
    // For topics not in our predefined list, generate some general ones
    // Try to extract keywords from the topic
    const words = cleanTopic.split(' ').filter(word => word.length > 3);
    
    if (words.length > 0) {
        // Use the longest word as a potential keyword
        const keyword = words.sort((a, b) => b.length - a.length)[0];
        
        // Return some generic related topics based on the keyword
        return [
            `${keyword} fundamentals`,
            `advanced ${keyword}`,
            `${keyword} applications`,
            `history of ${keyword}`,
            `future of ${keyword}`
        ];
    }
    
    // Default related topics if we couldn't generate anything specific
    return [
        'science and technology',
        'history and culture',
        'arts and humanities',
        'health and wellness',
        'society and economics'
    ];
}

// Function to handle "Explore Related Topics" action
function handleRelatedTopics() {
    console.log('Handling Related Topics action');
    
    // Show loading indicator
    const loadingMessage = createLoadingMessage('Finding related topics to explore...');
    const conversationHistory = document.getElementById('conversation-history');
    conversationHistory.appendChild(loadingMessage);
    conversationHistory.scrollTop = conversationHistory.scrollHeight;
    
    // Get most recent topic from localStorage
    const messageHistory = JSON.parse(localStorage.getItem('mentaura_messages') || '[]');
    let mostRecentTopic = '';
    
    // Find the most recent user message that's not a greeting
    for (let i = messageHistory.length - 1; i >= 0; i--) {
        const message = messageHistory[i];
        if (message.role === 'user') {
            const text = message.text.toLowerCase().trim();
            
            // Skip greetings
            if (text === 'hi' || text === 'hello' || text === 'hey' || text === 'how are you' || text.length < 5) {
                continue;
            }
            
            mostRecentTopic = message.text;
            
            // Clean up topic if it ends with a question mark
            if (mostRecentTopic.endsWith('?')) {
                mostRecentTopic = mostRecentTopic.substring(0, mostRecentTopic.length - 1).trim();
            }
            
            break;
        }
    }
    
    // If no topic found, use a default one
    if (!mostRecentTopic) {
        mostRecentTopic = 'general knowledge';
    }
    
    // Check server health
    const healthCheckTimeout = 2000; // 2 seconds
    const healthCheckUrl = 'http://localhost:5000/health';
    
    // Attempt to connect to server with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), healthCheckTimeout);
    
    fetch(healthCheckUrl, { signal: controller.signal })
        .then(response => {
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Server health check failed: ${response.status}`);
            }
            
            // Server is healthy, make API request for related topics
            return fetch('http://localhost:5000/related_topics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ topic: mostRecentTopic })
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Remove loading message
            conversationHistory.removeChild(loadingMessage);
            
            // Display the related topics
            displayRelatedTopics(data.related_topics || [], mostRecentTopic);
        })
        .catch(error => {
            console.error('Error fetching related topics:', error);
            
            // Remove loading message
            conversationHistory.removeChild(loadingMessage);
            
            // Use fallback related topics generator
            const fallbackTopics = generateRelatedTopics(mostRecentTopic);
            displayRelatedTopics(fallbackTopics, mostRecentTopic, true);
        });
}

// Function to display related topics
function displayRelatedTopics(topics, originalTopic, isFallback = false) {
    const conversationHistory = document.getElementById('conversation-history');
    
    // Create AI message for related topics
    const relatedTopicsMessage = document.createElement('div');
    relatedTopicsMessage.className = 'message ai-message';
    
    let topicsHTML = '';
    topics.forEach(topic => {
        topicsHTML += `
            <div class="related-topic-item">
                <button class="related-topic-btn" data-topic="${topic}">${topic}</button>
            </div>
        `;
    });
    
    let fallbackNotice = '';
    if (isFallback) {
        fallbackNotice = '<p class="fallback-notice"><small>(Using offline suggestions)</small></p>';
    }
    
    relatedTopicsMessage.innerHTML = `
        <div class="message-bubble">
            <div class="message-content">
                <p><strong>Related to "${originalTopic}":</strong></p>
                ${fallbackNotice}
                <div class="related-topics-container">
                    ${topicsHTML}
                </div>
            </div>
        </div>
    `;
    
    // Add to conversation history
    conversationHistory.appendChild(relatedTopicsMessage);
    
    // Scroll to bottom of conversation
    conversationHistory.scrollTop = conversationHistory.scrollHeight;
    
    // Add event listeners to topic buttons
    const topicButtons = relatedTopicsMessage.querySelectorAll('.related-topic-btn');
    topicButtons.forEach(button => {
        button.addEventListener('click', () => {
            const topic = button.getAttribute('data-topic');
            const userInput = document.getElementById('user-input');
            userInput.value = `Tell me about ${topic}`;
            
            // Simulate a click on the send button
            document.getElementById('send-message').click();
        });
    });
    
    // Save this message to history
    const api = new MentauraAPI();
    api.addMessage('ai', `Related to "${originalTopic}":\n${topics.map(topic => `- ${topic}`).join('\n')}`);
}

// Create a loading message for the UI
function createLoadingMessage(text) {
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'message ai-message loading-message';
    loadingMessage.innerHTML = `
        <div class="message-bubble">
            <div class="message-content">
                <p>${text}</p>
                <div class="loading-dots">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                </div>
            </div>
        </div>
    `;
    return loadingMessage;
}

// Define the action cards
function getActionCards() {
    return [
        { title: 'Learning History', description: 'View your learning topics and explore past interests', icon: 'fas fa-history' },
        { title: 'Explore Related Topics', description: 'Discover topics related to your recent conversations', icon: 'fas fa-compass' },
        // { title: 'Learning Path', description: 'Personalized learning path based on your interests', icon: 'fas fa-road' },
        // { title: 'Concept Map', description: 'Visual map of connected topics you\'ve explored', icon: 'fas fa-project-diagram' }
    ];
}

// Initialize action cards when the script loads
function initializeActionCards() {
    const actionCardContainer = document.querySelector('.action-cards-container');
    if (!actionCardContainer) return;
    
    actionCardContainer.innerHTML = '';
    
    getActionCards().forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'action-card';
        cardElement.innerHTML = `
            <div class="action-card-icon">
                <i class="${card.icon}"></i>
            </div>
            <div class="action-card-content">
                <h3>${card.title}</h3>
                <p>${card.description}</p>
            </div>
        `;
        cardElement.addEventListener('click', () => handleActionCardClick(card.title));
        actionCardContainer.appendChild(cardElement);
    });
}

// Handle action card clicks
function handleActionCardClick(cardTitle) {
    console.log(`Action card clicked: ${cardTitle}`);
    
    switch(cardTitle) {
        case 'Learning History':
            // Handle learning history card click
            const historyContent = getUserLearningHistory();
            displayLearningHistory(historyContent);
            break;
        case 'Explore Related Topics':
            // Handle explore related topics card click
            handleRelatedTopics();
            break;
        default:
            console.log(`Handling for ${cardTitle} not implemented yet`);
    }
}

// Initialize action cards when the script loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Action cards script loaded');
    initializeActionCards();
});

// Function to get user's learning history from local storage
function getUserLearningHistory() {
    const messageHistory = JSON.parse(localStorage.getItem('mentaura_messages') || '[]');
    const learningTopics = [];
    
    // Process message history to extract learning topics from user messages with timestamps
    for (let i = 0; i < messageHistory.length; i++) {
        const message = messageHistory[i];
        
        // Only process user messages
        if (message.role === 'user') {
            const userText = message.text.trim();
            const userTextLower = userText.toLowerCase();
            
            // Skip greetings and very short messages
            if (userTextLower === 'hi' || 
                userTextLower === 'hello' || 
                userTextLower === 'hey' || 
                userTextLower === 'how are you' ||
                userText.length < 5) {
                continue;
            }
            
            // Clean up the text to use as a topic
            let topic = userText;
            if (topic.endsWith('?')) {
                topic = topic.substring(0, topic.length - 1).trim();
            }
            
            // Skip very short topics after cleaning
            if (topic.length < 5) {
                continue;
            }
            
            // Add to our array with timestamp
            learningTopics.push({
                topic: topic,
                timestamp: message.timestamp || new Date().toISOString()
            });
        }
    }
    
    // Sort by timestamp (most recent first)
    return learningTopics.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// Function to display learning history in the UI
function displayLearningHistory(learningHistory) {
    // If no learning topics found, display a message
    if (learningHistory.length === 0) {
        // Add AI message with notification
        const aiMessage = document.createElement('div');
        aiMessage.className = 'message ai-message';
        
        aiMessage.innerHTML = `
            <div class="message-bubble">
                <div class="message-content">
                    <p>No learning history found. Start by asking questions on topics you're interested in!</p>
                </div>
            </div>
        `;
        
        // Add to conversation history
        const conversationHistory = document.getElementById('conversation-history');
        conversationHistory.appendChild(aiMessage);
        
        // Scroll to bottom of conversation
        conversationHistory.scrollTop = conversationHistory.scrollHeight;
        
        // Save this message to history
        const api = new MentauraAPI();
        api.addMessage('ai', 'No learning history found. Start by asking questions on topics you\'re interested in!');
        
        return;
    }
    
    // Take only the 10 most recent topics to display
    const recentTopics = learningHistory.slice(0, 10);
    
    // Prepare content for display
    const topicListHTML = recentTopics.map(topic => {
        return `
            <div class="history-item">
                <span class="history-topic">${topic}</span>
                <button class="explore-history-btn" data-topic="${topic}">Explore Again</button>
            </div>
        `;
    }).join('');
    
    // Add AI message with learning history
    const aiMessage = document.createElement('div');
    aiMessage.className = 'message ai-message';
    
    aiMessage.innerHTML = `
        <div class="message-bubble">
            <div class="message-content">
                <p><strong>Your Learning History:</strong></p>
                <div class="learning-history">
                    ${topicListHTML}
                </div>
            </div>
        </div>
    `;
    
    // Add to conversation history
    const conversationHistory = document.getElementById('conversation-history');
    conversationHistory.appendChild(aiMessage);
    
    // Scroll to bottom of conversation
    conversationHistory.scrollTop = conversationHistory.scrollHeight;
    
    // Add event listeners to explore buttons
    const exploreBtns = aiMessage.querySelectorAll('.explore-history-btn');
    exploreBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const topic = btn.getAttribute('data-topic');
            exploreTopic(topic);
        });
    });
    
    // Save this message to history
    const api = new MentauraAPI();
    api.addMessage('ai', `Your Learning History:\n${recentTopics.map(topic => `- ${topic}`).join('\n')}`);
}

// Function to explore a topic when user clicks the explore button
function exploreTopic(topic) {
    console.log('Exploring topic:', topic);
    
    // Clear the input field and add the topic exploration query
    const inputField = document.getElementById('user-input');
    inputField.value = `Tell me more about ${topic}`;
    
    // Trigger the send button click to submit the query
    document.getElementById('send-message').click();
}

// Function to show a notification to the user
function showNotification(message, duration = 3000) {
    // Check if there's an existing notification
    let notification = document.querySelector('.notification');
    
    // If notification already exists, remove it first
    if (notification) {
        notification.remove();
    }
    
    // Create new notification
    notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Append to body
    document.body.appendChild(notification);
    
    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('active');
    }, 10);
    
    // Hide and remove after duration
    setTimeout(() => {
        notification.classList.remove('active');
        
        // Remove from DOM after animation completes
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
} 