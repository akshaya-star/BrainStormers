/**
 * Speech Handler for Mentaura
 * Handles text-to-speech synthesis when server-side TTS is not available
 */

// Global speech synthesis object
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;
let isSpeaking = false;
let speechQueue = [];
let isProcessingQueue = false;
let retryCount = 0;
const MAX_RETRIES = 3;

// Function to get user preferences
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
 * Sanitize text to remove any sensitive information
 * @param {string} text - The text to sanitize
 * @returns {string} - Sanitized text safe for speech
 */
function sanitizeText(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text
        // Remove API keys (various formats)
        .replace(/sk-[a-zA-Z0-9]{20,}/g, 'API key redacted')
        .replace(/sk-proj-[a-zA-Z0-9]{20,}/g, 'API key redacted')
        // Remove potential JSON error messages
        .replace(/\{'error'[^}]*\}/g, 'Error information redacted')
        .replace(/{[^}]*"error"[^}]*}/g, 'Error information redacted')
        // Remove error codes
        .replace(/Error code: \d+[^\.]*\./g, 'An error occurred.')
        // Remove any other long strings that could be sensitive
        .replace(/[a-zA-Z0-9]{32,}/g, 'Sensitive data redacted');
}

/**
 * Initialize speech synthesis
 */
function initSpeechSynthesis() {
    // Check if speech synthesis is available
    if (!speechSynthesis) {
        console.error('Speech synthesis not supported in this browser');
        return false;
    }
    
    // Load voices
    let voices = [];
    function loadVoices() {
        voices = speechSynthesis.getVoices();
        console.log('Available voices:', voices.length);
    }
    
    // Chrome needs this event
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Load voices immediately for other browsers
    loadVoices();
    
    return true;
}

/**
 * Split text into manageable chunks for speech synthesis
 * @param {string} text - The text to split
 * @returns {Array} Array of text chunks
 */
function splitTextIntoChunks(text) {
    // First sanitize the text
    const sanitizedText = sanitizeText(text);
    
    const maxChunkLength = 200; // Reduced chunk size for better stability
    const chunks = [];
    let currentChunk = '';
    
    // Split by sentences first
    const sentences = sanitizedText.split(/(?<=[.!?])\s+/);
    
    for (const sentence of sentences) {
        if (currentChunk.length + sentence.length <= maxChunkLength) {
            currentChunk += sentence + ' ';
        } else {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }
            currentChunk = sentence + ' ';
        }
    }
    
    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }
    
    return chunks;
}

/**
 * Speak text using client-side speech synthesis
 * @param {string} text - The text to speak
 * @param {Object} options - Speech options
 */
function speakText(text, options = {}) {
    // Validate input
    if (!text || typeof text !== 'string') {
        console.error('Invalid text for speech synthesis');
        return;
    }
    
    console.log(`Starting speech synthesis for text of length: ${text.length}`);
    
    // Split text into smaller chunks
    const chunks = splitTextIntoChunks(text);
    console.log(`Split text into ${chunks.length} chunks`);
    
    // Add each chunk to the queue
    chunks.forEach(chunk => {
        queueSpeech(chunk, options);
    });
}

/**
 * Process the speech queue
 */
