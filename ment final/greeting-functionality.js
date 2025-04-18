// Mentaura greeting functionality

// Add conversation context tracking at the top of the file
let conversationContext = {
    lastTopic: null,
    lastQuestion: null,
    lastResponse: null,
    conversationHistory: []
};

// Add global variables for speech control
let currentSpeechState = {
    messageElement: null,
    chunks: [],
    currentChunkIndex: 0,
    isPaused: false,
    isSpeaking: false,
    utterance: null
};

// Store available voices globally after they're loaded
let speechVoicesLoaded = false;

// Initialize the greeting functionality when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Web Speech API voices as early as possible
    if ('speechSynthesis' in window) {
        loadVoices();
        
        // Handle the case where voices might not be immediately available
        window.speechSynthesis.onvoiceschanged = function() {
            loadVoices();
        };
    }
    
    // Initialize other greeting functionality
    initGreetingFunctionality();
});

/**
 * Load and cache available speech synthesis voices
 */
function loadVoices() {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        window.mentauraVoices = voices;
        speechVoicesLoaded = true;
        console.log('Speech synthesis voices loaded:', voices.length);
        
        // Preselect a preferred voice
        let preferredVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('female') && 
            voice.name.toLowerCase().includes('english')
        ) || voices.find(voice => voice.name.toLowerCase().includes('female'));
        
        if (preferredVoice) {
            window.mentauraPreferredVoice = preferredVoice;
            console.log('Preferred voice selected:', preferredVoice.name);
        }
    } else {
        console.log('No speech synthesis voices available yet, will try again');
        
        // If voices aren't loaded yet, try again in a moment
        setTimeout(function checkVoicesLoaded() {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                window.mentauraVoices = voices;
                speechVoicesLoaded = true;
                console.log('Speech synthesis voices loaded (retry):', voices.length);
                
                // Preselect a preferred voice
                let preferredVoice = voices.find(voice => 
                    voice.name.toLowerCase().includes('female') && 
                    voice.name.toLowerCase().includes('english')
                ) || voices.find(voice => voice.name.toLowerCase().includes('female'));
                
                if (preferredVoice) {
                    window.mentauraPreferredVoice = preferredVoice;
                    console.log('Preferred voice selected:', preferredVoice.name);
                }
            } else {
                console.log('Speech synthesis voices still not available');
            }
        }, 500);
    }
}

// Wait for the window to load and then override the functions
(function() {
    console.log('Initializing greeting functionality');
    
    // Load voices as soon as possible
    if ('speechSynthesis' in window) {
        // Create a function to get voices and store them globally
        let voicesLoaded = false;
        
        function loadVoices() {
            window.mentauraVoices = window.speechSynthesis.getVoices();
            console.log('Voices preloaded:', window.mentauraVoices.length);
            voicesLoaded = true;
        }
        
        // Try to load voices immediately
        loadVoices();
        
        // Some browsers need the onvoiceschanged event
        window.speechSynthesis.onvoiceschanged = function() {
            loadVoices();
            console.log('Voices changed and reloaded:', window.mentauraVoices.length);
        };
        
        // Make absolutely sure voices are loaded before user interaction
        setTimeout(function checkVoicesLoaded() {
            if (!voicesLoaded || window.mentauraVoices.length === 0) {
                window.mentauraVoices = window.speechSynthesis.getVoices();
                console.log('Voices check after timeout:', window.mentauraVoices.length);
                
                if (window.mentauraVoices.length === 0) {
                    setTimeout(checkVoicesLoaded, 100); // Keep checking until voices are loaded
                }
            }
        }, 500);
    }
    
    // When DOM is loaded, override the functions
    function initGreetingFunctionality() {
        console.log('DOM loaded, overriding functions');
        
        // Grab reference to conversation history
        window.conversationHistory = document.getElementById('conversation-history');
        
        // Override with our enhanced functions
        window.handleUserTextSubmission = handleUserTextSubmission;
        window.startVoiceRecognition = startVoiceRecognition;
        
        // Create a test greeting audio file
        createGreetingAudio();
        
        console.log('Greeting functionality initialized');
    }
    
    // Create a greeting audio file using Web Audio API if browser supports it
    function createGreetingAudio() {
        try {
            if ('AudioContext' in window || 'webkitAudioContext' in window) {
                // We'll just create a beep sound as a placeholder
                // In a real app, you'd use a proper audio file
            }
        } catch (error) {
            console.error('Error creating greeting audio:', error);
        }
    }
    
    // Add the event listener
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGreetingFunctionality);
    } else {
        // DOM already loaded, run the init function
        initGreetingFunctionality();
    }
})();

/**
 * Handles user text submission in the main conversation
 */
