// Import speech handler
import { speakText, handleClientTTS, stopSpeech } from './speech-handler.js';

// Function to handle AI responses
function handleAIResponse(response) {
    // Debug: Log the complete response
    console.log('Complete AI response:', response);
    console.log('Response text length:', response.text ? response.text.length : 0);
    
    // Display the text response first
    displayResponse(response.text);
    
    // Check if we need to use client-side TTS
    if (response.client_tts) {
        console.log('Using client-side TTS for response');
        handleClientTTS(response);
    } else if (response.audio) {
        // Use server-side audio
        console.log('Using server-side audio for response');
        if (response.audio.chunks) {
            // Handle chunked audio
            console.log('Playing chunked audio response');
            playAudioChunks(response.audio.chunks);
        } else {
            // Handle single audio
            console.log('Playing single audio response');
            playAudio(response.audio);
        }
    } else {
        // No audio provided, use client-side TTS as fallback
        console.log('No audio provided, using client-side TTS as fallback');
        if (response.text) {
            speakText(response.text);
        }
    }
}

// Function to play audio from base64
function playAudio(base64Audio) {
    if (!base64Audio) {
        console.error('No audio data provided');
        return;
    }
    
    // Create audio element
    const audio = new Audio('data:audio/mp3;base64,' + base64Audio);
    
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
    
    // Add event listeners
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
        
        // Fall back to client-side TTS if audio playback fails
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
    
    // Add keyboard shortcuts for controlling audio
    const keyHandler = function(e) {
        if (e.key === 'Escape') {
            audio.pause();
            audio.currentTime = 0;
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
    
    // Play the audio
    audio.play().catch(error => {
        console.error('Error starting audio playback:', error);
        audio.onerror(error);
    });
}

// Function to play multiple audio chunks
function playAudioChunks(chunks) {
    if (!chunks || !chunks.length) {
        console.error('No audio chunks provided');
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
            
            audio.play().catch(error => {
                console.error('Error starting chunk playback:', error);
                audio.onerror(error);
            });
        }
    }
    
    playNextChunk();
}

// Function to display response text
function displayResponse(text) {
    // Get the response container
    const responseContainer = document.getElementById('response-container');
    
    // Create response element
    const responseElement = document.createElement('div');
    responseElement.className = 'response';
    responseElement.textContent = text;
    
    // Add to container
    responseContainer.appendChild(responseElement);
    
    // Scroll to bottom
    responseContainer.scrollTop = responseContainer.scrollHeight;
}

// Function to send user input to the server
async function sendUserInput(input) {
    try {
        // Show loading indicator
        showLoading(true);
        
        // Send request to server
        const response = await fetch('/api/ai/process-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: input,
                userId: getUserId()
            })
        });
        
        // Parse response
        const data = await response.json();
        
        // Handle the response
        handleAIResponse(data);
        
        // Hide loading indicator
        showLoading(false);
    } catch (error) {
        console.error('Error sending user input:', error);
        showLoading(false);
        displayError('Failed to get response from Mentaura. Please try again.');
    }
}

// Function to show/hide loading indicator
function showLoading(show) {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? 'block' : 'none';
    }
}

// Function to display error message
function displayError(message) {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    }
}

// Function to get user ID
function getUserId() {
    // Get from localStorage or generate a new one
    let userId = localStorage.getItem('mentaura_user_id');
    if (!userId) {
        userId = 'user_' + Date.now();
        localStorage.setItem('mentaura_user_id', userId);
    }
    return userId;
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Get the input form
    const inputForm = document.getElementById('input-form');
    if (inputForm) {
        inputForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // Get the input field
            const inputField = document.getElementById('user-input');
            if (inputField && inputField.value.trim()) {
                // Send the input
                sendUserInput(inputField.value.trim());
                
                // Clear the input field
                inputField.value = '';
            }
        });
    }
    
    // Handle stop button
    const stopButton = document.getElementById('stop-button');
    if (stopButton) {
        stopButton.addEventListener('click', function() {
            stopSpeech();
        });
    }
}); 