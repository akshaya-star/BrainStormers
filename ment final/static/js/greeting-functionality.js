// Add initialization code at the top of file 
// Initialize conversation context for tracking the conversation
let conversationContext = {
    lastTopic: '',
    lastQuestion: '',
    lastResponse: '',
    conversationHistory: []
};

// Initialize our API clients - frontend API client and backend MentauraAPI for direct calls
const apiClient = new APIClient();
// Create reference to backend MentauraAPI
const mentauraAPI = new MentauraAPI();

// Function to load conversation context from localStorage
function loadConversationContext() {
    try {
        const savedContext = localStorage.getItem('mentaura_conversation');
        if (savedContext) {
            const parsedContext = JSON.parse(savedContext);
            conversationContext = parsedContext;
            console.log('Loaded conversation context from localStorage:', {
                topicLoaded: conversationContext.lastTopic,
                messagesLoaded: conversationContext.conversationHistory.length
            });
            
            // Also add the conversation history to apiClient
            if (conversationContext.conversationHistory && conversationContext.conversationHistory.length > 0) {
                conversationContext.conversationHistory.forEach(msg => {
                    apiClient.addMessage({
                        role: msg.sender === 'user' ? 'user' : 'ai',
                        text: msg.text,
                        timestamp: msg.timestamp
                    });
                });
                console.log('Synchronized conversation history with API client');
            }
        } else {
            console.log('No saved conversation context found');
        }
    } catch (e) {
        console.error('Error loading conversation context:', e);
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    loadConversationContext();
    console.log('Conversation context initialized');
});

// Function to add message to conversation history
function addMessageToHistory(sender, text) {
    const timestamp = new Date().toISOString();
    const message = {
        sender: sender,
        text: text,
        timestamp: timestamp
    };
    
    conversationContext.conversationHistory.push(message);
    
    // Also add to our APIClient's history for context tracking
    apiClient.addMessage({
        role: sender === 'user' ? 'user' : 'ai',
        text: text,
        timestamp: timestamp
    });
    
    // Keep only last 10 messages to prevent memory issues
    if (conversationContext.conversationHistory.length > 10) {
        conversationContext.conversationHistory = conversationContext.conversationHistory.slice(-10);
    }
    
    console.log(`Adding ${sender} message to history, length: ${text.length}`);
    
    // Try to persist conversation history in localStorage
    try {
        localStorage.setItem('mentaura_conversation', JSON.stringify(conversationContext));
    } catch (e) {
        console.error('Error saving conversation to localStorage', e);
    }
}