function processSpeechQueue() {
    if (isProcessingQueue || speechQueue.length === 0) {
        return;
    }
    
    isProcessingQueue = true;
    const nextItem = speechQueue.shift();
    
    // Sanitize text to remove any sensitive information
    const sanitizedText = sanitizeText(nextItem.text);
    
    // Skip empty text after sanitization
    if (!sanitizedText.trim()) {
        console.log('Text was completely sanitized, skipping speech');
        isProcessingQueue = false;
        setTimeout(processSpeechQueue, 100);
        return;
    }
    
    // Cancel any ongoing speech
    if (currentUtterance) {
        speechSynthesis.cancel();
    }
    
    // Get user preferences
    const userPreferences = getUserPreferences();
    
    // Create a new utterance with sanitized text
    currentUtterance = new SpeechSynthesisUtterance(sanitizedText);
    
    // Apply user preferences for rate and pitch
    currentUtterance.rate = userPreferences.speed || nextItem.options.rate || 0.8;
    currentUtterance.pitch = userPreferences.pitch || nextItem.options.pitch || 1.1;
    currentUtterance.volume = 1.0;
    
    // Select voice based on user preferences
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
        // Check if we already have a preferred voice set
        if (window.mentauraPreferredVoice) {
            currentUtterance.voice = window.mentauraPreferredVoice;
            console.log('Using preferred voice from window object:', window.mentauraPreferredVoice.name);
        } else {
            // Select voice based on user preference
            let selectedVoice = null;
            
            if (userPreferences.voice === 'male') {
                // Find a male voice (preferably English)
                selectedVoice = voices.find(voice => 
                    voice.name.toLowerCase().includes('male') && 
                    voice.lang.includes('en')
                ) || voices.find(voice => 
                    voice.name.toLowerCase().includes('male')
                );
                
                console.log('Selected male voice:', selectedVoice ? selectedVoice.name : 'None found');
            } 
            else if (userPreferences.voice === 'female' || userPreferences.voice === 'neutral') {
                // Find a female voice (preferably English) or fallback to any voice for neutral
                selectedVoice = voices.find(voice => 
                    (voice.name.toLowerCase().includes('female') || userPreferences.voice === 'neutral') && 
                    (voice.name.includes('British') || voice.name.includes('UK') || voice.lang.includes('en'))
                ) || voices.find(voice => 
                    voice.name.toLowerCase().includes('female')
                );
                
                console.log('Selected female/neutral voice:', selectedVoice ? selectedVoice.name : 'None found');
            }
            
            // If a specific voice was selected, use it
            if (selectedVoice) {
                currentUtterance.voice = selectedVoice;
                // Cache this voice for future use
                window.mentauraPreferredVoice = selectedVoice;
            } else {
                // Fallback to default voice selection logic
        const preferredVoice = voices.find(voice => 
            (voice.name.includes('British') || voice.name.includes('UK')) && 
            voice.lang.includes('en')
        );
        
        if (preferredVoice) {
            currentUtterance.voice = preferredVoice;
            } else {
                // Use the first available voice
                currentUtterance.voice = voices[0];
                }
            }
        }
    }
    
    // Add event listeners
    currentUtterance.onend = function() {
        console.log('Speech completed');
        currentUtterance = null;
        isSpeaking = false;
        retryCount = 0;
        
        // Process next item in queue if any
        isProcessingQueue = false;
        setTimeout(processSpeechQueue, 100); // Small delay before next chunk
    };
    
    currentUtterance.onerror = function(event) {
        console.error('Speech error:', event);
        
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`Retrying speech (attempt ${retryCount}/${MAX_RETRIES})`);
            
            // Cancel current speech
            speechSynthesis.cancel();
            
            // Wait before retrying
            setTimeout(() => {
                try {
                    speechSynthesis.speak(currentUtterance);
                } catch (error) {
                    console.error('Error restarting speech synthesis:', error);
                    handleSpeechError();
                }
            }, 500);
        } else {
            handleSpeechError();
        }
    };
    
    // Speak the text
    try {
        isSpeaking = true;
        speechSynthesis.speak(currentUtterance);
    } catch (error) {
        console.error('Error starting speech synthesis:', error);
        handleSpeechError();
    }
}

/**
 * Handle speech errors
 */
function handleSpeechError() {
    isSpeaking = false;
    currentUtterance = null;
    retryCount = 0;
    
    // Process next item in queue if any
    isProcessingQueue = false;
    setTimeout(processSpeechQueue, 100);
}

/**
 * Add text to speech queue
 * @param {string} text - The text to speak
 * @param {Object} options - Speech options
 */
function queueSpeech(text, options = {}) {
    speechQueue.push({ text, options });
    processSpeechQueue();
}

/**
 * Stop current speech
 */
function stopSpeech() {
    if (currentUtterance) {
        speechSynthesis.cancel();
        currentUtterance = null;
        isSpeaking = false;
        retryCount = 0;
    }
    // Clear the queue
    speechQueue = [];
    isProcessingQueue = false;
}

/**
 * Handle client-side TTS from server response
 * @param {Object} response - Server response with client_tts property
 */