async function handleUserTextSubmission(text) {
    try {
    if (!text.trim()) return;
    
    // Add user message to the chat
    addMessage('user', text);
    
    // Add to conversation history
    conversationContext.conversationHistory.push({
        role: 'user',
        text: text
    });
    
    // Check if this is a follow-up question
    const lowerText = text.toLowerCase();
    const isFollowUp = lowerText.includes('what about') || 
                      lowerText.includes('can you explain') || 
                      lowerText.includes('tell me more') || 
                      lowerText.includes('how about') ||
                      lowerText.includes('continue') ||
                      lowerText.includes('go on') ||
                      lowerText.includes('and');
    
    // Check specifically for "explain again"
    const isExplainAgain = lowerText.includes('explain again');
    
        // Get user preferences
        const userPreferences = getUserPreferences();
        
        // Add typing indicator
        addTypingIndicator();
    
    // Show thinking indicator
    showThinkingIndicator();
    
        // Store the current conversation state
        conversationContext.lastQuestion = text;
        
        // Prepare parameters for API request
        const requestData = {
            text: text,
            uid: getCurrentUserID(),
                isFollowUp: isFollowUp,
            isExplainAgain: isExplainAgain,
            settings: {
                voice: userPreferences.voice,
                teaching_style: userPreferences.teaching_style,
                personality: userPreferences.personality,
                difficulty: userPreferences.difficulty,
                speed: userPreferences.speed,
                pitch: userPreferences.pitch
            }
        };
        
        // Send the request to the backend
        console.log('Sending request to API:', requestData);
        const response = await fetch('/api/process_text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        // Hide thinking indicator
        hideThinkingIndicator();
        
        // Remove typing indicator
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const responseData = await response.json();
        console.log('API response:', responseData);
        
        // Store the response for context
        conversationContext.lastResponse = responseData.text;
        
        // Extract topics from response
        const topics = extractTopicsFromResponse(responseData.text);
        if (topics.length > 0) {
            console.log('Extracted topics:', topics);
            conversationContext.lastTopic = topics[0]; // Use the first topic as main topic
        }
        
        // Add AI response to conversation history
        conversationContext.conversationHistory.push({
            role: 'ai',
            text: responseData.text
        });
        
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

/**
 * Get user preferences from localStorage
 * Returns default preferences if none are found
 */
function getUserPreferences() {
    try {
        const savedPreferences = localStorage.getItem('mentaura_preferences');
        if (savedPreferences) {
            return JSON.parse(savedPreferences);
        }
    } catch (error) {
        console.error('Error loading preferences:', error);
    }
    
    // Default preferences if none are stored
    return {
        voice: 'female',
        speed: 1.0,
        pitch: 1.0,
        teaching_style: 'detailed',
        personality: 'friendly',
        difficulty: 'intermediate'
    };
}

/**
 * Get current user ID from localStorage or return guest ID
 */
function getCurrentUserID() {
    try {
        const userData = JSON.parse(localStorage.getItem('mentaura_user') || '{}');
        return userData.userId || userData.uid || 'guest';
    } catch (error) {
        console.error('Error getting user ID:', error);
        return 'guest';
    }
}

// Fallback function to play greeting audio when API fails
function playGreetingAudio() {
    // Create an audio element and play the greeting
    const audio = new Audio();
    
    // Try to use local greeting audio file if available
    audio.src = 'greeting.mp3';
    audio.onerror = function() {
        // If local file fails, try to use the Web Speech API
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance("Hi, I'm Mentaura. How can I help you today? What are you interested in learning about?");
            window.speechSynthesis.speak(utterance);
        }
    };
    
    audio.play().catch(error => {
        console.error('Error playing audio:', error);
    });
}

/**
 * Starts voice recognition for input
 */
function startVoiceRecognition() {
    // Check if we have Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Your browser does not support voice recognition.');
        return;
    }

    // Create recording indicator
    const recordingIndicator = document.createElement('div');
    recordingIndicator.className = 'recording-indicator';
    recordingIndicator.innerHTML = '<i class="fas fa-microphone"></i> Listening...';
    document.body.appendChild(recordingIndicator);
    
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    // Start listening
    recognition.start();
    
    // Handle results
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        console.log('Voice input:', transcript);
        
        // Remove recording indicator
        document.body.removeChild(recordingIndicator);
        
        // Add user message to the conversation
        addUserMessage(transcript);
        
        // Show typing indicator
        const typingIndicator = addTypingIndicator();
        
        // Check for follow-up indicators
        const isFollowUp = transcript.toLowerCase().includes('again') || 
                          transcript.toLowerCase().includes('what about') ||
                          transcript.toLowerCase().includes('can you explain') ||
                          transcript.toLowerCase().includes('tell me more') ||
                          transcript.toLowerCase().includes('how about');
        
        // Check for "explain again" specifically
        const isExplainAgain = transcript.toLowerCase().includes('explain again');
        
        // If it's a follow-up question and we have context, modify the message
        let processedTranscript = transcript;
        if ((isFollowUp || isExplainAgain) && conversationContext.lastTopic) {
            processedTranscript = `Regarding ${conversationContext.lastTopic}: ${transcript}`;
            console.log('Processing follow-up question with context:', processedTranscript);
        }
        
        // Process voice input
        setTimeout(() => {
            // Remove typing indicator
            if (typingIndicator) {
                conversationHistory.removeChild(typingIndicator);
            }
            
            // Process through API with context
            api.processText(processedTranscript, { 
                generateSpeech: true,
                generateNotes: true,  // Explicitly request notes for learning content
                context: {
                    isFollowUp: isFollowUp,
                    isExplainAgain: isExplainAgain,
                    lastTopic: conversationContext.lastTopic,
                    lastQuestion: conversationContext.lastQuestion,
                    lastResponse: conversationContext.lastResponse,
                    recentMessages: conversationContext.conversationHistory.slice(-5).map(msg => ({
                        role: msg.user ? 'user' : 'ai',
                        text: msg.user || msg.ai
                    }))
                }
            })
                .then(response => {
                // Update conversation context
                if (response.text) {
                    // Extract topic from response
                    const topicMatch = response.text.match(/^([^.!?]+)/);
                    if (topicMatch) {
                        conversationContext.lastTopic = topicMatch[1].trim();
                    }
                    conversationContext.lastQuestion = transcript;
                    conversationContext.lastResponse = response.text;
                    
                    // Store in conversation history
                    conversationContext.conversationHistory.push({
                        user: transcript,
                        ai: response.text,
                        topic: conversationContext.lastTopic
                    });
                    
                    // Limit history size
                    if (conversationContext.conversationHistory.length > 10) {
                        conversationContext.conversationHistory.shift();
                    }
                }
                
                console.log('Voice API Response received:', response);
                console.log('Voice response has notes:', !!response.notes);
                console.log('Notes object direct:', response.notes);
                console.log('Notes type:', typeof response.notes);
                
                // Force cast notes to string type if it exists but isn't a string
                const notesStr = response.notes ? response.notes.toString() : null;
                console.log('Notes after toString:', notesStr);
                
                addAIMessage(response.text, response.audio, notesStr);
                })
                .catch(error => {
                    console.error('Error processing voice input:', error);
                // Fallback message with context
                const fallbackText = conversationContext.lastTopic ? 
                    `I'd be happy to continue discussing ${conversationContext.lastTopic}. What specific aspects would you like to learn more about?` :
                    "I'm sorry, I'm having trouble understanding. Could you please try again?";
                    addAIMessage(fallbackText);
                });
        }, 1000);
    };
    
    // Handle errors
    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        // Remove recording indicator
        if (document.body.contains(recordingIndicator)) {
            document.body.removeChild(recordingIndicator);
        }
        
        // Show error message
        addSystemMessage('Voice recognition error. Please try again or type your message.');
    };
    
    // Handle end of speech
    recognition.onend = function() {
        // Remove recording indicator if it's still there
        if (document.body.contains(recordingIndicator)) {
            document.body.removeChild(recordingIndicator);
        }
    };
}