// Handle user text submission
async function handleUserTextSubmission(text) {
    try {
        console.log("Starting to process user text submission:", text);
        
        // Add user message to conversation history
        addMessageToHistory('user', text);
        
        // Check for follow-up indicators
        const followUpIndicators = ['again', 'what about', 'can you explain', 'tell me more', 'how about'];
        const isFollowUp = followUpIndicators.some(indicator => 
            text.toLowerCase().includes(indicator)
        );
        
        // Check for "explain again" request
        const explainAgainPatterns = [
            "explain again",
            "explain it again",
            "explain that again",
            "explain this again",
            "can you explain again",
            "could you explain again",
            "please explain again",
            "i didn't understand",
            "i don't get it",
            "one more time",
            "say it again",
            "repeat that"
        ];
        
        const isExplainAgain = explainAgainPatterns.some(pattern => 
            text.toLowerCase().includes(pattern.toLowerCase())
        );
        
        // Debug previous conversation state
        console.log('Previous conversation state:', JSON.stringify(conversationContext));
        
        // Get the current topic from conversation context
        let currentTopic = conversationContext.lastTopic || '';
        console.log("Initial current topic:", currentTopic);
        
        // If there's no current topic but this is an "explain again" request,
        // we need to find the topic from the conversation history
        if (isExplainAgain) {
            console.log("*** CRITICAL: Processing EXPLAIN AGAIN request ***");
            
            if (!currentTopic) {
                // Look for the most recent non-follow-up user message
                for (let i = conversationContext.conversationHistory.length - 2; i >= 0; i--) {
                    const msg = conversationContext.conversationHistory[i];
                    if (msg.sender === 'user') {
                        const msgText = msg.text.toLowerCase();
                        if (!msgText.includes('again') && 
                            !msgText.includes('what about') && 
                            !msgText.includes('tell me more')) {
                            currentTopic = msg.text;
                            console.log(`Found topic "${currentTopic}" from conversation history for "explain again" request`);
                            // Update the context with this topic
                            conversationContext.lastTopic = currentTopic;
                            break;
                        }
                    }
                }
            }
            
            // If we still don't have a topic, use a reasonable default
            if (!currentTopic) {
                // Find the most recent AI response to extract a topic
                for (let i = conversationContext.conversationHistory.length - 1; i >= 0; i--) {
                    if (conversationContext.conversationHistory[i].sender === 'assistant') {
                        const aiText = conversationContext.conversationHistory[i].text;
                        
                        // Try to extract a topic from the first sentence
                        const firstSentence = aiText.split('.')[0];
                        if (firstSentence && firstSentence.length > 10) {
                            currentTopic = firstSentence;
                            console.log(`Extracted topic from AI response: "${currentTopic}"`);
                            conversationContext.lastTopic = currentTopic;
                            break;
                        }
                    }
                }
            }
            
            // If we STILL don't have a topic, look for specific subject words in messages
            if (!currentTopic) {
                const subjectWords = ['addition', 'subtraction', 'multiplication', 'division', 
                                     'fractions', 'algebra', 'geometry', 'chemistry', 'physics', 
                                     'programming', 'history', 'biology'];
                
                // Search through recent messages for subject keywords
                for (let i = conversationContext.conversationHistory.length - 1; i >= 0; i--) {
                    const msgText = conversationContext.conversationHistory[i].text.toLowerCase();
                    
                    for (const subject of subjectWords) {
                        if (msgText.includes(subject)) {
                            currentTopic = subject;
                            console.log(`Found subject "${subject}" in message history`);
                            conversationContext.lastTopic = currentTopic;
                            break;
                        }
                    }
                    
                    if (currentTopic) break;
                }
            }
            
            // Last resort - set a default topic
            if (!currentTopic) {
                currentTopic = "the previous concept";
                console.log("No topic found, using default topic:", currentTopic);
                conversationContext.lastTopic = currentTopic;
            }
        }
        
        // If this is a follow-up question, prepend the context about the last topic
        let processedMessage = text;
        if ((isFollowUp || isExplainAgain) && currentTopic) {
            processedMessage = `Regarding ${currentTopic}: ${text}`;
            console.log(`Added context to message: "${processedMessage}"`);
        }
        
        console.log('Current conversation context:', {
            lastTopic: currentTopic,
            isFollowUp: isFollowUp,
            isExplainAgain: isExplainAgain,
            messageToProcess: processedMessage
        });
        
        // Get the most recent substantive message context
        let lastQuestion = '';
        let lastResponse = '';
        
        // Find the last AI message for context
        for (let i = conversationContext.conversationHistory.length - 1; i >= 0; i--) {
            const msg = conversationContext.conversationHistory[i];
            if (msg.sender === 'assistant' && !lastResponse) {
                lastResponse = msg.text;
                console.log(`Found last AI response (first 50 chars): ${lastResponse.substring(0, 50)}...`);
            } else if (msg.sender === 'user' && !lastQuestion) {
                lastQuestion = msg.text;
                console.log(`Found last user question: ${lastQuestion}`);
            }
            
            // If we have both, we can stop searching
            if (lastQuestion && lastResponse) break;
        }
        
        // Prepare the data object for backend
        const requestData = {
            text: processedMessage,
            context: {
                isFollowUp: isFollowUp,
                isExplainAgain: isExplainAgain,
                currentTopic: currentTopic,
                lastQuestion: lastQuestion,
                lastResponse: lastResponse,
                recentMessages: conversationContext.conversationHistory.map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'ai',
                    text: msg.text,
                    timestamp: msg.timestamp
                })).slice(-5)
            }
        };
        
        console.log("Sending direct request to backend with data:", {
            text: requestData.text,
            isExplainAgain: requestData.context.isExplainAgain,
            isFollowUp: requestData.context.isFollowUp,
            currentTopic: requestData.context.currentTopic,
            messageCount: requestData.context.recentMessages.length
        });
        
        // Ensure isExplainAgain is properly set in requestData
        requestData.isExplainAgain = isExplainAgain;
        
        // Additional logging for explain again handling
        if (isExplainAgain) {
            console.log("CRITICAL: Sending 'explain again' request to backend", {
                isExplainAgain: true,
                currentTopic: currentTopic,
                textBeingSent: text
            });
        }
        
        // Process the text directly through the MentauraAPI
        const response = await mentauraAPI.processText(requestData);
        
        // Update conversation context
        conversationContext.lastQuestion = text;
        conversationContext.lastResponse = response.text;
        
        // Only update the topic if this is a new question, not a follow-up or explain again
        if (!isFollowUp && !isExplainAgain && text.length > 5) {
            console.log(`Updating current topic from "${currentTopic}" to "${text}"`);
            conversationContext.lastTopic = text; // Update topic only for new questions
        } else {
            console.log(`Keeping current topic as "${currentTopic}" for follow-up/explain again`);
            // Ensure the topic is preserved
            if (currentTopic) {
                conversationContext.lastTopic = currentTopic;
            }
        }
        
        // Save conversation context to ensure persistence
        try {
            localStorage.setItem('mentaura_conversation', JSON.stringify(conversationContext));
            console.log('Saved conversation context with topic:', conversationContext.lastTopic);
        } catch (e) {
            console.error('Error saving conversation to localStorage', e);
        }
        
        // Add AI response to conversation history
        addMessageToHistory('assistant', response.text);
        console.log('Adding AI message, message length:', response.text.length, 'Has audio:', !!response.audio);
        
        // Update UI with the response
        updateChatUI(response);
        
    } catch (error) {
        console.error('Error processing text:', error);
        showError('Failed to process your message. Please try again.');
    }
} 