function handleClientTTS(response) {
    if (response.client_tts && response.client_tts.use_client_tts) {
        console.log('Using client-side TTS for:', response.text.substring(0, 30) + '...');
        // Ensure we have the complete text
        if (!response.text) {
            console.error('No text provided for TTS');
            return;
        }
        
        // Use slower rate for better clarity
        const options = {
            rate: response.client_tts.rate || 0.8, // Slower rate
            pitch: response.client_tts.pitch || 1.1
        };
        
        console.log('Using client-side TTS with options:', options);
        
        // Create a progress indicator
        const progressIndicator = document.createElement('div');
        progressIndicator.className = 'speech-progress';
        progressIndicator.style.position = 'fixed';
        progressIndicator.style.bottom = '10px';
        progressIndicator.style.right = '10px';
        progressIndicator.style.padding = '5px 10px';
        progressIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        progressIndicator.style.color = 'white';
        progressIndicator.style.borderRadius = '5px';
        progressIndicator.style.fontSize = '12px';
        progressIndicator.style.zIndex = '9999';
        progressIndicator.textContent = 'Speaking...';
        document.body.appendChild(progressIndicator);
        
        // Add keyboard shortcuts for controlling speech
        const keyHandler = function(e) {
            if (e.key === 'Escape') {
                stopSpeech();
                clearInterval(updateInterval);
                progressIndicator.remove();
                document.removeEventListener('keydown', keyHandler);
            } else if (e.key === ' ') {
                if (isSpeaking) {
                    speechSynthesis.pause();
                    progressIndicator.textContent = 'Paused';
                } else {
                    speechSynthesis.resume();
                    progressIndicator.textContent = 'Speaking...';
                }
            }
        };
        
        document.addEventListener('keydown', keyHandler);
        
        // Start speech synthesis with a small delay to ensure browser is ready
        setTimeout(() => {
            // Clear any existing speech
            stopSpeech();
            
            // Start speaking the text
            speakText(response.text, options);
            
            // Update progress indicator
            const updateInterval = setInterval(() => {
                if (!isSpeaking) {
                    clearInterval(updateInterval);
                    progressIndicator.textContent = 'Speech completed';
                    setTimeout(() => {
                        progressIndicator.remove();
                        document.removeEventListener('keydown', keyHandler);
                    }, 2000);
                }
            }, 1000);
        }, 100);
        
    } else if (response.audio && response.audio.chunks) {
        // Handle chunked audio response
        console.log('Playing chunked audio response with', response.audio.total_chunks, 'chunks');
        if (!response.audio.chunks.length) {
            console.error('No audio chunks provided');
            return;
        }
        playAudioChunks(response.audio.chunks);
    } else if (response.audio) {
        // Handle single audio response
        console.log('Playing single audio response');
        if (!response.audio) {
            console.error('No audio data provided');
            return;
        }
        playAudio(response.audio);
    } else {
        console.error('Invalid response format for TTS');
    }
}

/**
 * Play a single audio chunk
 * @param {string} audioBase64 - Base64 encoded audio data
 */
function playAudio(audioBase64) {
    if (!audioBase64) {
        console.error('Invalid audio data');
        return;
    }
    
    // Create a progress indicator
    const progressIndicator = document.createElement('div');
    progressIndicator.className = 'speech-progress';
    progressIndicator.style.position = 'fixed';
    progressIndicator.style.bottom = '10px';
    progressIndicator.style.right = '10px';
    progressIndicator.style.padding = '5px 10px';
    progressIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    progressIndicator.style.color = 'white';
    progressIndicator.style.borderRadius = '5px';
    progressIndicator.style.fontSize = '12px';
    progressIndicator.style.zIndex = '9999';
    progressIndicator.textContent = 'Playing audio...';
    document.body.appendChild(progressIndicator);
    
    const audio = new Audio('data:audio/mp3;base64,' + audioBase64);
    
    // Add event listeners for better error handling
    audio.onended = function() {
        console.log('Audio playback completed');
        progressIndicator.textContent = 'Audio completed';
        setTimeout(() => {
            progressIndicator.remove();
        }, 2000);
    };
    
    audio.onerror = function(error) {
        console.error('Error playing audio:', error);
        progressIndicator.textContent = 'Error playing audio';
        progressIndicator.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
        
        // Try to recover by using client-side TTS if available
        if (response && response.text) {
            console.log('Falling back to client-side TTS');
            setTimeout(() => {
                progressIndicator.remove();
                speakText(response.text);
            }, 2000);
        } else {
            setTimeout(() => {
                progressIndicator.remove();
            }, 2000);
        }
    };
    
    // Add timeout to detect if audio fails to start
    const timeout = setTimeout(() => {
        if (audio.paused) {
            console.error('Audio failed to start playing');
            audio.onerror(new Error('Audio playback timeout'));
        }
    }, 5000);
    
    audio.oncanplay = function() {
        clearTimeout(timeout);
    };
    
    // Add keyboard shortcuts for controlling audio
    const keyHandler = function(e) {
        if (e.key === 'Escape') {
            audio.pause();
            audio.currentTime = 0;
            clearTimeout(timeout);
            progressIndicator.remove();
            document.removeEventListener('keydown', keyHandler);
        } else if (e.key === ' ') {
            if (audio.paused) {
                audio.play();
                progressIndicator.textContent = 'Playing audio...';
            } else {
                audio.pause();
                progressIndicator.textContent = 'Paused';
            }
        }
    };
    
    document.addEventListener('keydown', keyHandler);
    
    audio.play().catch(error => {
        console.error('Error starting audio playback:', error);
        clearTimeout(timeout);
        audio.onerror(error);
    });
}