/**
 * Loads previous conversation history from local storage
 */
function loadConversationHistory() {
    const conversationHistory = document.getElementById('conversation-history');
    
    if (!conversationHistory) {
        console.error('Conversation history element not found');
        return;
    }
    
    // Clear current conversation display
    conversationHistory.innerHTML = '';
    
    // Get saved messages from local storage
    const savedMessages = JSON.parse(localStorage.getItem('mentaura_messages') || '[]');
    
    // If we have saved messages, display them
    if (savedMessages.length > 0) {
        savedMessages.forEach(msg => {
            if (msg.sender === 'user') {
                addUserMessage(msg.text);
            } else if (msg.sender === 'ai') {
                addAIMessage(msg.text);
            }
        });
    }
}

/**
 * Shows the initial greeting message when the user first loads the dashboard
 */
function showInitialGreeting() {
    const conversationHistory = document.getElementById('conversation-history');
    
    // Only show initial greeting if conversation is empty
    if (conversationHistory && conversationHistory.children.length === 0) {
        setTimeout(() => {
            // Add AI greeting message
            const greetingText = "Welcome to Mentaura! I'm your personal AI tutor. How can I help you today?";
            addAIMessage(greetingText);
            
            // Add hint about greetings
            const systemMsg = document.createElement('div');
            systemMsg.className = 'message system-message';
            systemMsg.innerHTML = `
                <div class="message-content">
                    <p>Tip: Try saying "hi" or "hello" to hear me speak!</p>
                </div>
            `;
            conversationHistory.appendChild(systemMsg);
        }, 500);
    }
}

