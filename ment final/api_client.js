/**
 * Mentaura API Client
 * Provides interface for communicating with the Mentaura AI backend
 */
class MentauraAPI {
    constructor() {
        this.baseUrl = "http://localhost:5000";
        this.isServerConnected = false;
        this.userId = null;
        this.userLearningType = null;
        this.apiURL = 'https://api.mentaura.com';
        this.apiKey = '';
        this.userInfo = {};
        this.messageHistory = [];
        this.maxHistoryLength = 20;
        this.serverAvailable = null; // null means unknown, true/false means checked
        this.lastServerCheck = 0;
        this.SERVER_CHECK_INTERVAL = 60000; // 1 minute
        this.currentTopic = null; // Track the current topic being discussed
        this.checkServer();
        this.loadUserInfo();
        this.loadMessageHistory(); // Load saved message history on initialization
    }

    // Load user information from localStorage
    loadUserInfo(userInfo) {
        try {
            const userData = JSON.parse(localStorage.getItem('mentaura_user'));
            if (userData) {
                this.userId = userData.username || userData.email?.split('@')[0];
                this.userLearningType = userData.learningType || 'Personal Growth';
                console.log(`Loaded user: ${this.userId}, Learning type: ${this.userLearningType}`);
            }
            this.userInfo = userInfo || userData || {};
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async checkServer() {
        try {
            // Try to connect to the server using its baseUrl
            let response;
            try {
                response = await fetch(`${this.baseUrl}/health`, { 
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    mode: 'cors'
                });
            } catch (e) {
                // If that fails, try alternative URL format
                console.log('First connection attempt failed, trying alternative URL');
                const altUrl = this.baseUrl.replace('localhost', '127.0.0.1');
                response = await fetch(`${altUrl}/health`, { 
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    mode: 'cors'
                });
            }
            
            this.isServerConnected = response.ok;
            
            // Update localStorage with connection status
            if (response.ok) {
                const userData = JSON.parse(localStorage.getItem('mentaura_user') || '{}');
                userData.isOnline = true;
                localStorage.setItem('mentaura_user', JSON.stringify(userData));
            }
            
            console.log(`Server connection: ${this.isServerConnected ? 'Connected' : 'Not connected'}`);
            return this.isServerConnected;
        } catch (error) {
            this.isServerConnected = false;
            console.log('Server not available, using fallback responses');
            
            // Update localStorage with connection status
            const userData = JSON.parse(localStorage.getItem('mentaura_user') || '{}');
            userData.isOnline = false;
            localStorage.setItem('mentaura_user', JSON.stringify(userData));
            
            return false;
        }
    }

    /**
     * Debug function to validate API response with structured notes
     * @param {Object} response - The response from the API
     * @private
     */
    _debugApiResponse(response) {
        if (!response) {
            console.error('DEBUG: API response is null or undefined');
            return response;
        }

        console.log('DEBUG: API response object keys:', Object.keys(response));
        
        // Check for notes field
        if (response.notes) {
            console.log('DEBUG: notes field exists with type:', typeof response.notes);
            console.log('DEBUG: notes length:', response.notes.length);
            console.log('DEBUG: notes preview:', typeof response.notes === 'string' ? 
                response.notes.substring(0, 150) + '...' : 
                JSON.stringify(response.notes).substring(0, 150) + '...');
            
            // Check for common issues
            if (typeof response.notes !== 'string') {
                console.error('DEBUG: notes is not a string type! Converting to string');
                response.notes = response.notes.toString();
            } else if (response.notes.length === 0) {
                console.error('DEBUG: notes is an empty string!');
            }
        } else {
            console.log('DEBUG: No notes field in response');
        }
        
        return response;
    }

    /**
     * Process text from the user and get a response from the Mentaura AI
     * @param {string} text - The user's input text
     * @param {Object} options - Additional options for processing
     * @param {boolean} options.generateEmotionalSpeech - Whether to generate emotional speech metadata
     * @param {boolean} options.generateImages - Whether to generate images for learning content
     * @param {boolean} options.generateNotes - Whether to generate structured notes
     * @param {boolean} options.evaluateUnderstanding - Whether to prepare for evaluation questions
     * @returns {Promise<Object>} - Promise resolving to the AI response
     */
    async processText(text, options = {}) {
        this.addMessage('user', text);
        
        // Check if text is a simple greeting
        const lowerText = text.toLowerCase().trim();
        const isGreeting = lowerText === 'hi' || lowerText === 'hello';
        
        // Check for "explain again" or similar follow-up requests
        const isFollowUp = lowerText.includes('what about') ||
                          lowerText.includes('can you explain') ||
                          lowerText.includes('tell me more') ||
                          lowerText.includes('how about') ||
                          lowerText.includes('continue') ||
                          lowerText.includes('go on') ||
                          lowerText.includes('and');
        
        // Check specifically for "explain again"
        const isExplainAgain = lowerText.includes('explain again');
        
        // Get context from message history
        const messageContext = this.getContextFromHistory();
        
        // If this is a follow-up request, use the last AI message as context
        if ((isFollowUp || isExplainAgain) && messageContext.recentMessages.length > 0) {
            // Find the last AI message that contains actual content (not a greeting)
            const lastAIMessage = messageContext.recentMessages
                .slice()
                .reverse()
                .find(msg => msg.role === 'ai' && 
                      !msg.text.toLowerCase().includes('hi, i\'m mentaura') &&
                      !msg.text.toLowerCase().includes('how can i help you today'));
                
            if (lastAIMessage) {
                // Extract the topic from the last AI message
                let previousTopic = null;
                
                // Try to extract topic from the first sentence
                const firstSentence = lastAIMessage.text.split(/[.!?]/)[0].trim();
                if (firstSentence.toLowerCase().includes('let\'s talk about') || 
                    firstSentence.toLowerCase().includes('let\'s discuss') ||
                    firstSentence.toLowerCase().includes('about')) {
                    previousTopic = firstSentence.split(/about|discuss/).pop().trim();
                }
                
                // If we couldn't extract a topic, use the entire message
                if (!previousTopic) {
                    previousTopic = lastAIMessage.text;
                }
                
                // Add the previous context to the current request
                options.context = {
                    ...options.context,
                    previousExplanation: lastAIMessage.text,
                    previousTopic: previousTopic,
                    isFollowUp: isFollowUp,
                    isExplainAgain: isExplainAgain
                };
                
                // For "explain again" requests, modify the text to include the previous topic
                if (isExplainAgain && previousTopic) {
                    text = `Explain again about ${previousTopic}`;
                    console.log('Modified explain again request:', text);
                }
            }
        }
        
        // If this is a greeting, use a local greeting response to avoid backend errors
        if (isGreeting) {
            console.log('Handling greeting message locally to avoid server errors');
            const greetingResponse = "Hi, I'm Mentaura. How can I help you today? What are you interested in learning about?";
            this.addMessage('ai', greetingResponse);
            return {
                text: greetingResponse,
                isOnline: true,
                emotion: 'happy'
            };
        }
        
        // For non-greeting messages, continue with normal server processing
        // Determine the context based on message history and provided context
        const context = {
            ...this.getContextFromHistory(),
            ...(options.context || {})
        };
        
        // If offline or server is not available, use fallback
        if (!navigator.onLine || !(await this.checkServer())) {
            console.log('Using fallback response due to offline status or server unavailable');
            const response = this.getFallbackResponse(text, context);
            this.addMessage('ai', response);
            return {
                text: response,
                isOnline: false,
                emotion: 'neutral'
            };
        }
        
        try {
            // Prepare the request with user info and context
            const requestData = {
                text: text,
                userId: this.userInfo.userId || 'guest',
                context: context,
                isFollowUp: isFollowUp,
                isExplainAgain: isExplainAgain
            };
            
            // Make the API request
            console.log('Sending API request to /api/process_text', requestData);
            const response = await fetch(`/api/process_text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            console.log('BACKEND API: Response received:', data);
            
            // Debug API response to check for notes field
            this._debugApiResponse(data);
            
            // Check for initialization or configuration errors
            if (data.error && (data.error.includes('__init__') || data.error.includes('initialization'))) {
                console.error('API initialization error:', data.error);
                // Use a more helpful error message
                const fallbackResponse = "I'm here to help with your questions. What would you like to learn about?";
                this.addMessage('ai', fallbackResponse);
                return {
                    text: fallbackResponse,
                    isOnline: true,
                    emotion: 'neutral'
                };
            }
            
            // Add the message to our history
            this.addMessage('ai', data.text);
            
            // Check if this is a learning-related question and has structured notes
            if (data.notes && data.notes.length > 0) {
                console.log('Response contains structured notes of length:', data.notes.length);
                console.log('Notes preview:', data.notes.substring(0, 100) + '...');
            } else {
                console.log('Response does not contain structured notes or not learning content');
            }
            
            // Prepare the response to include structured notes if available
            const result = {
                text: data.text,
                isOnline: data.isOnline || true,
                emotion: data.emotion || 'neutral'
            };
            
            // Add structured notes if available - ensure it's properly passed
            if (data.notes && data.notes.length > 0) {
                console.log("Adding notes to response, length:", data.notes.length);
                // Ensure notes is a string
                result.notes = typeof data.notes === 'string' ? data.notes : data.notes.toString();
                console.log("Notes in result:", result.notes.substring(0, 100) + "...");
            }
            
            // Add audio content if available
            if (data.client_tts) {
                result.client_tts = data.client_tts;
            } else if (data.audio) {
                result.audio = data.audio;
            }
            
            console.log('Final result object properties:', Object.keys(result));
            console.log('Has notes in final result:', !!result.notes);
            
            return result;
        } catch (error) {
            console.error('Error processing text:', error);
            
            // Use fallback in case of error
            const fallbackResponse = this.getFallbackResponse(text, context);
            this.addMessage('ai', fallbackResponse);
            
            return {
                text: fallbackResponse,
                isOnline: true,
                error: error.message,
                emotion: 'concerned'
            };
        }
    }

    /**
     * Enhance the AI response with additional features based on options
     * @param {Object} data - The raw response data from the API
     * @param {string} userText - The original user input
     * @param {Object} options - The processing options
     * @returns {Object} - The enhanced response
     */
    enhanceResponse(data, userText, options) {
        let enhancedResponse = {
            text: data.response,
            isOnline: true,
            emotion: 'neutral'
        };
        
        // Add emotional metadata if requested
        if (options.generateEmotionalSpeech) {
            enhancedResponse.emotion = this.detectResponseEmotion(data.response);
        }
        
        // Generate notes for learning content if requested
        if (options.generateNotes) {
            const isLearningContent = this.isLearningContent(userText, data.response);
            
            if (isLearningContent) {
                enhancedResponse.notes = this.generateStructuredNotes(data.response);
                
                // Extract main topics for potential evaluation questions
                enhancedResponse.topics = this.extractTopics(data.response);
            }
        }
        
        // Generate placeholder images if requested
        if (options.generateImages) {
            const isLearningContent = this.isLearningContent(userText, data.response);
            
            if (isLearningContent) {
                enhancedResponse.images = this.generatePlaceholderImages(data.response);
            }
        }
        
        return enhancedResponse;
    }

    /**
     * Detect the emotional tone of a response
     * @param {string} text - The response text
     * @returns {string} - The detected emotion
     */
    detectResponseEmotion(text) {
        // Basic emotion detection based on content and punctuation
        const lowerText = text.toLowerCase();
        
        // Detect excitement
        if (text.includes('!') && 
            (lowerText.includes('amazing') || 
             lowerText.includes('excellent') || 
             lowerText.includes('fantastic') ||
             lowerText.includes('great job'))) {
            return 'excited';
        }
        
        // Detect happiness
        if (lowerText.includes('glad') || 
            lowerText.includes('happy to') || 
            lowerText.includes('wonderful')) {
            return 'happy';
        }
        
        // Detect curiosity
        if (text.includes('?') && 
            (lowerText.includes('curious') || 
             lowerText.includes('interesting') || 
             lowerText.includes('wonder'))) {
            return 'curious';
        }
        
        // Detect concern
        if (lowerText.includes('careful') || 
            lowerText.includes('caution') || 
            lowerText.includes('important to note')) {
            return 'concerned';
        }
        
        // Detect thoughtfulness
        if (lowerText.includes('consider') || 
            lowerText.includes('reflect') || 
            lowerText.includes('think about')) {
            return 'thoughtful';
        }
        
        // Detect sympathy
        if (lowerText.includes('understand your') || 
            lowerText.includes('sorry to hear') || 
            lowerText.includes('must be difficult')) {
            return 'sympathetic';
        }
        
        // Default to professional for educational content
        if (this.isLearningContent('', text)) {
            return 'professional';
        }
        
        // Default emotion
        return 'neutral';
    }

    /**
     * Determine if the content is educational based on text analysis
     * @param {string} userText - The user's input text
     * @param {string} responseText - The AI's response text
     * @returns {boolean} - Whether the content is educational
     */
    isLearningContent(userText, responseText) {
        const learningSignals = [
            'definition', 'concept', 'theory', 'formula', 'method',
            'process', 'steps', 'procedure', 'example', 'explanation',
            'in summary', 'key points', 'remember that', 'important to note',
            'to understand', 'works by', 'means that', 'refers to'
        ];
        
        const lowerResponse = responseText.toLowerCase();
        
        // Check if response contains learning signals
        const hasLearningSignals = learningSignals.some(signal => 
            lowerResponse.includes(signal)
        );
        
        // Check if response has paragraph structure (likely explanatory)
        const hasParagraphs = (responseText.split('\n\n').length > 1);
        
        // Check if response has bullet points (likely structured information)
        const hasBulletPoints = (responseText.includes('•') || 
                                 responseText.includes('- ') ||
                                 responseText.includes('* '));
        
        return hasLearningSignals || hasParagraphs || hasBulletPoints;
    }

    /**
     * Generate structured notes from a response
     * @param {string} text - The response text
     * @returns {Array} - Array of note points
     */
    generateStructuredNotes(text) {
        const notes = [];
        
        // Split text into paragraphs
        const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
        
        // Process each paragraph
        paragraphs.forEach(paragraph => {
            // Skip very short paragraphs
            if (paragraph.length < 30) return;
            
            // Look for bullet points
            if (paragraph.includes('• ') || 
                paragraph.includes('- ') || 
                paragraph.includes('* ')) {
                
                // Split by bullet points
                const bulletPattern = /[•\-\*]\s+(.*?)(?=\n[•\-\*]|$)/gs;
                const bullets = [...paragraph.matchAll(bulletPattern)];
                
                bullets.forEach(match => {
                    if (match[1] && match[1].trim().length > 0) {
                        notes.push(match[1].trim());
                    }
                });
            } 
            // Check for numbered points
            else if (/^\d+\.\s/.test(paragraph)) {
                // Split by numbered points
                const numberPattern = /\d+\.\s+(.*?)(?=\n\d+\.|$)/gs;
                const numbered = [...paragraph.matchAll(numberPattern)];
                
                numbered.forEach(match => {
                    if (match[1] && match[1].trim().length > 0) {
                        notes.push(match[1].trim());
                    }
                });
            }
            // Add important sentences as notes
            else {
                const sentences = paragraph.split(/[.!?]/).filter(s => s.trim().length > 0);
                
                sentences.forEach(sentence => {
                    // Look for key phrases indicating important information
                    if (sentence.includes('important') || 
                        sentence.includes('key point') || 
                        sentence.includes('remember') ||
                        sentence.includes('note that') ||
                        sentence.includes('crucial') ||
                        sentence.length > 100) { // Longer sentences often contain key information
                        
                        notes.push(sentence.trim() + '.');
                    }
                });
                
                // If no important sentences were found, add the first sentence
                if (sentences.length > 0 && notes.length === 0) {
                    notes.push(sentences[0].trim() + '.');
                }
            }
        });
        
        // If we couldn't extract structured notes, create some based on the text
        if (notes.length === 0 && text.length > 100) {
            // Split by sentences
            const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 20);
            
            // Take up to 3 sentences
            for (let i = 0; i < Math.min(3, sentences.length); i++) {
                notes.push(sentences[i].trim() + '.');
            }
        }
        
        return notes;
    }

    /**
     * Extract main topics from text
     * @param {string} text - The response text
     * @returns {Array} - Array of main topics
     */
    extractTopics(text) {
        const topics = [];
        const lowerText = text.toLowerCase();
        
        // Look for common topic indicators
        const definitions = text.match(/([A-Z][a-z]+(?:\s[a-z]+)*) (?:is|are|refers to|means|can be defined as)/g);
        if (definitions) {
            definitions.forEach(def => {
                const term = def.split(' ')[0];
                if (term && term.length > 2 && !topics.includes(term)) {
                    topics.push(term);
                }
            });
        }
        
        // Look for bold or emphasized text (often topics)
        const emphasized = text.match(/\*\*(.*?)\*\*/g) || text.match(/__(.*?)__/g);
        if (emphasized) {
            emphasized.forEach(emp => {
                const term = emp.replace(/\*\*/g, '').replace(/__/g, '');
                if (term && term.length > 2 && !topics.includes(term)) {
                    topics.push(term);
                }
            });
        }
        
        // If no topics found, extract based on frequency
        if (topics.length === 0) {
            // Remove common words
            const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'by', 'with', 'about', 'as'];
            
            // Split the text into words
            const words = lowerText.split(/\W+/).filter(word => 
                word.length > 3 && !commonWords.includes(word)
            );
            
            // Count word frequency
            const wordCount = {};
            words.forEach(word => {
                wordCount[word] = (wordCount[word] || 0) + 1;
            });
            
            // Get the most frequent words
            const sortedWords = Object.entries(wordCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(entry => entry[0]);
            
            topics.push(...sortedWords);
        }
        
        return topics;
    }

    /**
     * Generate placeholder images for learning content
     * @param {string} text - The response text
     * @returns {Array} - Array of image objects
     */
    generatePlaceholderImages(text) {
        // In a real implementation, this would call an image generation API
        // For now, we'll use placeholder images based on content
        
        const images = [];
        const topics = this.extractTopics(text);
        
        // Generate placeholder images for up to 2 topics
        for (let i = 0; i < Math.min(2, topics.length); i++) {
            const topic = topics[i];
            
            // Use placeholder service
            images.push({
                url: `https://source.unsplash.com/featured/?${encodeURIComponent(topic)}`,
                alt: `Visual representation of ${topic}`,
                caption: `Illustration related to ${topic}`
            });
        }
        
        return images;
    }

    /**
     * Fallback responses when server is unavailable
     * @param {string} text - User input text
     * @param {Object} context - Context information
     * @returns {string} - Fallback response
     */
    getFallbackResponse(text, context = {}) {
        const { recentMessages = [], topics = [] } = context;
        const lowerText = text.toLowerCase();
        const userData = JSON.parse(localStorage.getItem('mentaura_user') || '{}');
        const username = userData.username || userData.name || 'there';
        
        // Update connection status
        userData.isOnline = false;
        localStorage.setItem('mentaura_user', JSON.stringify(userData));
        
        let response = { isOnline: false };
        
        // Check for follow-up indicators
        const isFollowUp = lowerText.includes('again') || 
                          lowerText.includes('what about') ||
                          lowerText.includes('can you explain') ||
                          lowerText.includes('tell me more') ||
                          lowerText.includes('how about');
        
        if (isFollowUp && topics.length > 0) {
            // Use the most recent topic for follow-up
            const lastTopic = topics[topics.length - 1];
            return `Let me continue explaining about ${lastTopic}. ${text}`;
        }
        
        if (lowerText.includes('hello') || lowerText.includes('hi')) {
            return `Hi ${username}! I'm Mentaura. How can I help you today?`;
        }
        
        // If we have recent context, use it
        if (recentMessages.length > 0) {
            const lastMessage = recentMessages[recentMessages.length - 1];
            if (lastMessage.role === 'ai') {
                return `Let me continue explaining about ${lastMessage.text.split('.')[0]}. ${text}`;
            }
        }
        
        return "I'd be happy to help with your question. What specific aspects would you like to learn about?";
    }
    
    /**
     * Get context information from message history
     * @returns {Object} - Context information
     */
    getContextFromHistory() {
        // Last 5 messages for immediate context
        const recentMessages = this.messageHistory.slice(-5);
        
        // Extract topics from all messages
        const allText = this.messageHistory.map(msg => msg.text).join(' ');
        const topics = this.extractTopics(allText);
        
        // Include current topic if available
        if (this.currentTopic && !topics.includes(this.currentTopic)) {
            topics.push(this.currentTopic);
        }
        
        return {
            recentMessages,
            topics,
            currentTopic: this.currentTopic
        };
    }
    
    /**
     * Add a message to the history
     * @param {string} role - Role of the message sender ('user' or 'ai')
     * @param {string} text - Message text
     */
    addMessage(role, text) {
        // Extract potential topic from AI messages
        if (role === 'ai' && text) {
            this.updateCurrentTopic(text);
        }
        
        this.messageHistory.push({
            role,
            text,
            timestamp: Date.now()
        });
        
        // Trim history if it exceeds max length
        if (this.messageHistory.length > this.maxHistoryLength) {
            this.messageHistory = this.messageHistory.slice(-this.maxHistoryLength);
        }
        
        // Save to localStorage
        this.saveMessageHistory();
        
        try {
            const messages = JSON.parse(localStorage.getItem('mentaura_messages') || '[]');
            messages.push({
                sender: role,
                text,
                timestamp: new Date().toISOString()
            });
            
            // Keep only the last 50 messages to avoid localStorage space issues
            const trimmedMessages = messages.slice(-50);
            localStorage.setItem('mentaura_messages', JSON.stringify(trimmedMessages));
        } catch (error) {
            console.error('Error saving message:', error);
        }
    }
    
    /**
     * Update the current topic based on AI response
     * @param {string} text - AI response text
     */
    updateCurrentTopic(text) {
        // Look for topic indicators in the text
        const topicIndicators = [
            'about', 'regarding', 'concerning', 'on the topic of', 
            'let\'s discuss', 'let\'s talk about', 'I\'ll explain'
        ];
        
        for (const indicator of topicIndicators) {
            const index = text.toLowerCase().indexOf(indicator);
            if (index !== -1) {
                // Extract potential topic (next 3-5 words after indicator)
                const afterIndicator = text.substring(index + indicator.length).trim();
                const words = afterIndicator.split(/\s+/);
                if (words.length >= 3) {
                    this.currentTopic = words.slice(0, 5).join(' ');
                    console.log('Updated current topic:', this.currentTopic);
                    return;
                }
            }
        }
    }

    // Load message history from localStorage
    loadMessageHistory() {
        try {
            const savedHistory = localStorage.getItem('mentaura_message_history');
            if (savedHistory) {
                this.messageHistory = JSON.parse(savedHistory);
                console.log('Loaded message history:', this.messageHistory.length, 'messages');
            }
        } catch (error) {
            console.error('Error loading message history:', error);
        }
    }

    // Save message history to localStorage
    saveMessageHistory() {
        try {
            localStorage.setItem('mentaura_message_history', JSON.stringify(this.messageHistory));
        } catch (error) {
            console.error('Error saving message history:', error);
        }
    }

    /**
     * Get user learning progress
     * @returns {Object} - Learning progress data
     */
    getLearningProgress() {
        // Extract topics from localStorage or generate default ones
        let topics = [];
        const recentMessages = this._getRecentMessages();
        
        if (recentMessages.length > 0) {
            topics = this._extractTopicsFromMessages(recentMessages);
        }
        
        return { topics };
    }
    
    /**
     * Helper to get recent messages from localStorage
     * @returns {Array} - Recent messages
     * @private
     */
    _getRecentMessages() {
        try {
            return JSON.parse(localStorage.getItem('mentaura_messages') || '[]');
        } catch (error) {
            console.error('Error loading messages:', error);
            return [];
        }
    }
    
    /**
     * Helper to extract topics from messages
     * @param {Array} messages - Messages to extract topics from
     * @returns {Array} - Extracted topics
     * @private
     */
    _extractTopicsFromMessages(messages) {
        const topics = [];
        const topicKeywords = {
            'math': ['mathematics', 'algebra', 'calculus', 'geometry', 'trigonometry'],
            'physics': ['mechanics', 'electricity', 'magnetism', 'quantum', 'relativity'],
            'chemistry': ['organic', 'inorganic', 'biochemistry', 'elements', 'compounds'],
            'biology': ['genetics', 'ecology', 'anatomy', 'physiology', 'evolution'],
            'computer science': ['programming', 'algorithms', 'data structures', 'coding', 'software'],
            'history': ['ancient', 'medieval', 'modern', 'world war', 'civilization'],
            'literature': ['poetry', 'novel', 'drama', 'fiction', 'shakespeare']
        };
        
        // Look for topic keywords in messages
        messages.forEach(message => {
            if (message.sender === 'user') {
                const text = message.text.toLowerCase();
                
                for (const [topic, keywords] of Object.entries(topicKeywords)) {
                    if (text.includes(topic) || keywords.some(keyword => text.includes(keyword))) {
                        // Only add if not already in the list
                        if (!topics.find(t => t.name === topic)) {
                            topics.push({
                                name: topic,
                                progress: Math.floor(Math.random() * 40) + 10, // Random progress 10-50%
                                lastStudied: new Date().toISOString()
                            });
                        }
                    }
                }
            }
        });
        
        return topics;
    }

    /**
     * Process voice input from the user and get a response from the Mentaura AI
     * @param {string} base64Audio - Base64 encoded audio
     * @returns {Promise<Object>} - Promise resolving to the AI response
     */
    async processVoice(base64Audio) {
        try {
            // If offline or server is not available, use fallback
            if (!navigator.onLine || !(await this.checkServer())) {
                console.log('Using fallback response for voice due to offline status or server unavailable');
                const fallbackText = 'Hello! I\'m Mentaura. How can I help you today?';
                return {
                    transcribed: 'Audio transcription not available offline',
                    text: fallbackText,
                    isOnline: false,
                    emotion: 'neutral'
                };
            }
            
            // Prepare the request with user info
            const requestData = {
                audio: base64Audio,
                userId: this.userInfo.userId || 'guest'
            };
            
            // Make the API request
            const response = await fetch(`/api/process_voice`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            
            // Debug API response to check for notes field
            this._debugApiResponse(data);
            
            // Check if the transcribed text is a greeting
            const transcribed = data.transcribed.toLowerCase().trim();
            const isGreeting = transcribed === 'hi' || transcribed === 'hello';
            
            // Add the messages to history
            this.addMessage('user', data.transcribed);
            
            // If this is a greeting, handle specially
            if (isGreeting) {
                const greetingText = "Hi, I'm Mentaura. How can I help you today? What are you interested in learning about?";
                // Don't add text to message history, just audio
                this.addMessage('ai', '');
                
                return {
                    transcribed: data.transcribed,
                    text: '',  // Empty text so it doesn't display in UI
                    audio: data.audio || data.voice, // Support different API response formats
                    isOnline: true,
                    is_greeting: true,
                    emotion: 'happy'
                };
            } else {
                // Normal message processing
                this.addMessage('ai', data.text);
                
                // Create response object with basic fields
                const result = {
                    transcribed: data.transcribed,
                    text: data.text,
                    audio: data.audio || data.voice,  // Support different API response formats
                    isOnline: true,
                    emotion: data.emotion || this.detectResponseEmotion(data.text)
                };
                
                // Add structured notes if available
                if (data.notes && data.notes.length > 0) {
                    console.log("Adding notes to voice response, length:", data.notes.length);
                    // Ensure notes is a string
                    result.notes = typeof data.notes === 'string' ? data.notes : data.notes.toString();
                    console.log("Voice notes in result:", result.notes.substring(0, 100) + "...");
                }
                
                return result;
            }
        } catch (error) {
            console.error('Error processing voice:', error);
            
            // Use fallback in case of error
            const fallbackText = 'Hello! I\'m Mentaura. How can I help you today?';
            this.addMessage('ai', fallbackText);
            
            return {
                transcribed: 'Audio transcription not available',
                text: fallbackText,
                isOnline: false,
                emotion: 'neutral'
            };
        }
    }

    /**
     * Generate practice questions for a given topic
     * @param {string} topic - The topic to generate questions about
     * @returns {Promise<Object>} - Promise resolving to practice questions
     */
    async generatePracticeQuestions(topic) {
        console.log(`Generating practice questions for topic: ${topic}`);
        
        // Check if server is available
        if (!navigator.onLine || !(await this.checkServer())) {
            console.log('Server unavailable, using fallback practice questions');
            return this.generateFallbackPracticeQuestions(topic);
        }
        
        try {
            // Make API request to get practice questions
            const response = await fetch(`${this.baseUrl}/practice_questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ topic }),
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            
            if (!response.ok) {
                throw new Error(`Failed to get practice questions: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error generating practice questions:', error);
            return this.generateFallbackPracticeQuestions(topic);
        }
    }

    /**
     * Generate fallback practice questions when server is unavailable
     * @param {string} topic - The topic to generate questions about
     * @returns {Object} - Object with practice questions
     */
    generateFallbackPracticeQuestions(topic) {
        // Clean up topic if it ends with a question mark
        topic = topic.replace(/\?$/, '').trim();
        
        // Generate topic-specific questions when possible
        let questions;
        
        if (topic.toLowerCase().includes('environment')) {
            questions = `
1. What are the main components of the environment?
2. How do human activities impact the environment?
3. What are some key environmental challenges facing our planet today?
4. Explain the concept of environmental sustainability and why it's important.
5. How can individuals contribute to environmental conservation?
`;
        } else if (topic.toLowerCase().includes('science')) {
            questions = `
1. What is the scientific method and how is it applied in research?
2. Explain the difference between a hypothesis and a theory in science.
3. How has science contributed to technological advancements in the past century?
4. What are some major unresolved questions in science today?
5. How do different branches of science (physics, biology, chemistry) overlap and interact?
`;
        } else {
            // Generic fallback questions for any topic
            questions = `
1. What are the key components of ${topic}?
2. Explain the main principles behind ${topic}.
3. How does ${topic} relate to real-world applications?
4. What are the advantages and disadvantages of ${topic}?
5. How has ${topic} evolved over time?
`;
        }
        
        return { questions: questions.trim() };
    }

    /**
     * Suggest related topics based on a given topic
     * @param {string} topic - The base topic to find related topics for
     * @returns {Promise<Object>} - Promise resolving to related topics
     */
    async suggestRelatedTopics(topic) {
        console.log(`Finding related topics for: ${topic}`);
        
        // Check if server is available
        if (!navigator.onLine || !(await this.checkServer())) {
            console.log('Server unavailable, using fallback related topics');
            return this.generateFallbackRelatedTopics(topic);
        }
        
        try {
            // Make API request to get related topics
            const response = await fetch(`${this.baseUrl}/new_topic`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ topic }),
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            
            if (!response.ok) {
                throw new Error(`Failed to get related topics: ${response.status}`);
            }
            
            const data = await response.json();
            return { related_topics: [data.new_topic] };
        } catch (error) {
            console.error('Error finding related topics:', error);
            return this.generateFallbackRelatedTopics(topic);
        }
    }

    /**
     * Generate fallback related topics when server is unavailable
     * @param {string} topic - The base topic to find related topics for
     * @returns {Object} - Object with related topics
     */
    generateFallbackRelatedTopics(topic) {
        // Clean up topic
        topic = topic.replace(/[?!.,;]$/, '').trim();
        
        // Simple mapping of topics to related topics
        const relatedTopicsMap = {
            'environment': ['climate change', 'sustainability', 'ecosystems', 'biodiversity', 'conservation'],
            'science': ['physics', 'chemistry', 'biology', 'astronomy', 'scientific method'],
            'technology': ['artificial intelligence', 'machine learning', 'robotics', 'software development', 'cybersecurity'],
            'math': ['algebra', 'calculus', 'geometry', 'statistics', 'number theory'],
            'history': ['world history', 'ancient civilizations', 'modern history', 'world war 2', 'cultural history'],
            'art': ['painting', 'sculpture', 'drawing', 'digital art', 'photography'],
            'literature': ['poetry', 'fiction', 'drama', 'essays', 'literary criticism'],
            'philosophy': ['ethics', 'metaphysics', 'epistemology', 'logic', 'aesthetics']
        };
        
        // Check if we have a direct topic match
        const lowerTopic = topic.toLowerCase();
        for (const key in relatedTopicsMap) {
            if (lowerTopic.includes(key)) {
                return { related_topics: relatedTopicsMap[key] };
            }
        }
        
        // Default fallback for unknown topics
        return {
            related_topics: [
                `${topic} fundamentals`,
                `advanced ${topic}`,
                `${topic} applications`,
                `history of ${topic}`,
                `future trends in ${topic}`
            ]
        };
    }

    /**
     * Get the user's learning history
     * @returns {Promise<Object>} - Promise resolving to learning history
     */
    async getLearningHistory() {
        console.log('Fetching learning history');
        
        // Extract learning history from message history
        const messageHistory = this._getRecentMessages();
        const learningHistory = [];
        
        for (let i = 0; i < messageHistory.length; i++) {
            const message = messageHistory[i];
            
            if (message.role === 'user') {
                const text = message.text.toLowerCase().trim();
                
                // Skip greetings and short messages
                if (text === 'hi' || text === 'hello' || text.length < 5) {
                    continue;
                }
                
                // Extract a potential topic
                let topic = message.text;
                if (topic.endsWith('?')) {
                    topic = topic.slice(0, -1).trim();
                }
                
                // Get AI response if available
                let response = '';
                if (i + 1 < messageHistory.length && messageHistory[i + 1].role === 'ai') {
                    response = messageHistory[i + 1].text;
                }
                
                // Add to learning history
                learningHistory.push({
                    topic: topic,
                    question: message.text,
                    answer: response,
                    timestamp: message.timestamp || new Date().toISOString()
                });
            }
        }
        
        // Sort by timestamp (newest first)
        learningHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return { history: learningHistory };
    }
}

// Export the API class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MentauraAPI };
} else if (typeof window !== 'undefined') {
    window.MentauraAPI = MentauraAPI;
} 