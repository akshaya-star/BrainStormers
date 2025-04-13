// Customize AI functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get references to all the customization inputs
    const voiceOptions = document.querySelectorAll('input[name="voice"]');
    const voiceSpeed = document.getElementById('voice-speed');
    const voicePitch = document.getElementById('voice-pitch');
    const teachingStyleOptions = document.querySelectorAll('input[name="teaching-style"]');
    const personalityOptions = document.querySelectorAll('input[name="personality"]');
    const difficultyLevel = document.getElementById('difficulty-level');
    const saveButton = document.querySelector('.save-preferences-btn');

    // Default preferences
    let userPreferences = {
        voice: 'female',
        speed: 1.0,
        pitch: 1.0,
        teaching_style: 'detailed',
        personality: 'friendly',
        difficulty: 'intermediate'
    };

    // Load existing preferences if available
    loadUserPreferences();

    // Apply preferences to UI
    applyPreferencesToUI();

    // Add event listener to save button
    if (saveButton) {
        saveButton.addEventListener('click', savePreferences);
    } else {
        console.error('Save preferences button not found');
    }

    // Function to save user preferences
    function savePreferences() {
        // Get selected voice
        voiceOptions.forEach(option => {
            if (option.checked) {
                userPreferences.voice = option.value;
            }
        });

        // Get voice speed and pitch
        userPreferences.speed = parseFloat(voiceSpeed.value);
        userPreferences.pitch = parseFloat(voicePitch.value);

        // Get selected teaching style
        teachingStyleOptions.forEach(option => {
            if (option.checked) {
                userPreferences.teaching_style = option.value;
            }
        });

        // Get selected personality
        personalityOptions.forEach(option => {
            if (option.checked) {
                userPreferences.personality = option.value;
            }
        });

        // Get difficulty level
        const difficultyValue = parseInt(difficultyLevel.value);
        switch (difficultyValue) {
            case 1:
                userPreferences.difficulty = 'beginner';
                break;
            case 2:
                userPreferences.difficulty = 'beginner-intermediate';
                break;
            case 3:
                userPreferences.difficulty = 'intermediate';
                break;
            case 4:
                userPreferences.difficulty = 'intermediate-advanced';
                break;
            case 5:
                userPreferences.difficulty = 'advanced';
                break;
            default:
                userPreferences.difficulty = 'intermediate';
        }

        // Save preferences to localStorage
        saveUserPreferences();

        // Update the voice preferences in the speech system
        updateVoicePreferences();

        // Show success notification
        showNotification('Preferences saved successfully!');

        // Test the new preferences with a greeting
        testVoicePreferences();
    }

    // Function to load user preferences from localStorage
    function loadUserPreferences() {
        try {
            const savedPreferences = localStorage.getItem('mentaura_preferences');
            if (savedPreferences) {
                userPreferences = JSON.parse(savedPreferences);
                console.log('Loaded preferences:', userPreferences);
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    }

    // Function to save user preferences to localStorage
    function saveUserPreferences() {
        try {
            localStorage.setItem('mentaura_preferences', JSON.stringify(userPreferences));
            console.log('Saved preferences:', userPreferences);
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    }

    // Function to apply loaded preferences to UI elements
    function applyPreferencesToUI() {
        // Apply voice selection
        voiceOptions.forEach(option => {
            option.checked = (option.value === userPreferences.voice);
        });

        // Apply speed and pitch
        if (voiceSpeed) voiceSpeed.value = userPreferences.speed;
        if (voicePitch) voicePitch.value = userPreferences.pitch;

        // Apply teaching style
        teachingStyleOptions.forEach(option => {
            option.checked = (option.value === userPreferences.teaching_style);
        });

        // Apply personality
        personalityOptions.forEach(option => {
            option.checked = (option.value === userPreferences.personality);
        });

        // Apply difficulty level
        if (difficultyLevel) {
            switch (userPreferences.difficulty) {
                case 'beginner':
                    difficultyLevel.value = 1;
                    break;
                case 'beginner-intermediate':
                    difficultyLevel.value = 2;
                    break;
                case 'intermediate':
                    difficultyLevel.value = 3;
                    break;
                case 'intermediate-advanced':
                    difficultyLevel.value = 4;
                    break;
                case 'advanced':
                    difficultyLevel.value = 5;
                    break;
                default:
                    difficultyLevel.value = 3; // Default to intermediate
            }
        }
    }

    // Function to update voice preferences in the speech system
    function updateVoicePreferences() {
        // Access the speech synthesis voices
        if ('speechSynthesis' in window) {
            const voices = window.speechSynthesis.getVoices();
            
            // If no voices are available yet, wait for them to load
            if (voices.length === 0) {
                window.speechSynthesis.onvoiceschanged = updateVoicePreferences;
                return;
            }
            
            // Select appropriate voice based on gender preference
            let selectedVoice = null;
            
            if (userPreferences.voice === 'male') {
                // Find a male voice (preferably English)
                selectedVoice = voices.find(voice => 
                    voice.name.toLowerCase().includes('male') && 
                    voice.name.toLowerCase().includes('english')
                ) || voices.find(voice => 
                    voice.name.toLowerCase().includes('male')
                );
            } 
            else if (userPreferences.voice === 'female') {
                // Find a female voice (preferably English)
                selectedVoice = voices.find(voice => 
                    voice.name.toLowerCase().includes('female') && 
                    voice.name.toLowerCase().includes('english')
                ) || voices.find(voice => 
                    voice.name.toLowerCase().includes('female')
                );
            }
            else {
                // Neutral or fallback to any English voice
                selectedVoice = voices.find(voice => 
                    voice.name.toLowerCase().includes('neutral') && 
                    voice.name.toLowerCase().includes('english')
                ) || voices.find(voice => 
                    voice.lang.includes('en')
                );
            }
            
            // If a voice was found, set it as the preferred voice
            if (selectedVoice) {
                window.mentauraPreferredVoice = selectedVoice;
                console.log('Updated preferred voice to:', selectedVoice.name);
            } else {
                console.warn('No appropriate voice found for preference:', userPreferences.voice);
            }
        }
    }

    // Function to show a notification
    function showNotification(message) {
        // Check if the showNotification function exists in the global scope
        if (typeof window.showNotification === 'function') {
            window.showNotification(message);
        } else {
            // Fallback implementation
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.textContent = message;
            notification.style.position = 'fixed';
            notification.style.bottom = '20px';
            notification.style.right = '20px';
            notification.style.backgroundColor = '#6c63ff';
            notification.style.color = 'white';
            notification.style.padding = '10px 20px';
            notification.style.borderRadius = '5px';
            notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            notification.style.zIndex = '9999';
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transition = 'opacity 0.5s ease';
                
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 500);
            }, 3000);
        }
    }

    // Function to test the voice preferences with a greeting
    function testVoicePreferences() {
        // Create a test message based on personality
        let testMessage = "Hello! I'm your AI assistant. ";
        
        if (userPreferences.personality === 'humorous') {
            if (userPreferences.voice === 'male') {
                testMessage = "Hey there! I'm your AI assistant with a dad-joke loaded and ready to go. Why did the scarecrow win an award? Because he was outstanding in his field! Ba-dum-tss!";
            } else {
                testMessage = "Hey there! I'm your AI assistant with a joke ready to brighten your day. What do you call a fake noodle? An impasta! Get it?";
            }
        } else if (userPreferences.personality === 'friendly') {
            testMessage = "Hi there! I'm your friendly AI assistant. I'm here to help you with anything you need!";
        } else if (userPreferences.personality === 'formal') {
            testMessage = "Good day. I am your AI assistant. How may I be of service to you today?";
        } else if (userPreferences.personality === 'motivational') {
            testMessage = "Hello! I'm your AI assistant ready to help you achieve your goals. Remember, every great achievement starts with the decision to try!";
        }
        
        // Use the speech synthesis to speak the test message
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(testMessage);
            
            // Set the voice
            if (window.mentauraPreferredVoice) {
                utterance.voice = window.mentauraPreferredVoice;
            }
            
            // Set speech rate and pitch
            utterance.rate = userPreferences.speed;
            utterance.pitch = userPreferences.pitch;
            
            // Speak the test message
            window.speechSynthesis.cancel(); // Cancel any ongoing speech
            window.speechSynthesis.speak(utterance);
        }
    }
}); 