/**
 * Adds a user message to the conversation
 * @param {string} message - The message text or HTML content
 */
function addUserMessage(message) {
    const conversationHistory = document.getElementById('conversation-history');
    
    if (!conversationHistory) {
        console.error('Conversation history element not found');
        return;
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message user-message';
    messageElement.innerHTML = `
        <div class="avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    
    conversationHistory.appendChild(messageElement);
    conversationHistory.scrollTop = conversationHistory.scrollHeight;
}

/**
 * Adds an AI message to the conversation
 * @param {string} message - The AI message text
 * @param {string} audioBase64 - Optional base64 encoded audio for voice response
 * @param {string} notes - Optional structured notes in markdown format
 */
function addAIMessage(message, audioBase64, notes) {
    const conversationHistory = document.getElementById('conversation-history');
    
    if (!conversationHistory) {
        console.error('Conversation history element not found');
        return;
    }
    
    console.log('Adding AI message, message length:', message ? message.length : 0, 'Has audio:', !!audioBase64, 'Has notes:', !!notes);
    console.log('Notes type:', typeof notes, 'Notes value:', notes ? notes.substring(0, 50) + '...' : 'undefined/null');
    
    // Create message element
    const messageElement = document.createElement('div');
    
    // Make sure notes is a string
    const notesStr = typeof notes === 'string' ? notes : (notes ? notes.toString() : '');
    
    // Check if this message has structured notes
    if (notesStr && notesStr.length > 0) {
        console.log("Displaying structured notes:", notesStr.substring(0, 100) + "...");
        messageElement.className = 'message ai-message learning-message';
        
        // Create content with both notes and voice controls
        messageElement.innerHTML = `
            <div class="avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="structured-notes">
                    <div class="notes-header">
                        <i class="fas fa-book-open"></i> Structured Notes
                    </div>
                    <div class="notes-content markdown-content">
                        ${window.marked ? window.marked(notesStr) : notesStr}
                    </div>
                </div>
                <div class="voice-controls">
                    <button class="voice-control-btn pause-play-btn">
                        <i class="fas fa-pause"></i>
                    </button>
                    <button class="voice-control-btn stop-btn">
                        <i class="fas fa-stop"></i>
                    </button>
                    <button class="voice-control-btn transcript-btn" title="Show Transcript">
                        <i class="fas fa-file-alt"></i>
                    </button>
                </div>
                <div class="transcript-content" style="display: none;">
                    <div class="transcript-header">
                        <i class="fas fa-file-alt"></i> Transcript
                    </div>
                    <div class="transcript-text">
                        ${message || ""}
                    </div>
                </div>
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
    } else {
        console.log("No structured notes to display, using voice-only message");
        // Regular voice-only message
        messageElement.className = 'message ai-message voice-only-message';
        messageElement.innerHTML = `
            <div class="avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                ${message ? `<p>${message}</p>` : ''}
                <div class="voice-controls">
                    <button class="voice-control-btn pause-play-btn">
                        <i class="fas fa-pause"></i>
                    </button>
                    <button class="voice-control-btn stop-btn">
                        <i class="fas fa-stop"></i>
                    </button>
                    <button class="voice-control-btn transcript-btn" title="Show Transcript">
                        <i class="fas fa-file-alt"></i>
                    </button>
                </div>
                <div class="transcript-content" style="display: none;">
                    <div class="transcript-header">
                        <i class="fas fa-file-alt"></i> Transcript
                    </div>
                    <div class="transcript-text">
                        ${message || ""}
                    </div>
                </div>
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
    }
    
    // Add to conversation
    conversationHistory.appendChild(messageElement);
    conversationHistory.scrollTop = conversationHistory.scrollHeight;
    
    // Add event listeners for voice control buttons
    const pausePlayBtn = messageElement.querySelector('.pause-play-btn');
    const stopBtn = messageElement.querySelector('.stop-btn');
    const transcriptBtn = messageElement.querySelector('.transcript-btn');
    const transcriptContent = messageElement.querySelector('.transcript-content');
    
    pausePlayBtn.addEventListener('click', function() {
        if (currentSpeechState.messageElement === messageElement) {
            if (currentSpeechState.isPaused) {
                // Resume speech
                resumeSpeech();
                this.innerHTML = '<i class="fas fa-pause"></i>';
            } else {
                // Pause speech
                pauseSpeech();
                this.innerHTML = '<i class="fas fa-play"></i>';
            }
        }
    });
    
    stopBtn.addEventListener('click', function() {
        if (currentSpeechState.messageElement === messageElement) {
            stopSpeech();
            pausePlayBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    });
    
    // Add event listener for transcript button
    if (transcriptBtn && transcriptContent) {
        transcriptBtn.addEventListener('click', function() {
            // Toggle transcript visibility
            if (transcriptContent.style.display === 'none') {
                transcriptContent.style.display = 'block';
                this.classList.add('active');
            } else {
                transcriptContent.style.display = 'none';
                this.classList.remove('active');
            }
        });
    }
    
    // Add event listeners for feedback buttons
    const likeBtn = messageElement.querySelector('.like-btn');
    const dislikeBtn = messageElement.querySelector('.dislike-btn');
    
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
    
    // Determine what text to speak
    let textToSpeak = message;
    if (!message || message.trim() === '') {
        textToSpeak = "Hi, I'm Mentaura. How can I help you today? What are you interested in learning about?";
    }
    
    // Create and play audio using Web Speech API with improved handling
    if ('speechSynthesis' in window) {
        console.log('Using Web Speech API for response:', textToSpeak.substring(0, 50) + (textToSpeak.length > 50 ? '...' : ''));
        
        // First make sure any previous speech is properly canceled
        stopSpeech();
        
        // Wait a moment to ensure speech synthesis is ready
        setTimeout(() => {
            // Split text into natural chunks at sentence boundaries with improved splitting
            const chunks = splitTextIntoSpeechChunks(textToSpeak);
            
            // Set up current speech state
            currentSpeechState = {
                messageElement: messageElement,
                chunks: chunks,
                currentChunkIndex: 0,
                isPaused: false,
                isSpeaking: false,
                utterance: null
            };
            
            // Wait another short moment before starting to speak
            setTimeout(() => {
                // Start speaking chunks
                speakNextChunk();
            }, 200);
        }, 100);
    } else if (audioBase64) {
        console.log('Using provided audio base64 for response');
        const audioElement = document.createElement('audio');
        audioElement.src = `data:audio/mp3;base64,${audioBase64}`;
        audioElement.style.display = 'none';
        document.body.appendChild(audioElement);
        
        // Add controls for audio element
        const audioControls = messageElement.querySelector('.voice-controls');
        if (audioControls) {
            const pausePlayBtn = audioControls.querySelector('.pause-play-btn');
            const stopBtn = audioControls.querySelector('.stop-btn');
            
            pausePlayBtn.addEventListener('click', function() {
                if (audioElement.paused) {
                    audioElement.play();
                    this.innerHTML = '<i class="fas fa-pause"></i>';
                } else {
                    audioElement.pause();
                    this.innerHTML = '<i class="fas fa-play"></i>';
                }
            });
            
            stopBtn.addEventListener('click', function() {
                audioElement.pause();
                audioElement.currentTime = 0;
                pausePlayBtn.innerHTML = '<i class="fas fa-play"></i>';
            });
        }
        
        audioElement.play().catch(error => {
            console.error('Error playing audio:', error);
        });
    }
}

/**
 * Splits text into appropriate chunks for speech synthesis
 * @param {string} text - The text to split into chunks
 * @returns {Array<string>} - Array of text chunks
 */
function splitTextIntoSpeechChunks(text) {
    // Split text at sentence boundaries
    const sentences = text.split(/(?<=[.!?])\s+/);
    const chunks = [];
    let currentChunk = '';
    
    // Optimal chunk size - not too small, not too large
    const MAX_CHUNK_SIZE = 150;
    
    for (const sentence of sentences) {
        // If adding this sentence would make the chunk too long, start a new chunk
        if (currentChunk.length + sentence.length > MAX_CHUNK_SIZE) {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
            }
            
            // If the sentence itself is very long, split it at punctuation
            if (sentence.length > MAX_CHUNK_SIZE) {
                const subParts = sentence.split(/(?<=[,;:])\s+/);
                for (const part of subParts) {
                    if (part.length > MAX_CHUNK_SIZE) {
                        // If still too long, just add it as its own chunk
                        chunks.push(part.trim());
                    } else if (currentChunk.length + part.length > MAX_CHUNK_SIZE) {
                        chunks.push(currentChunk.trim());
                        currentChunk = part;
                    } else {
                        currentChunk += (currentChunk ? ' ' : '') + part;
                    }
                }
            } else {
                currentChunk = sentence;
            }
        } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
    }
    
    // Add the final chunk if there is one
    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }
    
    console.log(`Split text into ${chunks.length} chunks for speech`);
    return chunks;
}

/**
 * Speaks the next chunk of text in the speech synthesis queue
 */
function speakNextChunk() {
    if (currentSpeechState.isPaused) {
        return; // Don't proceed if paused
    }
    
    if (currentSpeechState.currentChunkIndex >= currentSpeechState.chunks.length) {
        console.log('All chunks completed');
        if (currentSpeechState.messageElement) {
            currentSpeechState.messageElement.classList.remove('speaking');
        }
        currentSpeechState.isSpeaking = false;
        return;
    }
    
    const chunk = currentSpeechState.chunks[currentSpeechState.currentChunkIndex];
    console.log(`Speaking chunk ${currentSpeechState.currentChunkIndex + 1}/${currentSpeechState.chunks.length}:`, chunk.substring(0, 50) + '...');
    
    // Make sure speech synthesis is fully ready and not already speaking
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel(); // Cancel any ongoing speech first
        setTimeout(() => speakNextChunk(), 300); // Wait before trying again
        return;
    }
    
    const utterance = new SpeechSynthesisUtterance(chunk);
    currentSpeechState.utterance = utterance;
    
    // Use the preferred voice if already selected, otherwise find appropriate voice
    if (window.mentauraPreferredVoice) {
        utterance.voice = window.mentauraPreferredVoice;
        console.log('Using preferred voice:', window.mentauraPreferredVoice.name);
    } else {
        // Get available voices
        let voices = window.mentauraVoices || window.speechSynthesis.getVoices();
    
        // If no voices available yet, try to load them
        if (!voices || voices.length === 0) {
            console.log('No voices available, trying to load...');
            voices = window.speechSynthesis.getVoices();
            
            // If still no voices, retry after a delay
            if (!voices || voices.length === 0) {
                setTimeout(() => {
                    window.mentauraVoices = window.speechSynthesis.getVoices();
                    speakNextChunk();
                }, 500);
                return;
            }
        }
        
        // Find a female voice (preferably English)
        let selectedVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('female') && 
            voice.name.toLowerCase().includes('english')
        ) || voices.find(voice => voice.name.toLowerCase().includes('female'));
        
        if (selectedVoice) {
            console.log('Using voice:', selectedVoice.name);
            utterance.voice = selectedVoice;
            // Cache this voice for future use
            window.mentauraPreferredVoice = selectedVoice;
        }
    }
    
    // Optimize speech settings for natural flow
    utterance.rate = 0.95;  // Slightly slower but still natural
    utterance.pitch = 1.0;  // Natural pitch
    utterance.volume = 1.0;
    
    // Make sure previous speech has fully completed
    if (window.speechSynthesis.speaking && !currentSpeechState.isPaused) {
        console.log('Speech synthesis still speaking, waiting...');
        setTimeout(speakNextChunk, 250);
        return;
    }
    
    // Set flag for chunk in progress
    let chunkCompleted = false;
    
    // Set maximum chunk length protection
    const MAX_CHUNK_DURATION = 10000; // 10 seconds max per chunk
    
    utterance.onstart = () => {
        console.log(`Chunk ${currentSpeechState.currentChunkIndex + 1} started`);
        currentSpeechState.isSpeaking = true;
        if (currentSpeechState.messageElement) {
            currentSpeechState.messageElement.classList.add('speaking');
        }
    };
    
    utterance.onend = () => {
        console.log(`Chunk ${currentSpeechState.currentChunkIndex + 1} completed`);
        chunkCompleted = true;
        currentSpeechState.isSpeaking = false;
        currentSpeechState.currentChunkIndex++;
        
        // Add a short delay between chunks for more reliable playback
        if (!currentSpeechState.isPaused) {
            setTimeout(speakNextChunk, 350); // Increased delay for better reliability
        }
    };
    
    utterance.onerror = (event) => {
        console.error(`Error speaking chunk ${currentSpeechState.currentChunkIndex + 1}:`, event);
        
        // Handle authentication errors specifically
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || 
            (typeof event.error === 'string' && event.error.includes('401'))) {
            console.log('Authentication error detected in speech synthesis, using fallback voice');
            
            // Try to use a different voice
            const voices = window.speechSynthesis.getVoices();
            if (voices && voices.length > 0) {
                const fallbackVoice = voices.find(v => v.default) || voices[0];
                utterance.voice = fallbackVoice;
                window.mentauraPreferredVoice = fallbackVoice;
                console.log('Using fallback voice:', fallbackVoice.name);
                
                try {
                    // Try again with the fallback voice
                    setTimeout(() => {
                        window.speechSynthesis.speak(utterance);
                    }, 300);
                    return;
                } catch (fallbackError) {
                    console.error('Error using fallback voice:', fallbackError);
                }
            }
        }
        
        // Handle interruption errors specifically
        if (event.error === 'interrupted' || event.error === 'canceled') {
            console.log('Speech was interrupted, will attempt to resume...');
            
            // If we haven't already marked this chunk as complete, move to the next one
            if (!chunkCompleted) {
                chunkCompleted = true;
                currentSpeechState.isSpeaking = false;
                currentSpeechState.currentChunkIndex++;
                
                // Try to recover with a longer delay
                if (!currentSpeechState.isPaused) {
                    setTimeout(speakNextChunk, 500);
                }
            }
        } else {
            // For other errors
            if (!chunkCompleted) {
                chunkCompleted = true;
                currentSpeechState.isSpeaking = false;
                currentSpeechState.currentChunkIndex++;
                
                // Try to recover with a slightly longer delay
                if (!currentSpeechState.isPaused) {
                    setTimeout(speakNextChunk, 400);
                }
            }
        }
    };
    
    // Additional handling to ensure speech completes
    try {
        // Speak the chunk
        window.speechSynthesis.speak(utterance);
        
        // Set a backup timeout in case onend doesn't fire
        setTimeout(() => {
            if (!chunkCompleted && !currentSpeechState.isPaused) {
                console.log(`Backup timeout for chunk ${currentSpeechState.currentChunkIndex + 1}`);
                chunkCompleted = true;
                currentSpeechState.isSpeaking = false;
                currentSpeechState.currentChunkIndex++;
                speakNextChunk();
            }
        }, Math.min(MAX_CHUNK_DURATION, Math.max(2000, chunk.length * 80))); // Minimum 2 seconds or ~80ms per character, max 10 seconds
        
    } catch (error) {
        console.error('Error starting speech:', error);
        // Try next chunk
        currentSpeechState.currentChunkIndex++;
        if (!currentSpeechState.isPaused) {
            setTimeout(speakNextChunk, 300);
        }
    }
}

/**
 * Pauses the current speech synthesis
 */
function pauseSpeech() {
    if (window.speechSynthesis && currentSpeechState.isSpeaking) {
        window.speechSynthesis.pause();
        currentSpeechState.isPaused = true;
        console.log('Speech paused');
    }
}

/**
 * Resumes the current speech synthesis
 */
function resumeSpeech() {
    if (window.speechSynthesis && currentSpeechState.isPaused) {
        window.speechSynthesis.resume();
        currentSpeechState.isPaused = false;
        
        // If we're between chunks, start the next chunk
        if (!currentSpeechState.isSpeaking) {
            speakNextChunk();
        }
        console.log('Speech resumed');
    }
}

/**
 * Stops the current speech synthesis
 */
function stopSpeech() {
    if (window.speechSynthesis) {
        try {
            window.speechSynthesis.cancel();
            currentSpeechState.isPaused = false;
            currentSpeechState.isSpeaking = false;
            
            if (currentSpeechState.messageElement) {
                currentSpeechState.messageElement.classList.remove('speaking');
            }
            console.log('Speech stopped');
        } catch (err) {
            console.error('Error stopping speech:', err);
        }
    }
}

/**
 * Adds a typing indicator to show AI is processing
 * @returns {HTMLElement} The typing indicator element
 */
function addTypingIndicator() {
    const conversationHistory = document.getElementById('conversation-history');
    
    if (!conversationHistory) {
        console.error('Conversation history element not found');
        return null;
    }
    
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message ai-message typing-indicator';
    typingIndicator.id = 'typing-indicator';
    typingIndicator.innerHTML = `
        <div class="avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content typing-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    
    conversationHistory.appendChild(typingIndicator);
    conversationHistory.scrollTop = conversationHistory.scrollHeight;
    
    return typingIndicator;
}

/**
 * Adds a system message to the conversation
 * @param {string} message - The system message
 */
function addSystemMessage(message) {
    const conversationHistory = document.getElementById('conversation-history');
    
    if (!conversationHistory) {
        console.error('Conversation history element not found');
        return;
    }
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'message system-message';
    messageElement.innerHTML = `
        <div class="avatar">
            <i class="fas fa-info-circle"></i>
        </div>
        <div class="message-content">
            <p>${message}</p>
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
    
    // Add to conversation
    conversationHistory.appendChild(messageElement);
    conversationHistory.scrollTop = conversationHistory.scrollHeight;
    
    // Add event listeners for feedback buttons
    const likeBtn = messageElement.querySelector('.like-btn');
    const dislikeBtn = messageElement.querySelector('.dislike-btn');
    
    likeBtn.addEventListener('click', function() {
        // Toggle liked state
        if (this.classList.contains('liked')) {
            this.classList.remove('liked');
        } else {
            this.classList.add('liked');
            dislikeBtn.classList.remove('disliked'); // Remove disliked from the other button
        }
        
        // Here you could also send feedback to the server
        console.log('User liked system message');
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
        console.log('User disliked system message');
    });
}

/**
 * Speaks the response text using our speech controls
 * @param {string} text - The text to speak
 */
function speakResponse(text) {
    if (!text) return;
    
    console.log('Speaking response:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    
    // Cancel any ongoing speech
    stopSpeech();
    
    // Split text into natural chunks at sentence boundaries
    const sentences = text.split(/(?<=[.!?])\s+/);
    const chunks = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
        // If adding this sentence would make the chunk too long, start a new chunk
        if (currentChunk.length + sentence.length > 200) {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
            }
            // If the sentence itself is too long, split it at commas
            if (sentence.length > 200) {
                const parts = sentence.split(/(?<=[,;:])\s+/);
                for (const part of parts) {
                    if (currentChunk.length + part.length > 200) {
                        if (currentChunk) {
                            chunks.push(currentChunk.trim());
                            currentChunk = '';
                        }
                        currentChunk = part;
                    } else {
                        currentChunk += (currentChunk ? ' ' : '') + part;
                    }
                }
            } else {
                currentChunk = sentence;
            }
        } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
    }
    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }
    
    // Find the last AI message to attach the speech to
    const conversationHistory = document.getElementById('conversation-history');
    const messages = conversationHistory.querySelectorAll('.ai-message');
    const lastAIMessage = messages[messages.length - 1];
    
    if (!lastAIMessage) {
        console.error('No AI message found to attach speech to');
        return;
    }
    
    // Set up current speech state
    currentSpeechState = {
        messageElement: lastAIMessage,
        chunks: chunks,
        currentChunkIndex: 0,
        isPaused: false,
        isSpeaking: false,
        utterance: null
    };
    
    // Start speaking chunks
    speakNextChunk();
}

/**
 * Shows a typing indicator while AI is processing
 */
function showThinkingIndicator() {
    const conversationHistory = document.getElementById('conversation-history');
    
    if (!conversationHistory) {
        console.error('Conversation history element not found');
        return null;
    }
    
    // Check if there's already a typing indicator
    const existingIndicator = conversationHistory.querySelector('.typing-indicator');
    if (existingIndicator) {
        return existingIndicator;
    }
    
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message ai-message typing-indicator';
    typingIndicator.id = 'typing-indicator';
    typingIndicator.innerHTML = `
        <div class="avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content typing-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    
    conversationHistory.appendChild(typingIndicator);
    conversationHistory.scrollTop = conversationHistory.scrollHeight;
    
    return typingIndicator;
}

/**
 * Hides the typing indicator
 */
function hideThinkingIndicator() {
    const conversationHistory = document.getElementById('conversation-history');
    
    if (!conversationHistory) {
        console.error('Conversation history element not found');
        return;
    }
    
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator && typingIndicator.parentNode === conversationHistory) {
        conversationHistory.removeChild(typingIndicator);
    }
}