/**
 * Play multiple audio chunks in sequence
 * @param {Array} chunks - Array of base64 encoded audio chunks
 */
function playAudioChunks(chunks) {
    if (!chunks || !chunks.length) {
        console.error('Invalid audio chunks');
        return;
    }
    
    // Create a progress indicator
    const progressIndicator = document.createElement('div');
    progressIndicator.className = 'speech-progress';
    progressIndicator.style.position = 'fixed';
    progressIndicator.style.bottom = '10px';
    progressIndicator.style.right = '10px';
    progressIndicator.style.padding = '5px 10px';
    progressIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    progressIndicator.style.color = 'white';
    progressIndicator.style.borderRadius = '5px';
    progressIndicator.style.fontSize = '12px';
    progressIndicator.style.zIndex = '9999';
    progressIndicator.textContent = 'Playing audio...';
    document.body.appendChild(progressIndicator);
    
    let currentChunk = 0;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    let isPaused = false;
    
    // Add keyboard shortcuts for controlling audio
    const keyHandler = function(e) {
        if (e.key === 'Escape') {
            // Stop playback
            currentChunk = chunks.length; // Skip to end
            progressIndicator.textContent = 'Stopped';
            setTimeout(() => {
                progressIndicator.remove();
                document.removeEventListener('keydown', keyHandler);
            }, 2000);
        } else if (e.key === ' ') {
            isPaused = !isPaused;
            if (isPaused) {
                progressIndicator.textContent = 'Paused';
            } else {
                progressIndicator.textContent = 'Playing audio...';
                playNextChunk();
            }
        }
    };
    
    document.addEventListener('keydown', keyHandler);
    
    function playNextChunk() {
        if (currentChunk < chunks.length && !isPaused) {
            const audio = new Audio('data:audio/mp3;base64,' + chunks[currentChunk]);
            
            // Update progress indicator
            progressIndicator.textContent = `Playing chunk ${currentChunk + 1}/${chunks.length}...`;
            
            audio.onended = function() {
                console.log('Chunk', currentChunk + 1, 'completed');
                currentChunk++;
                retryCount = 0; // Reset retry count on success
                
                if (currentChunk < chunks.length) {
                    // Add a small delay between chunks
                    setTimeout(playNextChunk, 100);
                } else {
                    // All chunks completed
                    progressIndicator.textContent = 'Audio completed';
                    setTimeout(() => {
                        progressIndicator.remove();
                        document.removeEventListener('keydown', keyHandler);
                    }, 2000);
                }
            };
            
            audio.onerror = function(error) {
                console.error('Error playing chunk', currentChunk + 1, ':', error);
                if (retryCount < MAX_RETRIES) {
                    retryCount++;
                    console.log('Retrying chunk', currentChunk + 1, '(attempt', retryCount, ')');
                    progressIndicator.textContent = `Retrying chunk ${currentChunk + 1}...`;
                    setTimeout(playNextChunk, 500); // Longer delay before retry
                } else {
                    console.error('Max retries reached for chunk', currentChunk + 1);
                    progressIndicator.textContent = `Error with chunk ${currentChunk + 1}`;
                    currentChunk++;
                    retryCount = 0;
                    setTimeout(playNextChunk, 100);
                }
            };
            
            // Add timeout to detect if chunk fails to start
            const timeout = setTimeout(() => {
                if (audio.paused) {
                    console.error('Chunk', currentChunk + 1, 'failed to start playing');
                    audio.onerror(new Error('Audio chunk playback timeout'));
                }
            }, 5000);
            
            audio.oncanplay = function() {
                clearTimeout(timeout);
            };
            
            audio.play().catch(error => {
                console.error('Error starting chunk playback:', error);
                clearTimeout(timeout);
                audio.onerror(error);
            });
        }
    }
    
    playNextChunk();
}

// Initialize speech synthesis when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initSpeechSynthesis();
});

// Export functions
export { initSpeechSynthesis, speakText, stopSpeech, handleClientTTS }; 