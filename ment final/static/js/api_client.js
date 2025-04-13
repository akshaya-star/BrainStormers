class APIClient {
    constructor() {
        this.messageHistory = [];
        this.loadMessageHistory();
        this.baseUrl = "http://localhost:5000";
    }

    loadMessageHistory() {
        try {
            const savedHistory = localStorage.getItem('messageHistory');
            if (savedHistory) {
                this.messageHistory = JSON.parse(savedHistory);
            }
        } catch (error) {
            console.error('Error loading message history:', error);
            this.messageHistory = [];
        }
    }

    saveMessageHistory() {
        try {
            localStorage.setItem('messageHistory', JSON.stringify(this.messageHistory));
        } catch (error) {
            console.error('Error saving message history:', error);
        }
    }

    extractTopics(messages) {
        // Extract key topics from messages
        const topics = new Set();
        const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
        
        messages.forEach(msg => {
            const words = msg.text.toLowerCase().split(' ');
            words.forEach(word => {
                if (!commonWords.has(word) && word.length > 3) {
                    topics.add(word);
                }
            });
        });
        
        return Array.from(topics).slice(0, 5); // Return top 5 topics
    }

    getContextFromHistory() {
        // Get the last 5 messages for better context
        const recentMessages = this.messageHistory.slice(-5);
        
        // Extract topics from message history
        const topics = this.extractTopics(recentMessages);
        
        // Add emotional context from recent messages
        const emotionalContext = this.getEmotionalContext(recentMessages);
        
        return {
            recentMessages: recentMessages.map(msg => ({
                role: msg.role,
                text: msg.text,
                timestamp: msg.timestamp,
                emotionalTone: msg.emotionalTone
            })),
            topics: topics,
            emotionalContext: emotionalContext
        };
    }

    getEmotionalContext(messages) {
        // Analyze emotional patterns in recent messages
        const emotionalPatterns = messages
            .filter(msg => msg.emotionalTone)
            .map(msg => msg.emotionalTone);
        
        return {
            recentTones: emotionalPatterns.slice(-3),
            dominantTone: this.getDominantTone(emotionalPatterns)
        };
    }

    getDominantTone(tones) {
        if (!tones.length) return null;
        const toneCount = {};
        tones.forEach(tone => {
            toneCount[tone] = (toneCount[tone] || 0) + 1;
        });
        return Object.entries(toneCount)
            .sort((a, b) => b[1] - a[1])[0][0];
    }

    addMessage(message) {
        // Add timestamp if not present
        if (!message.timestamp) {
            message.timestamp = new Date().toISOString();
        }
        
        // Add emotional tone if not present
        if (!message.emotionalTone) {
            message.emotionalTone = this.analyzeEmotionalTone(message.text);
        }
        
        // Add to message history
        this.messageHistory.push(message);
        
        // Keep only last 50 messages to prevent memory issues
        if (this.messageHistory.length > 50) {
            this.messageHistory = this.messageHistory.slice(-50);
        }
        
        // Update local storage
        this.saveMessageHistory();
        
        // Log message addition
        console.log('Message added to history:', {
            role: message.role,
            textLength: message.text.length,
            timestamp: message.timestamp,
            emotionalTone: message.emotionalTone
        });
    }

    analyzeEmotionalTone(text) {
        // Simple emotional tone analysis
        const positiveWords = ['good', 'great', 'excellent', 'happy', 'wonderful', 'thanks', 'thank you'];
        const negativeWords = ['bad', 'difficult', 'hard', 'confused', 'don\'t understand', 'help'];
        const neutralWords = ['what', 'how', 'why', 'when', 'where', 'explain'];
        
        const words = text.toLowerCase().split(' ');
        let positiveCount = 0;
        let negativeCount = 0;
        let neutralCount = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) positiveCount++;
            if (negativeWords.includes(word)) negativeCount++;
            if (neutralWords.includes(word)) neutralCount++;
        });
        
        if (positiveCount > negativeCount && positiveCount > neutralCount) return 'positive';
        if (negativeCount > positiveCount && negativeCount > neutralCount) return 'negative';
        return 'neutral';
    }

    async processText(text, options = {}) {
        try {
            console.log("Frontend API Client: Processing text with context:", text.substring(0, 30) + "...");
            
            // Get conversation context
            const context = this.getContextFromHistory();
            
            // Extract options
            const isFollowUp = options.isFollowUp || false;
            const isExplainAgain = text.toLowerCase().includes('explain again');
            const currentTopic = options.currentTopic || this.getCurrentTopic();
            
            // Find the most recent AI response for context
            let lastResponse = '';
            let lastQuestion = '';
            
            // For explain again requests, we need the last AI response and the last substantive question
            if (isExplainAgain) {
                console.log("Finding last AI response for 'explain again' request");
                // Find last AI message
                for (let i = this.messageHistory.length - 1; i >= 0; i--) {
                    if (this.messageHistory[i].role === 'ai') {
                        lastResponse = this.messageHistory[i].text;
                        console.log("Found last AI response:", lastResponse.substring(0, 50) + "...");
                        break;
                    }
                }
                
                // Find last substantive user question (not follow-up or explain again)
                for (let i = this.messageHistory.length - 1; i >= 0; i--) {
                    if (this.messageHistory[i].role === 'user') {
                        const msgText = this.messageHistory[i].text.toLowerCase();
                        if (!msgText.includes('again') && 
                            !msgText.includes('what about') && 
                            !msgText.includes('tell me more')) {
                            lastQuestion = this.messageHistory[i].text;
                            console.log("Found last substantive question:", lastQuestion);
                            break;
                        }
                    }
                }
            } else {
                // For regular messages, just get the last message of each type
                lastResponse = this.messageHistory.length > 0 ? 
                    this.messageHistory.filter(m => m.role === 'ai').pop()?.text || '' : '';
                lastQuestion = this.messageHistory.length > 0 ? 
                    this.messageHistory.filter(m => m.role === 'user').pop()?.text || '' : '';
            }
            
            // Prepare request data
            const requestData = {
                text: text,
                context: {
                    isFollowUp: isFollowUp,
                    isExplainAgain: isExplainAgain,
                    currentTopic: currentTopic,
                    recentMessages: context.recentMessages,
                    topics: context.topics,
                    lastQuestion: lastQuestion || (this.messageHistory.length > 1 ? 
                        this.messageHistory[this.messageHistory.length-2].text : ''),
                    lastResponse: lastResponse || (this.messageHistory.length > 0 ? 
                        this.messageHistory[this.messageHistory.length-1].text : ''),
                    forceKeepTopic: options.forceKeepTopic || isExplainAgain
                }
            };
            
            console.log("Frontend API Client: Sending direct request to backend:", requestData);
            
            // Make API call to backend directly with full context object
            const response = await fetch(`${this.baseUrl}/api/ai/process-text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("API error response:", errorText);
                throw new Error(`API request failed with status ${response.status}`);
            }
            
            const responseData = await response.json();
            console.log("Frontend API Client: Received response:", responseData);
            
            // Add message to history
            this.addMessage({
                role: 'ai',
                text: responseData.text,
                emotionalTone: responseData.emotion || 'neutral'
            });
            
            return responseData;
        } catch (error) {
            console.error("Error in processText:", error);
            return {
                text: "I'm sorry, I encountered an error while processing your request. Please try again.",
                error: error.message
            };
        }
    }
    
    getCurrentTopic() {
        // For debugging
        console.log("Message history in getCurrentTopic:", this.messageHistory.map(m => ({role: m.role, text: m.text.substring(0, 30)})));
        
        // First check if we have a stored topic in localStorage
        try {
            const savedContext = localStorage.getItem('mentaura_conversation');
            if (savedContext) {
                const parsedContext = JSON.parse(savedContext);
                if (parsedContext.lastTopic) {
                    console.log("Using stored topic from localStorage:", parsedContext.lastTopic);
                    return parsedContext.lastTopic;
                }
            }
        } catch (e) {
            console.error("Error retrieving topic from localStorage:", e);
        }
        
        // Get the most recent substantive user message as the topic
        let mostRecentTopic = '';
        for (let i = this.messageHistory.length - 1; i >= 0; i--) {
            if (this.messageHistory[i].role === 'user') {
                // Skip follow-up indicators
                const text = this.messageHistory[i].text.toLowerCase();
                if (!text.includes('again') && 
                    !text.includes('what about') && 
                    !text.includes('tell me more')) {
                    mostRecentTopic = this.messageHistory[i].text;
                    console.log("Found topic from message history:", mostRecentTopic);
                    return mostRecentTopic;
                }
            }
        }
        
        console.log("No substantive topic found in history, returning empty string");
        return '';
    }
} 