/**
 * Adds a message to the conversation
 * @param {string} role - 'user' or 'ai'
 * @param {string} text - Message text
 */
function addMessage(role, text) {
    if (role === 'user') {
        addUserMessage(text);
    } else if (role === 'ai') {
        addAIMessage(text);
    } else {
        addSystemMessage(text);
    }
}

/**
 * Extracts potential topics from an AI response
 * @param {string} response - AI response text
 * @returns {string[]} - Array of potential topics
 */
function extractTopicsFromResponse(response) {
    const topics = [];
    
    // Try to extract topics from the first sentence or key phrases
    const firstSentence = response.split(/[.!?](\s|$)/)[0].trim();
    
    // Check if the first sentence contains topic indicators
    if (firstSentence.toLowerCase().includes('about') || 
        firstSentence.toLowerCase().includes('let\'s talk about') || 
        firstSentence.toLowerCase().includes('let\'s explore') ||
        firstSentence.toLowerCase().includes('regarding')) {
        
        const aboutIndex = Math.max(
            firstSentence.toLowerCase().lastIndexOf('about '),
            firstSentence.toLowerCase().lastIndexOf('talk about '),
            firstSentence.toLowerCase().lastIndexOf('explore '),
            firstSentence.toLowerCase().lastIndexOf('regarding ')
        );
        
        if (aboutIndex !== -1) {
            const topic = firstSentence.substring(aboutIndex).replace(/^(about|talk about|explore|regarding)\s+/i, '').trim();
            if (topic) {
                topics.push(topic);
            }
        }
    }
    
    // Check for specific educational topics
    const educationalTopics = [
        'math', 'science', 'history', 'geography', 'literature', 'physics',
        'chemistry', 'biology', 'algebra', 'geometry', 'calculus', 'programming',
        'language', 'grammar', 'writing', 'reading', 'addition', 'subtraction',
        'multiplication', 'division', 'fractions', 'decimals', 'percentages'
    ];
    
    for (const topic of educationalTopics) {
        if (response.toLowerCase().includes(topic)) {
            topics.push(topic);
            break;  // Just get the first match to avoid too many topics
        }
    }
    
    return topics;
}
