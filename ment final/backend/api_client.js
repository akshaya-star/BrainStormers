// Mentaura API Client
class MentauraAPI {
    constructor() {
        this.baseUrl = "http://localhost:5000";
        this.isServerConnected = false;
        this.userId = null;
        this.userLearningType = null;
        this.lastResponse = null;
        this.currentTopic = null;
        this.checkServer();
        this.loadUserInfo();
    }

    // Load user information from localStorage
    loadUserInfo() {
        try {
            const userData = JSON.parse(localStorage.getItem('mentaura_user'));
            if (userData) {
                this.userId = userData.username || userData.email.split('@')[0];
                this.userLearningType = userData.learningType || 'Personal Growth';
                console.log(`Loaded user: ${this.userId}, Learning type: ${this.userLearningType}`);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async checkServer() {
        try {
            const response = await fetch(`${this.baseUrl}/health`, { 
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            this.isServerConnected = response.ok;
            
            // Update localStorage with connection status
            if (response.ok) {
                const userData = JSON.parse(localStorage.getItem('mentaura_user') || '{}');
                userData.isOnline = true;
                localStorage.setItem('mentaura_user', JSON.stringify(userData));
            }
            
            console.log(`Server connection: ${this.isServerConnected ? 'Connected' : 'Not connected'}`);
        } catch (error) {
            this.isServerConnected = false;
            console.log('Server not available, using fallback responses');
            
            // Update localStorage with connection status
            const userData = JSON.parse(localStorage.getItem('mentaura_user') || '{}');
            userData.isOnline = false;
            localStorage.setItem('mentaura_user', JSON.stringify(userData));
        }
    }

    async processText(data) {
        try {
            // Log the full data for debugging
            console.log("BACKEND API CLIENT: Full request data received:", data);
            
            // Extract data or use defaults if just text was passed
            const text = typeof data === 'string' ? data : data.text;
            const context = typeof data === 'object' && data.context ? data.context : {};
            
            // Check for mathematical topics in the query
            const lowerText = text.toLowerCase();
            if (lowerText.includes('what is addition') || lowerText.includes('about addition')) {
                this.currentTopic = 'addition';
                console.log("Setting current topic to: addition");
            } else if (lowerText.includes('what is subtraction') || lowerText.includes('about subtraction')) {
                this.currentTopic = 'subtraction';
                console.log("Setting current topic to: subtraction");
            } else if (lowerText.includes('what is multiplication') || lowerText.includes('about multiplication')) {
                this.currentTopic = 'multiplication';
                console.log("Setting current topic to: multiplication");
            } else if (lowerText.includes('what is division') || lowerText.includes('about division')) {
                this.currentTopic = 'division';
                console.log("Setting current topic to: division");
            }
            
            // Check if this is an "explain again" request
            const isExplainAgain = typeof text === 'string' && 
                text.toLowerCase().includes('explain again');
                
            if (isExplainAgain) {
                console.log("DETECTED 'EXPLAIN AGAIN' REQUEST!");
                console.log("Current stored topic:", this.currentTopic);
                console.log("Current stored last response:", this.lastResponse ? this.lastResponse.substring(0, 50) + "..." : "None");
            }
            
            // Default options
            const options = {
                generateStructuredNotes: false,
                generateEmotionalSpeech: true,
                includeImages: false
            };
            
            if (!this.isServerConnected) {
                console.log("Server not connected, using fallback response");
                return this._getFallbackResponse(text, options);
            }

            // Create a deeply nested log of all context properties
            console.log('MentauraAPI: Full context details:');
            for (const [key, value] of Object.entries(context)) {
                if (typeof value === 'object' && value !== null) {
                    console.log(`  ${key}: ${JSON.stringify(value)}`);
                } else {
                    console.log(`  ${key}: ${value}`);
                }
            }

            // Construct request payload with context
            const payload = { 
                text,
                userId: this.userId || 'anonymous',
                learningType: this.userLearningType || 'General',
                context: {
                    isFollowUp: context.isFollowUp === true || isExplainAgain,
                    isExplainAgain: context.isExplainAgain === true || isExplainAgain,
                    currentTopic: context.currentTopic || this.currentTopic || '',
                    lastQuestion: context.lastQuestion || '',
                    lastResponse: context.lastResponse || this.lastResponse || '',
                    recentMessages: context.recentMessages || [],
                    topics: context.topics || []
                }
            };

            console.log("BACKEND API: Final payload being sent to server:", JSON.stringify(payload));
            console.log("EXPLAIN AGAIN FLAG:", payload.context.isExplainAgain);
            console.log("CURRENT TOPIC BEING SENT:", payload.context.currentTopic);

            const response = await fetch(`${this.baseUrl}/api/process_text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                console.error(`Server responded with status: ${response.status}`);
                const errorText = await response.text();
                console.error(`Error response body: ${errorText}`);
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const responseData = await response.json();
            console.log("BACKEND API: Response received:", responseData);
            
            // Store the response for future "explain again" requests
            if (responseData.text) {
                this.lastResponse = responseData.text;
                
                // Try to extract topic from the response if not already set
                if (!this.currentTopic) {
                    // Simple extraction - first sentence or keyword detection
                    const firstSentence = responseData.text.split('.')[0];
                    if (firstSentence.toLowerCase().includes('addition')) {
                        this.currentTopic = 'addition';
                    } else if (firstSentence.toLowerCase().includes('subtraction')) {
                        this.currentTopic = 'subtraction';
                    } else if (firstSentence.toLowerCase().includes('multiplication')) {
                        this.currentTopic = 'multiplication';
                    } else if (firstSentence.toLowerCase().includes('division')) {
                        this.currentTopic = 'division';
                    } else {
                        // Use first sentence as fallback
                        this.currentTopic = firstSentence;
                    }
                    console.log("Extracted topic:", this.currentTopic);
                }
            }
            
            // Add emotional context if it's not already included from server
            if (options.generateEmotionalSpeech && !responseData.emotion) {
                responseData.emotion = this._detectEmotion(text, responseData.text);
            }
            
            // Generate structured notes if requested but not provided by server
            if (options.generateStructuredNotes && !responseData.structuredNotes) {
                responseData.structuredNotes = this._generateStructuredNotes(responseData.text);
            }
            
            // If we get here, the connection is working
            const userData = JSON.parse(localStorage.getItem('mentaura_user') || '{}');
            userData.isOnline = true;
            localStorage.setItem('mentaura_user', JSON.stringify(userData));
            
            return responseData;
        } catch (error) {
            console.error('Error processing text:', error);
            return this._getFallbackResponse(typeof data === 'string' ? data : data.text);
        }
    }

    // Fallback responses when server is unavailable
    _getFallbackResponse(text, options = {}) {
        const { generateEmotionalSpeech = true, generateStructuredNotes = false } = options;
        const lowerText = text.toLowerCase();
        const userData = JSON.parse(localStorage.getItem('mentaura_user') || '{}');
        const username = userData.username || userData.name || 'there';
        
        // Update connection status
        userData.isOnline = false;
        localStorage.setItem('mentaura_user', JSON.stringify(userData));
        
        let response = { isOnline: false };
        
        if (lowerText.includes('hello') || lowerText.includes('hi')) {
            response.text = `Hello ${username}! I'm Mentaura. How can I help you today?`;
            response.emotion = 'happy';
        } else if (lowerText.includes('math') || lowerText.includes('mathematics')) {
            response.text = `Mathematics is a fascinating subject! I'd be happy to help you with math concepts. What specific topic or problem are you interested in?`;
            response.emotion = 'excited';
        } else if (lowerText.includes('science') || lowerText.includes('physics')) {
            response.text = `Science helps us understand the natural world. I'd be happy to discuss scientific concepts with you. What aspect of science are you curious about?`;
            response.emotion = 'curious';
        } else {
            response.text = `I'd be happy to help you with that. What specific aspects would you like to explore?`;
            response.emotion = 'thoughtful';
        }
        
        // Add structured notes if requested
        if (generateStructuredNotes) {
            response.structuredNotes = this._generateStructuredNotes(response.text);
        }
        
        return response;
    }
    
    // Detect emotional tone for voice synthesis
    _detectEmotion(query, response) {
        const queryLower = query.toLowerCase();
        const responseLower = response.toLowerCase();
        
        // Excitement detection
        if (
            responseLower.includes('fascinating') || 
            responseLower.includes('amazing') || 
            responseLower.includes('incredible') ||
            queryLower.includes('cool') ||
            queryLower.includes('awesome')
        ) {
            return 'excited';
        }
        
        // Happiness detection
        if (
            queryLower.includes('thank') || 
            queryLower.includes('appreciate') || 
            responseLower.includes('happy to help') ||
            responseLower.includes('glad to assist')
        ) {
            return 'happy';
        }
        
        // Curiosity detection
        if (
            queryLower.includes('why') || 
            queryLower.includes('how') || 
            queryLower.includes('what') ||
            responseLower.includes('interesting question') ||
            responseLower.includes('let\'s explore')
        ) {
            return 'curious';
        }
        
        // Concern detection
        if (
            queryLower.includes('difficult') || 
            queryLower.includes('hard') || 
            queryLower.includes('confused') ||
            queryLower.includes('help') ||
            responseLower.includes('important to note') ||
            responseLower.includes('be careful')
        ) {
            return 'concerned';
        }
        
        // Thoughtful detection - fallback emotion for academic topics
        if (
            queryLower.includes('explain') || 
            queryLower.includes('understand') ||
            responseLower.includes('concept') ||
            responseLower.includes('understand')
        ) {
            return 'thoughtful';
        }
        
        // Default to neutral
        return 'neutral';
    }
    
    // Generate structured notes from response text
    _generateStructuredNotes(text) {
        // Simple implementation that creates bullet points from paragraphs
        const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
        
        let notes = {
            title: this._extractTitle(text),
            keyPoints: [],
            details: []
        };
        
        // Extract key points (first few paragraphs or sentences)
        paragraphs.slice(0, Math.min(2, paragraphs.length)).forEach(p => {
            const sentences = p.split(/[.!?]+/).filter(s => s.trim().length > 0);
            sentences.slice(0, Math.min(2, sentences.length)).forEach(s => {
                notes.keyPoints.push(s.trim());
            });
        });
        
        // Extract details from the rest of the paragraphs
        paragraphs.slice(Math.min(2, paragraphs.length)).forEach(p => {
            if (p.length > 30) { // Only use substantial paragraphs
                notes.details.push(p.trim());
            }
        });
        
        return notes;
    }
    
    // Extract a title from the text
    _extractTitle(text) {
        // Get the first sentence or first 50 characters
        const firstSentence = text.split(/[.!?]+/)[0].trim();
        
        if (firstSentence.length < 60) {
            return firstSentence;
        } else {
            // Extract key noun phrases for title
            const words = firstSentence.split(' ');
            if (words.length > 4) {
                return words.slice(0, 4).join(' ') + '...';
            } else {
                return firstSentence.substring(0, 50) + '...';
            }
        }
    }
    
    // Get user learning progress
    getLearningProgress() {
        // Extract topics from localStorage or generate default ones
        let topics = [];
        const recentMessages = this._getRecentMessages();
        
        if (recentMessages.length > 0) {
            topics = this._extractTopicsFromMessages(recentMessages);
        }
        
        return { topics };
    }
    
    // Helper to get recent messages from localStorage
    _getRecentMessages() {
        try {
            return JSON.parse(localStorage.getItem('mentaura_messages') || '[]');
        } catch (error) {
            console.error('Error loading messages:', error);
            return [];
        }
    }
    
    // Helper to extract topics from messages
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
    
    // Add a message to history
    addMessage(sender, text) {
        try {
            const messages = JSON.parse(localStorage.getItem('mentaura_messages') || '[]');
            messages.push({
                sender,
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
}
