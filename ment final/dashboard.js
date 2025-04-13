// Mentaura Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard initialized');
    
    // Sync user session with the server
    syncUserSession();
    
    // TEMPORARY: Clear previous conversations to start fresh with new behavior
    localStorage.removeItem('mentaura_messages');
    
    // Initialize API client
    const api = new MentauraAPI();
    
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('mentaura_user') || '{}');
    if (!user.username) {
        // Redirect to login page
        window.location.href = 'index.html';
        return;
    }
    
    // Load saved settings
    loadSavedSettings();
    
    // Update UI with user info
    const username = document.getElementById('username');
    const learningType = document.getElementById('learning-type');
    
    if (username) {
        username.textContent = user.username || user.name || '';
    }
    
    if (learningType) {
        learningType.textContent = user.learningType || 'Personal Growth';
    }
    
    // Update profile avatar to show first letter of username or a user icon
    const profileAvatar = document.getElementById('profile-avatar');
    const dropdownMenu = document.getElementById('profile-dropdown');
    
    if (profileAvatar) {
        // Replace default icon with user's first letter in a circle or user icon
        if (user.name) {
            const firstLetter = user.name.charAt(0).toUpperCase();
            profileAvatar.innerHTML = `<div class="avatar-circle">${firstLetter}</div>`;
        } else {
            profileAvatar.innerHTML = `<i class="fas fa-user"></i>`;
        }
    }
    
    // Handle profile dropdown
    if (profileAvatar && dropdownMenu) {
        console.log('Profile avatar and dropdown menu found');
        
        // Position the dropdown menu relative to the profile avatar
        function positionDropdown() {
            const avatarRect = profileAvatar.getBoundingClientRect();
            dropdownMenu.style.position = 'fixed';
            dropdownMenu.style.top = `${avatarRect.bottom + 5}px`;
            dropdownMenu.style.right = `${window.innerWidth - avatarRect.right}px`;
        }
        
        // Toggle dropdown when profile avatar is clicked
        profileAvatar.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('Profile avatar clicked');
            
            // Position the dropdown before showing it
            positionDropdown();
            
            // Toggle the active class
            dropdownMenu.classList.toggle('active');
        });
        
        // Close dropdown when clicking elsewhere
        document.addEventListener('click', function(e) {
            if (dropdownMenu.classList.contains('active') && !profileAvatar.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('active');
            }
        });
        
        // Reposition dropdown on window resize
        window.addEventListener('resize', function() {
            if (dropdownMenu.classList.contains('active')) {
                positionDropdown();
            }
        });
    }
    
    // Setup tabs functionality
    setupTabs();
    
    // Load conversation history
    loadConversationHistory();
    
    // Update learning progress
    updateLearningProgress();
    
    // Show initial greeting
    showInitialGreeting();
    
    // Initialize Fun Talks section at page load 
    // (this ensures it works even if the Fun Talks tab isn't initially active)
    initializeFunTalks();
    console.log('Fun Talks initialized at page load');
    
    // Initialize Games section at page load
    initializeGames();
    console.log('Games initialized at page load');
    
    // Add event listener for user input
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-message');
    
    if (userInput && sendButton) {
        // Send message when Enter key is pressed
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleUserTextSubmission();
            }
        });
        
        // Send message when Send button is clicked
        sendButton.addEventListener('click', handleUserTextSubmission);
    }
    
    // Add event listener for voice input
    const voiceButton = document.getElementById('voice-input');
    if (voiceButton) {
        voiceButton.addEventListener('click', startVoiceRecognition);
    }
    
    // Add event listener for image upload
    const imageButton = document.getElementById('image-upload');
    if (imageButton) {
        imageButton.addEventListener('click', function() {
            // Create a file input element
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';
            
            // Append to body
            document.body.appendChild(fileInput);
            
            // Trigger click on file input
            fileInput.click();
            
            // Handle file selection
            fileInput.addEventListener('change', function() {
                const file = this.files[0];
                if (file) {
                    // Handle image upload
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const imageData = e.target.result;
                        // Add user message with image
                        addUserMessage(`<img src="${imageData}" alt="Uploaded image" style="max-width: 100%; max-height: 300px; border-radius: 8px;">`);
                        
                        // Process image (in a real app, this would use AI to analyze the image)
                        processImage(file);
                    };
                    reader.readAsDataURL(file);
                }
                
                // Remove file input from DOM
                document.body.removeChild(fileInput);
            });
        });
    }
    
    // Function to process uploaded image
    function processImage(file) {
        // Simulate AI processing of the image
        const typingIndicator = addTypingIndicator();
        
        // Simulate delay for AI processing
        setTimeout(() => {
            // Remove typing indicator
            if (typingIndicator) {
                conversationHistory.removeChild(typingIndicator);
            }
            
            // Determine a random image type for variety
            const imageTypes = ['chart', 'diagram', 'photo', 'document'];
            const randomType = imageTypes[Math.floor(Math.random() * imageTypes.length)];
            
            let response;
            
            switch (randomType) {
                case 'chart':
                    response = "I see you've uploaded what appears to be a chart or graph. Would you like me to analyze the data trends shown in this visualization? I can help interpret the key patterns and insights from this data.";
                    break;
                case 'diagram':
                    response = "This looks like a diagram or schematic. If you'd like me to explain what's shown here or help understand specific elements, just let me know what you'd like to focus on.";
                    break;
                case 'document':
                    response = "I can see this is a document with text. Would you like me to extract and summarize the key information? Or is there something specific from this text you'd like me to explain?";
                    break;
                default: // photo
                    response = "Thank you for sharing this image. What would you like to know about it? I can describe what I see, answer questions about elements in the image, or use it as reference for our discussion.";
            }
            
            // Add AI response
            addAIMessage(response);
            
            // Save message to conversation history
            api.addMessage('user', 'image_upload');
            api.addMessage('ai', response);
        }, 2000);
    }
    
    // Add click handler for learning tab
    const learningTab = document.querySelector('.nav-tabs li[data-tab="learning"]');
    if (learningTab) {
        learningTab.addEventListener('click', function() {
            // Initialize learning tab functionality
            initializeLearningTab();
        });
    }
    
    // Add click handler for fun talks tab
    const funTalksTab = document.querySelector('.nav-tabs li[data-tab="fun-talks"]');
    if (funTalksTab) {
        funTalksTab.addEventListener('click', function() {
            // Initialize fun talks tab functionality when tab is clicked
            initializeFunTalks();
        });
    }
    
    // Add click handler for games tab
    const gamesTab = document.querySelector('.nav-tabs li[data-tab="games"]');
    if (gamesTab) {
        gamesTab.addEventListener('click', function() {
            // Initialize games tab functionality
            initializeGames();
        });
    }

    // Sync user session with the server
    syncUserSession();
});

// Function to initialize learning tab functionality
function initializeLearningTab() {
    console.log('Initializing learning tab...');
    
    // Get category elements
    const booksCategory = document.getElementById('books-category');
    const coursesCategory = document.getElementById('courses-category');
    const practiceCategory = document.getElementById('practice-category');
    const topicsCategory = document.getElementById('topics-category');
    
    // Get section elements
    const booksSection = document.getElementById('books-section');
    const coursesSection = document.getElementById('courses-section');
    const practiceSection = document.getElementById('practice-section');
    const topicsSection = document.getElementById('topics-section');
    
    // Get search elements
    const searchInput = document.querySelector('.learning-header .search-bar input');
    const searchButton = document.querySelector('.learning-header .search-bar button');
    
    // Initialize search functionality
    if (searchInput && searchButton) {
        // Add click event listener to search button
        searchButton.addEventListener('click', function() {
            executeSearch(searchInput.value);
        });
        
        // Add keypress event listener to search input (for Enter key)
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                executeSearch(searchInput.value);
            }
        });
    }
    
    // Clear recommended resources - show empty state
    const recommendedContainer = document.getElementById('recommended-resources-container');
    if (recommendedContainer) {
        recommendedContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-lightbulb"></i>
                <p>Resources will be recommended according to your learning progress.</p>
            </div>
        `;
    }
    
    // Initially hide all sections
    hideAllSections();
    
    // Add click event listeners to categories
    if (booksCategory) {
        booksCategory.addEventListener('click', function() {
            console.log('Books category clicked');
            hideAllSections();
            if (booksSection) {
                booksSection.style.display = 'block';
                initializeBooksSection();
            }
        });
    }
    
    if (coursesCategory) {
        coursesCategory.addEventListener('click', function() {
            console.log('Courses category clicked');
            hideAllSections();
            if (coursesSection) {
                coursesSection.style.display = 'block';
                initializeCoursesSection();
            }
        });
    }
    
    if (practiceCategory) {
        practiceCategory.addEventListener('click', function() {
            console.log('Practice category clicked');
            hideAllSections();
            if (practiceSection) {
                practiceSection.style.display = 'block';
                initializePracticeSection();
            }
        });
    }
    
    if (topicsCategory) {
        topicsCategory.addEventListener('click', function() {
            console.log('Topics category clicked');
            hideAllSections();
            if (topicsSection) {
                topicsSection.style.display = 'block';
                initializeTopicsSection();
            }
        });
    }
    
    // Function to execute search across all learning content
    function executeSearch(query) {
        if (!query || query.trim() === '') {
            showNotification('Please enter a search term');
            return;
        }
        
        console.log(`Executing search for: ${query}`);
        showNotification(`Searching for "${query}"...`);
        
        // Create a search results section if it doesn't exist
        let searchSection = document.getElementById('search-results-section');
        if (!searchSection) {
            searchSection = document.createElement('div');
            searchSection.id = 'search-results-section';
            searchSection.className = 'learning-section';
            
            // Add search section after the learning categories
            const learningContent = document.getElementById('learning-content');
            if (learningContent) {
                const categories = document.querySelector('.learning-categories');
                if (categories) {
                    learningContent.insertBefore(searchSection, categories.nextSibling);
                } else {
                    learningContent.appendChild(searchSection);
                }
            }
        }
        
        // Show the search section and hide others
        hideAllSections();
        searchSection.style.display = 'block';
        
        // Set initial loading state
        searchSection.innerHTML = `
            <div class="section-header">
                <h3>Search Results for "${query}"</h3>
                <button id="clear-search-results" class="back-btn">
                    <i class="fas fa-times"></i> Clear Results
                </button>
            </div>
            <div class="search-results-content">
                <div class="loading-indicator">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Searching all learning resources...</p>
                </div>
            </div>
        `;
        
        // Add event listener to clear search results button
        const clearButton = document.getElementById('clear-search-results');
        if (clearButton) {
            clearButton.addEventListener('click', function() {
                searchSection.style.display = 'none';
                searchInput.value = '';
            });
        }
        
        // Perform search across all resources
        Promise.all([
            searchBooks(query),
            searchCourses(query),
            searchTopics(query),
            searchPracticeQuestions(query)
        ]).then(([books, courses, topics, questions]) => {
            const resultsContent = document.querySelector('.search-results-content');
            if (!resultsContent) return;
            
            // Clear loading indicator
            resultsContent.innerHTML = '';
            
            // Check if we have any results
            const totalResults = books.length + courses.length + topics.length + questions.length;
            
            if (totalResults === 0) {
                resultsContent.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <p>No results found for "${query}"</p>
                        <p>Try using different keywords or browse categories</p>
                    </div>
                `;
                return;
            }
            
            // Display results by category
            if (books.length > 0) {
                addResultsSection(resultsContent, 'Books', books, renderBookResult);
            }
            
            if (courses.length > 0) {
                addResultsSection(resultsContent, 'Courses', courses, renderCourseResult);
            }
            
            if (topics.length > 0) {
                addResultsSection(resultsContent, 'Topics', topics, renderTopicResult);
            }
            
            if (questions.length > 0) {
                addResultsSection(resultsContent, 'Practice Questions', questions, renderQuestionResult);
            }
        }).catch(error => {
            console.error('Search error:', error);
            const resultsContent = document.querySelector('.search-results-content');
            if (resultsContent) {
                resultsContent.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error searching for "${query}"</p>
                        <p>Please try again later</p>
                    </div>
                `;
            }
        });
    }
    
    // Helper function to add a section of results
    function addResultsSection(container, title, items, renderFunction) {
        const section = document.createElement('div');
        section.className = 'search-result-category';
        
        section.innerHTML = `
            <h4>${title} (${items.length})</h4>
            <div class="result-items"></div>
        `;
        
        const itemsContainer = section.querySelector('.result-items');
        
        items.forEach(item => {
            const renderedItem = renderFunction(item);
            itemsContainer.appendChild(renderedItem);
        });
        
        container.appendChild(section);
    }
    
    // Render functions for different result types
    function renderBookResult(book) {
        const element = document.createElement('div');
        element.className = 'search-result-item';
        
        // Add web search identifier
        book.source = 'web_search';
        book.fromWebSearch = true;
        // Create a unique ID with web- prefix if it doesn't have one
        if (!book.id || !book.id.toString().includes('web-')) {
            book.id = `web-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }
        
        element.innerHTML = `
            <div class="result-icon">
                <i class="fas fa-book"></i>
            </div>
            <div class="result-details">
                <h5>${book.title}</h5>
                <p>${book.author}${book.year ? ` (${book.year})` : ''}</p>
            </div>
            <div class="result-actions">
                <button class="view-btn" data-id="${book.id}" data-type="book">View</button>
                <button class="add-btn" data-id="${book.id}" data-type="book">Add to Library</button>
            </div>
        `;
        
        // Add event listeners to buttons
        const viewBtn = element.querySelector('.view-btn');
        const addBtn = element.querySelector('.add-btn');
        
        viewBtn.addEventListener('click', function() {
            // Navigate to book detail
            hideAllSections();
            const booksSection = document.getElementById('books-section');
            if (booksSection) {
                booksSection.style.display = 'block';
                initializeBooksSection();
                // Additional logic to show book details
            }
        });
        
        addBtn.addEventListener('click', function() {
            addBookToLibrary(book);
            this.textContent = 'Added';
            this.disabled = true;
            showNotification(`"${book.title}" added to your library`);
        });
        
        return element;
    }
    
    function renderCourseResult(course) {
        const element = document.createElement('div');
        element.className = 'search-result-item';
        
        // Add web search identifier
        course.source = 'web_search';
        course.fromWebSearch = true;
        // Create a unique ID with web- prefix if it doesn't have one
        if (!course.id || !course.id.toString().includes('web-')) {
            course.id = `web-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }
        
        element.innerHTML = `
            <div class="result-icon">
                <i class="fas fa-chalkboard-teacher"></i>
            </div>
            <div class="result-details">
                <h5>${course.title}</h5>
                <p>${course.description}</p>
            </div>
            <div class="result-actions">
                <button class="view-btn" data-id="${course.id}" data-type="course">View</button>
                <button class="add-btn" data-id="${course.id}" data-type="course">Add to Library</button>
            </div>
        `;
        
        // Add event listeners to buttons
        const viewBtn = element.querySelector('.view-btn');
        const addBtn = element.querySelector('.add-btn');
        
        viewBtn.addEventListener('click', function() {
            // Navigate to course detail
            hideAllSections();
            const coursesSection = document.getElementById('courses-section');
            if (coursesSection) {
                coursesSection.style.display = 'block';
                initializeCoursesSection();
                // Logic to show specific course
            }
        });
        
        addBtn.addEventListener('click', function() {
            addCourseToLibrary(course.id);
            this.textContent = 'Added';
            this.disabled = true;
            showNotification(`"${course.title}" added to your library`);
        });
        
        return element;
    }
    
    function renderTopicResult(topic) {
        const element = document.createElement('div');
        element.className = 'search-result-item';
        
        element.innerHTML = `
            <div class="result-icon">
                <i class="fas fa-project-diagram"></i>
            </div>
            <div class="result-details">
                <h5>${topic.title}</h5>
                <p>${topic.subject}</p>
            </div>
            <div class="result-actions">
                <button class="view-btn" data-id="${topic.id}" data-type="topic">View</button>
            </div>
        `;
        
        // Add event listeners to buttons
        const viewBtn = element.querySelector('.view-btn');
        
        viewBtn.addEventListener('click', function() {
            // Navigate to topic detail
            hideAllSections();
            const topicsSection = document.getElementById('topics-section');
            if (topicsSection) {
                topicsSection.style.display = 'block';
                initializeTopicsSection();
                // Logic to show specific topic
            }
        });
        
        return element;
    }
    
    function renderQuestionResult(question) {
        const element = document.createElement('div');
        element.className = 'search-result-item';
        
        element.innerHTML = `
            <div class="result-icon">
                <i class="fas fa-question-circle"></i>
            </div>
            <div class="result-details">
                <h5>${question.question}</h5>
                <p>${question.topic}</p>
            </div>
            <div class="result-actions">
                <button class="view-btn" data-id="${question.id}" data-type="question">Practice</button>
            </div>
        `;
        
        // Add event listeners to buttons
        const viewBtn = element.querySelector('.view-btn');
        
        viewBtn.addEventListener('click', function() {
            // Navigate to practice section
            hideAllSections();
            const practiceSection = document.getElementById('practice-section');
            if (practiceSection) {
                practiceSection.style.display = 'block';
                initializePracticeSection();
                // Logic to show specific question
            }
        });
        
        return element;
    }
    
    // Mock search functions - in a real app these would call the backend
    function searchBooks(query) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate search results
                const books = [
                    { id: 'b1', title: 'Advanced JavaScript', author: 'John Smith', year: 2023 },
                    { id: 'b2', title: 'Python for Data Science', author: 'Emily Johnson', year: 2022 },
                    { id: 'b3', title: 'Learning React', author: 'Michael Williams', year: 2022 }
                ];
                
                const filteredBooks = books.filter(book => 
                    book.title.toLowerCase().includes(query.toLowerCase()) || 
                    book.author.toLowerCase().includes(query.toLowerCase())
                );
                
                resolve(filteredBooks);
            }, 500);
        });
    }
    
    function searchCourses(query) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate search results
                const courses = [
                    { id: 'c1', title: 'Full Stack Development', description: 'Complete path from frontend to backend development' },
                    { id: 'c2', title: 'Machine Learning Basics', description: 'Introduction to ML concepts and algorithms' },
                    { id: 'c3', title: 'Web Design Fundamentals', description: 'Learn UI/UX principles for web' }
                ];
                
                const filteredCourses = courses.filter(course => 
                    course.title.toLowerCase().includes(query.toLowerCase()) || 
                    course.description.toLowerCase().includes(query.toLowerCase())
                );
                
                resolve(filteredCourses);
            }, 600);
        });
    }
    
    function searchTopics(query) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate search results
                const topics = [
                    { id: 't1', title: 'JavaScript Basics', subject: 'Programming' },
                    { id: 't2', title: 'Linear Algebra', subject: 'Mathematics' },
                    { id: 't3', title: 'Quantum Mechanics', subject: 'Physics' }
                ];
                
                const filteredTopics = topics.filter(topic => 
                    topic.title.toLowerCase().includes(query.toLowerCase()) || 
                    topic.subject.toLowerCase().includes(query.toLowerCase())
                );
                
                resolve(filteredTopics);
            }, 400);
        });
    }
    
    function searchPracticeQuestions(query) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate search results
                const questions = [
                    { id: 'q1', question: 'What is the difference between let and var in JavaScript?', topic: 'JavaScript' },
                    { id: 'q2', question: 'Explain the concept of inheritance in Object-Oriented Programming', topic: 'Programming Fundamentals' },
                    { id: 'q3', question: 'How does the CSS box model work?', topic: 'Web Development' }
                ];
                
                const filteredQuestions = questions.filter(question => 
                    question.question.toLowerCase().includes(query.toLowerCase()) || 
                    question.topic.toLowerCase().includes(query.toLowerCase())
                );
                
                resolve(filteredQuestions);
            }, 550);
        });
    }
    
    // Helper function to hide all sections
    function hideAllSections() {
        if (booksSection) booksSection.style.display = 'none';
        if (coursesSection) {
            coursesSection.style.display = 'none';
            // Reset course plan container visibility
            const coursePlanContainer = document.getElementById('course-plan-container');
            if (coursePlanContainer) {
                coursePlanContainer.style.display = 'none';
            }
            // Ensure courses container is visible when section is shown again
            const coursesContainer = document.querySelector('.courses-container');
            if (coursesContainer) {
                coursesContainer.style.display = 'grid';
            }
        }
        if (practiceSection) practiceSection.style.display = 'none';
        if (topicsSection) topicsSection.style.display = 'none';
        
        // Also hide search results section if it exists
        const searchSection = document.getElementById('search-results-section');
        if (searchSection) searchSection.style.display = 'none';
    }
}

// Mentaura Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard initialized');
    
    // Sync user session with the server
    syncUserSession();
    
    // TEMPORARY: Clear previous conversations to start fresh with new behavior
    localStorage.removeItem('mentaura_messages');
    
    // Initialize API client
    const api = new MentauraAPI();
    
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('mentaura_user') || '{}');
    if (!user.username) {
        // Redirect to login page
        window.location.href = 'index.html';
        return;
    }
    
    // Load saved settings
    loadSavedSettings();
    
    // Update UI with user info
    const username = document.getElementById('username');
    const learningType = document.getElementById('learning-type');
    
    if (username) {
        username.textContent = user.username || user.name || '';
    }
    
    if (learningType) {
        learningType.textContent = user.learningType || 'Personal Growth';
    }
    
    // Update profile avatar to show first letter of username or a user icon
    const profileAvatar = document.getElementById('profile-avatar');
    const dropdownMenu = document.getElementById('profile-dropdown');
    
    if (profileAvatar) {
        // Replace default icon with user's first letter in a circle or user icon
        if (user.name) {
            const firstLetter = user.name.charAt(0).toUpperCase();
            profileAvatar.innerHTML = `<div class="avatar-circle">${firstLetter}</div>`;
        } else {
            profileAvatar.innerHTML = `<i class="fas fa-user"></i>`;
        }
    }
    
    // Handle profile dropdown
    if (profileAvatar && dropdownMenu) {
        console.log('Profile avatar and dropdown menu found');
        
        // Position the dropdown menu relative to the profile avatar
        function positionDropdown() {
            const avatarRect = profileAvatar.getBoundingClientRect();
            dropdownMenu.style.position = 'fixed';
            dropdownMenu.style.top = `${avatarRect.bottom + 5}px`;
            dropdownMenu.style.right = `${window.innerWidth - avatarRect.right}px`;
        }
        
        // Toggle dropdown when profile avatar is clicked
        profileAvatar.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('Profile avatar clicked');
            
            // Position the dropdown before showing it
            positionDropdown();
            
            // Toggle the active class
            dropdownMenu.classList.toggle('active');
        });
        
        // Close dropdown when clicking elsewhere
        document.addEventListener('click', function(e) {
            if (dropdownMenu.classList.contains('active') && !profileAvatar.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('active');
            }
        });
        
        // Reposition dropdown on window resize
        window.addEventListener('resize', function() {
            if (dropdownMenu.classList.contains('active')) {
                positionDropdown();
            }
        });
    }
    
    // Setup tabs functionality
    setupTabs();
    
    // Load conversation history
    loadConversationHistory();
    
    // Update learning progress
    updateLearningProgress();
    
    // Show initial greeting
    showInitialGreeting();
    
    // Initialize Fun Talks section at page load 
    // (this ensures it works even if the Fun Talks tab isn't initially active)
    initializeFunTalks();
    console.log('Fun Talks initialized at page load');
    
    // Initialize Games section at page load
    initializeGames();
    console.log('Games initialized at page load');
    
    // Add event listener for user input
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-message');
    
    if (userInput && sendButton) {
        // Send message when Enter key is pressed
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleUserTextSubmission();
            }
        });
        
        // Send message when Send button is clicked
        sendButton.addEventListener('click', handleUserTextSubmission);
    }
    
    // Add event listener for voice input
    const voiceButton = document.getElementById('voice-input');
    if (voiceButton) {
        voiceButton.addEventListener('click', startVoiceRecognition);
    }
    
    // Add event listener for image upload
    const imageButton = document.getElementById('image-upload');
    if (imageButton) {
        imageButton.addEventListener('click', function() {
            // Create a file input element
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';
            
            // Append to body
            document.body.appendChild(fileInput);
            
            // Trigger click on file input
            fileInput.click();
            
            // Handle file selection
            fileInput.addEventListener('change', function() {
                const file = this.files[0];
                if (file) {
                    // Handle image upload
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const imageData = e.target.result;
                        // Add user message with image
                        addUserMessage(`<img src="${imageData}" alt="Uploaded image" style="max-width: 100%; max-height: 300px; border-radius: 8px;">`);
                        
                        // Process image (in a real app, this would use AI to analyze the image)
                        processImage(file);
                    };
                    reader.readAsDataURL(file);
                }
                
                // Remove file input from DOM
                document.body.removeChild(fileInput);
            });
        });
    }
    
    // Function to process uploaded image
    function processImage(file) {
        // Simulate AI processing of the image
        const typingIndicator = addTypingIndicator();
        
        // Simulate delay for AI processing
        setTimeout(() => {
            // Remove typing indicator
            if (typingIndicator) {
                conversationHistory.removeChild(typingIndicator);
            }
            
            // Determine a random image type for variety
            const imageTypes = ['chart', 'diagram', 'photo', 'document'];
            const randomType = imageTypes[Math.floor(Math.random() * imageTypes.length)];
            
            let response;
            
            switch (randomType) {
                case 'chart':
                    response = "I see you've uploaded what appears to be a chart or graph. Would you like me to analyze the data trends shown in this visualization? I can help interpret the key patterns and insights from this data.";
                    break;
                case 'diagram':
                    response = "This looks like a diagram or schematic. If you'd like me to explain what's shown here or help understand specific elements, just let me know what you'd like to focus on.";
                    break;
                case 'document':
                    response = "I can see this is a document with text. Would you like me to extract and summarize the key information? Or is there something specific from this text you'd like me to explain?";
                    break;
                default: // photo
                    response = "Thank you for sharing this image. What would you like to know about it? I can describe what I see, answer questions about elements in the image, or use it as reference for our discussion.";
            }
            
            // Add AI response
            addAIMessage(response);
            
            // Save message to conversation history
            api.addMessage('user', 'image_upload');
            api.addMessage('ai', response);
        }, 2000);
    }
    
    // Add click handler for learning tab
    const learningTab = document.querySelector('.nav-tabs li[data-tab="learning"]');
    if (learningTab) {
        learningTab.addEventListener('click', function() {
            // Initialize learning tab functionality
            initializeLearningTab();
        });
    }
    
    // Add click handler for fun talks tab
    const funTalksTab = document.querySelector('.nav-tabs li[data-tab="fun-talks"]');
    if (funTalksTab) {
        funTalksTab.addEventListener('click', function() {
            // Initialize fun talks tab functionality when tab is clicked
            initializeFunTalks();
        });
    }
    
    // Add click handler for games tab
    const gamesTab = document.querySelector('.nav-tabs li[data-tab="games"]');
    if (gamesTab) {
        gamesTab.addEventListener('click', function() {
            // Initialize games tab functionality
            initializeGames();
        });
    }

    // Sync user session with the server
    syncUserSession();
});

// Function to initialize learning tab functionality
function initializeLearningTab() {
    console.log('Initializing learning tab...');
    
    // Get category elements
    const booksCategory = document.getElementById('books-category');
    const coursesCategory = document.getElementById('courses-category');
    const practiceCategory = document.getElementById('practice-category');
    const topicsCategory = document.getElementById('topics-category');
    
    // Get section elements
    const booksSection = document.getElementById('books-section');
    const coursesSection = document.getElementById('courses-section');
    const practiceSection = document.getElementById('practice-section');
    const topicsSection = document.getElementById('topics-section');
    
    // Get search elements
    const searchInput = document.querySelector('.learning-header .search-bar input');
    const searchButton = document.querySelector('.learning-header .search-bar button');
    
    // Initialize search functionality
    if (searchInput && searchButton) {
        // Add click event listener to search button
        searchButton.addEventListener('click', function() {
            executeSearch(searchInput.value);
        });
        
        // Add keypress event listener to search input (for Enter key)
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                executeSearch(searchInput.value);
            }
        });
    }
    
    // Clear recommended resources - show empty state
    const recommendedContainer = document.getElementById('recommended-resources-container');
    if (recommendedContainer) {
        recommendedContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-lightbulb"></i>
                <p>Resources will be recommended according to your learning progress.</p>
            </div>
        `;
    }
    
    // Initially hide all sections
    hideAllSections();
    
    // Add click event listeners to categories
    if (booksCategory) {
        booksCategory.addEventListener('click', function() {
            console.log('Books category clicked');
            hideAllSections();
            if (booksSection) {
                booksSection.style.display = 'block';
                initializeBooksSection();
            }
        });
    }
    
    if (coursesCategory) {
        coursesCategory.addEventListener('click', function() {
            console.log('Courses category clicked');
            hideAllSections();
            if (coursesSection) {
                coursesSection.style.display = 'block';
                initializeCoursesSection();
            }
        });
    }
    
    if (practiceCategory) {
        practiceCategory.addEventListener('click', function() {
            console.log('Practice category clicked');
            hideAllSections();
            if (practiceSection) {
                practiceSection.style.display = 'block';
                initializePracticeSection();
            }
        });
    }
    
    if (topicsCategory) {
        topicsCategory.addEventListener('click', function() {
            console.log('Topics category clicked');
            hideAllSections();
            if (topicsSection) {
                topicsSection.style.display = 'block';
                initializeTopicsSection();
            }
        });
    }
    
    // Function to execute search across all learning content
    function executeSearch(query) {
        if (!query || query.trim() === '') {
            showNotification('Please enter a search term');
            return;
        }
        
        console.log(`Executing search for: ${query}`);
        showNotification(`Searching for "${query}"...`);
        
        // Create a search results section if it doesn't exist
        let searchSection = document.getElementById('search-results-section');
        if (!searchSection) {
            searchSection = document.createElement('div');
            searchSection.id = 'search-results-section';
            searchSection.className = 'learning-section';
            
            // Add search section after the learning categories
            const learningContent = document.getElementById('learning-content');
            if (learningContent) {
                const categories = document.querySelector('.learning-categories');
                if (categories) {
                    learningContent.insertBefore(searchSection, categories.nextSibling);
                } else {
                    learningContent.appendChild(searchSection);
                }
            }
        }
        
        // Show the search section and hide others
        hideAllSections();
        searchSection.style.display = 'block';
        
        // Set initial loading state
        searchSection.innerHTML = `
            <div class="section-header">
                <h3>Search Results for "${query}"</h3>
                <button id="clear-search-results" class="back-btn">
                    <i class="fas fa-times"></i> Clear Results
                </button>
            </div>
            <div class="search-results-content">
                <div class="loading-indicator">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Searching all learning resources...</p>
                </div>
            </div>
        `;
        
        // Add event listener to clear search results button
        const clearButton = document.getElementById('clear-search-results');
        if (clearButton) {
            clearButton.addEventListener('click', function() {
                searchSection.style.display = 'none';
                searchInput.value = '';
            });
        }
        
        // Perform search across all resources
        Promise.all([
            searchBooks(query),
            searchCourses(query),
            searchTopics(query),
            searchPracticeQuestions(query)
        ]).then(([books, courses, topics, questions]) => {
            const resultsContent = document.querySelector('.search-results-content');
            if (!resultsContent) return;
            
            // Clear loading indicator
            resultsContent.innerHTML = '';
            
            // Check if we have any results
            const totalResults = books.length + courses.length + topics.length + questions.length;
            
            if (totalResults === 0) {
                resultsContent.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <p>No results found for "${query}"</p>
                        <p>Try using different keywords or browse categories</p>
                    </div>
                `;
                return;
            }
            
            // Display results by category
            if (books.length > 0) {
                addResultsSection(resultsContent, 'Books', books, renderBookResult);
            }
            
            if (courses.length > 0) {
                addResultsSection(resultsContent, 'Courses', courses, renderCourseResult);
            }
            
            if (topics.length > 0) {
                addResultsSection(resultsContent, 'Topics', topics, renderTopicResult);
            }
            
            if (questions.length > 0) {
                addResultsSection(resultsContent, 'Practice Questions', questions, renderQuestionResult);
            }
        }).catch(error => {
            console.error('Search error:', error);
            const resultsContent = document.querySelector('.search-results-content');
            if (resultsContent) {
                resultsContent.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error searching for "${query}"</p>
                        <p>Please try again later</p>
                    </div>
                `;
            }
        });
    }
    
    // Helper function to add a section of results
    function addResultsSection(container, title, items, renderFunction) {
        const section = document.createElement('div');
        section.className = 'search-result-category';
        
        section.innerHTML = `
            <h4>${title} (${items.length})</h4>
            <div class="result-items"></div>
        `;
        
        const itemsContainer = section.querySelector('.result-items');
        
        items.forEach(item => {
            const renderedItem = renderFunction(item);
            itemsContainer.appendChild(renderedItem);
        });
        
        container.appendChild(section);
    }
    
    // Render functions for different result types
    function renderBookResult(book) {
        const element = document.createElement('div');
        element.className = 'search-result-item';
        
        // Add web search identifier
        book.source = 'web_search';
        book.fromWebSearch = true;
        // Create a unique ID with web- prefix if it doesn't have one
        if (!book.id || !book.id.toString().includes('web-')) {
            book.id = `web-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }
        
        element.innerHTML = `
            <div class="result-icon">
                <i class="fas fa-book"></i>
            </div>
            <div class="result-details">
                <h5>${book.title}</h5>
                <p>${book.author}${book.year ? ` (${book.year})` : ''}</p>
            </div>
            <div class="result-actions">
                <button class="view-btn" data-id="${book.id}" data-type="book">View</button>
                <button class="add-btn" data-id="${book.id}" data-type="book">Add to Library</button>
            </div>
        `;
        
        // Add event listeners to buttons
        const viewBtn = element.querySelector('.view-btn');
        const addBtn = element.querySelector('.add-btn');
        
        viewBtn.addEventListener('click', function() {
            // Navigate to book detail
            hideAllSections();
            const booksSection = document.getElementById('books-section');
            if (booksSection) {
                booksSection.style.display = 'block';
                initializeBooksSection();
                // Additional logic to show book details
            }
        });
        
        addBtn.addEventListener('click', function() {
            addBookToLibrary(book);
            this.textContent = 'Added';
            this.disabled = true;
            showNotification(`"${book.title}" added to your library`);
        });
        
        return element;
    }
    
    function renderCourseResult(course) {
        const element = document.createElement('div');
        element.className = 'search-result-item';
        
        // Add web search identifier
        course.source = 'web_search';
        course.fromWebSearch = true;
        // Create a unique ID with web- prefix if it doesn't have one
        if (!course.id || !course.id.toString().includes('web-')) {
            course.id = `web-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }
        
        element.innerHTML = `
            <div class="result-icon">
                <i class="fas fa-chalkboard-teacher"></i>
            </div>
            <div class="result-details">
                <h5>${course.title}</h5>
                <p>${course.description}</p>
            </div>
            <div class="result-actions">
                <button class="view-btn" data-id="${course.id}" data-type="course">View</button>
                <button class="add-btn" data-id="${course.id}" data-type="course">Add to Library</button>
            </div>
        `;
        
        // Add event listeners to buttons
        const viewBtn = element.querySelector('.view-btn');
        const addBtn = element.querySelector('.add-btn');
        
        viewBtn.addEventListener('click', function() {
            // Navigate to course detail
            hideAllSections();
            const coursesSection = document.getElementById('courses-section');
            if (coursesSection) {
                coursesSection.style.display = 'block';
                initializeCoursesSection();
                // Logic to show specific course
            }
        });
        
        addBtn.addEventListener('click', function() {
            addCourseToLibrary(course.id);
            this.textContent = 'Added';
            this.disabled = true;
            showNotification(`"${course.title}" added to your library`);
        });
        
        return element;
    }
    
    function renderTopicResult(topic) {
        const element = document.createElement('div');
        element.className = 'search-result-item';
        
        element.innerHTML = `
            <div class="result-icon">
                <i class="fas fa-project-diagram"></i>
            </div>
            <div class="result-details">
                <h5>${topic.title}</h5>
                <p>${topic.subject}</p>
            </div>
            <div class="result-actions">
                <button class="view-btn" data-id="${topic.id}" data-type="topic">View</button>
            </div>
        `;
        
        // Add event listeners to buttons
        const viewBtn = element.querySelector('.view-btn');
        
        viewBtn.addEventListener('click', function() {
            // Navigate to topic detail
            hideAllSections();
            const topicsSection = document.getElementById('topics-section');
            if (topicsSection) {
                topicsSection.style.display = 'block';
                initializeTopicsSection();
                // Logic to show specific topic
            }
        });
        
        return element;
    }
    
    function renderQuestionResult(question) {
        const element = document.createElement('div');
        element.className = 'search-result-item';
        
        element.innerHTML = `
            <div class="result-icon">
                <i class="fas fa-question-circle"></i>
            </div>
            <div class="result-details">
                <h5>${question.question}</h5>
                <p>${question.topic}</p>
            </div>
            <div class="result-actions">
                <button class="view-btn" data-id="${question.id}" data-type="question">Practice</button>
            </div>
        `;
        
        // Add event listeners to buttons
        const viewBtn = element.querySelector('.view-btn');
        
        viewBtn.addEventListener('click', function() {
            // Navigate to practice section
            hideAllSections();
            const practiceSection = document.getElementById('practice-section');
            if (practiceSection) {
                practiceSection.style.display = 'block';
                initializePracticeSection();
                // Logic to show specific question
            }
        });
        
        return element;
    }
    
    // Mock search functions - in a real app these would call the backend
    function searchBooks(query) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate search results
                const books = [
                    { id: 'b1', title: 'Advanced JavaScript', author: 'John Smith', year: 2023 },
                    { id: 'b2', title: 'Python for Data Science', author: 'Emily Johnson', year: 2022 },
                    { id: 'b3', title: 'Learning React', author: 'Michael Williams', year: 2022 }
                ];
                
                const filteredBooks = books.filter(book => 
                    book.title.toLowerCase().includes(query.toLowerCase()) || 
                    book.author.toLowerCase().includes(query.toLowerCase())
                );
                
                resolve(filteredBooks);
            }, 500);
        });
    }
    
    function searchCourses(query) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate search results
                const courses = [
                    { id: 'c1', title: 'Full Stack Development', description: 'Complete path from frontend to backend development' },
                    { id: 'c2', title: 'Machine Learning Basics', description: 'Introduction to ML concepts and algorithms' },
                    { id: 'c3', title: 'Web Design Fundamentals', description: 'Learn UI/UX principles for web' }
                ];
                
                const filteredCourses = courses.filter(course => 
                    course.title.toLowerCase().includes(query.toLowerCase()) || 
                    course.description.toLowerCase().includes(query.toLowerCase())
                );
                
                resolve(filteredCourses);
            }, 600);
        });
    }
    
    function searchTopics(query) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate search results
                const topics = [
                    { id: 't1', title: 'JavaScript Basics', subject: 'Programming' },
                    { id: 't2', title: 'Linear Algebra', subject: 'Mathematics' },
                    { id: 't3', title: 'Quantum Mechanics', subject: 'Physics' }
                ];
                
                const filteredTopics = topics.filter(topic => 
                    topic.title.toLowerCase().includes(query.toLowerCase()) || 
                    topic.subject.toLowerCase().includes(query.toLowerCase())
                );
                
                resolve(filteredTopics);
            }, 400);
        });
    }
    
    function searchPracticeQuestions(query) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate search results
                const questions = [
                    { id: 'q1', question: 'What is the difference between let and var in JavaScript?', topic: 'JavaScript' },
                    { id: 'q2', question: 'Explain the concept of inheritance in Object-Oriented Programming', topic: 'Programming Fundamentals' },
                    { id: 'q3', question: 'How does the CSS box model work?', topic: 'Web Development' }
                ];
                
                const filteredQuestions = questions.filter(question => 
                    question.question.toLowerCase().includes(query.toLowerCase()) || 
                    question.topic.toLowerCase().includes(query.toLowerCase())
                );
                
                resolve(filteredQuestions);
            }, 550);
        });
    }
    
    // Helper function to hide all sections
    function hideAllSections() {
        if (booksSection) booksSection.style.display = 'none';
        if (coursesSection) {
            coursesSection.style.display = 'none';
            // Reset course plan container visibility
            const coursePlanContainer = document.getElementById('course-plan-container');
            if (coursePlanContainer) {
                coursePlanContainer.style.display = 'none';
            }
            // Ensure courses container is visible when section is shown again
            const coursesContainer = document.querySelector('.courses-container');
            if (coursesContainer) {
                coursesContainer.style.display = 'grid';
            }
        }
        if (practiceSection) practiceSection.style.display = 'none';
        if (topicsSection) topicsSection.style.display = 'none';
        
        // Also hide search results section if it exists
        const searchSection = document.getElementById('search-results-section');
        if (searchSection) searchSection.style.display = 'none';
    }
}

// Function to initialize the Books section
function initializeBooksSection() {
    console.log('Initializing books section...');
    
    const uploadBtn = document.getElementById('upload-book-btn');
    const searchBtn = document.getElementById('search-books-btn');
    const uploadContainer = document.querySelector('.book-upload-container');
    const searchContainer = document.querySelector('.book-search-container');
    const cancelUploadBtn = document.getElementById('cancel-upload');
    const bookUploadForm = document.getElementById('book-upload-form');
    const executeSearchBtn = document.getElementById('execute-book-search');
    const searchInput = document.getElementById('book-search-input');
    const searchResults = document.getElementById('book-search-results');
    const booksGrid = document.getElementById('books-grid');
    const emptyLibrary = document.getElementById('library-empty');
    
    // Toggle book upload form
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function() {
            console.log('Upload button clicked');
            if (uploadContainer) {
                uploadContainer.style.display = 'block';
            }
            if (searchContainer) {
                searchContainer.style.display = 'none';
            }
        });
    }
    
    // Toggle book search form
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            console.log('Search button clicked');
            if (searchContainer) {
                searchContainer.style.display = 'block';
            }
            if (uploadContainer) {
                uploadContainer.style.display = 'none';
            }
        });
    }
    
    // Cancel upload action
    if (cancelUploadBtn) {
        cancelUploadBtn.addEventListener('click', function() {
            console.log('Cancel upload clicked');
            if (uploadContainer) {
                uploadContainer.style.display = 'none';
            }
            if (bookUploadForm) {
                bookUploadForm.reset();
            }
        });
    }
    
    // Handle book upload
    if (bookUploadForm) {
        console.log('Book upload form found:', bookUploadForm);
        
        // Form submit handler
        bookUploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Book form submitted');
            
            const title = document.getElementById('book-title').value;
            const author = document.getElementById('book-author').value;
            const category = document.getElementById('book-category').value;
            const fileInput = document.getElementById('book-file');
            
            if (!title || !author || !category || !fileInput || !fileInput.files[0]) {
                alert('Please fill in all required fields');
                return;
            }
            
            const file = fileInput.files[0];
            console.log('File selected:', file.name);
            
            try {
                // Simulate file upload
                const newBook = uploadBook(title, author, category, file);
                console.log('Book uploaded successfully:', newBook);
                
                // Reset form
                bookUploadForm.reset();
                
                // Hide upload container
                if (uploadContainer) {
                    uploadContainer.style.display = 'none';
                }
                
                // Show success notification
                showNotification('Book uploaded successfully!');
                
                // Force refresh the books display
                displayBooks();
            } catch (error) {
                console.error('Error uploading book:', error);
                alert('There was an error uploading your book. Please try again.');
            }
        });
    }
    
    // Handle book upload button
    const uploadBookBtn = document.getElementById('upload-book-btn-submit');
    if (uploadBookBtn) {
        console.log('Upload book submit button found');
        uploadBookBtn.addEventListener('click', function() {
            console.log('Upload book button clicked');
            
            const title = document.getElementById('book-title').value;
            const author = document.getElementById('book-author').value;
            const category = document.getElementById('book-category').value;
            const fileInput = document.getElementById('book-file');
            
            if (!title || !author || !category || !fileInput || !fileInput.files[0]) {
                alert('Please fill in all required fields');
                return;
            }
            
            const file = fileInput.files[0];
            console.log('File selected:', file.name);
            
            try {
                // Simulate file upload
                const newBook = uploadBook(title, author, category, file);
                console.log('Book uploaded successfully:', newBook);
                
                // Reset form fields
                document.getElementById('book-title').value = '';
                document.getElementById('book-author').value = '';
                document.getElementById('book-category').value = '';
                document.getElementById('book-file').value = '';
                
                // Hide upload container
                if (uploadContainer) {
                    uploadContainer.style.display = 'none';
                }
                
                // Show success notification
                showNotification('Book uploaded successfully!');
                
                // Force refresh the books display
                displayBooks();
            } catch (error) {
                console.error('Error uploading book:', error);
                alert('There was an error uploading your book. Please try again.');
            }
        });
    }
    
    // Handle book search
    if (executeSearchBtn && searchInput) {
        executeSearchBtn.addEventListener('click', function() {
            console.log('Execute search clicked');
            const query = searchInput.value.trim();
            
            if (!query) {
                alert('Please enter a search term');
                return;
            }
            
            // Simulate search (in a real app, this would be an API call)
            searchBooks(query);
        });
    }
    
    // Simulate book upload function
    function uploadBook(title, author, category, file) {
        console.log(`Uploading book: ${title} by ${author}, category: ${category}`);
        
        // Generate a cover image URL
        let coverUrl;
        if (file.type.includes('image')) {
            coverUrl = URL.createObjectURL(file);
        } else {
            // For PDFs and other files, use a placeholder based on category
            const categoryImages = {
                'programming': 'https://source.unsplash.com/random/300x400/?coding',
                'mathematics': 'https://source.unsplash.com/random/300x400/?math',
                'science': 'https://source.unsplash.com/random/300x400/?science',
                'other': 'https://source.unsplash.com/random/300x400/?book'
            };
            coverUrl = categoryImages[category] || categoryImages.other;
        }
        
        // Generate a unique ID for the book
        const bookId = 'book-' + Date.now();
        
        // Create a new book object
        const newBook = {
            id: bookId,
            title: title,
            author: author,
            category: category,
            coverUrl: coverUrl,
            fileName: file.name,
            dateAdded: new Date().toISOString(),
            type: 'book'  // Add type field for library display
        };
        
        // Add to userLibrary
        userLibrary.books.push(newBook);
        
        // Save to localStorage
        saveLibraryData();
        
        return newBook;
    }
    
    // Simulate book search function
    function searchBooks(query) {
        console.log(`Searching for books with query: ${query}`);
        
        // Clear previous results
        if (searchResults) {
            searchResults.innerHTML = '<p>Searching...</p>';
        }
        
        // Define fallback mock data for when backend is not available
        const getMockBookResults = (query) => {
            const mockBooks = [
                {
                    id: 'book123',
                    title: 'Let Us C',
                    author: 'Yashavant Kanetkar',
                    year: '2004',
                    coverUrl: 'https://source.unsplash.com/random/300x400/?programming'
                },
                {
                    id: 'book124',
                    title: 'Let Us C++',
                    author: 'Yashavant Kanetkar',
                    year: '2008',
                    coverUrl: 'https://source.unsplash.com/random/300x400/?coding'
                },
                {
                    id: 'book125',
                    title: 'Let Us Python',
                    author: 'Yashavant Kanetkar',
                    year: '2019',
                    coverUrl: 'https://source.unsplash.com/random/300x400/?python'
                }
            ];
            
            // Filter books based on query
            const filteredBooks = mockBooks.filter(book => 
                book.title.toLowerCase().includes(query.toLowerCase()) || 
                book.author.toLowerCase().includes(query.toLowerCase())
            );
            
            return { books: filteredBooks };
        };
        
        // Make API call to backend with proper fetch options
        fetch(`/api/learning/search-books?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include',
            mode: 'cors',
            cache: 'no-cache',
        })
            .then(response => {
                if (!response.ok) {
                    console.error(`Search error: ${response.status} ${response.statusText}`);
                    console.log('Falling back to mock data...');
                    // Use mock data instead
                    return { json: () => Promise.resolve(getMockBookResults(query)) };
                }
                return response;
            })
            .then(response => response.json())
            .then(data => {
                if (searchResults) {
                    if (!data.books || data.books.length === 0) {
                        searchResults.innerHTML = '<p>No books found matching your search.</p>';
                    } else {
                        searchResults.innerHTML = '';
                        
                        data.books.forEach(book => {
                            const bookElement = document.createElement('div');
                            bookElement.className = 'book-item';
                            bookElement.innerHTML = `
                                <div class="book-cover">
                                    <img src="${book.coverUrl || 'https://source.unsplash.com/random/300x400/?book'}" alt="${book.title}">
                                </div>
                                <div class="book-details">
                                    <h5>${book.title}</h5>
                                    <p>${book.author}${book.year ? ` (${book.year})` : ''}</p>
                                    <div class="book-actions">
                                        <button class="add-book-btn" data-book-id="${book.id}">Add to Library</button>
                                    </div>
                                </div>
                            `;
                            searchResults.appendChild(bookElement);
                            
                            // Add event listener to the Add button
                            const addBtn = bookElement.querySelector('.add-book-btn');
                            addBtn.addEventListener('click', function() {
                                addBookToLibrary(book);
                                addBtn.textContent = 'Added';
                                addBtn.disabled = true;
                            });
                        });
                    }
                }
            })
            .catch(error => {
                console.error('Error searching books:', error);
                
                // Use mock data as fallback in case of error
                const mockData = getMockBookResults(query);
                
                if (searchResults) {
                    if (mockData.books.length === 0) {
                        searchResults.innerHTML = '<p>No books found matching your search.</p>';
                    } else {
                        searchResults.innerHTML = '<p>Using offline results (backend unavailable):</p>';
                        
                        mockData.books.forEach(book => {
                            const bookElement = document.createElement('div');
                            bookElement.className = 'book-item';
                            bookElement.innerHTML = `
                                <div class="book-cover">
                                    <img src="${book.coverUrl || 'https://source.unsplash.com/random/300x400/?book'}" alt="${book.title}">
                                </div>
                                <div class="book-details">
                                    <h5>${book.title}</h5>
                                    <p>${book.author}${book.year ? ` (${book.year})` : ''}</p>
                                    <div class="book-actions">
                                        <button class="add-book-btn" data-book-id="${book.id}">Add to Library</button>
                                    </div>
                                </div>
                            `;
                            searchResults.appendChild(bookElement);
                            
                            // Add event listener to the Add button
                            const addBtn = bookElement.querySelector('.add-book-btn');
                            addBtn.addEventListener('click', function() {
                                addBookToLibrary(book);
                                addBtn.textContent = 'Added';
                                addBtn.disabled = true;
                            });
                        });
                    }
                }
            });
    }
    
    // Function to add a book to the library
    function addBookToLibrary(book) {
        // Check if book is already in library
        if (!userLibrary.books.some(b => b.title === book.title)) {
            userLibrary.books.push(book);
            saveLibraryData(); // Save to localStorage
            updateLibraryView(document.querySelector('.library-tab.active').dataset.tab);
        }
    }
    
    // Function to display books in the library
    function displayBooks() {
        const libraryGrid = document.getElementById('library-grid');
        if (!libraryGrid) return;

        // Clear current content
        libraryGrid.innerHTML = '';

        // Get items to display based on selected tab
        let itemsToDisplay = [];
        const activeTab = document.querySelector('.library-tab.active').dataset.tab;
        
        if (activeTab === 'all') {
            itemsToDisplay = [...userLibrary.books, ...userLibrary.courses];
        } else if (activeTab === 'books') {
            itemsToDisplay = userLibrary.books;
        } else if (activeTab === 'courses') {
            itemsToDisplay = userLibrary.courses;
        }

        // Display items or empty state
        if (itemsToDisplay.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'library-empty';
            emptyState.innerHTML = `
                <i class="fas fa-books"></i>
                <p>No ${activeTab === 'all' ? 'items' : activeTab} in your library yet.</p>
            `;
            libraryGrid.appendChild(emptyState);
        } else {
            itemsToDisplay.forEach(item => {
                const libraryItem = createLibraryItem(item);
                libraryGrid.appendChild(libraryItem);
            });
        }
    }
    
    // Function to remove a book from the library
    function removeBookFromLibrary(bookId) {
        console.log(`Removing book with ID: ${bookId}`);
        
        const books = JSON.parse(localStorage.getItem('mentaura_books') || '[]');
        const updatedBooks = books.filter(book => book.id !== bookId);
        
        localStorage.setItem('mentaura_books', JSON.stringify(updatedBooks));
        
        // Refresh the books display
        displayBooks();
        
        // Show notification
        showNotification('Book removed from your library');
    }
    
    // Display books on initialization
    displayBooks();
}

// Function to initialize the Courses section
function initializeCoursesSection() {
    console.log('Initializing courses section...');
    
    const coursesContainer = document.querySelector('.courses-container');
    const coursePlanContainer = document.getElementById('course-plan-container');
    const coursePlanTitle = document.getElementById('course-plan-title');
    const coursePlanContent = document.getElementById('course-plan-content');
    const backButton = document.getElementById('back-to-courses');
    
    // Initialize state
    if (coursePlanContainer) {
        coursePlanContainer.style.display = 'none';
    }
    
    // Ensure courses container is visible
    if (coursesContainer) {
        coursesContainer.style.display = 'grid';
    }
    
    // Add event listeners to Start Learning buttons
    const startCourseButtons = document.querySelectorAll('.start-course-btn');
    
    if (startCourseButtons) {
        startCourseButtons.forEach(button => {
            button.addEventListener('click', function() {
                const courseType = this.getAttribute('data-course');
                console.log(`Starting course: ${courseType}`);
                
                // Hide courses container and show course plan
                if (coursesContainer) {
                    coursesContainer.style.display = 'none';
                }
                
                if (coursePlanContainer) {
                    coursePlanContainer.style.display = 'block';
                }
                
                // Generate and display course plan
                const coursePlan = generateCoursePlan(courseType);
                
                // Update course plan title
                if (coursePlanTitle) {
                    coursePlanTitle.textContent = coursePlan.title;
                }
                
                // Render course plan content
                if (coursePlanContent) {
                    coursePlanContent.innerHTML = '';
                    
                    coursePlan.modules.forEach((module, index) => {
                        const moduleElement = document.createElement('div');
                        moduleElement.className = 'course-module';
                        
                        // Set progress to 0 for all modules
                        const progress = 0;
                        
                        moduleElement.innerHTML = `
                            <h4><i class="${module.icon}"></i> Module ${index + 1}: ${module.title}</h4>
                            <p>${module.description}</p>
                            <ul class="module-topics">
                                ${module.topics.map(topic => `<li>${topic}</li>`).join('')}
                            </ul>
                            <div class="module-completion">
                                <span>Progress:</span>
                                <div class="module-progress-bar">
                                    <div class="module-progress" style="width: ${progress}%; background-color: #ccc;"></div>
                                </div>
                                <span>${progress}%</span>
                            </div>
                        `;
                        
                        coursePlanContent.appendChild(moduleElement);
                    });
                }
            });
        });
    }
    
    // Back button functionality
    if (backButton) {
        backButton.addEventListener('click', function() {
            // Hide course plan and show courses container
            if (coursePlanContainer) {
                coursePlanContainer.style.display = 'none';
            }
            
            if (coursesContainer) {
                coursesContainer.style.display = 'grid';
            }
        });
    }
}

// Function to initialize the Practice section
function initializePracticeSection() {
    console.log('Initializing practice section...');
    
    const topicItems = document.querySelectorAll('.topic-item');
    const practiceContent = document.getElementById('practice-content');
    const practiceEmpty = document.querySelector('.practice-empty');
    
    // Add click event to each topic item
    if (topicItems && practiceContent) {
        topicItems.forEach(item => {
            item.addEventListener('click', function() {
                const topic = this.getAttribute('data-topic');
                console.log(`Topic clicked: ${topic}`);
                
                // Remove active class from all topics
                topicItems.forEach(t => t.classList.remove('active'));
                
                // Add active class to current topic
                this.classList.add('active');
                
                // Hide the empty state
                if (practiceEmpty) {
                    practiceEmpty.style.display = 'none';
                }
                
                // Generate questions for the selected topic
                const questions = generateQuestions(topic);
                
                // Display the questions
                displayQuestions(questions, practiceContent);
            });
        });
    }
    
    // Function to generate questions based on topic
    function generateQuestions(topic) {
        const questionsData = {
            javascript: [
                {
                    question: "What will be the output of: console.log(typeof([]));",
                    options: ["array", "object", "undefined", "null"],
                    correctAnswer: 1,
                    explanation: "In JavaScript, arrays are actually objects, so typeof([]) returns 'object'."
                },
                {
                    question: "Which method adds an element to the end of an array?",
                    options: ["push()", "pop()", "shift()", "unshift()"],
                    correctAnswer: 0,
                    explanation: "The push() method adds elements to the end of an array and returns the new length."
                },
                {
                    question: "What does the '===' operator do in JavaScript?",
                    options: ["Checks for equality with type conversion", "Checks for equality without type conversion", "Assigns a value", "Checks if a value exists"],
                    correctAnswer: 1,
                    explanation: "The '===' operator is a strict equality operator that checks both value and type without conversion."
                }
            ],
            python: [
                {
                    question: "What is the correct way to create a function in Python?",
                    options: ["function myFunc():", "def myFunc():", "create myFunc():", "func myFunc():"],
                    correctAnswer: 1,
                    explanation: "In Python, functions are defined using the 'def' keyword followed by the function name and parentheses."
                },
                {
                    question: "Which method is used to add an element to a list in Python?",
                    options: ["add()", "append()", "insert()", "extend()"],
                    correctAnswer: 1,
                    explanation: "The append() method adds a single element to the end of a list."
                },
                {
                    question: "What does the following code return: len([1, 2, 3, 4])?",
                    options: ["3", "4", "5", "Error"],
                    correctAnswer: 1,
                    explanation: "The len() function returns the number of items in an object. The list has 4 elements."
                }
            ],
            "html-css": [
                {
                    question: "Which HTML tag is used to create a hyperlink?",
                    options: ["<link>", "<a>", "<href>", "<url>"],
                    correctAnswer: 1,
                    explanation: "The <a> (anchor) tag is used to create hyperlinks in HTML."
                },
                {
                    question: "Which CSS property is used to change the text color?",
                    options: ["text-color", "font-color", "color", "text-style"],
                    correctAnswer: 2,
                    explanation: "The 'color' property is used to set the color of text in CSS."
                },
                {
                    question: "What does CSS stand for?",
                    options: ["Creative Style Sheets", "Computer Style Sheets", "Cascading Style Sheets", "Colorful Style Sheets"],
                    correctAnswer: 2,
                    explanation: "CSS stands for Cascading Style Sheets, which is used to style web pages."
                }
            ],
            algorithms: [
                {
                    question: "What is the time complexity of binary search?",
                    options: ["O(n)", "O(n log n)", "O(log n)", "O(1)"],
                    correctAnswer: 2,
                    explanation: "Binary search has a time complexity of O(log n) as it divides the search interval in half with each step."
                },
                {
                    question: "Which sorting algorithm has the best average time complexity?",
                    options: ["Bubble Sort", "Insertion Sort", "Quick Sort", "Selection Sort"],
                    correctAnswer: 2,
                    explanation: "Quick Sort has an average time complexity of O(n log n), which is better than O(n²) algorithms like Bubble, Insertion, and Selection Sort."
                },
                {
                    question: "What data structure would you use for implementing a LIFO (Last In, First Out) structure?",
                    options: ["Queue", "Stack", "Linked List", "Array"],
                    correctAnswer: 1,
                    explanation: "A Stack is a data structure that follows the LIFO principle where the last element added is the first one to be removed."
                }
            ],
            algebra: [
                {
                    question: "Solve for x: 3x - 7 = 8",
                    options: ["x = 3", "x = 5", "x = 6", "x = 15/3"],
                    correctAnswer: 1,
                    explanation: "3x - 7 = 8\n3x = 15\nx = 5"
                },
                {
                    question: "What is the value of x in the equation 2(x + 3) = 14?",
                    options: ["x = 4", "x = 5", "x = 7", "x = 8"],
                    correctAnswer: 0,
                    explanation: "2(x + 3) = 14\n2x + 6 = 14\n2x = 8\nx = 4"
                },
                {
                    question: "Simplify the expression: 3(x - 2) - 2(x + 1)",
                    options: ["x - 8", "x - 4", "5x - 8", "x - 6"],
                    correctAnswer: 0,
                    explanation: "3(x - 2) - 2(x + 1) = 3x - 6 - 2x - 2 = x - 8"
                }
            ],
            calculus: [
                {
                    question: "What is the derivative of f(x) = x²?",
                    options: ["f'(x) = x", "f'(x) = 2x", "f'(x) = 2", "f'(x) = x³"],
                    correctAnswer: 1,
                    explanation: "The derivative of x² is 2x using the power rule: d/dx(x^n) = n*x^(n-1)"
                },
                {
                    question: "What is the integral of f(x) = 2x?",
                    options: ["∫2x dx = x² + C", "∫2x dx = 2x² + C", "∫2x dx = x² + 2C", "∫2x dx = x²/2 + C"],
                    correctAnswer: 0,
                    explanation: "∫2x dx = 2∫x dx = 2(x²/2) + C = x² + C"
                },
                {
                    question: "What is the limit as x approaches 0 of sin(x)/x?",
                    options: ["0", "1", "∞", "Does not exist"],
                    correctAnswer: 1,
                    explanation: "The limit as x approaches 0 of sin(x)/x is 1, which is a famous result in calculus."
                }
            ],
            geometry: [
                {
                    question: "What is the formula for the area of a circle?",
                    options: ["A = πr", "A = 2πr", "A = πr²", "A = 2πr²"],
                    correctAnswer: 2,
                    explanation: "The area of a circle is given by A = πr², where r is the radius."
                },
                {
                    question: "What is the sum of the interior angles of a triangle?",
                    options: ["90 degrees", "180 degrees", "270 degrees", "360 degrees"],
                    correctAnswer: 1,
                    explanation: "The sum of interior angles of a triangle is always 180 degrees."
                },
                {
                    question: "What is the Pythagorean theorem?",
                    options: ["a² + b² = c", "a + b + c = 180", "a² + b² = c²", "a + b = c"],
                    correctAnswer: 2,
                    explanation: "The Pythagorean theorem states that in a right triangle, the square of the length of the hypotenuse (c) equals the sum of squares of the other two sides (a and b): a² + b² = c²."
                }
            ],
            statistics: [
                {
                    question: "What is the mean of the numbers: 3, 5, 7, 9?",
                    options: ["5", "6", "7", "8"],
                    correctAnswer: 1,
                    explanation: "Mean = (3 + 5 + 7 + 9) / 4 = 24 / 4 = 6"
                },
                {
                    question: "What measure of central tendency is affected most by extreme values?",
                    options: ["Mean", "Median", "Mode", "Range"],
                    correctAnswer: 0,
                    explanation: "The mean is most affected by extreme values (outliers) because it includes every value in its calculation."
                },
                {
                    question: "What is the probability of rolling a 6 on a standard six-sided die?",
                    options: ["1/5", "1/6", "1/3", "1/2"],
                    correctAnswer: 1,
                    explanation: "The probability is 1/6 because there is 1 favorable outcome out of 6 possible equally likely outcomes."
                }
            ],
            // Physics Questions
            mechanics: [
                {
                    question: "What is Newton's Second Law of Motion?",
                    options: ["F = ma", "F = mv", "F = mg", "F = mv²"],
                    correctAnswer: 0,
                    explanation: "Newton's Second Law states that Force equals mass times acceleration (F = ma)."
                },
                {
                    question: "What is the SI unit of force?",
                    options: ["Watt", "Joule", "Newton", "Pascal"],
                    correctAnswer: 2,
                    explanation: "The SI unit of force is the Newton (N), which equals 1 kg⋅m/s²."
                },
                {
                    question: "What is the principle of conservation of momentum?",
                    options: [
                        "Total energy remains constant",
                        "Total momentum remains constant in a closed system",
                        "Mass remains constant",
                        "Velocity remains constant"
                    ],
                    correctAnswer: 1,
                    explanation: "The principle states that the total momentum of a closed system remains constant if no external forces act on it."
                }
            ],
            thermodynamics: [
                {
                    question: "What is the First Law of Thermodynamics?",
                    options: [
                        "Energy cannot be created or destroyed",
                        "Heat flows from hot to cold",
                        "Entropy always increases",
                        "Temperature is constant in equilibrium"
                    ],
                    correctAnswer: 0,
                    explanation: "The First Law of Thermodynamics states that energy cannot be created or destroyed, only converted from one form to another."
                },
                {
                    question: "What is entropy?",
                    options: [
                        "Total energy of a system",
                        "Measure of disorder in a system",
                        "Temperature of a system",
                        "Pressure of a system"
                    ],
                    correctAnswer: 1,
                    explanation: "Entropy is a measure of the disorder or randomness in a system."
                },
                {
                    question: "What happens to the temperature of a gas when it expands adiabatically?",
                    options: [
                        "Increases",
                        "Decreases",
                        "Remains constant",
                        "Becomes zero"
                    ],
                    correctAnswer: 1,
                    explanation: "In an adiabatic expansion, the gas temperature decreases as it does work against its surroundings."
                }
            ],
            
            // Chemistry Questions
            organic: [
                {
                    question: "What is a functional group in organic chemistry?",
                    options: [
                        "A group of atoms responsible for characteristic chemical reactions",
                        "A group of similar molecules",
                        "A group of elements",
                        "A group of electrons"
                    ],
                    correctAnswer: 0,
                    explanation: "A functional group is a specific group of atoms within molecules that is responsible for the characteristic chemical reactions of those molecules."
                },
                {
                    question: "What is the general formula for alkanes?",
                    options: ["CnH2n", "CnH2n+2", "CnH2n-2", "CnHn"],
                    correctAnswer: 1,
                    explanation: "Alkanes have the general formula CnH2n+2, where n is the number of carbon atoms."
                },
                {
                    question: "What type of hybridization is present in ethene (C2H4)?",
                    options: ["sp³", "sp²", "sp", "No hybridization"],
                    correctAnswer: 1,
                    explanation: "The carbon atoms in ethene are sp² hybridized, forming a double bond."
                }
            ],
            
            // Biology Questions
            "cell-biology": [
                {
                    question: "What is the function of mitochondria?",
                    options: [
                        "Protein synthesis",
                        "Energy production",
                        "Waste removal",
                        "DNA storage"
                    ],
                    correctAnswer: 1,
                    explanation: "Mitochondria are known as the powerhouse of the cell as they produce energy through cellular respiration."
                },
                {
                    question: "What is the cell membrane composed of?",
                    options: [
                        "Proteins only",
                        "Lipids only",
                        "Phospholipid bilayer and proteins",
                        "Carbohydrates only"
                    ],
                    correctAnswer: 2,
                    explanation: "The cell membrane is composed of a phospholipid bilayer with embedded proteins, known as the fluid mosaic model."
                },
                {
                    question: "What is the function of the Golgi apparatus?",
                    options: [
                        "Energy production",
                        "Protein modification and packaging",
                        "DNA replication",
                        "Waste disposal"
                    ],
                    correctAnswer: 1,
                    explanation: "The Golgi apparatus modifies, packages, and distributes proteins and lipids to their final destinations."
                }
            ],
            
            // Economics Questions
            microeconomics: [
                {
                    question: "What is the law of demand?",
                    options: [
                        "Price and quantity demanded are directly related",
                        "Price and quantity demanded are inversely related",
                        "Price and supply are directly related",
                        "Price has no effect on demand"
                    ],
                    correctAnswer: 1,
                    explanation: "The law of demand states that, all else being equal, as the price of a good increases, the quantity demanded decreases."
                },
                {
                    question: "What is opportunity cost?",
                    options: [
                        "The monetary cost of a product",
                        "The cost of production",
                        "The value of the next best alternative foregone",
                        "The market price of a good"
                    ],
                    correctAnswer: 2,
                    explanation: "Opportunity cost is the value of the next best alternative that must be given up when making a choice."
                },
                {
                    question: "What is perfect competition?",
                    options: [
                        "A market with one seller",
                        "A market with many buyers and sellers, homogeneous products, and perfect information",
                        "A market with few sellers",
                        "A market with differentiated products"
                    ],
                    correctAnswer: 1,
                    explanation: "Perfect competition is characterized by many buyers and sellers, homogeneous products, perfect information, and free entry/exit."
                }
            ],
            
            // History Questions
            ancient: [
                {
                    question: "In ancient Mesopotamia, what was the significance of the Code of Hammurabi?",
                    options: [
                        "A collection of religious hymns",
                        "The first written legal code with standardized laws and punishments",
                        "A guide to agricultural practices",
                        "A mathematical treatise"
                    ],
                    correctAnswer: 1,
                    explanation: "The Code of Hammurabi (c. 1750 BCE) was one of the earliest and most complete written legal codes, establishing standardized laws and punishments for various crimes and civil matters."
                }
            ],
            medieval: [
                {
                    question: "How did the feudal system impact medieval European society?",
                    options: [
                        "It promoted social mobility",
                        "It created a rigid social hierarchy based on land ownership",
                        "It eliminated social classes",
                        "It was only used in warfare"
                    ],
                    correctAnswer: 1,
                    explanation: "The feudal system created a strict social hierarchy where land ownership and military service determined social status and obligations between lords and vassals."
                }
            ],
            modern: [
                {
                    question: "What significant impact did the Industrial Revolution have on urban development?",
                    options: [
                        "It decreased urban population",
                        "It led to rapid urbanization and the growth of cities",
                        "It had no effect on cities",
                        "It eliminated cities entirely"
                    ],
                    correctAnswer: 1,
                    explanation: "The Industrial Revolution caused massive urbanization as people moved to cities for factory work, leading to the growth of industrial cities and new urban challenges."
                }
            ],
            
            // Geography Questions
            physical: [
                {
                    question: "How do tectonic plates affect the formation of mountain ranges?",
                    options: [
                        "They have no effect",
                        "They cause erosion only",
                        "They create mountains through collision and uplift",
                        "They only affect oceans"
                    ],
                    correctAnswer: 2,
                    explanation: "When tectonic plates collide, the compression and uplift of rock layers creates mountain ranges through a process called orogeny."
                }
            ],
            climate: [
                {
                    question: "What causes the monsoon climate pattern in South Asia?",
                    options: [
                        "Urban development",
                        "Seasonal wind direction changes and temperature differences",
                        "Ocean currents only",
                        "Forest coverage"
                    ],
                    correctAnswer: 1,
                    explanation: "Monsoons are caused by seasonal changes in wind direction and temperature differences between land and sea, creating distinct wet and dry seasons."
                }
            ],
            
            // Literature Questions
            poetry: [
                {
                    question: "Analyze this excerpt from Robert Frost's 'The Road Not Taken': 'Two roads diverged in a wood, and I— / I took the one less traveled by'. What literary device is primarily used?",
                    options: [
                        "Metaphor for life choices",
                        "Simple description of a walk",
                        "Personification of nature",
                        "Onomatopoeia"
                    ],
                    correctAnswer: 0,
                    explanation: "The poem uses an extended metaphor where the diverging roads represent life choices and the consequences of decision-making."
                }
            ],
            prose: [
                {
                    question: "In George Orwell's '1984', how does the concept of 'doublethink' reflect the novel's themes?",
                    options: [
                        "It's just a plot device",
                        "It shows the power of government control over thought and reality",
                        "It's about education",
                        "It represents love"
                    ],
                    correctAnswer: 1,
                    explanation: "Doublethink represents how totalitarian control extends to people's ability to think independently, forcing them to accept contradictory beliefs as true."
                }
            ],
            drama: [
                {
                    question: "How does the use of dramatic irony in Shakespeare's 'Romeo and Juliet' affect the audience's experience?",
                    options: [
                        "It has no effect",
                        "It creates suspense and emotional investment",
                        "It confuses the audience",
                        "It only affects the actors"
                    ],
                    correctAnswer: 1,
                    explanation: "Dramatic irony, where the audience knows more than the characters, creates tension and emotional investment as viewers watch events unfold knowing the tragic outcome."
                }
            ],
            
            // Psychology Questions
            cognitive: [
                {
                    question: "A student remembers the first and last items from their study list better than the middle items. Which memory phenomenon explains this?",
                    options: [
                        "Recency and primacy effects",
                        "Encoding specificity",
                        "State-dependent memory",
                        "Flashbulb memory"
                    ],
                    correctAnswer: 0,
                    explanation: "The serial position effect shows better recall for items at the beginning (primacy) and end (recency) of a list, demonstrating how memory storage varies based on item position."
                }
            ],
            developmental: [
                {
                    question: "How does Piaget's concept of object permanence develop in infants?",
                    options: [
                        "It's present at birth",
                        "It develops gradually through sensorimotor experiences",
                        "It's learned through language",
                        "It never develops"
                    ],
                    correctAnswer: 1,
                    explanation: "Object permanence develops gradually during the sensorimotor stage (0-2 years) as infants learn that objects continue to exist even when out of sight."
                }
            ],
            social: [
                {
                    question: "In the Stanford Prison Experiment, what psychological concept was demonstrated?",
                    options: [
                        "Classical conditioning",
                        "The power of social roles and situational influences on behavior",
                        "Memory formation",
                        "Language development"
                    ],
                    correctAnswer: 1,
                    explanation: "The experiment showed how people conform to social roles and how situational factors can lead to dramatic changes in behavior and moral judgment."
                }
            ],
            // Computer Science Questions
            "data-structures": [
                {
                    question: "A social media application needs to implement a 'back' button for photo browsing. Which data structure is most appropriate?",
                    options: [
                        "Queue",
                        "Stack",
                        "Binary Tree",
                        "Hash Table"
                    ],
                    correctAnswer: 1,
                    explanation: "A stack is ideal for implementing 'back' functionality because it follows Last-In-First-Out (LIFO) principle, naturally tracking the sequence of viewed items in reverse order."
                }
            ],
            databases: [
                {
                    question: "In a university database, why would you use a foreign key to link the 'Students' and 'Courses' tables?",
                    options: [
                        "To save storage space",
                        "To maintain referential integrity between related tables",
                        "To speed up queries",
                        "To encrypt data"
                    ],
                    correctAnswer: 1,
                    explanation: "Foreign keys maintain referential integrity by ensuring that relationships between tables remain valid and consistent, preventing orphaned records."
                }
            ],
            networking: [
                {
                    question: "Why does video streaming use UDP instead of TCP in many cases?",
                    options: [
                        "UDP is more secure",
                        "UDP prioritizes speed over reliability, acceptable for streaming",
                        "UDP is newer than TCP",
                        "UDP uses less bandwidth"
                    ],
                    correctAnswer: 1,
                    explanation: "UDP is preferred for streaming because it doesn't wait for lost packets to be resent, prioritizing speed and continuous playback over perfect data transmission."
                }
            ],
            
            // Philosophy Questions
            metaphysics: [
                {
                    question: "How does Plato's Theory of Forms address the problem of universals?",
                    options: [
                        "It denies universals exist",
                        "It suggests universal forms exist in a perfect realm beyond physical reality",
                        "It claims universals are just words",
                        "It ignores the problem"
                    ],
                    correctAnswer: 1,
                    explanation: "Plato's Theory of Forms proposes that perfect, unchanging forms exist in a realm beyond physical reality, explaining how we can recognize universal concepts despite imperfect physical examples."
                }
            ],
            ethics: [
                {
                    question: "A self-driving car must choose between hitting five pedestrians or swerving to hit one person. What ethical framework would prioritize saving the greater number?",
                    options: [
                        "Virtue ethics",
                        "Utilitarianism",
                        "Deontological ethics",
                        "Moral relativism"
                    ],
                    correctAnswer: 1,
                    explanation: "Utilitarianism, focused on maximizing good for the greatest number, would justify saving five lives at the cost of one, though this raises complex ethical questions about programmed decision-making."
                }
            ],
            logic: [
                {
                    question: "If all A are B, and all B are C, what can we validly conclude?",
                    options: [
                        "Nothing can be concluded",
                        "All A are C",
                        "Some A are C",
                        "No A are C"
                    ],
                    correctAnswer: 1,
                    explanation: "This is a valid syllogism using transitive property: if all A are B, and all B are C, then necessarily all A are C. This demonstrates the power of deductive reasoning."
                }
            ]
        };
        
        // Return the questions for the selected topic
        return questionsData[topic] || [
            {
                question: "Sample question for " + topic,
                options: ["Option 1", "Option 2", "Option 3", "Option 4"],
                correctAnswer: 0,
                explanation: "This is a sample question for topics that don't have specific questions yet."
            }
        ];
    }
    
    // Function to display questions in the practice content area
    function displayQuestions(questions, container) {
        // Clear current content
        container.innerHTML = '';
        
        if (questions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>No questions available for this topic yet.</p>
                </div>
            `;
            return;
        }
        
        // Create container for each question
        questions.forEach((question, index) => {
            const questionElement = document.createElement('div');
            questionElement.className = 'question-container';
            questionElement.id = `question-${index}`;
            
            let optionsHTML = '';
            question.options.forEach((option, optionIndex) => {
                optionsHTML += `
                    <div class="answer-option" data-question="${index}" data-option="${optionIndex}">
                        <span class="option-marker">${String.fromCharCode(65 + optionIndex)}.</span>
                        <span class="option-text">${option}</span>
                    </div>
                `;
            });
            
            questionElement.innerHTML = `
                <h4>Question ${index + 1}</h4>
                <div class="question-text">${question.question}</div>
                <div class="answer-options">
                    ${optionsHTML}
                </div>
                <div class="answer-feedback" id="feedback-${index}" style="display: none;"></div>
            `;
            
            container.appendChild(questionElement);
        });
        
        // Add event listeners to answer options
        const answerOptions = container.querySelectorAll('.answer-option');
        answerOptions.forEach(option => {
            option.addEventListener('click', function() {
                const questionIndex = parseInt(this.getAttribute('data-question'));
                const optionIndex = parseInt(this.getAttribute('data-option'));
                const question = questions[questionIndex];
                const feedbackElement = document.getElementById(`feedback-${questionIndex}`);
                
                // Remove any previous selection and feedback
                const questionContainer = document.getElementById(`question-${questionIndex}`);
                const options = questionContainer.querySelectorAll('.answer-option');
                options.forEach(opt => {
                    opt.classList.remove('correct');
                    opt.classList.remove('incorrect');
                });
                
                // Check if answer is correct
                if (optionIndex === question.correctAnswer) {
                    // Correct answer
                    this.classList.add('correct');
                    if (feedbackElement) {
                        feedbackElement.innerHTML = `
                            <i class="fas fa-check-circle"></i>
                            <p>Correct! ${question.explanation}</p>
                        `;
                        feedbackElement.className = 'answer-feedback correct';
                        feedbackElement.style.display = 'block';
                    }
                } else {
                    // Incorrect answer
                    this.classList.add('incorrect');
                    if (feedbackElement) {
                        feedbackElement.innerHTML = `
                            <i class="fas fa-times-circle"></i>
                            <p>Incorrect. The correct answer is ${String.fromCharCode(65 + question.correctAnswer)}: ${question.options[question.correctAnswer]}. ${question.explanation}</p>
                        `;
                        feedbackElement.className = 'answer-feedback incorrect';
                        feedbackElement.style.display = 'block';
                    }
                }
            });
        });
    }
}

// Function to initialize the Topics section
function initializeTopicsSection() {
    console.log('Initializing topics section...');
    
    // Get all explore buttons in the topics section
    const exploreButtons = document.querySelectorAll('#topics-section .explore-btn');
    console.log('Found explore buttons:', exploreButtons.length);
    
    if (exploreButtons && exploreButtons.length > 0) {
        exploreButtons.forEach(button => {
            // Remove any existing click handlers to prevent duplicates
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            newButton.addEventListener('click', function() {
                console.log('Explore button clicked');
                // Get the subject from the parent card
                const subjectCard = this.closest('.subject-card');
                if (!subjectCard) {
                    console.error('Could not find subject card parent element');
                    return;
                }
                
                const subjectHeader = subjectCard.querySelector('h4');
                if (!subjectHeader) {
                    console.error('Could not find subject header');
                    return;
                }
                
                const subjectName = subjectHeader.textContent;
                console.log('Subject:', subjectName);
                
                const topicList = subjectCard.querySelector('.subject-topics');
                if (!topicList) {
                    console.error('Could not find topic list');
                    return;
                }
                
                // Create or update description element
                let descriptionElement = subjectCard.querySelector('.subject-description');
                
                if (!descriptionElement) {
                    // Create new description element if it doesn't exist
                    descriptionElement = document.createElement('div');
                    descriptionElement.className = 'subject-description';
                    
                    // Insert before the explore button
                    subjectCard.insertBefore(descriptionElement, this);
                }
                
                // Get descriptions based on subject
                const subjectDescription = getSubjectDescription(subjectName);
                const topicDescriptions = getTopicDescriptions(subjectName);
                
                // Create HTML content with subject and topic descriptions
                let content = `<div class="subject-overview">${subjectDescription}</div>`;
                content += '<div class="topic-descriptions">';
                
                // Add each topic with its description
                const topics = topicList.querySelectorAll('li');
                topics.forEach((topic, index) => {
                    // Make sure we don't go beyond available descriptions
                    const description = topicDescriptions[index] || 'No description available.';
                    
                    content += `<div class="topic-description">
                        <strong>${topic.textContent}:</strong> ${description}
                    </div>`;
                });
                
                content += '</div>';
                
                // Update description content
                descriptionElement.innerHTML = content;
                
                // Toggle visibility for better UX
                if (descriptionElement.style.display === 'block') {
                    // Hide the description if already visible
                    descriptionElement.style.display = 'none';
                    this.textContent = 'Explore';
                } else {
                    // Show the description
                    descriptionElement.style.display = 'block';
                    this.textContent = 'Hide';
                }
            });
        });
    } else {
        console.error('No explore buttons found in topics section');
    }
    
    // Function to get description based on subject
    function getSubjectDescription(subject) {
        const descriptions = {
            'Programming': 'Learn coding skills to build software, websites, and applications across various platforms.',
            'Mathematics': 'Explore the fundamental concepts of numbers, structures, shapes, and patterns that form the basis of science and engineering.',
            'Science': 'Discover the principles and laws that govern the natural world through observation, experimentation, and analysis.',
            'Languages': 'Master communication skills in various world languages to connect across cultures and borders.',
            'Arts': 'Express creativity and explore human expression through various mediums including visual arts, music, drama, and design.',
            'Literature': 'Dive into the world of written works, exploring different genres, styles, and cultural perspectives through reading and analysis.',
            'History': 'Study past events, civilizations, and developments that shaped our modern world and understand the context of human progress.',
            'Psychology': 'Explore the human mind and behavior through scientific study of mental processes, emotions, and social interactions.',
            'Economics': 'Understand how societies allocate scarce resources and make decisions about production, distribution, and consumption.',
            'Law': 'Study the system of rules and regulations that govern society and learn about legal principles, rights, and responsibilities.',
            'Medicine': 'Explore the science and practice of diagnosing, treating, and preventing disease while maintaining health.',
            'Technology': 'Learn about the application of scientific knowledge for practical purposes and the development of innovative solutions.'
        };
        
        return descriptions[subject] || `Explore comprehensive resources and lessons about ${subject}.`;
    }

    // Function to get descriptions for topics within a subject
    function getTopicDescriptions(subject) {
        const topicDescriptions = {
            'Programming': [
                'Build interactive websites and web applications using modern frameworks and technologies.',
                'Create mobile applications for iOS and Android platforms using native or cross-platform development tools.',
                'Learn about efficient ways to organize and store data for optimal performance and scalability.',
                'Study problem-solving techniques and computational thinking through algorithmic approaches.',
                'Master the principles of object-oriented programming for creating modular and maintainable code.'
            ],
            'Mathematics': [
                'Study algebraic structures, equations, and their applications in solving real-world problems.',
                'Explore the mathematics of change and motion through differentiation and integration.',
                'Learn about shapes, sizes, and spatial relationships in two and three dimensions.',
                'Understand data analysis, probability, and statistical inference for making informed decisions.',
                'Investigate properties of numbers and their relationships in pure mathematics.'
            ],
            'Science': [
                'Study matter, energy, and their interactions through fundamental physical laws and principles.',
                'Explore the composition, properties, and reactions of substances at atomic and molecular levels.',
                'Understand living organisms, their structure, function, growth, and evolution.',
                'Learn about celestial objects, space, and the physical universe as a whole.',
                'Study the environment, ecosystems, and sustainable practices for preserving natural resources.'
            ],
            'Languages': [
                'Master the global language of business, science, and international communication.',
                'Learn one of the most widely spoken languages with rich cultural heritage.',
                'Study the language of art, culture, and international diplomacy.',
                'Master the language of philosophy, literature, and European business.',
                'Learn the language of technology, anime, and Japanese culture.'
            ],
            'Arts': [
                'Explore drawing, painting, sculpture, and other visual art forms and techniques.',
                'Study musical notation, harmony, rhythm, and composition principles.',
                'Learn about theatrical performance, stagecraft, and dramatic literature.',
                'Master principles of visual communication, user experience, and creative problem-solving.',
                'Study the evolution of art through different periods, styles, and cultural contexts.'
            ],
            'Literature': [
                'Explore the art of verse, rhythm, and poetic expression across cultures and time periods.',
                'Study narrative fiction, character development, and storytelling techniques.',
                'Learn about theatrical works, performance, and dramatic structure.',
                'Understand critical approaches to analyzing and interpreting literary texts.',
                'Develop skills in writing fiction, poetry, and creative non-fiction.'
            ],
            'History': [
                'Study early civilizations, their development, and contributions to human progress.',
                'Explore the Middle Ages, feudalism, and the transition to modern society.',
                'Learn about recent historical events, globalization, and contemporary issues.',
                'Understand the causes, events, and consequences of major global conflicts.',
                'Study the development of societies, traditions, and cultural heritage.'
            ],
            'Psychology': [
                'Study mental processes, perception, memory, and problem-solving.',
                'Explore human development across the lifespan from infancy to old age.',
                'Understand how individuals think, feel, and behave in social contexts.',
                'Learn about mental health, psychological disorders, and therapeutic approaches.',
                'Study observable behavior, learning processes, and behavior modification.'
            ],
            'Economics': [
                'Study individual and business decision-making in markets and resource allocation.',
                'Explore national and global economic systems, policies, and indicators.',
                'Understand international trade, exchange rates, and global economic relations.',
                'Learn about financial markets, investments, and economic decision-making.',
                'Study economic development, poverty reduction, and sustainable growth.'
            ],
            'Law': [
                'Study constitutional principles, rights, and government structure.',
                'Learn about criminal offenses, justice system, and legal procedures.',
                'Understand private law, contracts, property, and personal rights.',
                'Study international legal frameworks, treaties, and global governance.',
                'Learn about commercial law, corporate regulations, and business transactions.'
            ],
            'Medicine': [
                'Study the structure of the human body and its systems.',
                'Learn about body functions, homeostasis, and biological processes.',
                'Understand disease processes, diagnosis, and medical conditions.',
                'Study drugs, their effects, and therapeutic applications.',
                'Explore ethical principles and dilemmas in medical practice.'
            ],
            'Technology': [
                'Study intelligent systems, machine learning, and cognitive computing.',
                'Learn about algorithms that improve through experience and data analysis.',
                'Explore data analysis, visualization, and statistical modeling techniques.',
                'Study information security, network protection, and digital privacy.',
                'Learn about cloud platforms, services, and distributed computing.'
            ]
        };
        
        return topicDescriptions[subject] || [];
    }
}

// Function to handle tab switching and initialize appropriate tabs
function setupTabs() {
    const navTabs = document.querySelectorAll('.nav-tabs li');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Add click event to tabs
    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all tabs
            navTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to current tab
            this.classList.add('active');
            
            // Hide all tab contents
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // Show the current tab content
            const currentTabContent = document.getElementById(`${tabId}-content`);
            if (currentTabContent) {
                currentTabContent.classList.add('active');
                
                // Initialize specific tab content based on the tab
                if (tabId === 'learning') {
                    initializeLearningTab();
                } else if (tabId === 'fun-talks') {
                    // Initialize fun talks when the tab is clicked
                    initializeFunTalks();
                    console.log('Fun Talks tab initialized');
                } else if (tabId === 'games') {
                    // Initialize games when the tab is clicked
                    initializeGames();
                    console.log('Games tab initialized');
                }
            }
        });
    });
}

// Add the missing showNotification function
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

// Function to initialize Fun Talks section
function initializeFunTalks() {
    console.log('Initializing fun talks section...');
    
    // Get all topic cards
    const topicCards = document.querySelectorAll('.topic-card');
    const funChatHistory = document.getElementById('fun-chat-history');
    const funChatInput = document.getElementById('fun-chat-input');
    const sendFunMessage = document.getElementById('send-fun-message');
    
    console.log(`Found ${topicCards.length} topic cards`);
    
    // Add event listeners to all topic cards
    if (topicCards && topicCards.length > 0) {
        topicCards.forEach((card, index) => {
            const topicName = card.querySelector('span').textContent;
            console.log(`Setting up listener for topic card ${index + 1}: ${topicName}`);
            
            // Remove any existing click listeners to prevent duplicates
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            
            // Add click event listener to the new card
            newCard.addEventListener('click', topicCardClickHandler);
        });
    } else {
        console.error('No topic cards found or topic cards not loaded yet');
    }
    
    // Topic card click handler function
    function topicCardClickHandler() {
        // Get the topic text
        const topicName = this.querySelector('span').textContent;
        console.log(`Topic card clicked: ${topicName}`);
        
        // Add user message showing topic selection
        addFunChatUserMessage(`Let's talk about ${topicName}!`);
        
        // Generate AI response based on the selected topic
        const aiResponse = getTopicResponse(topicName);
        console.log(`Generated response for ${topicName}: ${aiResponse.substring(0, 30)}...`);
        
        // Show typing indicator
        const typingIndicator = addFunChatTypingIndicator();
        
        // Simulate AI thinking time
        setTimeout(() => {
            // Remove typing indicator
            if (typingIndicator && funChatHistory.contains(typingIndicator)) {
                funChatHistory.removeChild(typingIndicator);
            }
            
            // Add AI response
            addFunChatAIMessage(aiResponse);
            console.log('AI response added to chat');
            
            // Scroll to the bottom of the chat
            funChatHistory.scrollTop = funChatHistory.scrollHeight;
        }, 1500);
    }
    
    // Handle user message submission in fun chat
    if (funChatInput && sendFunMessage) {
        console.log('Setting up fun chat input handlers');
        
        // Send message when Enter key is pressed
        funChatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleFunChatSubmission();
            }
        });
        
        // Send message when Send button is clicked
        sendFunMessage.addEventListener('click', handleFunChatSubmission);
    } else {
        console.error('Fun chat input elements not found');
    }
    
    // Function to handle fun chat message submission
    function handleFunChatSubmission() {
        const message = funChatInput.value.trim();
        if (message) {
            console.log(`User submitted message: ${message}`);
            
            // Add user message
            addFunChatUserMessage(message);
            
            // Clear input
            funChatInput.value = '';
            
            // Show typing indicator
            const typingIndicator = addFunChatTypingIndicator();
            
            // Generate AI response
            setTimeout(() => {
                // Remove typing indicator
                if (typingIndicator && funChatHistory.contains(typingIndicator)) {
                    funChatHistory.removeChild(typingIndicator);
                }
                
                // Add AI response
                const aiResponse = getGenericResponse(message);
                console.log(`Generated generic response: ${aiResponse.substring(0, 30)}...`);
                addFunChatAIMessage(aiResponse);
                
                // Scroll to the bottom of the chat
                funChatHistory.scrollTop = funChatHistory.scrollHeight;
            }, 1500);
        }
    }
    
    // Function to add user message to fun chat
    function addFunChatUserMessage(message) {
        if (!funChatHistory) {
            console.error('Fun chat history element not found');
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
        
        funChatHistory.appendChild(messageElement);
        funChatHistory.scrollTop = funChatHistory.scrollHeight;
    }
    
    // Function to add AI message to fun chat
    function addFunChatAIMessage(message) {
        if (!funChatHistory) {
            console.error('Fun chat history element not found');
            return;
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message ai-message';
        messageElement.innerHTML = `
            <div class="avatar">
                <i class="fas fa-robot"></i>
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
        
        funChatHistory.appendChild(messageElement);
        funChatHistory.scrollTop = funChatHistory.scrollHeight;
        
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
            console.log('User liked fun chat response');
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
            console.log('User disliked fun chat response');
        });
    }
    
    // Function to add typing indicator
    function addFunChatTypingIndicator() {
        if (!funChatHistory) {
            console.error('Fun chat history element not found');
            return null;
        }
        
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message ai-message typing-indicator';
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
        
        funChatHistory.appendChild(typingIndicator);
        funChatHistory.scrollTop = funChatHistory.scrollHeight;
        
        return typingIndicator;
    }
    
    // Function to generate topic-specific responses
    function getTopicResponse(topic) {
        const responses = {
            'Music': [
                "Music is such a fascinating topic! What genres do you enjoy listening to the most?",
                "I love talking about music! From classical to hip-hop, there's so much to explore. What's your favorite artist right now?",
                "Music has the incredible power to change our mood instantly. Do you have any songs that always make you feel better?",
                "There's something magical about how music connects people across different cultures and languages. What kind of music makes you feel most connected to others?"
            ],
            'Movies': [
                "Movies are a wonderful escape! Are you more into action-packed blockbusters or thought-provoking indie films?",
                "Film is such a rich medium for storytelling. What was the last movie that really moved you or made you think?",
                "I'm always looking for movie recommendations! What's a hidden gem you think more people should watch?",
                "Movies have a way of shaping our culture in profound ways. Is there a film that changed your perspective on something important?"
            ],
            'Gaming': [
                "Gaming has evolved so much over the years! Are you into console games, PC gaming, or mobile games?",
                "Games can be such immersive experiences these days. What game world would you most want to live in if you could?",
                "I find the storytelling in modern games to be incredible. Have you played any games with stories that really stayed with you?",
                "Whether for relaxation or competition, games offer so many different experiences. What do you enjoy most about gaming?"
            ],
            'Hobbies': [
                "Hobbies are so important for maintaining balance in life! What activities do you enjoy in your free time?",
                "There's something special about having a hobby you're passionate about. What hobby have you been dedicating time to lately?",
                "I'm curious - what hobby would you love to pick up if you had unlimited time and resources?",
                "Some hobbies can be relaxing while others energize us. Do you have different hobbies for different moods?"
            ],
            'Travel': [
                "Traveling opens our eyes to new cultures and perspectives! What's been your most memorable travel destination?",
                "If you could travel anywhere in the world right now, where would you go and why?",
                "Travel experiences shape us in unexpected ways. Has a trip ever changed how you see the world?",
                "There are so many different ways to travel - as a tourist, a backpacker, a luxury traveler. What's your preferred travel style?"
            ],
            'Trivia': [
                "I love random facts and trivia! Did you know that honey never spoils? Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly good to eat!",
                "Here's something fascinating: octopuses have three hearts, nine brains, and blue blood! Would you like to hear more animal trivia?",
                "Random trivia time: the shortest war in history was between Britain and Zanzibar in 1896. It lasted only 38 minutes! Do you have any favorite historical facts?",
                "Fun fact: a group of flamingos is called a 'flamboyance'. What's your favorite collective noun for animals?"
            ]
        };
        
        // Get responses for the specific topic, or use default if topic not found
        const topicResponses = responses[topic] || ["That's an interesting topic! What aspects of it would you like to discuss?"];
        
        // Return a random response from the array
        return topicResponses[Math.floor(Math.random() * topicResponses.length)];
    }
    
    // Function to generate generic responses to user messages
    function getGenericResponse(message) {
        const responses = [
            "That's really interesting! Tell me more about that.",
            "I'm curious to hear your thoughts on this. What makes you feel that way?",
            "Thanks for sharing that with me! What else would you like to talk about?",
            "That's a fascinating perspective! Have you always felt this way?",
            "I appreciate you telling me about this. How does this topic make you feel?",
            "That's good to know! Is there anything specific about this you'd like to explore further?",
            "I'm glad you brought this up! What other interests do you have related to this?",
            "That's a great point! How did you first become interested in this topic?"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
}

// Function to initialize the Games section
function initializeGames() {
    console.log('Initializing games section...');
    
    const playButtons = document.querySelectorAll('.play-btn');
    const gamesContainer = document.querySelector('.games-container');
    const gamePlayArea = document.getElementById('game-play-area');
    const gameContainer = document.getElementById('game-container');
    const backToGamesButton = document.getElementById('back-to-games');
    const currentGameTitle = document.getElementById('current-game-title');
    
    // Add click events to play buttons
    if (playButtons && gamesContainer && gamePlayArea && gameContainer) {
        playButtons.forEach(button => {
            button.addEventListener('click', function() {
                const gameType = this.getAttribute('data-game');
                console.log(`Game selected: ${gameType}`);
                
                // Hide games list and show game play area
                gamesContainer.style.display = 'none';
                gamePlayArea.style.display = 'block';
                
                // Load and start the selected game
                switch (gameType) {
                    case 'math-challenge':
                        currentGameTitle.textContent = 'Math Challenge';
                        startMathGame(gameContainer);
                        break;
                    case 'word-wizard':
                        currentGameTitle.textContent = 'Word Wizard';
                        startWordWizardGame(gameContainer);
                        break;
                    case 'science-explorer':
                        currentGameTitle.textContent = 'Science Explorer';
                        startScienceGame(gameContainer);
                        break;
                    case 'knowledge-quiz':
                        currentGameTitle.textContent = 'Knowledge Quiz';
                        startKnowledgeQuizGame(gameContainer);
                        break;
                    case 'code-master':
                        currentGameTitle.textContent = 'Code Master';
                        startCodeMasterGame(gameContainer);
                        break;
                    case 'memory-master':
                        currentGameTitle.textContent = 'Memory Master';
                        startMemoryMasterGame(gameContainer);
                        break;
                    default:
                        showGameComingSoon(gameContainer, 'This game');
                }
            });
        });
    }
    
    // Add click event for back button
    if (backToGamesButton) {
        backToGamesButton.addEventListener('click', function() {
            // Hide game play area and show games list
            gamePlayArea.style.display = 'none';
            gamesContainer.style.display = 'grid';
            
            // Clear game container
            if (gameContainer) {
                gameContainer.innerHTML = '';
            }
        });
    }
    
    // Function to show a coming soon message for games not yet implemented
    function showGameComingSoon(container, gameName) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <h2>${gameName} - Coming Soon!</h2>
                <p>We're working hard to bring you this exciting game. Please check back later!</p>
                <i class="fas fa-gamepad" style="font-size: 5rem; margin: 30px 0; color: var(--primary-color);"></i>
            </div>
        `;
    }
    
    // Function to start Math Challenge game
    function startMathGame(container) {
        // Game variables
        let score = 0;
        let level = 1;
        let gameMode = 'standard'; // 'standard' or 'puzzle'
        let timeLeft = 60;
        let timer;
        
        // Create the game UI with mode selection
        container.innerHTML = `
            <div class="math-game-container">
                <div class="math-game-header">
                    <h2>Math Challenge</h2>
                    <div class="mode-selector">
                        <button id="standard-mode" class="mode-btn active">Quiz Mode</button>
                        <button id="puzzle-mode" class="mode-btn">Visual Puzzle</button>
                    </div>
                </div>
                <div id="math-game-content">
                <div class="math-timer">Time remaining: <span id="timer">60</span> seconds</div>
                    <div class="math-problem" id="problem">Select a game mode to start!</div>
                <div class="math-options" id="options"></div>
                <div class="math-feedback" id="feedback"></div>
                <div class="math-score">Score: <span id="score">0</span></div>
                    <div class="math-level">Level: <span id="level">1</span></div>
                </div>
            </div>
        `;
        
        // Get UI elements
        const problemElement = document.getElementById('problem');
        const optionsElement = document.getElementById('options');
        const feedbackElement = document.getElementById('feedback');
        const scoreElement = document.getElementById('score');
        const timerElement = document.getElementById('timer');
        const levelElement = document.getElementById('level');
        const standardModeBtn = document.getElementById('standard-mode');
        const puzzleModeBtn = document.getElementById('puzzle-mode');
        const gameContent = document.getElementById('math-game-content');
        
        // Add event listeners to mode buttons
        standardModeBtn.addEventListener('click', function() {
            standardModeBtn.classList.add('active');
            puzzleModeBtn.classList.remove('active');
            gameMode = 'standard';
            resetGame();
            startStandardMode();
        });
        
        puzzleModeBtn.addEventListener('click', function() {
            puzzleModeBtn.classList.add('active');
            standardModeBtn.classList.remove('active');
            gameMode = 'puzzle';
            resetGame();
            startPuzzleMode();
        });
        
        // Function to reset game state
        function resetGame() {
            clearInterval(timer);
            score = 0;
            level = 1;
            timeLeft = 60;
            scoreElement.textContent = score;
            levelElement.textContent = level;
            timerElement.textContent = timeLeft;
            feedbackElement.innerHTML = '';
        }
        
        // Standard Quiz Mode
        function startStandardMode() {
            // Start the timer
            timer = setInterval(updateTimer, 1000);
            
            // Create first problem
            const currentProblem = generateProblem();
            displayProblem(currentProblem);
        }
        
        // Function to generate a random math problem
        function generateProblem() {
            // Clear feedback
            feedbackElement.innerHTML = '';
            
            // Generate operands and operators based on level
            const operators = level === 1 ? ['+', '-'] : ['+', '-', '*', '/'];
            const operator = operators[Math.floor(Math.random() * operators.length)];
            
            let num1, num2, answer, problemText;
            
            // Generate appropriate numbers based on operator and level
            switch (operator) {
                case '+':
                    num1 = Math.floor(Math.random() * (level * 20)) + 1;
                    num2 = Math.floor(Math.random() * (level * 20)) + 1;
                    answer = num1 + num2;
                    problemText = `${num1} + ${num2} = ?`;
                    break;
                case '-':
                    // Ensure num1 > num2 
                    num1 = Math.floor(Math.random() * (level * 20)) + (level * 10);
                    num2 = Math.floor(Math.random() * (level * 10)) + 1;
                    answer = num1 - num2;
                    problemText = `${num1} - ${num2} = ?`;
                    break;
                case '*':
                    num1 = Math.floor(Math.random() * (level * 5)) + 1;
                    num2 = Math.floor(Math.random() * (level * 5)) + 1;
                    answer = num1 * num2;
                    problemText = `${num1} × ${num2} = ?`;
                    break;
                case '/':
                    // Create a division problem with a whole number answer
                    num2 = Math.floor(Math.random() * 10) + 1;
                    answer = Math.floor(Math.random() * 10) + 1;
                    num1 = num2 * answer;
                    problemText = `${num1} ÷ ${num2} = ?`;
                    break;
            }
            
            // Generate options
            const wrongAnswers = [];
            while (wrongAnswers.length < 3) {
                // Generate a wrong answer within ±10 of the correct answer
                let wrongAnswer = answer + (Math.floor(Math.random() * 20) - 10);
                
                // Ensure it's not the correct answer and not already in the array
                if (wrongAnswer !== answer && !wrongAnswers.includes(wrongAnswer) && wrongAnswer > 0) {
                    wrongAnswers.push(wrongAnswer);
                }
            }
            
            // Combine correct and wrong answers, and shuffle
            const options = [answer, ...wrongAnswers];
            for (let i = options.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [options[i], options[j]] = [options[j], options[i]];
            }
            
            return {
                problemText,
                options,
                correctAnswer: options.indexOf(answer)
            };
        }
        
        // Function to display a problem
        function displayProblem(problem) {
            problemElement.textContent = problem.problemText;
            
            // Clear options
            optionsElement.innerHTML = '';
            
            // Add options
            problem.options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'math-option';
                optionElement.textContent = option;
                optionElement.setAttribute('data-index', index);
                
                // Add click event
                optionElement.addEventListener('click', function() {
                    const selectedIndex = parseInt(this.getAttribute('data-index'));
                    checkAnswer(selectedIndex, problem.correctAnswer);
                });
                
                optionsElement.appendChild(optionElement);
            });
        }
        
        // Function to check answer
        function checkAnswer(selectedIndex, correctIndex) {
            const options = document.querySelectorAll('.math-option');
            
            // Disable all options
            options.forEach(option => {
                option.style.pointerEvents = 'none';
            });
            
            // Highlight correct and incorrect options
            if (selectedIndex === correctIndex) {
                // Correct answer
                options[selectedIndex].classList.add('correct');
                feedbackElement.innerHTML = '<p style="color: green;"><i class="fas fa-check-circle"></i> Correct!</p>';
                score += 10 * level;
                scoreElement.textContent = score;
                
                // Level up after every 5 correct answers
                if (score % (50 * level) === 0) {
                    level++;
                    levelElement.textContent = level;
                    feedbackElement.innerHTML = `<p style="color: green;"><i class="fas fa-level-up-alt"></i> Level Up! You're now at level ${level}</p>`;
                    // Add time bonus for leveling up
                    timeLeft += 10;
                    timerElement.textContent = timeLeft;
                }
            } else {
                // Incorrect answer
                options[selectedIndex].classList.add('incorrect');
                options[correctIndex].classList.add('correct');
                feedbackElement.innerHTML = '<p style="color: red;"><i class="fas fa-times-circle"></i> Incorrect!</p>';
            }
            
            // Show next problem after a delay
            setTimeout(() => {
                // Only proceed if there's still time left
                if (timeLeft > 0) {
                    const newProblem = generateProblem();
                    displayProblem(newProblem);
                }
            }, 1500);
        }
        
        // Visual Puzzle Mode
        function startPuzzleMode() {
            // Start the timer
            timer = setInterval(updateTimer, 1000);
            
            // Create number blocks puzzle
            createNumberBlocksPuzzle();
        }
        
        // Function to create a visual number blocks puzzle
        function createNumberBlocksPuzzle() {
            // Clear previous content
            problemElement.innerHTML = '';
            optionsElement.innerHTML = '';
            
            // Create puzzle container
            const puzzleContainer = document.createElement('div');
            puzzleContainer.className = 'number-blocks-puzzle';
            
            // Generate puzzle based on level
            const targetNumber = Math.floor(Math.random() * (level * 20)) + (level * 10);
            const numberOfBlocks = Math.min(6 + level, 12); // Increase blocks with level, max 12
            
            // Create target display
            const targetDisplay = document.createElement('div');
            targetDisplay.className = 'target-number';
            targetDisplay.innerHTML = `<h3>Target: ${targetNumber}</h3>`;
            problemElement.appendChild(targetDisplay);
            
            // Generate blocks with numbers
            const blocks = [];
            let remainingSum = targetNumber;
            
            for (let i = 0; i < numberOfBlocks - 1; i++) {
                let blockValue;
                if (i === numberOfBlocks - 2) {
                    // Last block gets the remaining value to ensure a solution exists
                    blockValue = remainingSum;
                } else {
                    // Random values, but ensure they don't exceed the remaining sum
                    const maxVal = Math.min(remainingSum - (numberOfBlocks - i - 2), level * 15);
                    blockValue = Math.max(1, Math.floor(Math.random() * maxVal));
                    remainingSum -= blockValue;
                }
                blocks.push(blockValue);
            }
            
            // Add some distractor blocks that don't contribute to the solution
            for (let i = blocks.length; i < numberOfBlocks; i++) {
                blocks.push(Math.floor(Math.random() * (level * 10)) + 1);
            }
            
            // Shuffle the blocks
            for (let i = blocks.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
            }
            
            // Create selection area
            const selectionArea = document.createElement('div');
            selectionArea.className = 'selection-area';
            
            // Create selected blocks area
            const selectedArea = document.createElement('div');
            selectedArea.className = 'selected-blocks';
            selectedArea.innerHTML = '<p>Drag blocks here to reach the target sum:</p><div id="drop-zone" class="drop-zone"></div>';
            
            // Add blocks to the puzzle
            blocks.forEach((value, index) => {
                const block = document.createElement('div');
                block.className = 'number-block';
                block.textContent = value;
                block.setAttribute('data-value', value);
                block.setAttribute('draggable', true);
                block.id = `block-${index}`;
                
                // Add drag events
                block.addEventListener('dragstart', function(e) {
                    e.dataTransfer.setData('text/plain', block.id);
                    setTimeout(() => block.classList.add('dragging'), 0);
                });
                
                block.addEventListener('dragend', function() {
                    block.classList.remove('dragging');
                });
                
                selectionArea.appendChild(block);
            });
            
            // Setup drop zone
            const dropZone = document.createElement('div');
            dropZone.className = 'drop-zone';
            dropZone.id = 'drop-zone';
            
            dropZone.addEventListener('dragover', function(e) {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });
            
            dropZone.addEventListener('dragleave', function() {
                dropZone.classList.remove('drag-over');
            });
            
            dropZone.addEventListener('drop', function(e) {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                
                const blockId = e.dataTransfer.getData('text/plain');
                const block = document.getElementById(blockId);
                
                if (block && !dropZone.contains(block)) {
                    dropZone.appendChild(block);
                    checkPuzzleSolution(targetNumber);
                }
            });
            
            // Add verify button
            const verifyButton = document.createElement('button');
            verifyButton.className = 'verify-btn';
            verifyButton.textContent = 'Verify';
            verifyButton.addEventListener('click', function() {
                checkPuzzleSolution(targetNumber);
            });
            
            // Add reset button
            const resetButton = document.createElement('button');
            resetButton.className = 'reset-puzzle-btn';
            resetButton.textContent = 'Reset Puzzle';
            resetButton.addEventListener('click', function() {
                createNumberBlocksPuzzle();
            });
            
            // Append all elements
            selectedArea.querySelector('#drop-zone').replaceWith(dropZone);
            puzzleContainer.appendChild(selectionArea);
            puzzleContainer.appendChild(selectedArea);
            
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'puzzle-buttons';
            buttonContainer.appendChild(verifyButton);
            buttonContainer.appendChild(resetButton);
            puzzleContainer.appendChild(buttonContainer);
            
            optionsElement.appendChild(puzzleContainer);
        }
        
        // Function to check puzzle solution
        function checkPuzzleSolution(targetNumber) {
            const dropZone = document.getElementById('drop-zone');
            const selectedBlocks = dropZone.querySelectorAll('.number-block');
            
            let sum = 0;
            selectedBlocks.forEach(block => {
                sum += parseInt(block.getAttribute('data-value'));
            });
            
            if (sum === targetNumber) {
                feedbackElement.innerHTML = '<p style="color: green;"><i class="fas fa-check-circle"></i> Correct! You\'ve reached the target number!</p>';
                score += 20 * level;
                scoreElement.textContent = score;
                
                // Add time bonus for solving puzzle
                timeLeft += 5;
                timerElement.textContent = timeLeft;
                
                // Level up after every 2 puzzles
                if (score % (40 * level) === 0) {
                    level++;
                    levelElement.textContent = level;
                    feedbackElement.innerHTML += `<p style="color: green;"><i class="fas fa-level-up-alt"></i> Level Up! You're now at level ${level}</p>`;
                    // Additional time bonus for leveling up
                    timeLeft += 10;
                    timerElement.textContent = timeLeft;
                }
                
                // Create new puzzle after delay
                setTimeout(() => {
                    if (timeLeft > 0) {
                        createNumberBlocksPuzzle();
                    }
                }, 2000);
            } else if (selectedBlocks.length > 0) {
                // Only show feedback if at least one block is selected
                feedbackElement.innerHTML = `<p style="color: orange;"><i class="fas fa-exclamation-circle"></i> Sum = ${sum}. Keep trying to reach ${targetNumber}!</p>`;
            }
        }
        
        // Function to update timer
        function updateTimer() {
            timeLeft--;
            timerElement.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                // Game over
                clearInterval(timer);
                endGame();
            }
        }
        
        // Function to end the game
        function endGame() {
            // Display game over message
            container.innerHTML = `
                <div class="math-game-container">
                    <h2>Game Over!</h2>
                    <p>Your final score: ${score}</p>
                    <p>You reached level: ${level}</p>
                    <button id="play-again" class="play-btn" style="margin: 20px auto; display: block;">Play Again</button>
                </div>
            `;
            
            // Add event listener to play again button
            const playAgainButton = document.getElementById('play-again');
            if (playAgainButton) {
                playAgainButton.addEventListener('click', function() {
                    startMathGame(container);
                });
            }
        }
    }

    // Function to start Science Explorer game
    function startScienceGame(container) {
        // Game variables
        let currentQuestion = {};
        let score = 0;
        let questionsAnswered = 0;
        let gameMode = 'quiz'; // 'quiz' or 'simulation'
        const totalQuestions = 10;
        
        // Create the game UI with mode selector
        container.innerHTML = `
            <div class="science-game-container">
                <div class="science-game-header">
                    <h2>Science Explorer</h2>
                    <div class="mode-selector">
                        <button id="quiz-mode" class="mode-btn active">Quiz Mode</button>
                        <button id="sim-mode" class="mode-btn">Simulation Lab</button>
                    </div>
                </div>
                <div id="science-game-content">
                    <!-- Content will be dynamically filled based on mode -->
                </div>
            </div>
        `;
        
        // Get game mode buttons
        const quizModeBtn = document.getElementById('quiz-mode');
        const simModeBtn = document.getElementById('sim-mode');
        const gameContent = document.getElementById('science-game-content');
        
        // Add event listeners for mode buttons
        quizModeBtn.addEventListener('click', function() {
            quizModeBtn.classList.add('active');
            simModeBtn.classList.remove('active');
            gameMode = 'quiz';
            startQuizMode();
        });
        
        simModeBtn.addEventListener('click', function() {
            simModeBtn.classList.add('active');
            quizModeBtn.classList.remove('active');
            gameMode = 'simulation';
            startSimulationMode();
        });
        
        // Function to start Quiz Mode
        function startQuizMode() {
            // Reset game variables
            score = 0;
            questionsAnswered = 0;
            
            // Create the quiz UI
            gameContent.innerHTML = `
                <div class="science-progress">
                    <div class="progress-text">Question <span id="current-question">1</span>/${totalQuestions}</div>
                    <div class="progress-bar">
                        <div class="progress" id="progress-indicator" style="width: 0%"></div>
                    </div>
                </div>
                <div class="science-question-container">
                    <div class="science-image" id="question-image">
                        <i class="fas fa-atom"></i>
                    </div>
                    <div class="science-question" id="question">Loading...</div>
                </div>
                <div class="science-options" id="options"></div>
                <div class="science-feedback" id="science-feedback"></div>
                <div class="science-score">Score: <span id="science-score">0</span></div>
            `;
        
            // Get UI elements
            const questionElement = document.getElementById('question');
            const questionImageElement = document.getElementById('question-image');
            const optionsElement = document.getElementById('options');
            const feedbackElement = document.getElementById('science-feedback');
            const scoreElement = document.getElementById('science-score');
            const currentQuestionElement = document.getElementById('current-question');
            const progressIndicator = document.getElementById('progress-indicator');
            
            // Define science questions
            const scienceQuestions = [
                {
                    question: "What is the chemical symbol for water?",
                    options: ["H2O", "CO2", "O2", "NaCl"],
                    correctAnswer: 0,
                    explanation: "Water has the chemical formula H2O, meaning it consists of two hydrogen atoms bonded to one oxygen atom.",
                    image: '<i class="fas fa-tint"></i>'
                },
                {
                    question: "Which planet is known as the Red Planet?",
                    options: ["Venus", "Mars", "Jupiter", "Saturn"],
                    correctAnswer: 1,
                    explanation: "Mars appears reddish because of iron oxide (rust) on its surface, earning it the nickname 'The Red Planet'.",
                    image: '<i class="fas fa-globe-americas"></i>'
                },
                {
                    question: "What is the largest organ in the human body?",
                    options: ["Heart", "Liver", "Skin", "Brain"],
                    correctAnswer: 2,
                    explanation: "The skin is the largest organ, covering an area of about 2 square meters in adults and serving as a protective barrier.",
                    image: '<i class="fas fa-user"></i>'
                },
                {
                    question: "Which element has the chemical symbol 'Au'?",
                    options: ["Silver", "Aluminum", "Argon", "Gold"],
                    correctAnswer: 3,
                    explanation: "Au is the chemical symbol for Gold, derived from the Latin word 'aurum'.",
                    image: '<i class="fas fa-coins"></i>'
                },
                {
                    question: "What process do plants use to make their own food?",
                    options: ["Photosynthesis", "Respiration", "Fermentation", "Digestion"],
                    correctAnswer: 0,
                    explanation: "Plants use photosynthesis to convert light energy, water, and carbon dioxide into glucose and oxygen.",
                    image: '<i class="fas fa-leaf"></i>'
                },
                {
                    question: "Which of these is NOT a state of matter?",
                    options: ["Solid", "Liquid", "Energy", "Gas"],
                    correctAnswer: 2,
                    explanation: "Energy is not a state of matter. The four primary states of matter are solid, liquid, gas, and plasma.",
                    image: '<i class="fas fa-thermometer-half"></i>'
                },
                {
                    question: "What is the smallest unit of life?",
                    options: ["Atom", "Cell", "Molecule", "Organ"],
                    correctAnswer: 1,
                    explanation: "The cell is the basic structural and functional unit of all living organisms.",
                    image: '<i class="fas fa-microscope"></i>'
                },
                {
                    question: "Which force keeps planets orbiting around the Sun?",
                    options: ["Magnetic force", "Nuclear force", "Gravity", "Friction"],
                    correctAnswer: 2,
                    explanation: "Gravity is the force of attraction that keeps planets in orbit around the Sun.",
                    image: '<i class="fas fa-sun"></i>'
                },
                {
                    question: "What is the speed of light in a vacuum?",
                    options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"],
                    correctAnswer: 0,
                    explanation: "Light travels at approximately 300,000 kilometers per second (or 186,000 miles per second) in a vacuum.",
                    image: '<i class="fas fa-bolt"></i>'
                },
                {
                    question: "Which gas do plants release during photosynthesis?",
                    options: ["Carbon dioxide", "Nitrogen", "Oxygen", "Hydrogen"],
                    correctAnswer: 2,
                    explanation: "During photosynthesis, plants take in carbon dioxide and release oxygen as a byproduct.",
                    image: '<i class="fas fa-tree"></i>'
                },
                {
                    question: "What is the Earth's primary protection from solar radiation?",
                    options: ["Clouds", "Ozone Layer", "Atmosphere", "Magnetic Field"],
                    correctAnswer: 1,
                    explanation: "The ozone layer in the stratosphere absorbs most of the Sun's harmful ultraviolet radiation.",
                    image: '<i class="fas fa-shield-alt"></i>'
                },
                {
                    question: "Which of these is a renewable energy source?",
                    options: ["Coal", "Natural gas", "Solar power", "Petroleum"],
                    correctAnswer: 2,
                    explanation: "Solar power is renewable because it comes from the Sun, which will continue to provide energy for billions of years.",
                    image: '<i class="fas fa-solar-panel"></i>'
                }
            ];
            
            // Shuffle questions and start quiz
            const shuffledQuestions = shuffleArray([...scienceQuestions]).slice(0, totalQuestions);
            currentQuestion = shuffledQuestions[0];
            displayQuestion(currentQuestion, 1);
        
            // Function to display a question
            function displayQuestion(questionData, questionNumber) {
                // Update progress
                if (currentQuestionElement) {
                    currentQuestionElement.textContent = questionNumber;
                }
                
                // Update progress bar
                if (progressIndicator) {
                    const progressPercentage = ((questionNumber - 1) / totalQuestions) * 100;
                    progressIndicator.style.width = `${progressPercentage}%`;
                }
                
                // Set question text
                questionElement.textContent = questionData.question;
                
                // Set question image
                questionImageElement.innerHTML = questionData.image;
                
                // Clear options
                optionsElement.innerHTML = '';
                
                // Clear feedback
                if (feedbackElement) {
                    feedbackElement.innerHTML = '';
                }
                
                // Add options
                questionData.options.forEach((option, index) => {
                    const optionElement = document.createElement('div');
                    optionElement.className = 'science-option';
                    optionElement.textContent = option;
                    optionElement.setAttribute('data-index', index);
                    
                    // Add click event
                    optionElement.addEventListener('click', function() {
                        const selectedIndex = parseInt(this.getAttribute('data-index'));
                        checkAnswer(selectedIndex, questionData.correctAnswer, questionData.explanation);
                    });
                    
                    optionsElement.appendChild(optionElement);
                });
            }
        
            // Function to check an answer
            function checkAnswer(selectedIndex, correctIndex, explanation) {
                const options = document.querySelectorAll('.science-option');
                
                // Disable all options
                options.forEach(option => {
                    option.style.pointerEvents = 'none';
                });
                
                // Highlight correct and incorrect options
                if (selectedIndex === correctIndex) {
                    // Correct answer
                    options[selectedIndex].classList.add('correct');
                    feedbackElement.innerHTML = `<p class="correct-feedback"><i class="fas fa-check-circle"></i> Correct! ${explanation}</p>`;
                    score += 10;
                    scoreElement.textContent = score;
                } else {
                    // Incorrect answer
                    options[selectedIndex].classList.add('incorrect');
                    options[correctIndex].classList.add('correct');
                    feedbackElement.innerHTML = `<p class="incorrect-feedback"><i class="fas fa-times-circle"></i> Incorrect. ${explanation}</p>`;
                }
                
                // Move to next question or end game after delay
                questionsAnswered++;
                setTimeout(() => {
                    if (questionsAnswered < totalQuestions) {
                        // Show next question
                        currentQuestion = shuffledQuestions[questionsAnswered];
                        displayQuestion(currentQuestion, questionsAnswered + 1);
                    } else {
                        // Game over
                            endQuiz();
                    }
                }, 2000);
            }
        
            // Function to end the quiz
            function endQuiz() {
            // Update progress bar to 100%
            if (progressIndicator) {
                progressIndicator.style.width = '100%';
            }
            
            // Display game over message
                gameContent.innerHTML = `
                <div class="science-game-container">
                        <h2>Science Explorer Quiz Complete!</h2>
                    <div class="end-game-icon"><i class="fas fa-atom"></i></div>
                    <p>Your final score: ${score} out of ${totalQuestions * 10}</p>
                    <p class="performance-message">${getPerformanceMessage(score, totalQuestions)}</p>
                    <button id="play-again" class="play-btn" style="margin: 20px auto; display: block;">Play Again</button>
                </div>
            `;
            
            // Add event listener to play again button
            const playAgainButton = document.getElementById('play-again');
            if (playAgainButton) {
                playAgainButton.addEventListener('click', function() {
                        startQuizMode();
                    });
                }
            }
        }
        
        // Function to start Simulation Mode
        function startSimulationMode() {
            gameContent.innerHTML = `
                <div class="simulation-lab">
                    <div class="sim-header">
                        <h3>Virtual Science Lab</h3>
                        <p>Choose an experiment below to explore scientific concepts in an interactive way!</p>
                    </div>
                    
                    <div class="experiment-selector">
                        <div class="experiment-card" data-experiment="pendulum">
                            <div class="experiment-icon"><i class="fas fa-clock"></i></div>
                            <div class="experiment-info">
                                <h4>Pendulum Motion</h4>
                                <p>Discover how pendulum length affects oscillation period</p>
                            </div>
                        </div>
                        
                        <div class="experiment-card" data-experiment="chemical">
                            <div class="experiment-icon"><i class="fas fa-flask"></i></div>
                            <div class="experiment-info">
                                <h4>Chemical Reactions</h4>
                                <p>Mix virtual chemicals and observe exciting reactions</p>
                            </div>
                        </div>
                        
                        <div class="experiment-card" data-experiment="sound">
                            <div class="experiment-icon"><i class="fas fa-wave-square"></i></div>
                            <div class="experiment-info">
                                <h4>Sound Wave Explorer</h4>
                                <p>Visualize and understand sound wave properties</p>
                            </div>
                        </div>
                    </div>
                    
                    <div id="experiment-area" class="experiment-area">
                        <div class="experiment-placeholder">
                            <i class="fas fa-flask"></i>
                            <p>Select an experiment to begin!</p>
                        </div>
                    </div>
                </div>
            `;
            
            // Add event listeners to experiment cards
            const experimentCards = document.querySelectorAll('.experiment-card');
            experimentCards.forEach(card => {
                card.addEventListener('click', function() {
                    const experimentType = this.getAttribute('data-experiment');
                    loadExperiment(experimentType);
                    
                    // Mark this card as selected
                    experimentCards.forEach(c => c.classList.remove('selected'));
                    this.classList.add('selected');
                });
            });
        }
        
        // Function to load an experiment
        function loadExperiment(experimentType) {
            const experimentArea = document.getElementById('experiment-area');
            
            switch(experimentType) {
                case 'pendulum':
                    loadPendulumExperiment(experimentArea);
                    break;
                case 'chemical':
                    loadChemicalExperiment(experimentArea);
                    break;
                case 'sound':
                    loadSoundExperiment(experimentArea);
                    break;
            }
        }
        
        // Function to load pendulum experiment
        function loadPendulumExperiment(container) {
            container.innerHTML = `
                <div class="pendulum-experiment">
                    <h3>Pendulum Motion Experiment</h3>
                    <p>Adjust the length of the pendulum and observe how it affects the period of oscillation.</p>
                    
                    <div class="experiment-instructions">
                        <h4>What to do:</h4>
                        <ol>
                            <li>Use the slider to change the pendulum length</li>
                            <li>Click "Start" to see the pendulum swing</li>
                            <li>Observe how the pendulum period changes with length</li>
                            <li>Click "Reset" to try different lengths</li>
                        </ol>
                    </div>
                    
                    <div class="pendulum-controls">
                        <div class="control-group">
                            <label for="pendulum-length">Pendulum Length:</label>
                            <input type="range" id="pendulum-length" min="50" max="200" value="100">
                            <span id="length-value">100</span> cm
                        </div>
                        
                        <div class="control-group">
                            <button id="start-pendulum" class="experiment-btn">Start</button>
                            <button id="reset-pendulum" class="experiment-btn">Reset</button>
                        </div>
                    </div>
                    
                    <div class="pendulum-animation">
                        <div id="pendulum" class="pendulum">
                            <div class="pendulum-string"></div>
                            <div class="pendulum-bob"></div>
                        </div>
                    </div>
                    
                    <div class="experiment-data">
                        <h4>Results:</h4>
                        <p>Period: <span id="period-value">0</span> seconds</p>
                        <p class="experiment-formula">T = 2π√(L/g)</p>
                        <p class="experiment-insight">The period (T) of a pendulum is proportional to the square root of its length (L).</p>
                        <div class="science-fact">
                            <h4>Did you know?</h4>
                            <p>Pendulums were used in the first accurate clocks. The length of a pendulum with a period of exactly 2 seconds (1 second in each direction) is about 1 meter.</p>
                        </div>
                    </div>
                </div>
            `;
            
            // Get elements
            const lengthSlider = document.getElementById('pendulum-length');
            const lengthValue = document.getElementById('length-value');
            const startButton = document.getElementById('start-pendulum');
            const resetButton = document.getElementById('reset-pendulum');
            const pendulum = document.getElementById('pendulum');
            const periodValue = document.getElementById('period-value');
            
            // Update pendulum length display
            lengthSlider.addEventListener('input', function() {
                const length = this.value;
                lengthValue.textContent = length;
                
                // Update pendulum string length in the UI
                document.querySelector('.pendulum-string').style.height = `${length * 0.8}px`;
                
                // Update period calculation (T = 2π√(L/g))
                const period = 2 * Math.PI * Math.sqrt(length / 980) * 2; // Approximation for visualization
                periodValue.textContent = period.toFixed(2);
            });
            
            // Trigger initial update
            lengthSlider.dispatchEvent(new Event('input'));
            
            // Start button
            startButton.addEventListener('click', function() {
                pendulum.classList.add('swinging');
                this.disabled = true;
                resetButton.disabled = false;
            });
            
            // Reset button
            resetButton.addEventListener('click', function() {
                pendulum.classList.remove('swinging');
                startButton.disabled = false;
                this.disabled = true;
            });
        }
        
        // Function to load chemical reactions experiment
        function loadChemicalExperiment(container) {
            container.innerHTML = `
                <div class="chemical-experiment">
                    <h3>Chemical Reactions Lab</h3>
                    <p>Mix virtual chemicals and observe different types of reactions.</p>
                    
                    <div class="experiment-instructions">
                        <h4>What to do:</h4>
                        <ol>
                            <li>Select chemicals from the reagent panel</li>
                            <li>Drag them to the reaction vessel</li>
                            <li>Observe the reaction and its properties</li>
                            <li>Record your observations</li>
                        </ol>
                    </div>
                    
                    <div class="chemical-controls">
                        <div class="reagent-panel">
                            <div class="reagent" data-chemical="acid">
                                <i class="fas fa-vial"></i>
                                <span>Acid (HCl)</span>
                            </div>
                            <div class="reagent" data-chemical="base">
                                <i class="fas fa-vial"></i>
                                <span>Base (NaOH)</span>
                            </div>
                            <div class="reagent" data-chemical="salt">
                                <i class="fas fa-vial"></i>
                                <span>Salt (NaCl)</span>
                            </div>
                            <div class="reagent" data-chemical="water">
                                <i class="fas fa-tint"></i>
                                <span>Water (H₂O)</span>
                            </div>
                        </div>
                        
                        <div class="reaction-vessel">
                            <div id="vessel-content">
                                <p>Drag chemicals here to mix</p>
                            </div>
                        </div>
                        
                        <div class="control-buttons">
                            <button id="mix-chemicals" class="experiment-btn">Mix</button>
                            <button id="reset-reaction" class="experiment-btn">Reset</button>
                        </div>
                    </div>
                    
                    <div class="reaction-data">
                        <h4>Reaction Information:</h4>
                        <div id="reaction-info">
                            <p>Select and mix chemicals to see reaction details</p>
                        </div>
                        <div class="science-fact">
                            <h4>Did you know?</h4>
                            <p>Chemical reactions can be classified into different types: synthesis, decomposition, single displacement, double displacement, and acid-base reactions.</p>
                        </div>
                    </div>
                </div>
            `;
            
            initChemicalExperiment();
        }
        
        function initChemicalExperiment() {
            const reagents = document.querySelectorAll('.reagent');
            const vessel = document.querySelector('.reaction-vessel');
            const mixButton = document.getElementById('mix-chemicals');
            const resetButton = document.getElementById('reset-reaction');
            const reactionInfo = document.getElementById('reaction-info');
            
            let currentChemicals = [];
            
            // Make reagents draggable
            reagents.forEach(reagent => {
                reagent.setAttribute('draggable', 'true');
                reagent.addEventListener('dragstart', handleDragStart);
            });
            
            vessel.addEventListener('dragover', e => e.preventDefault());
            vessel.addEventListener('drop', handleDrop);
            
            mixButton.addEventListener('click', () => {
                if (currentChemicals.length < 2) {
                    reactionInfo.innerHTML = '<p>Add at least two chemicals to create a reaction.</p>';
                    return;
                }
                
                const reaction = getReactionResult(currentChemicals);
                reactionInfo.innerHTML = `
                    <p><strong>Reaction:</strong> ${reaction.equation}</p>
                    <p><strong>Type:</strong> ${reaction.type}</p>
                    <p><strong>Observation:</strong> ${reaction.observation}</p>
                `;
                
                vessel.style.backgroundColor = reaction.color;
            });
            
            resetButton.addEventListener('click', () => {
                currentChemicals = [];
                vessel.style.backgroundColor = '';
                document.getElementById('vessel-content').innerHTML = '<p>Drag chemicals here to mix</p>';
                reactionInfo.innerHTML = '<p>Select and mix chemicals to see reaction details</p>';
            });
            
            function handleDragStart(e) {
                e.dataTransfer.setData('text/plain', e.target.getAttribute('data-chemical'));
            }
            
            function handleDrop(e) {
                e.preventDefault();
                const chemical = e.dataTransfer.getData('text/plain');
                if (!currentChemicals.includes(chemical) && currentChemicals.length < 3) {
                    currentChemicals.push(chemical);
                    updateVesselContent();
                }
            }
            
            function updateVesselContent() {
                const content = document.getElementById('vessel-content');
                content.innerHTML = `
                    <p>Current mixture:</p>
                    <ul>${currentChemicals.map(chem => `<li>${chem}</li>`).join('')}</ul>
                `;
            }
            
            function getReactionResult(chemicals) {
                // Simplified reaction logic
                if (chemicals.includes('acid') && chemicals.includes('base')) {
                    return {
                        equation: 'HCl + NaOH → NaCl + H₂O',
                        type: 'Neutralization',
                        observation: 'The solution becomes neutral, salt is formed',
                        color: '#a8e6cf'
                    };
                }
                if (chemicals.includes('salt') && chemicals.includes('water')) {
                    return {
                        equation: 'NaCl + H₂O → Na⁺ + Cl⁻ + H₂O',
                        type: 'Dissolution',
                        observation: 'Salt dissolves in water forming a clear solution',
                        color: '#dcedc1'
                    };
                }
                return {
                    equation: 'No specific reaction',
                    type: 'Mixture',
                    observation: 'The substances have mixed but no chemical reaction occurred',
                    color: '#ffd3b6'
                };
            }
        }
        
        // Function to load sound wave experiment
        function loadSoundExperiment(container) {
            container.innerHTML = `
                <div class="sound-experiment">
                    <h3>Sound Wave Explorer</h3>
                    <p>Visualize sound waves and understand their properties.</p>
                    
                    <div class="experiment-instructions">
                        <h4>What to do:</h4>
                        <ol>
                            <li>Adjust frequency and amplitude using the sliders</li>
                            <li>Click "Play" to hear the sound</li>
                            <li>Observe how changes affect the wave pattern</li>
                            <li>Try combining different waves</li>
                        </ol>
                    </div>
                    
                    <div class="wave-controls">
                        <div class="control-group">
                            <label for="frequency">Frequency (Hz):</label>
                            <input type="range" id="frequency" min="20" max="2000" value="440">
                            <span id="freq-value">440 Hz</span>
                        </div>
                        
                        <div class="control-group">
                            <label for="amplitude">Amplitude:</label>
                            <input type="range" id="amplitude" min="0" max="100" value="50">
                            <span id="amp-value">50%</span>
                        </div>
                        
                        <div class="control-group">
                            <button id="play-sound" class="experiment-btn">Play</button>
                            <button id="stop-sound" class="experiment-btn">Stop</button>
                        </div>
                    </div>
                    
                    <div class="wave-visualization">
                        <canvas id="waveCanvas"></canvas>
                    </div>
                    
                    <div class="wave-data">
                        <h4>Wave Properties:</h4>
                        <p>Wavelength: <span id="wavelength">0.78</span> meters</p>
                        <p>Period: <span id="period">0.00227</span> seconds</p>
                        <p class="experiment-formula">Speed of Sound = Frequency × Wavelength</p>
                        <div class="science-fact">
                            <h4>Did you know?</h4>
                            <p>The human ear can typically hear frequencies between 20 Hz and 20,000 Hz, with peak sensitivity around 2,000-5,000 Hz.</p>
                        </div>
                    </div>
                </div>
            `;
            
            initSoundExperiment();
        }
        
        function initSoundExperiment() {
            const canvas = document.getElementById('waveCanvas');
            const ctx = canvas.getContext('2d');
            const frequencySlider = document.getElementById('frequency');
            const amplitudeSlider = document.getElementById('amplitude');
            const playButton = document.getElementById('play-sound');
            const stopButton = document.getElementById('stop-sound');
            const freqValue = document.getElementById('freq-value');
            const ampValue = document.getElementById('amp-value');
            
            let audioContext = null;
            let oscillator = null;
            let gainNode = null;
            let animationId = null;
            
            // Set canvas size
            function resizeCanvas() {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = 200;
            }
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            
            // Update displays
            frequencySlider.addEventListener('input', function() {
                freqValue.textContent = this.value + ' Hz';
                updateWavelength();
                if (oscillator) {
                    oscillator.frequency.setValueAtTime(this.value, audioContext.currentTime);
                }
            });
            
            amplitudeSlider.addEventListener('input', function() {
                ampValue.textContent = this.value + '%';
                if (gainNode) {
                    gainNode.gain.setValueAtTime(this.value / 100, audioContext.currentTime);
                }
            });
            
            playButton.addEventListener('click', function() {
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    oscillator = audioContext.createOscillator();
                    gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(frequencySlider.value, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(amplitudeSlider.value / 100, audioContext.currentTime);
                    
                    oscillator.start();
                    startAnimation();
                }
            });
            
            stopButton.addEventListener('click', function() {
                if (audioContext) {
                    oscillator.stop();
                    audioContext.close();
                    audioContext = null;
                    cancelAnimationFrame(animationId);
                }
            });
            
            function updateWavelength() {
                const frequency = frequencySlider.value;
                const speedOfSound = 343; // m/s at room temperature
                const wavelength = speedOfSound / frequency;
                const period = 1 / frequency;
                
                document.getElementById('wavelength').textContent = wavelength.toFixed(2);
                document.getElementById('period').textContent = period.toFixed(5);
            }
            
            function drawWave() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.beginPath();
                ctx.moveTo(0, canvas.height / 2);
                
                const frequency = frequencySlider.value;
                const amplitude = (amplitudeSlider.value / 100) * (canvas.height / 2);
                const angularFrequency = 2 * Math.PI * frequency;
                const time = audioContext ? audioContext.currentTime : 0;
                
                for (let x = 0; x < canvas.width; x++) {
                    const y = canvas.height / 2 + amplitude * Math.sin(angularFrequency * (time + x / 100));
                    ctx.lineTo(x, y);
                }
                
                ctx.strokeStyle = '#3498db';
                ctx.stroke();
                
                animationId = requestAnimationFrame(drawWave);
            }
            
            function startAnimation() {
                if (animationId) {
                    cancelAnimationFrame(animationId);
                }
                drawWave();
            }
            
            // Initial wavelength update
            updateWavelength();
        }
        
        // Start with quiz mode by default
        startQuizMode();
        
        // Helper functions
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }
        
        function getPerformanceMessage(score, totalQuestions) {
            const percentage = (score / (totalQuestions * 10)) * 100;
            
            if (percentage >= 90) {
                return "Outstanding! You're a science genius!";
            } else if (percentage >= 70) {
                return "Great job! You have excellent science knowledge!";
            } else if (percentage >= 50) {
                return "Good effort! Keep learning about science!";
            } else {
                return "Keep exploring! Science is fascinating!";
            }
        }
        
        // Science quiz questions database
        const scienceQuestions = [
            {
                question: "What is the chemical symbol for water?",
                options: ["H2O", "CO2", "O2", "NaCl"],
                correctAnswer: 0,
                explanation: "Water has the chemical formula H2O, meaning it consists of two hydrogen atoms bonded to one oxygen atom.",
                image: '<i class="fas fa-tint"></i>'
            },
            {
                question: "Which planet is known as the Red Planet?",
                options: ["Venus", "Mars", "Jupiter", "Saturn"],
                correctAnswer: 1,
                explanation: "Mars appears reddish because of iron oxide (rust) on its surface, earning it the nickname 'The Red Planet'.",
                image: '<i class="fas fa-globe-americas"></i>'
            },
            {
                question: "What is the largest organ in the human body?",
                options: ["Heart", "Liver", "Skin", "Brain"],
                correctAnswer: 2,
                explanation: "The skin is the largest organ, covering an area of about 2 square meters in adults and serving as a protective barrier.",
                image: '<i class="fas fa-user"></i>'
            },
            {
                question: "Which element has the chemical symbol 'Au'?",
                options: ["Silver", "Aluminum", "Argon", "Gold"],
                correctAnswer: 3,
                explanation: "Au is the chemical symbol for Gold, derived from the Latin word 'aurum'.",
                image: '<i class="fas fa-coins"></i>'
            },
            {
                question: "What process do plants use to make their own food?",
                options: ["Photosynthesis", "Respiration", "Fermentation", "Digestion"],
                correctAnswer: 0,
                explanation: "Plants use photosynthesis to convert light energy, water, and carbon dioxide into glucose and oxygen.",
                image: '<i class="fas fa-leaf"></i>'
            },
            {
                question: "Which of these is NOT a state of matter?",
                options: ["Solid", "Liquid", "Energy", "Gas"],
                correctAnswer: 2,
                explanation: "Energy is not a state of matter. The four primary states of matter are solid, liquid, gas, and plasma.",
                image: '<i class="fas fa-thermometer-half"></i>'
            },
            {
                question: "What is the smallest unit of life?",
                options: ["Atom", "Cell", "Molecule", "Organ"],
                correctAnswer: 1,
                explanation: "The cell is the basic structural and functional unit of all living organisms.",
                image: '<i class="fas fa-microscope"></i>'
            },
            {
                question: "Which force keeps planets orbiting around the Sun?",
                options: ["Magnetic force", "Nuclear force", "Gravity", "Friction"],
                correctAnswer: 2,
                explanation: "Gravity is the force of attraction that keeps planets in orbit around the Sun.",
                image: '<i class="fas fa-sun"></i>'
            },
            {
                question: "What is the speed of light in a vacuum?",
                options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"],
                correctAnswer: 0,
                explanation: "Light travels at approximately 300,000 kilometers per second (or 186,000 miles per second) in a vacuum.",
                image: '<i class="fas fa-bolt"></i>'
            },
            {
                question: "Which gas do plants release during photosynthesis?",
                options: ["Carbon dioxide", "Nitrogen", "Oxygen", "Hydrogen"],
                correctAnswer: 2,
                explanation: "During photosynthesis, plants take in carbon dioxide and release oxygen as a byproduct.",
                image: '<i class="fas fa-tree"></i>'
            },
            {
                question: "What is the Earth's primary protection from solar radiation?",
                options: ["Clouds", "Ozone Layer", "Atmosphere", "Magnetic Field"],
                correctAnswer: 1,
                explanation: "The ozone layer in the stratosphere absorbs most of the Sun's harmful ultraviolet radiation.",
                image: '<i class="fas fa-shield-alt"></i>'
            },
            {
                question: "Which of these is a renewable energy source?",
                options: ["Coal", "Natural gas", "Solar power", "Petroleum"],
                correctAnswer: 2,
                explanation: "Solar power is renewable because it comes from the Sun, which will continue to provide energy for billions of years.",
                image: '<i class="fas fa-solar-panel"></i>'
            },
            {
                question: "What is the unit of electric current?",
                options: ["Volt", "Watt", "Ohm", "Ampere"],
                correctAnswer: 3,
                explanation: "The ampere (A) is the SI unit of electric current, measuring the rate of electron flow.",
                image: '<i class="fas fa-plug"></i>'
            },
            {
                question: "Which of these animals is NOT a mammal?",
                options: ["Dolphin", "Bat", "Platypus", "Penguin"],
                correctAnswer: 3,
                explanation: "Penguins are birds, not mammals. They lay eggs and have feathers instead of fur or hair.",
                image: '<i class="fas fa-feather"></i>'
            },
            {
                question: "What is the process by which liquid water changes to water vapor?",
                options: ["Evaporation", "Condensation", "Sublimation", "Freezing"],
                correctAnswer: 0,
                explanation: "Evaporation is the process where liquid water changes to water vapor at temperatures below boiling point.",
                image: '<i class="fas fa-cloud"></i>'
            }
        ];
    }

    // Function to start Word Wizard game
    function startWordWizardGame(container) {
        // Game variables
        let score = 0;
        let level = 1;
        let round = 1;
        let gameMode = 'word-scramble'; // Options: 'word-scramble', 'word-builder'
        let currentWord = {};
        let usedWords = [];
        let timeLeft = 120; // 2 minutes
        let timer;

        // Create the game UI
        container.innerHTML = `
            <div class="word-wizard-container">
                <div class="word-wizard-header">
                    <div class="game-stats">
                        <div class="time-display">Time: <span id="word-timer">${timeLeft}</span>s</div>
                        <div class="score-display">Score: <span id="word-score">0</span></div>
                        <div class="level-display">Level: <span id="word-level">${level}</span></div>
                    </div>
                    <div class="mode-selector">
                        <button id="scramble-mode" class="mode-btn active">Word Scramble</button>
                        <button id="builder-mode" class="mode-btn">Word Association</button>
                    </div>
                </div>
                <div id="game-area" class="word-game-area">
                    <div class="word-instructions" id="word-instructions">
                        Unscramble the letters to form a word!
                    </div>
                    <div class="word-display" id="word-display"></div>
                    <div class="word-input-area" id="word-input-area">
                        <input type="text" id="word-input" placeholder="Type your answer...">
                        <button id="submit-word">Submit</button>
                        <button id="hint-btn">Get Hint</button>
                    </div>
                    <div class="word-feedback" id="word-feedback"></div>
                </div>
            </div>
        `;

        // Get UI elements
        const timerElement = document.getElementById('word-timer');
        const scoreElement = document.getElementById('word-score');
        const levelElement = document.getElementById('word-level');
        const wordDisplay = document.getElementById('word-display');
        const wordInput = document.getElementById('word-input');
        const submitButton = document.getElementById('submit-word');
        const hintButton = document.getElementById('hint-btn');
        const feedbackElement = document.getElementById('word-feedback');
        const instructionsElement = document.getElementById('word-instructions');
        const gameArea = document.getElementById('game-area');
        const scrambleModeBtn = document.getElementById('scramble-mode');
        const builderModeBtn = document.getElementById('builder-mode');

        // Game word lists by difficulty
        const wordLists = {
            1: ["cat", "dog", "run", "sun", "hat", "pen", "cup", "box", "fox", "car", "map", "toy", "leg", "kid", "yes"],
            2: ["apple", "table", "happy", "pencil", "water", "music", "window", "flower", "banana", "school", "planet", "garden"],
            3: ["computer", "vacation", "elephant", "mountain", "hospital", "education", "furniture", "beautiful", "vegetable"],
            4: ["technology", "creativity", "intelligent", "celebration", "appreciation", "opportunity", "environment", "responsible"],
            5: ["encyclopedia", "extraordinary", "communication", "determination", "classification", "understanding", "achievement"]
        };

        // Add mode selection event listeners
        scrambleModeBtn.addEventListener('click', function() {
            if (gameMode !== 'word-scramble') {
                gameMode = 'word-scramble';
                scrambleModeBtn.classList.add('active');
                builderModeBtn.classList.remove('active');
                resetGame();
                instructionsElement.textContent = 'Unscramble the letters to form a word!';
                startScrambleMode();
            }
        });

        builderModeBtn.addEventListener('click', function() {
            if (gameMode !== 'word-builder') {
                gameMode = 'word-builder';
                builderModeBtn.classList.add('active');
                scrambleModeBtn.classList.remove('active');
                resetGame();
                instructionsElement.textContent = 'Find words related to the given theme!';
                startBuilderMode();
            }
        });

        // Function to reset game state
        function resetGame() {
            clearInterval(timer);
            score = 0;
            level = 1;
            round = 1;
            timeLeft = 120;
            usedWords = [];
            
            scoreElement.textContent = score;
            levelElement.textContent = level;
            timerElement.textContent = timeLeft;
            feedbackElement.innerHTML = '';
            wordInput.value = '';
        }

        // Start the game timer
        function startTimer() {
            timer = setInterval(function() {
                timeLeft--;
                timerElement.textContent = timeLeft;
                
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    endGame();
                }
            }, 1000);
        }

        // Word Scramble Mode
        function startScrambleMode() {
            // Set up input field for this mode
            wordInput.placeholder = "Type the unscrambled word...";
            wordInput.value = '';
            wordInput.focus();
            
            // Generate first scrambled word
            generateScrambledWord();
            
            // Start timer
            startTimer();
            
            // Set up submit button event
            submitButton.onclick = checkScrambledWord;
            
            // Set up enter key submission
            wordInput.onkeypress = function(e) {
                if (e.key === 'Enter') {
                    checkScrambledWord();
                }
            };
            
            // Set up hint button
            hintButton.onclick = giveScrambleHint;
        }

        // Function to generate a scrambled word
        function generateScrambledWord() {
            // Get words for current level
            const availableWords = getWordsForLevel();
            
            // If we've used all words at this level
            if (availableWords.length === 0) {
                if (level < 5) {
                    level++;
                    levelElement.textContent = level;
                    usedWords = [];
                    generateScrambledWord();
                    return;
                } else {
                    // If we've completed all levels
                    endGame(true);
                    return;
                }
            }
            
            // Select a random word
            const wordIndex = Math.floor(Math.random() * availableWords.length);
            const word = availableWords[wordIndex];
            usedWords.push(word);
            
            // Scramble the word
            const scrambledWord = scrambleWord(word);
            
            // Save current word
            currentWord = {
                original: word,
                scrambled: scrambledWord
            };
            
            // Display the scrambled word
            displayScrambledWord(scrambledWord);
            
            // Clear input and feedback
            wordInput.value = '';
            feedbackElement.innerHTML = '';
            
            // Increment round
            round++;
        }

        // Function to get words for the current level that haven't been used yet
        function getWordsForLevel() {
            return wordLists[level].filter(word => !usedWords.includes(word));
        }

        // Function to scramble a word
        function scrambleWord(word) {
            const letters = word.split('');
            for (let i = letters.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [letters[i], letters[j]] = [letters[j], letters[i]];
            }
            
            // Make sure the scrambled word is different from the original
            const scrambled = letters.join('');
            if (scrambled === word) {
                return scrambleWord(word);
            }
            
            return scrambled;
        }

        // Function to display a scrambled word
        function displayScrambledWord(scrambledWord) {
            wordDisplay.innerHTML = '';
            
            // Create letter tiles
            scrambledWord.split('').forEach(letter => {
                const letterTile = document.createElement('div');
                letterTile.className = 'letter-tile';
                letterTile.textContent = letter;
                wordDisplay.appendChild(letterTile);
            });
        }

        // Function to check if the entered word matches the original
        function checkScrambledWord() {
            const userWord = wordInput.value.trim().toLowerCase();
            
            if (userWord === '') {
                feedbackElement.innerHTML = '<p class="neutral-feedback">Please enter a word.</p>';
                return;
            }
            
            if (userWord === currentWord.original) {
                // Correct answer
                feedbackElement.innerHTML = '<p class="correct-feedback"><i class="fas fa-check-circle"></i> Correct! Well done!</p>';
                
                // Award points based on word length and level
                const pointsEarned = currentWord.original.length * level * 5;
                score += pointsEarned;
                scoreElement.textContent = score;
                
                // Highlight correct answer
                highlightCorrectWord();
                
                // Check if level up is needed
                if (round % 5 === 0) {
                    if (level < 5) {
                        level++;
                        levelElement.textContent = level;
                        timeLeft += 20; // Bonus time for level up
                        timerElement.textContent = timeLeft;
                        feedbackElement.innerHTML += `<p class="level-up"><i class="fas fa-level-up-alt"></i> Level Up! You're now at level ${level}</p>`;
                    }
                }
                
                // Move to next word after delay
                setTimeout(() => {
                    if (timeLeft > 0) {
                        generateScrambledWord();
                    }
                }, 1500);
            } else {
                // Incorrect answer
                feedbackElement.innerHTML = '<p class="incorrect-feedback"><i class="fas fa-times-circle"></i> Try again!</p>';
                
                // Apply "shake" effect to the input
                wordInput.classList.add('shake');
                setTimeout(() => {
                    wordInput.classList.remove('shake');
                }, 500);
            }
        }

        // Function to highlight the correct word
        function highlightCorrectWord() {
            wordDisplay.innerHTML = '';
            
            // Create letter tiles for the correct word
            currentWord.original.split('').forEach(letter => {
                const letterTile = document.createElement('div');
                letterTile.className = 'letter-tile correct';
                letterTile.textContent = letter;
                wordDisplay.appendChild(letterTile);
            });
        }

        // Function to give a hint in scramble mode
        function giveScrambleHint() {
            // Deduct points for using a hint
            score = Math.max(0, score - 5);
            scoreElement.textContent = score;
            
            // Show first letter of the word
            const hintText = `First letter: <strong>${currentWord.original[0]}</strong>`;
            feedbackElement.innerHTML = `<p class="hint-feedback"><i class="fas fa-lightbulb"></i> ${hintText}</p>`;
            
            // Disable hint button temporarily
            hintButton.disabled = true;
            setTimeout(() => {
                hintButton.disabled = false;
            }, 5000);
        }

        // Word Builder Mode (now Word Association Game)
        function startBuilderMode() {
            // Clear display
            wordDisplay.innerHTML = '';
            
            // Set up for this mode
            wordInput.placeholder = "Enter a related word...";
            wordInput.value = '';
            wordInput.focus();
            
            // Generate theme and starter words
            generateTheme();
            
            // Start timer
            startTimer();
            
            // Set up submit button event
            submitButton.onclick = checkRelatedWord;
            
            // Set up enter key submission
            wordInput.onkeypress = function(e) {
                if (e.key === 'Enter') {
                    checkRelatedWord();
                }
            };
            
            // Set up hint button
            hintButton.onclick = giveAssociationHint;
        }

        // Variables for Word Association mode
        let currentTheme = '';
        let themeWords = [];
        let foundThemeWords = [];
        let wordThemes = {
            1: [
                { theme: "Colors", words: ["red", "blue", "green", "yellow", "black", "white", "purple", "orange", "pink", "brown"] },
                { theme: "Animals", words: ["dog", "cat", "lion", "tiger", "horse", "elephant", "bird", "fish", "monkey", "bear"] },
                { theme: "Food", words: ["apple", "bread", "cheese", "pizza", "rice", "cake", "meat", "pasta", "soup", "egg"] }
            ],
            2: [
                { theme: "Weather", words: ["sunny", "rainy", "cloudy", "windy", "storm", "thunder", "rainbow", "foggy", "snowy", "humid"] },
                { theme: "Sports", words: ["soccer", "baseball", "tennis", "swimming", "running", "cycling", "basketball", "golf", "hockey", "boxing"] },
                { theme: "Jobs", words: ["teacher", "doctor", "engineer", "chef", "artist", "police", "writer", "driver", "farmer", "nurse"] }
            ],
            3: [
                { theme: "Technology", words: ["computer", "internet", "software", "smartphone", "website", "tablet", "keyboard", "monitor", "camera", "robot"] },
                { theme: "Emotions", words: ["happy", "angry", "excited", "nervous", "afraid", "curious", "anxious", "peaceful", "confused", "surprised"] },
                { theme: "Places", words: ["mountain", "beach", "forest", "desert", "island", "valley", "canyon", "village", "castle", "museum"] }
            ],
            4: [
                { theme: "Music", words: ["melody", "rhythm", "harmony", "instrument", "concert", "orchestra", "symphony", "composer", "acoustic", "percussion"] },
                { theme: "Science", words: ["experiment", "laboratory", "chemistry", "physics", "biology", "molecule", "hypothesis", "research", "scientist", "discovery"] },
                { theme: "Ocean", words: ["waves", "coral", "seaweed", "dolphin", "shark", "current", "tides", "submarine", "sailing", "seashell"] }
            ],
            5: [
                { theme: "Architecture", words: ["building", "skyscraper", "cathedral", "mansion", "blueprint", "foundation", "pillar", "facade", "interior", "structure"] },
                { theme: "Psychology", words: ["behavior", "cognition", "emotion", "personality", "perception", "consciousness", "motivation", "memory", "thinking", "learning"] },
                { theme: "Literature", words: ["novel", "character", "poetry", "symbolism", "metaphor", "author", "narrative", "dialogue", "fiction", "protagonist"] }
            ]
        };
        
        // Function to generate a theme for the game
        function generateTheme() {
            // Pick a random theme for the current level
            const levelThemes = wordThemes[level];
            const themeIndex = Math.floor(Math.random() * levelThemes.length);
            const themeData = levelThemes[themeIndex];
            
            currentTheme = themeData.theme;
            themeWords = themeData.words;
            foundThemeWords = [];
            
            // Display the theme
            displayThemeAndWords();
            
            // Update feedback
            feedbackElement.innerHTML = `<p>Find words related to <strong>${currentTheme}</strong>!</p>`;
            
            // Show theme words area
            const themeWordsArea = document.createElement('div');
            themeWordsArea.id = 'theme-words-area';
            themeWordsArea.className = 'theme-words-area';
            themeWordsArea.innerHTML = `
                <h4>Theme: <strong>${currentTheme}</strong></h4>
                <div class="theme-progress">
                    <div class="progress-text">Words Found: <span id="words-found-count">0</span>/<span id="total-words">${themeWords.length}</span></div>
                    <div class="theme-progress-bar">
                        <div class="theme-progress" id="theme-progress-bar" style="width: 0%"></div>
                    </div>
                </div>
                <div id="found-theme-words" class="found-theme-words"></div>
            `;
            gameArea.appendChild(themeWordsArea);
        }
        
        // Function to display the theme and found words
        function displayThemeAndWords() {
            wordDisplay.innerHTML = '';
            
            // Create theme display
            const themeContainer = document.createElement('div');
            themeContainer.className = 'theme-container';
            
            // Create theme title
            const themeTitle = document.createElement('div');
            themeTitle.className = 'theme-title';
            themeTitle.textContent = currentTheme;
            themeContainer.appendChild(themeTitle);
            
            // Add animation elements
            const animationContainer = document.createElement('div');
            animationContainer.className = 'word-animation-container';
            
            // Add animated bubbles with theme-related words
            for (let i = 0; i < Math.min(5, themeWords.length); i++) {
                if (foundThemeWords.includes(themeWords[i])) continue;
                
                const bubble = document.createElement('div');
                bubble.className = 'word-bubble';
                bubble.style.animationDelay = `${i * 0.7}s`;
                bubble.style.left = `${10 + (i * 15)}%`;
                
                // For visual variety only - don't actually show the theme words as that would be too easy
                bubble.textContent = "?";
                
                animationContainer.appendChild(bubble);
            }
            
            themeContainer.appendChild(animationContainer);
            wordDisplay.appendChild(themeContainer);
        }
        
        // Function to update found words display
        function updateFoundWords() {
            const foundWordsElement = document.getElementById('found-theme-words');
            const wordsFoundCount = document.getElementById('words-found-count');
            const progressBar = document.getElementById('theme-progress-bar');
            
            if (foundWordsElement && wordsFoundCount && progressBar) {
                foundWordsElement.innerHTML = '';
                wordsFoundCount.textContent = foundThemeWords.length;
                
                // Update progress bar
                const progressPercentage = (foundThemeWords.length / themeWords.length) * 100;
                progressBar.style.width = `${progressPercentage}%`;
                
                // Display found words
                foundThemeWords.forEach(word => {
                    const wordElement = document.createElement('div');
                    wordElement.className = 'theme-word-found';
                    wordElement.textContent = word;
                    foundWordsElement.appendChild(wordElement);
                });
            }
        }
        
        // Function to check if a word is a valid theme word
        function isValidThemeWord(word) {
            // Check if it's in the theme list and not already found
            return themeWords.includes(word) && !foundThemeWords.includes(word);
        }
        
        // Function to check a related word
        function checkRelatedWord() {
            const userWord = wordInput.value.trim().toLowerCase();
            
            if (userWord === '') {
                feedbackElement.innerHTML = '<p class="neutral-feedback">Please enter a word.</p>';
                return;
            }
            
            if (isValidThemeWord(userWord)) {
                // Valid theme word
                foundThemeWords.push(userWord);
                
                // Award points based on word length and level
                const pointsEarned = userWord.length * (level + 1);
                score += pointsEarned;
                scoreElement.textContent = score;
                
                // Show feedback
                feedbackElement.innerHTML = `<p class="correct-feedback"><i class="fas fa-check-circle"></i> Great! "${userWord}" is related to ${currentTheme}! +${pointsEarned} points!</p>`;
                
                // Update found words display
                updateFoundWords();
                
                // Clear input
                wordInput.value = '';
                
                // Check if found all theme words
                if (foundThemeWords.length === themeWords.length) {
                    // Level up
                    if (level < 5) {
                        level++;
                        levelElement.textContent = level;
                        timeLeft += 30; // Bonus time for completing all words
                        timerElement.textContent = timeLeft;
                        
                        // Show level up message
                        feedbackElement.innerHTML = `<p class="level-up"><i class="fas fa-level-up-alt"></i> Amazing! You found all words related to ${currentTheme}! Level Up to ${level}!</p>`;
                        
                        // Generate new theme after a delay
                        setTimeout(() => {
                            if (timeLeft > 0) {
                                // Remove theme words area
                                const themeWordsArea = document.getElementById('theme-words-area');
                                if (themeWordsArea) {
                                    gameArea.removeChild(themeWordsArea);
                                }
                                
                                // Generate new theme
                                generateTheme();
                            }
                        }, 2000);
                    } else {
                        // Completed all levels
                        endGame(true);
                    }
                }
            } else if (foundThemeWords.includes(userWord)) {
                // Word already found
                feedbackElement.innerHTML = '<p class="neutral-feedback">You already found that word!</p>';
                wordInput.value = '';
            } else {
                // Not a valid theme word
                feedbackElement.innerHTML = `<p class="incorrect-feedback"><i class="fas fa-times-circle"></i> Try again! That word isn't in our ${currentTheme} list.</p>`;
                
                // Apply "shake" effect to the input
                wordInput.classList.add('shake');
                setTimeout(() => {
                    wordInput.classList.remove('shake');
                }, 500);
                
                // Clear input
                wordInput.value = '';
            }
        }
        
        // Function to give a hint in association mode
        function giveAssociationHint() {
            // Deduct points for using a hint
            score = Math.max(0, score - 10);
            scoreElement.textContent = score;
            
            // Find a word they haven't discovered yet
            const unFoundWords = themeWords.filter(word => !foundThemeWords.includes(word));
            
            if (unFoundWords.length > 0) {
                // Pick a random unfound word for the hint
                const hintIndex = Math.floor(Math.random() * unFoundWords.length);
                const hintWord = unFoundWords[hintIndex];
                
                // Show first letter of an unfound word
                const hintText = `Try a ${currentTheme} word starting with: <strong>${hintWord[0].toUpperCase()}</strong>`;
                feedbackElement.innerHTML = `<p class="hint-feedback"><i class="fas fa-lightbulb"></i> ${hintText}</p>`;
            } else {
                feedbackElement.innerHTML = '<p class="hint-feedback"><i class="fas fa-lightbulb"></i> You\'ve found all the words!</p>';
            }
            
            // Disable hint button temporarily
            hintButton.disabled = true;
            setTimeout(() => {
                hintButton.disabled = false;
            }, 10000);
        }

        // Function to end the game
        function endGame(completed = false) {
            // Stop the timer
            clearInterval(timer);
            
            // Calculate performance message
            let performanceMsg = "";
            if (completed) {
                performanceMsg = "Congratulations! You completed all levels!";
            } else if (score > 200) {
                performanceMsg = "Amazing! You're a true Word Wizard!";
            } else if (score > 100) {
                performanceMsg = "Great job! Your vocabulary is impressive!";
            } else if (score > 50) {
                performanceMsg = "Good effort! Keep expanding your vocabulary!";
            } else {
                performanceMsg = "Nice try! Practice makes perfect!";
            }
            
            // Show game over message
            container.innerHTML = `
                <div class="word-wizard-container">
                    <h2>${completed ? 'Game Completed!' : 'Game Over!'}</h2>
                    <div class="end-game-icon"><i class="fas fa-book"></i></div>
                    <p>Your final score: ${score}</p>
                    <p>You reached level: ${level}</p>
                    <p class="performance-message">${performanceMsg}</p>
                    <button id="play-again" class="play-btn" style="margin: 20px auto; display: block;">Play Again</button>
                </div>
            `;
            
            // Add event listener to play again button
            const playAgainButton = document.getElementById('play-again');
            if (playAgainButton) {
                playAgainButton.addEventListener('click', function() {
                    startWordWizardGame(container);
                });
            }
        }

        // Start with scramble mode by default
        startScrambleMode();
    }

    // Function to start Knowledge Quiz game
    function startKnowledgeQuizGame(container) {
        // Game variables
        let score = 0;
        let timeLeft = 180; // 3 minutes
        let currentQuestion = null;
        let questionIndex = 0;
        let timer;
        let gameMode = 'board'; // 'board' or 'challenge'
        let categories = ['History', 'Geography', 'Science', 'Literature', 'Arts'];
        let difficulties = ['Easy', 'Medium', 'Hard'];
        let selectedCategories = {};
        let correctAnswers = 0;
        let totalAnswered = 0;

        // Create the game UI
        container.innerHTML = `
            <div class="knowledge-quiz-container">
                <div class="quiz-header">
                    <div class="quiz-stats">
                        <div class="time-display">Time: <span id="quiz-timer">${timeLeft}</span>s</div>
                        <div class="score-display">Score: <span id="quiz-score">0</span></div>
                        <div class="progress-display">Progress: <span id="quiz-progress">0</span>/<span id="quiz-total">15</span></div>
                    </div>
                    <div class="mode-selector">
                        <button id="board-mode" class="mode-btn active">Quiz Board</button>
                        <button id="challenge-mode" class="mode-btn">Challenge Mode</button>
                    </div>
                </div>
                <div id="quiz-area" class="quiz-area">
                    <!-- Content will be added dynamically -->
                </div>
            </div>
        `;

        // Get UI elements
        const timerElement = document.getElementById('quiz-timer');
        const scoreElement = document.getElementById('quiz-score');
        const progressElement = document.getElementById('quiz-progress');
        const quizArea = document.getElementById('quiz-area');
        const boardModeBtn = document.getElementById('board-mode');
        const challengeModeBtn = document.getElementById('challenge-mode');

        // Add mode selection event listeners
        boardModeBtn.addEventListener('click', function() {
            if (gameMode !== 'board') {
                gameMode = 'board';
                boardModeBtn.classList.add('active');
                challengeModeBtn.classList.remove('active');
                resetGame();
                createQuizBoard();
            }
        });

        challengeModeBtn.addEventListener('click', function() {
            if (gameMode !== 'challenge') {
                gameMode = 'challenge';
                challengeModeBtn.classList.add('active');
                boardModeBtn.classList.remove('active');
                resetGame();
                startChallengeMode();
            }
        });

        // Function to reset game state
        function resetGame() {
            clearInterval(timer);
            score = 0;
            timeLeft = 180;
            questionIndex = 0;
            correctAnswers = 0;
            totalAnswered = 0;
            selectedCategories = {};
            
            scoreElement.textContent = score;
            timerElement.textContent = timeLeft;
            progressElement.textContent = '0';
        }

        // Start the game timer
        function startTimer() {
            timer = setInterval(function() {
                timeLeft--;
                timerElement.textContent = timeLeft;
                
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    endGame();
                }
            }, 1000);
        }

        // Create quiz board for first mode
        function createQuizBoard() {
            quizArea.innerHTML = `
                <div class="quiz-board">
                    <table class="board-table">
                        <thead>
                            <tr>
                                <th></th>
                                ${categories.map(category => `<th>${category}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${difficulties.map((difficulty, i) => `
                                <tr>
                                    <th>${difficulty}</th>
                                    ${categories.map((category, j) => `
                                        <td>
                                            <button class="question-cell" data-difficulty="${i}" data-category="${j}" data-points="${(i + 1) * 100}">
                                                ${(i + 1) * 100}
                                            </button>
                                        </td>
                                    `).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            // Add event listeners to question cells
            const questionCells = document.querySelectorAll('.question-cell');
            questionCells.forEach(cell => {
                cell.addEventListener('click', function() {
                    const difficulty = parseInt(this.getAttribute('data-difficulty'));
                    const category = parseInt(this.getAttribute('data-category'));
                    const points = parseInt(this.getAttribute('data-points'));
                    
                    // Disable the cell
                    this.disabled = true;
                    this.classList.add('selected');
                    
                    // Show question
                    showQuestion(difficulty, category, points);
                });
            });

            // Start the timer
            startTimer();
        }

        // Function to show a question
        function showQuestion(difficulty, category, points) {
            // Get three questions instead of one
            const questions = [];
            const questionsPool = quizQuestions[difficulties[difficulty].toLowerCase()][categories[category].toLowerCase()];
            
            // Select 3 random questions from the pool
            const indices = [];
            while (indices.length < 3 && indices.length < questionsPool.length) {
                const randomIndex = Math.floor(Math.random() * questionsPool.length);
                if (!indices.includes(randomIndex)) {
                    indices.push(randomIndex);
                    questions.push(questionsPool[randomIndex]);
                }
            }
            
            // Store all questions with their points
            currentQuestion = { questions, points };
            
            // Create HTML for all questions
            const questionsHTML = questions.map((question, qIndex) => `
                <div class="question-item">
                    <div class="question-text">${question.text}</div>
                    <div class="question-options">
                        ${question.options.map((option, index) => `
                            <button class="question-option" data-question="${qIndex}" data-index="${index}">${option}</button>
                        `).join('')}
                    </div>
                    <div class="answer-feedback-container" id="feedback-${qIndex}"></div>
                </div>
            `).join('<hr class="question-divider">');
            
            // Update quiz area with questions
            quizArea.innerHTML = `
                <div class="question-display">
                    <div class="question-header">
                        <span class="question-category">${categories[category]}</span>
                        <span class="question-difficulty">${difficulties[difficulty]}</span>
                        <span class="question-points">${points} points</span>
                    </div>
                    <div class="questions-container">
                        ${questionsHTML}
                    </div>
                    <button class="continue-btn" id="continue-btn" style="display: none;">Continue</button>
                </div>
            `;

            // Track how many questions have been answered
            let answeredCount = 0;
            
            // Add event listeners to options
            const optionButtons = document.querySelectorAll('.question-option');
            optionButtons.forEach(button => {
                button.addEventListener('click', function() {
                    // Extract question index and selected option index
                    const questionIndex = parseInt(this.getAttribute('data-question'));
                    const selectedIndex = parseInt(this.getAttribute('data-index'));
                    
                    // Disable options for this question only
                    document.querySelectorAll(`.question-option[data-question="${questionIndex}"]`).forEach(opt => {
                        opt.disabled = true;
                    });
                    
                    // Get the current question from the array
                    const question = questions[questionIndex];
                    
                    // Highlight correct and selected options for this question
                    const questionOptions = document.querySelectorAll(`.question-option[data-question="${questionIndex}"]`);
                    questionOptions[question.correctIndex].classList.add('correct');
                    if (selectedIndex !== question.correctIndex) {
                        questionOptions[selectedIndex].classList.add('incorrect');
                    }
                    
                    // Update score if correct
                    if (selectedIndex === question.correctIndex) {
                        score += Math.floor(points / 3); // Divide points among the 3 questions
                        scoreElement.textContent = score;
                        correctAnswers++;
                    }
                    
                    // Show feedback for this question
                    const feedbackText = selectedIndex === question.correctIndex ? 
                        `<p class="correct-feedback"><i class="fas fa-check-circle"></i> Correct! ${question.explanation}</p>` :
                        `<p class="incorrect-feedback"><i class="fas fa-times-circle"></i> Incorrect. ${question.explanation}</p>`;
                    
                    const feedbackContainer = document.getElementById(`feedback-${questionIndex}`);
                    feedbackContainer.innerHTML = feedbackText;
                    
                    // Increment answered count
                    answeredCount++;
                    
                    // Show continue button after all questions are answered
                    if (answeredCount >= questions.length) {
                        totalAnswered++;
                        progressElement.textContent = totalAnswered;
                        
                        const continueBtn = document.getElementById('continue-btn');
                        continueBtn.style.display = 'block';
                        continueBtn.addEventListener('click', function() {
                            // Return to the board
                            createQuizBoard();
                            
                            // Check if game should end
                            if (totalAnswered >= 15 || document.querySelectorAll('.question-cell:not(.selected)').length === 0) {
                                // All questions answered
                                setTimeout(() => {
                                    endGame(true);
                                }, 1000);
                            }
                        });
                    }
                });
            });
        }

        // Challenge Mode functions
        function startChallengeMode() {
            // In this mode, questions come one after another with increasing difficulty
            
            // Reset trackers
            questionIndex = 0;
            
            // Start timer
            startTimer();
            
            // Show the first question
            showNextChallengeQuestion();
        }

        // Show the next question in challenge mode
        function showNextChallengeQuestion() {
            // Determine difficulty based on progress
            let difficulty;
            if (questionIndex < 5) {
                difficulty = 0; // Easy
            } else if (questionIndex < 10) {
                difficulty = 1; // Medium
            } else {
                difficulty = 2; // Hard
            }
            
            // Get three questions instead of one
            const questions = [];
            const points = (difficulty + 1) * 100 + (questionIndex * 10);
            
            // Get 3 questions from different categories
            const usedCategories = [];
            while (questions.length < 3 && usedCategories.length < categories.length) {
                // Pick a random category that hasn't been used yet
                let categoryIndex;
                do {
                    categoryIndex = Math.floor(Math.random() * categories.length);
                } while (usedCategories.includes(categoryIndex));
                
                usedCategories.push(categoryIndex);
                
                // Get a question from this category
                const questionsPool = quizQuestions[difficulties[difficulty].toLowerCase()][categories[categoryIndex].toLowerCase()];
                if (questionsPool && questionsPool.length > 0) {
                    const randomIndex = Math.floor(Math.random() * questionsPool.length);
                    questions.push({
                        ...questionsPool[randomIndex],
                        category: categories[categoryIndex]
                    });
                }
                
                // If we don't have enough categories, break the loop
                if (usedCategories.length >= categories.length && questions.length < 3) {
                    break;
                }
            }
            
            // Store all questions with their points
            currentQuestion = { questions, points };
            
            // Create HTML for all questions
            const questionsHTML = questions.map((question, qIndex) => `
                <div class="question-item">
                    <div class="question-header">
                        <span class="question-category">${question.category}</span>
                    </div>
                    <div class="question-text">${question.text}</div>
                    <div class="question-options">
                        ${question.options.map((option, index) => `
                            <button class="question-option" data-question="${qIndex}" data-index="${index}">${option}</button>
                        `).join('')}
                    </div>
                    <div class="answer-feedback-container" id="challenge-feedback-${qIndex}"></div>
                </div>
            `).join('<hr class="question-divider">');
            
            // Update quiz area with questions
            quizArea.innerHTML = `
                <div class="question-display challenge-mode">
                    <div class="question-header">
                        <span class="question-number">Question ${questionIndex + 1}/15</span>
                        <span class="question-difficulty">${difficulties[difficulty]}</span>
                        <span class="question-points">${points} points total</span>
                    </div>
                    <div class="questions-container">
                        ${questionsHTML}
                    </div>
                    <button class="continue-btn" id="challenge-continue-btn" style="display: none;">Next Questions</button>
                </div>
            `;

            // Track how many questions have been answered
            let answeredCount = 0;
            
            // Add event listeners to options
            const optionButtons = document.querySelectorAll('.question-option');
            optionButtons.forEach(button => {
                button.addEventListener('click', function() {
                    // Extract question index and selected option index
                    const questionIndex = parseInt(this.getAttribute('data-question'));
                    const selectedIndex = parseInt(this.getAttribute('data-index'));
                    
                    // Disable options for this question only
                    document.querySelectorAll(`.question-option[data-question="${questionIndex}"]`).forEach(opt => {
                        opt.disabled = true;
                    });
                    
                    // Get the current question from the array
                    const question = questions[questionIndex];
                    
                    // Highlight correct and selected options for this question
                    const questionOptions = document.querySelectorAll(`.question-option[data-question="${questionIndex}"]`);
                    questionOptions[question.correctIndex].classList.add('correct');
                    if (selectedIndex !== question.correctIndex) {
                        questionOptions[selectedIndex].classList.add('incorrect');
                    }
                    
                    // Update score if correct
                    if (selectedIndex === question.correctIndex) {
                        score += Math.floor(points / 3); // Divide points among the 3 questions
                        scoreElement.textContent = score;
                        correctAnswers++;
                        
                        // Add bonus time for correct answers
                        timeLeft += 5;
                        timerElement.textContent = timeLeft;
                    }
                    
                    // Show feedback for this question
                    const feedbackText = selectedIndex === question.correctIndex ? 
                        `<p class="correct-feedback"><i class="fas fa-check-circle"></i> Correct! ${question.explanation}</p>` :
                        `<p class="incorrect-feedback"><i class="fas fa-times-circle"></i> Incorrect. ${question.explanation}</p>`;
                    
                    const feedbackContainer = document.getElementById(`challenge-feedback-${questionIndex}`);
                    feedbackContainer.innerHTML = feedbackText;
                    
                    // Increment answered count
                    answeredCount++;
                    
                    // Show continue button after all questions are answered
                    if (answeredCount >= questions.length) {
                        totalAnswered++;
                        progressElement.textContent = totalAnswered;
                        
                        const continueBtn = document.getElementById('challenge-continue-btn');
                        continueBtn.style.display = 'block';
                        continueBtn.addEventListener('click', function() {
                            // Increment question index for the next set of questions
                            questionIndex++;
                            
                            // Check if game should end
                            if (questionIndex >= 5) { // Changed from 15 to 5 since each set has 3 questions (5*3=15)
                                // All questions answered
                                setTimeout(() => {
                                    endGame(true);
                                }, 1000);
                            } else {
                                // Show next set of questions
                                showNextChallengeQuestion();
                            }
                        });
                    }
                });
            });
        }

        // Function to end the game
        function endGame(completed = false) {
            // Stop the timer
            clearInterval(timer);
            
            // Calculate accuracy
            const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
            
            // Calculate performance message
            let performanceMsg = "";
            if (accuracy >= 90) {
                performanceMsg = "Outstanding! You're a knowledge master!";
            } else if (accuracy >= 70) {
                performanceMsg = "Great job! You have excellent knowledge!";
            } else if (accuracy >= 50) {
                performanceMsg = "Good effort! Keep learning!";
            } else {
                performanceMsg = "Keep exploring! Knowledge is power!";
            }
            
            // Show game over message
            container.innerHTML = `
                <div class="knowledge-quiz-container">
                    <h2>${completed ? 'Quiz Completed!' : 'Time\'s Up!'}</h2>
                    <div class="end-game-icon"><i class="fas fa-brain"></i></div>
                    <p>Your final score: ${score}</p>
                    <p>Correct answers: ${correctAnswers}/${totalAnswered} (${accuracy}%)</p>
                    <p class="performance-message">${performanceMsg}</p>
                    <button id="play-again" class="play-btn" style="margin: 20px auto; display: block;">Play Again</button>
                </div>
            `;
            
            // Add event listener to play again button
            const playAgainButton = document.getElementById('play-again');
            if (playAgainButton) {
                playAgainButton.addEventListener('click', function() {
                    startKnowledgeQuizGame(container);
                });
            }
        }

        // Quiz questions database
        const quizQuestions = {
            easy: {
                history: [
                    {
                        text: "In which year did Christopher Columbus first reach the Americas?",
                        options: ["1492", "1776", "1066", "1215"],
                        correctIndex: 0,
                        explanation: "Christopher Columbus reached the Americas in 1492, marking the beginning of European exploration of the 'New World'."
                    },
                    {
                        text: "Who was the first President of the United States?",
                        options: ["Thomas Jefferson", "George Washington", "Abraham Lincoln", "John Adams"],
                        correctIndex: 1,
                        explanation: "George Washington served as the first President from 1789 to 1797."
                    }
                ],
                geography: [
                    {
                        text: "Which is the largest ocean on Earth?",
                        options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
                        correctIndex: 3,
                        explanation: "The Pacific Ocean is the largest and deepest ocean on Earth, covering more than 60 million square miles."
                    },
                    {
                        text: "What is the capital city of Australia?",
                        options: ["Sydney", "Melbourne", "Canberra", "Perth"],
                        correctIndex: 2,
                        explanation: "Canberra is the capital city of Australia, not Sydney or Melbourne as many people think."
                    }
                ],
                science: [
                    {
                        text: "What is the chemical symbol for gold?",
                        options: ["Go", "Gd", "Au", "Ag"],
                        correctIndex: 2,
                        explanation: "The chemical symbol for gold is Au, from the Latin word 'aurum'."
                    },
                    {
                        text: "Which planet is closest to the Sun?",
                        options: ["Venus", "Earth", "Mars", "Mercury"],
                        correctIndex: 3,
                        explanation: "Mercury is the closest planet to the Sun, with an average distance of about 36 million miles."
                    }
                ],
                literature: [
                    {
                        text: "Who wrote 'Romeo and Juliet'?",
                        options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
                        correctIndex: 1,
                        explanation: "William Shakespeare wrote 'Romeo and Juliet' around 1594-1595."
                    },
                    {
                        text: "Which of these is NOT one of the Harry Potter books?",
                        options: ["The Chamber of Secrets", "The Goblet of Fire", "The Deathly Hallows", "The Cursed Crown"],
                        correctIndex: 3,
                        explanation: "'The Cursed Crown' is not a Harry Potter book. The series consists of seven main books written by J.K. Rowling."
                    }
                ],
                arts: [
                    {
                        text: "Who painted the Mona Lisa?",
                        options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
                        correctIndex: 2,
                        explanation: "Leonardo da Vinci painted the Mona Lisa, one of the most famous portraits in the world, in the early 16th century."
                    },
                    {
                        text: "Which musical instrument has 88 keys?",
                        options: ["Violin", "Guitar", "Piano", "Flute"],
                        correctIndex: 2,
                        explanation: "A standard piano has 88 keys: 52 white keys and 36 black keys."
                    }
                ]
            },
            medium: {
                history: [
                    {
                        text: "The Treaty of Versailles was signed in what year, officially ending World War I?",
                        options: ["1917", "1918", "1919", "1920"],
                        correctIndex: 2,
                        explanation: "The Treaty of Versailles was signed on June 28, 1919, exactly five years after the assassination of Archduke Franz Ferdinand."
                    },
                    {
                        text: "Which ancient civilization built the Machu Picchu complex in Peru?",
                        options: ["Aztecs", "Maya", "Olmec", "Inca"],
                        correctIndex: 3,
                        explanation: "Machu Picchu was built by the Inca civilization in the 15th century and later abandoned."
                    }
                ],
                geography: [
                    {
                        text: "Which of these countries is NOT in Africa?",
                        options: ["Suriname", "Namibia", "Zambia", "Senegal"],
                        correctIndex: 0,
                        explanation: "Suriname is located in South America, while all other options are African countries."
                    },
                    {
                        text: "The Strait of Hormuz connects which two bodies of water?",
                        options: ["Red Sea and Mediterranean Sea", "Persian Gulf and Gulf of Oman", "Black Sea and Caspian Sea", "Baltic Sea and North Sea"],
                        correctIndex: 1,
                        explanation: "The Strait of Hormuz connects the Persian Gulf to the Gulf of Oman and is a critical shipping route for oil."
                    }
                ],
                science: [
                    {
                        text: "What is the approximate speed of light in a vacuum?",
                        options: ["300,000 km/s", "150,000 km/s", "1,000,000 km/s", "30,000 km/s"],
                        correctIndex: 0,
                        explanation: "The speed of light in a vacuum is approximately 299,792 kilometers per second, typically rounded to 300,000 km/s."
                    },
                    {
                        text: "Which of the following is NOT a type of elementary particle?",
                        options: ["Quark", "Lepton", "Photon", "Proton"],
                        correctIndex: 3,
                        explanation: "A proton is not an elementary particle but is composed of quarks. Quarks, leptons, and photons are elementary particles."
                    }
                ],
                literature: [
                    {
                        text: "Which novel begins with the line 'It was the best of times, it was the worst of times'?",
                        options: ["Moby Dick", "A Tale of Two Cities", "Great Expectations", "Oliver Twist"],
                        correctIndex: 1,
                        explanation: "Charles Dickens' 'A Tale of Two Cities' (1859) begins with this famous opening line, referring to London and Paris during the French Revolution."
                    },
                    {
                        text: "Who is the author of 'One Hundred Years of Solitude'?",
                        options: ["Jorge Luis Borges", "Gabriel García Márquez", "Isabel Allende", "Pablo Neruda"],
                        correctIndex: 1,
                        explanation: "Gabriel García Márquez wrote 'One Hundred Years of Solitude' (1967), a landmark work of magical realism."
                    }
                ],
                arts: [
                    {
                        text: "Which art movement is Salvador Dalí primarily associated with?",
                        options: ["Impressionism", "Cubism", "Surrealism", "Abstract Expressionism"],
                        correctIndex: 2,
                        explanation: "Salvador Dalí was a prominent figure in the Surrealist movement, known for his striking and bizarre images."
                    },
                    {
                        text: "Who composed 'The Four Seasons'?",
                        options: ["Johann Sebastian Bach", "Wolfgang Amadeus Mozart", "Ludwig van Beethoven", "Antonio Vivaldi"],
                        correctIndex: 3,
                        explanation: "Antonio Vivaldi composed 'The Four Seasons', a set of four violin concertos, around 1720."
                    }
                ]
            },
            hard: {
                history: [
                    {
                        text: "During which Chinese dynasty was the Great Wall significantly expanded to approximately its current form?",
                        options: ["Tang", "Song", "Ming", "Qing"],
                        correctIndex: 2,
                        explanation: "Although parts of the wall existed earlier, the Ming Dynasty (1368-1644) was responsible for the major expansions and renovations that created much of the Great Wall as it exists today."
                    },
                    {
                        text: "Who was the last Tsar of Russia?",
                        options: ["Nicholas II", "Alexander III", "Peter the Great", "Ivan the Terrible"],
                        correctIndex: 0,
                        explanation: "Nicholas II was the last Tsar of Russia, ruling from 1894 until his abdication in 1917. He and his family were executed in 1918."
                    }
                ],
                geography: [
                    {
                        text: "Which of these cities is located at the highest elevation?",
                        options: ["Mexico City", "Bogotá", "Quito", "La Paz"],
                        correctIndex: 3,
                        explanation: "La Paz, Bolivia, sits at approximately 3,650 meters (11,975 feet) above sea level, making it the highest capital city in the world."
                    },
                    {
                        text: "The Line of Control is a de facto border between which two countries?",
                        options: ["North Korea and South Korea", "India and Pakistan", "Israel and Palestine", "Sudan and South Sudan"],
                        correctIndex: 1,
                        explanation: "The Line of Control (LoC) is the military control line between the Indian and Pakistani controlled parts of the former princely state of Jammu and Kashmir."
                    }
                ],
                science: [
                    {
                        text: "Which of these is NOT one of the four fundamental forces of nature?",
                        options: ["Electromagnetic force", "Strong nuclear force", "Gravitational force", "Centrifugal force"],
                        correctIndex: 3,
                        explanation: "The four fundamental forces are electromagnetic, strong nuclear, weak nuclear, and gravitational. Centrifugal force is actually a fictitious force."
                    },
                    {
                        text: "Which of these scientists contributed to the development of quantum mechanics but was NOT awarded a Nobel Prize?",
                        options: ["Niels Bohr", "Max Planck", "Emmy Noether", "Werner Heisenberg"],
                        correctIndex: 2,
                        explanation: "Emmy Noether, despite her fundamental contributions to physics and algebra, never received a Nobel Prize, while the others did for their work in quantum physics."
                    }
                ],
                literature: [
                    {
                        text: "Which novel features a character named Captain Ahab?",
                        options: ["Moby Dick", "The Old Man and the Sea", "Treasure Island", "Twenty Thousand Leagues Under the Sea"],
                        correctIndex: 0,
                        explanation: "Captain Ahab is the monomaniacal captain of the whaling ship Pequod in Herman Melville's 'Moby Dick' (1851)."
                    },
                    {
                        text: "Which philosopher wrote 'Beyond Good and Evil'?",
                        options: ["Friedrich Nietzsche", "Jean-Paul Sartre", "Immanuel Kant", "Søren Kierkegaard"],
                        correctIndex: 0,
                        explanation: "Friedrich Nietzsche wrote 'Beyond Good and Evil' in 1886, which explores themes about morality, religion, and truthfulness."
                    }
                ],
                arts: [
                    {
                        text: "Who designed the Sagrada Familia in Barcelona?",
                        options: ["Frank Lloyd Wright", "Antoni Gaudí", "Le Corbusier", "Mies van der Rohe"],
                        correctIndex: 1,
                        explanation: "Antoni Gaudí designed the Sagrada Familia, which began construction in 1882 and is still being completed today."
                    },
                    {
                        text: "Which artist created the sculpture 'The Thinker'?",
                        options: ["Michelangelo", "Donatello", "Auguste Rodin", "Bernini"],
                        correctIndex: 2,
                        explanation: "Auguste Rodin created 'The Thinker' (Le Penseur) around 1880, originally as part of his larger work 'The Gates of Hell'."
                    }
                ]
            }
        };

        // Start with quiz board mode by default
        createQuizBoard();
    }
}

// Initialize library state
let userLibrary = {
    books: [],
    courses: []
};

// Function to sync user session with the server
function syncUserSession() {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('mentaura_user'));
    
    if (!userData || !userData.uid) {
        console.error('No user data found in localStorage');
        return Promise.reject('No user data found');
    }
    
    // Sync session with the server
    return fetch('http://localhost:5000/api/auth/sync-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
            uid: userData.uid
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Failed to sync session');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Session synchronized successfully');
        return data;
    })
    .catch(error => {
        console.error('Error syncing session:', error);
        throw error;
    });
}

// Load library data from localStorage
function loadLibraryData() {
    try {
        const savedLibrary = localStorage.getItem('mentaura_library');
        if (savedLibrary) {
            const parsedData = JSON.parse(savedLibrary);
            // Ensure the loaded data has the correct structure
            userLibrary = {
                books: Array.isArray(parsedData.books) ? parsedData.books : [],
                courses: Array.isArray(parsedData.courses) ? parsedData.courses : []
            };
            // Ensure all items have IDs
            ensureLibraryItemsHaveIds();
            console.log('Library data loaded successfully:', userLibrary);
        }
    } catch (error) {
        console.error('Error loading library data:', error);
        // Reset to empty state if there's an error
        userLibrary = { books: [], courses: [] };
    }
}

// Ensure all library items have unique IDs
function ensureLibraryItemsHaveIds() {
    // Add IDs to books if missing
    userLibrary.books = userLibrary.books.map(book => {
        if (!book.id) {
            book.id = `book-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }
        return book;
    });
    
    // Add IDs to courses if missing
    userLibrary.courses = userLibrary.courses.map(course => {
        if (!course.id) {
            course.id = `course-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }
        return course;
    });
    
    // Save the updated library
    saveLibraryData();
}

// Save library data to localStorage
function saveLibraryData() {
    try {
        localStorage.setItem('mentaura_library', JSON.stringify(userLibrary));
        console.log('Library data saved successfully');
    } catch (error) {
        console.error('Error saving library data:', error);
    }
}

// Function to add a book to the library
function addBookToLibrary(book) {
    // Check if book is already in library
    if (!userLibrary.books.some(b => b.title === book.title)) {
        userLibrary.books.push(book);
        saveLibraryData(); // Save to localStorage
        updateLibraryView(document.querySelector('.library-tab.active').dataset.tab);
    }
}

// Function to remove an item from the library
function removeFromLibrary(itemId, itemType) {
    try {
        if (!itemId) {
            console.error('Missing item ID in removeFromLibrary');
            return;
        }
        
        // If itemType is missing, try to infer it
        if (!itemType) {
            // Try to find the item in the library
            const bookItem = userLibrary.books.find(book => book.id === itemId);
            if (bookItem) {
                itemType = 'book';
            } else {
                const courseItem = userLibrary.courses.find(course => course.id === itemId);
                if (courseItem) {
                    itemType = 'course';
                } else {
                    // Default type if we can't determine
                    itemType = 'item';
                }
            }
        }
        
        // Show confirmation dialog
        if (!confirm(`Are you sure you want to remove this ${itemType} from your library?`)) {
            return;
        }
        
        // Check if the item is from web search
        const isWebSearchItem = 
            (itemId && itemId.toString().includes('web-')) || 
            (itemType === 'websearch') || 
            (itemType === 'web_result') ||
            (userLibrary.books.some(book => book.id === itemId && (book.fromWebSearch || book.source === 'web_search'))) ||
            (userLibrary.courses.some(course => course.id === itemId && (course.fromWebSearch || course.source === 'web_search')));
        
        // For web search items, we don't need to check session or make API call
        if (isWebSearchItem) {
            // Just update local storage and UI
            updateLocalLibrary(itemId, itemType);
            showNotification(`Item removed from library`, 'success');
            return;
        }
        
        // Check session status first (for non-web search items)
        fetch('http://localhost:5000/api/auth/check-session', {
            method: 'GET',
            credentials: 'include',
            mode: 'cors'
        })
        .then(response => response.json())
        .then(data => {
            if (!data.authenticated) {
                // Session not found, sync it first
                console.log('Session not found, syncing...');
                return syncUserSession().then(() => true);
            }
            return true;
        })
        .then(sessionValid => {
            if (!sessionValid) {
                throw new Error('Failed to establish session');
            }
            
            // Make API call to remove the item
            return fetch('http://localhost:5000/api/learning/library/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                mode: 'cors',
                body: JSON.stringify({
                    id: itemId,
                    type: itemType
                })
            });
        })
        .then(response => {
            // Update local storage and UI regardless of server response
            // This ensures items appear to be removed on the client side
            updateLocalLibrary(itemId, itemType);
            
            if (response.status === 401) {
                // Handle unauthorized error but still update UI
                console.warn('Server authentication failed, but item removed from local library');
                return { message: `${itemType} removed from library` };
            }
            if (!response.ok) {
                return response.json().then(err => {
                    console.warn('Server error, but item removed from local library:', err);
                    return { message: `${itemType} removed from library` };
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.warn('API returned error, but item removed from local library:', data.error);
            }
            
            // Show success notification
            showNotification(`${itemType} removed from library`);
        })
        .catch(error => {
            console.error('Error removing item:', error);
            // Still update local library even if there's a complete failure
            updateLocalLibrary(itemId, itemType);
            showNotification(`${itemType} removed from local library`, 'warning');
        });
    } catch (error) {
        console.error('Unexpected error in removeFromLibrary:', error);
        // Try to remove the item from local library anyway
        try {
            if (itemId) {
                userLibrary.books = userLibrary.books.filter(book => book.id !== itemId);
                userLibrary.courses = userLibrary.courses.filter(course => course.id !== itemId);
                saveLibraryData();
                updateLibraryView(document.querySelector('.library-tab.active')?.dataset.tab || 'all');
                showNotification('Item removed from library', 'success');
            }
        } catch (e) {
            console.error('Failed to remove item as fallback:', e);
        }
    }
}

// Function to add a course to the library
function addCourseToLibrary(courseId) {
    const courseCard = document.querySelector(`.course-card [data-course="${courseId}"]`).closest('.course-card');
    if (!courseCard) return;

    const courseInfo = {
        id: `course-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Add a truly unique ID
        type: 'course',
        title: courseCard.querySelector('h4').textContent,
        description: courseCard.querySelector('p').textContent,
        icon: courseCard.querySelector('.course-icon i').className
    };

    // Check if course is already in library
    if (!userLibrary.courses.some(course => course.title === courseInfo.title)) {
        userLibrary.courses.push(courseInfo);
        saveLibraryData(); // Save to localStorage
        updateLibraryView(document.querySelector('.library-tab.active').dataset.tab);
        
        // Update button state
        const addButton = courseCard.querySelector('.add-to-library-btn');
        if (addButton) {
            addButton.textContent = 'Added to Library';
            addButton.classList.add('added');
        }
    }
}

// Initialize library section
function initializeLibrarySection() {
    loadLibraryData(); // Load saved library data
    const librarySection = document.querySelector('.library-section');
    if (!librarySection) return;

    // Create library tabs
    const libraryTabs = document.createElement('div');
    libraryTabs.className = 'library-tabs';
    libraryTabs.innerHTML = `
        <div class="library-tab active" data-tab="all">All Items</div>
        <div class="library-tab" data-tab="books">Books</div>
        <div class="library-tab" data-tab="courses">Courses</div>
    `;

    // Create library content container
    const libraryContent = document.createElement('div');
    libraryContent.className = 'library-content active';
    libraryContent.id = 'library-grid';

    // Add tabs and content to library section
    librarySection.appendChild(libraryTabs);
    librarySection.appendChild(libraryContent);

    // Add event listeners for tabs
    const tabs = libraryTabs.querySelectorAll('.library-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            updateLibraryView(tab.dataset.tab);
        });
    });

    // Initialize library view
    updateLibraryView('all');
}

// Function to update library view based on selected tab
function updateLibraryView(tab) {
    const libraryGrid = document.getElementById('library-grid');
    if (!libraryGrid) return;

    // Clear current content
    libraryGrid.innerHTML = '';

    // Get items to display based on selected tab
    let itemsToDisplay = [];
    if (tab === 'all') {
        itemsToDisplay = [...userLibrary.books, ...userLibrary.courses];
    } else if (tab === 'books') {
        itemsToDisplay = userLibrary.books;
    } else if (tab === 'courses') {
        itemsToDisplay = userLibrary.courses;
    }

    // Display items or empty state
    if (itemsToDisplay.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'library-empty';
        emptyState.innerHTML = `
            <i class="fas fa-books"></i>
            <p>No ${tab === 'all' ? 'items' : tab} in your library yet.</p>
        `;
        libraryGrid.appendChild(emptyState);
    } else {
        itemsToDisplay.forEach(item => {
            const libraryItem = createLibraryItem(item);
            libraryGrid.appendChild(libraryItem);
        });
    }
}

// Function to create a library item element
function createLibraryItem(item) {
    const itemElement = document.createElement('div');
    itemElement.className = 'library-item';
    
    // Ensure item has the necessary properties
    if (!item) {
        console.error('Invalid item passed to createLibraryItem');
        return document.createElement('div'); // Return empty div to avoid errors
    }
    
    // Generate a unique ID if not present
    if (!item.id) {
        item.id = `${item.type || 'item'}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        // Save the updated library data with the new ID
        saveLibraryData();
    }
    
    // Ensure item has a type
    if (!item.type) {
        // Try to determine type from properties or just set a default
        if (item.author || item.year) {
            item.type = 'book';
        } else if (item.modules || item.lessons) {
            item.type = 'course';
        } else {
            item.type = 'general';
        }
        saveLibraryData();
    }
    
    // Mark web search items explicitly
    if (item.source === 'web_search' || item.fromWebSearch || (item.id && item.id.toString().includes('web-'))) {
        item.fromWebSearch = true;
        if (!item.id.toString().includes('web-')) {
            item.id = `web-${item.id}`;
        }
        saveLibraryData();
    }
    
    itemElement.dataset.id = item.id;
    itemElement.dataset.type = item.type;
    
    const iconClass = item.icon || (item.type === 'book' ? 'fas fa-book' : 'fas fa-graduation-cap');
    
    itemElement.innerHTML = `
        <div class="item-icon">
            <i class="${iconClass}"></i>
        </div>
        <div class="item-info">
            <h4>${item.title || 'Untitled'}</h4>
            <p>${item.description || ''}</p>
        </div>
        <div class="item-actions">
            <button class="remove-item-btn" title="Remove from library">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Add event listener for remove button
    const removeBtn = itemElement.querySelector('.remove-item-btn');
    removeBtn.addEventListener('click', () => {
        removeFromLibrary(item.id, item.type);
    });
    
    return itemElement;
}

// Helper function to update local library data
function updateLocalLibrary(itemId, itemType) {
    // Handle case where itemId or itemType might be undefined or null
    if (!itemId) {
        console.warn('Missing itemId in updateLocalLibrary');
        return;
    }
    
    // If itemType is missing, try to infer it from the library data
    if (!itemType) {
        // Check if it exists in books
        if (userLibrary.books.some(book => book.id === itemId)) {
            itemType = 'book';
        } 
        // Check if it exists in courses
        else if (userLibrary.courses.some(course => course.id === itemId)) {
            itemType = 'course';
        }
        // If still no itemType, remove from both collections
        else {
            userLibrary.books = userLibrary.books.filter(book => book.id !== itemId);
            userLibrary.courses = userLibrary.courses.filter(course => course.id !== itemId);
            saveLibraryData();
            updateLibraryView(document.querySelector('.library-tab.active')?.dataset.tab || 'all');
            return;
        }
    }
    
    // Handle web search items specially
    const isWebSearchItem = 
        itemId.toString().includes('web-') || 
        itemType === 'websearch' || 
        itemType === 'web_result';
        
    if (isWebSearchItem) {
        // Remove from both collections to be safe
        userLibrary.books = userLibrary.books.filter(book => book.id !== itemId);
        userLibrary.courses = userLibrary.courses.filter(course => course.id !== itemId);
    } else if (itemType === 'book') {
        userLibrary.books = userLibrary.books.filter(book => book.id !== itemId);
    } else if (itemType === 'course') {
        userLibrary.courses = userLibrary.courses.filter(course => course.id !== itemId);
    }
    
    saveLibraryData();
    
    // Update the library view
    const activeTab = document.querySelector('.library-tab.active');
    updateLibraryView(activeTab ? activeTab.dataset.tab : 'all');
}

// Add event listeners for Add to Library buttons
document.addEventListener('DOMContentLoaded', () => {
    // Load library data immediately when the page loads
    loadLibraryData();
    
    const addToLibraryButtons = document.querySelectorAll('.add-to-library-btn');
    addToLibraryButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const courseId = button.dataset.course;
            addCourseToLibrary(courseId);
        });
    });

    // Initialize library section
    initializeLibrarySection();
});

function generateCoursePlan(courseType) {
    const coursePlans = {
        'full-stack': {
            title: 'Full Stack Development',
            modules: [
                {
                    title: 'Frontend Fundamentals',
                    description: 'Learn HTML, CSS, and JavaScript basics',
                    topics: [
                        'HTML5 and Semantic Markup',
                        'CSS3 and Responsive Design',
                        'JavaScript ES6+ Fundamentals',
                        'DOM Manipulation',
                        'Event Handling'
                    ],
                    icon: 'fas fa-code',
                    progress: 0,
                    progressBarColor: 'grey'
                },
                {
                    title: 'Backend Development',
                    description: 'Master server-side programming and databases',
                    topics: [
                        'Node.js and Express.js',
                        'RESTful API Design',
                        'MongoDB and Mongoose',
                        'Authentication and Authorization',
                        'Error Handling'
                    ],
                    icon: 'fas fa-server',
                    progress: 0,
                    progressBarColor: 'grey'
                },
                {
                    title: 'Full Stack Integration',
                    description: 'Combine frontend and backend to build complete applications',
                    topics: [
                        'State Management',
                        'API Integration',
                        'Deployment Strategies',
                        'Performance Optimization',
                        'Security Best Practices'
                    ],
                    icon: 'fas fa-sitemap',
                    progress: 0,
                    progressBarColor: 'grey'
                }
            ]
        },
        'math': {
            title: 'Basic Mathematics',
            modules: [
                {
                    title: 'Arithmetic Fundamentals',
                    description: 'Master basic mathematical operations',
                    topics: [
                        'Number Systems',
                        'Basic Operations',
                        'Fractions and Decimals',
                        'Percentages',
                        'Ratio and Proportion'
                    ],
                    icon: 'fas fa-calculator',
                    progress: 0,
                    progressBarColor: 'grey'
                },
                {
                    title: 'Algebra Basics',
                    description: 'Introduction to algebraic concepts',
                    topics: [
                        'Variables and Expressions',
                        'Linear Equations',
                        'Quadratic Equations',
                        'Polynomials',
                        'Factoring'
                    ],
                    icon: 'fas fa-square-root-alt',
                    progress: 0,
                    progressBarColor: 'grey'
                },
                {
                    title: 'Geometry Essentials',
                    description: 'Explore shapes and spatial relationships',
                    topics: [
                        'Basic Geometric Shapes',
                        'Angles and Triangles',
                        'Perimeter and Area',
                        'Volume and Surface Area',
                        'Coordinate Geometry'
                    ],
                    icon: 'fas fa-shapes',
                    progress: 0,
                    progressBarColor: 'grey'
                }
            ]
        },
        'machine-learning': {
            title: 'Machine Learning',
            modules: [
                {
                    title: 'Introduction to ML',
                    description: 'Learn the fundamentals of machine learning',
                    topics: [
                        'What is Machine Learning?',
                        'Types of ML Algorithms',
                        'Data Preprocessing',
                        'Feature Engineering',
                        'Model Evaluation'
                    ],
                    icon: 'fas fa-brain',
                    progress: 0,
                    progressBarColor: 'grey'
                },
                {
                    title: 'Supervised Learning',
                    description: 'Master algorithms that learn from labeled data',
                    topics: [
                        'Linear Regression',
                        'Logistic Regression',
                        'Decision Trees',
                        'Random Forests',
                        'Support Vector Machines'
                    ],
                    icon: 'fas fa-chart-line',
                    progress: 0,
                    progressBarColor: 'grey'
                },
                {
                    title: 'Deep Learning',
                    description: 'Explore neural networks and deep learning',
                    topics: [
                        'Neural Networks Basics',
                        'Convolutional Neural Networks',
                        'Recurrent Neural Networks',
                        'Transfer Learning',
                        'Model Deployment'
                    ],
                    icon: 'fas fa-network-wired',
                    progress: 0,
                    progressBarColor: 'grey'
                }
            ]
        },
        'mobile-dev': {
            title: 'Mobile App Development',
            modules: [
                {
                    title: 'Mobile Development Basics',
                    description: 'Learn the fundamentals of mobile app development',
                    topics: [
                        'Mobile Development Overview',
                        'UI/UX Design Principles',
                        'Platform Differences',
                        'Development Tools',
                        'App Architecture'
                    ],
                    icon: 'fas fa-mobile-alt',
                    progress: 0,
                    progressBarColor: 'grey'
                },
                {
                    title: 'Native Development',
                    description: 'Build apps for specific platforms',
                    topics: [
                        'iOS Development with Swift',
                        'Android Development with Kotlin',
                        'Platform APIs',
                        'Device Features',
                        'Performance Optimization'
                    ],
                    icon: 'fas fa-code-branch',
                    progress: 0,
                    progressBarColor: 'grey'
                },
                {
                    title: 'Cross-Platform Development',
                    description: 'Create apps that work across multiple platforms',
                    topics: [
                        'React Native Basics',
                        'Flutter Development',
                        'Cross-Platform APIs',
                        'State Management',
                        'App Publishing'
                    ],
                    icon: 'fas fa-sync',
                    progress: 0,
                    progressBarColor: 'grey'
                }
            ]
        },
        'data-science': {
            title: 'Data Science',
            modules: [
                {
                    title: 'Data Analysis',
                    description: 'Learn to analyze and interpret data',
                    topics: [
                        'Data Collection',
                        'Data Cleaning',
                        'Exploratory Data Analysis',
                        'Statistical Analysis',
                        'Data Visualization'
                    ],
                    icon: 'fas fa-chart-bar',
                    progress: 0,
                    progressBarColor: 'grey'
                },
                {
                    title: 'Data Processing',
                    description: 'Master data processing techniques',
                    topics: [
                        'Pandas and NumPy',
                        'Data Transformation',
                        'Feature Engineering',
                        'Time Series Analysis',
                        'Big Data Tools'
                    ],
                    icon: 'fas fa-database',
                    progress: 0,
                    progressBarColor: 'grey'
                },
                {
                    title: 'Advanced Analytics',
                    description: 'Apply advanced analytical techniques',
                    topics: [
                        'Predictive Modeling',
                        'Clustering Analysis',
                        'Natural Language Processing',
                        'Computer Vision',
                        'Model Deployment'
                    ],
                    icon: 'fas fa-chart-pie',
                    progress: 0,
                    progressBarColor: 'grey'
                }
            ]
        },
        'cybersecurity': {
            title: 'Cybersecurity',
            modules: [
                {
                    title: 'Security Fundamentals',
                    description: 'Learn the basics of cybersecurity',
                    topics: [
                        'Security Concepts',
                        'Threat Landscape',
                        'Risk Management',
                        'Security Policies',
                        'Compliance Standards'
                    ],
                    icon: 'fas fa-shield-alt',
                    progress: 0,
                    progressBarColor: 'grey'
                },
                {
                    title: 'Network Security',
                    description: 'Protect network infrastructure',
                    topics: [
                        'Network Protocols',
                        'Firewalls and IDS',
                        'VPN and Encryption',
                        'Wireless Security',
                        'Network Monitoring'
                    ],
                    icon: 'fas fa-network-wired',
                    progress: 0,
                    progressBarColor: 'grey'
                },
                {
                    title: 'Application Security',
                    description: 'Secure software applications',
                    topics: [
                        'Secure Coding',
                        'Web Application Security',
                        'Mobile Security',
                        'Penetration Testing',
                        'Incident Response'
                    ],
                    icon: 'fas fa-lock',
                    progress: 0,
                    progressBarColor: 'grey'
                }
            ]
        },
        'cloud-computing': {
            title: 'Cloud Computing',
            modules: [
                {
                    title: 'Cloud Fundamentals',
                    description: 'Understand cloud computing basics',
                    topics: [
                        'Cloud Concepts',
                        'Service Models',
                        'Deployment Models',
                        'Cloud Providers',
                        'Cloud Economics'
                    ],
                    icon: 'fas fa-cloud',
                    progress: 0,
                    progressBarColor: 'grey'
                },
                {
                    title: 'Cloud Services',
                    description: 'Master cloud service offerings',
                    topics: [
                        'Compute Services',
                        'Storage Services',
                        'Database Services',
                        'Networking Services',
                        'Security Services'
                    ],
                    icon: 'fas fa-server',
                    progress: 0,
                    progressBarColor: 'grey'
                },
                {
                    title: 'Cloud Architecture',
                    description: 'Design cloud-based solutions',
                    topics: [
                        'Architecture Patterns',
                        'Scalability',
                        'High Availability',
                        'Disaster Recovery',
                        'Cost Optimization'
                    ],
                    icon: 'fas fa-sitemap',
                    progress: 0,
                    progressBarColor: 'grey'
                }
            ]
        },
        'game-dev': {
            title: 'Game Development',
            modules: [
                {
                    title: 'Game Design',
                    description: 'Learn game design principles',
                    topics: [
                        'Game Mechanics',
                        'Level Design',
                        'Game Balance',
                        'Player Psychology',
                        'Game Documentation'
                    ],
                    icon: 'fas fa-gamepad',
                    progress: 0,
                    progressBarColor: 'grey'
                },
                {
                    title: 'Game Programming',
                    description: 'Master game development programming',
                    topics: [
                        'Game Engines',
                        'Physics Simulation',
                        'AI Programming',
                        'Multiplayer Networking',
                        'Performance Optimization'
                    ],
                    icon: 'fas fa-code',
                    progress: 0,
                    progressBarColor: 'grey'
                },
                {
                    title: 'Game Production',
                    description: 'Complete the game development process',
                    topics: [
                        'Asset Creation',
                        'Sound Design',
                        'Testing and QA',
                        'Publishing',
                        'Monetization'
                    ],
                    icon: 'fas fa-cogs',
                    progress: 0,
                    progressBarColor: 'grey'
                }
            ]
        },
        'ui-ux': {
            title: 'UI/UX Design',
            modules: [
                {
                    title: 'Design Fundamentals',
                    description: 'Learn core design principles',
                    topics: [
                        'Design Theory',
                        'Color Theory',
                        'Typography',
                        'Layout Principles',
                        'Visual Hierarchy'
                    ],
                    icon: 'fas fa-palette',
                    progress: 0,
                    progressBarColor: 'grey'
                },
                {
                    title: 'User Experience',
                    description: 'Master UX design concepts',
                    topics: [
                        'User Research',
                        'Information Architecture',
                        'Wireframing',
                        'Prototyping',
                        'Usability Testing'
                    ],
                    icon: 'fas fa-users',
                    progress: 0,
                    progressBarColor: 'grey'
                },
                {
                    title: 'UI Development',
                    description: 'Implement designs in code',
                    topics: [
                        'Design Systems',
                        'Responsive Design',
                        'Animation',
                        'Accessibility',
                        'Design Tools'
                    ],
                    icon: 'fas fa-laptop-code',
                    progress: 0,
                    progressBarColor: 'grey'
                }
            ]
        },
        'nlp': {
            title: 'Natural Language Processing',
            modules: [
                {
                    title: 'NLP Fundamentals',
                    description: 'Learn the basics of NLP',
                    topics: [
                        'Text Processing',
                        'Tokenization',
                        'Part-of-Speech Tagging',
                        'Named Entity Recognition',
                        'Text Classification'
                    ],
                    icon: 'fas fa-language',
                    progress: 0,
                    progressBarColor: 'grey'
                },
                {
                    title: 'Advanced NLP',
                    description: 'Explore advanced NLP techniques',
                    topics: [
                        'Word Embeddings',
                        'Sequence Models',
                        'Attention Mechanisms',
                        'Transformers',
                        'BERT and GPT'
                    ],
                    icon: 'fas fa-brain',
                    progress: 0,
                    progressBarColor: 'grey'
                },
                {
                    title: 'NLP Applications',
                    description: 'Build real-world NLP applications',
                    topics: [
                        'Chatbots',
                        'Machine Translation',
                        'Sentiment Analysis',
                        'Text Generation',
                        'Model Deployment'
                    ],
                    icon: 'fas fa-robot',
                    progress: 0,
                    progressBarColor: 'grey'
                }
            ]
        },
        'robotics': {
            title: 'Robotics',
            modules: [
                {
                    title: 'Robotics Fundamentals',
                    description: 'Learn the basics of robotics',
                    topics: [
                        'Robot Components',
                        'Sensors and Actuators',
                        'Control Systems',
                        'Robot Kinematics',
                        'Robot Programming'
                    ],
                    icon: 'fas fa-robot',
                    progress: 0,
                    progressBarColor: 'grey'
                },
                {
                    title: 'Robot Control',
                    description: 'Master robot control systems',
                    topics: [
                        'Motion Planning',
                        'Path Planning',
                        'Robot Vision',
                        'Robot Learning',
                        'Multi-Robot Systems'
                    ],
                    icon: 'fas fa-cogs',
                    progress: 0,
                    progressBarColor: 'grey'
                },
                {
                    title: 'Advanced Robotics',
                    description: 'Explore advanced robotics concepts',
                    topics: [
                        'Autonomous Navigation',
                        'Human-Robot Interaction',
                        'Robot Ethics',
                        'Industrial Robotics',
                        'Robot Applications'
                    ],
                    icon: 'fas fa-industry',
                    progress: 0,
                    progressBarColor: 'grey'
                }
            ]
        },
        'blockchain': {
            title: 'Blockchain Development',
            modules: [
                {
                    title: 'Blockchain Basics',
                    description: 'Learn blockchain fundamentals',
                    topics: [
                        'Blockchain Concepts',
                        'Cryptography',
                        'Consensus Mechanisms',
                        'Smart Contracts',
                        'Blockchain Networks'
                    ],
                    icon: 'fas fa-cubes',
                    progress: 0,
                    progressBarColor: 'grey'
                },
                {
                    title: 'Smart Contract Development',
                    description: 'Master smart contract programming',
                    topics: [
                        'Solidity Programming',
                        'Smart Contract Design',
                        'Testing and Debugging',
                        'Security Best Practices',
                        'Gas Optimization'
                    ],
                    icon: 'fas fa-file-contract',
                    progress: 0,
                    progressBarColor: 'grey'
                },
                {
                    title: 'DApp Development',
                    description: 'Build decentralized applications',
                    topics: [
                        'Web3.js',
                        'DApp Architecture',
                        'Token Standards',
                        'DeFi Applications',
                        'DApp Deployment'
                    ],
                    icon: 'fas fa-cube',
                    progress: 0,
                    progressBarColor: 'grey'
                }
            ]
        }
    };

    return coursePlans[courseType] || {
        title: 'Course Plan',
        modules: [
            {
                title: 'Module 1: Foundations',
                description: 'Build a strong foundation in the subject',
                topics: [
                    'Introduction to Core Concepts',
                    'Essential Terminology',
                    'Basic Principles and Theories',
                    'Fundamental Skills Development',
                    'Learning Resources and Tools'
                ],
                icon: 'fas fa-book',
                progress: 0,
                progressBarColor: 'grey'
            },
            {
                title: 'Module 2: Intermediate Concepts',
                description: 'Develop deeper understanding and practical skills',
                topics: [
                    'Advanced Theory and Applications',
                    'Problem-Solving Techniques',
                    'Case Studies and Examples',
                    'Practical Exercises',
                    'Skill Integration'
                ],
                icon: 'fas fa-book',
                progress: 0,
                progressBarColor: 'grey'
            },
            {
                title: 'Module 3: Advanced Applications',
                description: 'Master advanced topics and real-world applications',
                topics: [
                    'Complex Problem Solving',
                    'Real-World Scenarios',
                    'Advanced Techniques',
                    'Project Development',
                    'Best Practices and Optimization'
                ],
                icon: 'fas fa-book',
                progress: 0,
                progressBarColor: 'grey'
            }
        ]
    };
}

// Function to complete the logout process
function completeLogout() {
    console.log('Logging out user');
    
    // Clear local storage
    localStorage.removeItem('mentaura_user');
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('mentaura_messages');
    localStorage.removeItem('mentaura_active_tab');
    localStorage.removeItem('mentaura_library');
    
    // Redirect to login page
    window.location.href = 'index.html?logged_out=true';
}

// Function to show profile modal
function showProfileModal(user) {
    console.log('Showing profile modal');
    
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'profile-modal';
    
    // Get initial letter for avatar
    const firstLetter = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    
    // Create modal content with profile information
    modal.innerHTML = `
        <div class="modal-content profile-modal-content">
            <button class="close-modal">&times;</button>
            <h2>Your Profile</h2>
            <div class="profile-details">
                <div class="profile-avatar-large">
                    <div class="avatar-circle-large">${firstLetter}</div>
                </div>
                <div class="profile-info-details">
                    <div class="info-row">
                        <span class="info-label">Name:</span>
                        <span class="info-value">${user.name || ''}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Username:</span>
                        <span class="info-value">${user.username || ''}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Learning Type:</span>
                        <span class="info-value learning-badge">${user.learningType || 'Personal Growth'}</span>
                    </div>
                </div>
            </div>
            <div class="form-actions">
                <button class="primary-btn" id="edit-profile-btn">Edit Profile</button>
            </div>
        </div>
    `;
    
    // Add modal to document
    document.body.appendChild(modal);
    
    // Show modal with animation
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Handle close button
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    });
    
    // Handle edit profile button
    const editProfileBtn = modal.querySelector('#edit-profile-btn');
    editProfileBtn.addEventListener('click', () => {
        // Close current modal
        modal.classList.remove('active');
        setTimeout(() => {
            document.body.removeChild(modal);
            // Show edit profile modal
            showEditProfileModal(user);
        }, 300);
    });
}

// Function to show edit profile modal
function showEditProfileModal(user) {
    console.warn('showEditProfileModal in dashboard.js should not be called, use profile.js version instead');
    // This is intentionally left empty to avoid conflicts with profile.js
    return;
}

// Function to show settings modal
function showSettingsModal() {
    console.warn('showSettingsModal in dashboard.js should not be called, use profile.js version instead');
    // This is intentionally left empty to avoid conflicts with profile.js
    return;
}

// Add new game functions
function startCodeMasterGame(container) {
    let score = 0;
    let level = 1;
    let timeLeft = 300; // 5 minutes per challenge
    let timer;

    // Create game UI
    container.innerHTML = `
        <div class="code-master-container">
            <div class="code-master-header">
                <h2>Code Master</h2>
                <div class="game-stats">
                    <div class="timer">Time: <span id="time-left">${timeLeft}</span>s</div>
                    <div class="score">Score: <span id="score">${score}</span></div>
                    <div class="level">Level: <span id="level">${level}</span></div>
                </div>
            </div>
            <div class="code-challenge">
                <div class="challenge-description" id="challenge-desc"></div>
                <div class="code-editor">
                    <textarea id="code-input" placeholder="Write your code here..."></textarea>
                </div>
                <div class="test-cases" id="test-cases"></div>
                <div class="controls">
                    <button id="run-code">Run Code</button>
                    <button id="submit-code">Submit</button>
                </div>
                <div class="feedback" id="code-feedback"></div>
            </div>
        </div>
    `;

    // Get current challenge
    const currentChallenge = generateCodingChallenge(level);
    document.getElementById('challenge-desc').innerHTML = currentChallenge.description;
    
    // Display test cases
    const testCasesContainer = document.getElementById('test-cases');
    testCasesContainer.innerHTML = '<h4>Test Cases:</h4>' + 
        currentChallenge.testCases.map(test => 
            `<div class="test-case">
                <div>Input: ${test.input}</div>
                <div>Expected Output: ${test.output}</div>
            </div>`
        ).join('');

    // Add event listeners
    document.getElementById('run-code').addEventListener('click', () => {
        const code = document.getElementById('code-input').value;
        runCode(code, currentChallenge.testCases);
    });

    document.getElementById('submit-code').addEventListener('click', () => {
        const code = document.getElementById('code-input').value;
        submitCode(code, currentChallenge);
    });

    // Start timer
    startTimer();
}

function startBusinessTycoonGame(container) {
    let money = 10000;
    let day = 1;
    let reputation = 50;
    
    // Create game UI
    container.innerHTML = `
        <div class="business-tycoon-container">
            <div class="business-header">
                <h2>Business Tycoon</h2>
                <div class="business-stats">
                    <div class="money">Money: $<span id="money">${money}</span></div>
                    <div class="day">Day: <span id="day">${day}</span></div>
                    <div class="reputation">Reputation: <span id="reputation">${reputation}</span></div>
                </div>
            </div>
            <div class="business-main">
                <div class="business-actions">
                    <h3>Actions</h3>
                    <button id="buy-inventory">Buy Inventory</button>
                    <button id="hire-staff">Hire Staff</button>
                    <button id="marketing">Marketing</button>
                    <button id="research">Market Research</button>
                </div>
                <div class="business-dashboard">
                    <div class="market-trends" id="market-trends"></div>
                    <div class="staff-management" id="staff-list"></div>
                    <div class="inventory" id="inventory"></div>
                </div>
                <div class="business-events" id="events-log">
                    <h3>Business Events</h3>
                </div>
            </div>
        </div>
    `;

    // Initialize game systems
    initializeMarket();
    initializeInventory();
    initializeStaff();
    startBusinessDay();
}

function startHistoryQuestGame(container) {
    let score = 0;
    let currentPeriod = 'ancient';
    let progress = 0;
    
    // Create game UI
    container.innerHTML = `
        <div class="history-quest-container">
            <div class="history-header">
                <h2>History Quest</h2>
                <div class="quest-stats">
                    <div class="score">Score: <span id="history-score">${score}</span></div>
                    <div class="period">Period: <span id="current-period">${currentPeriod}</span></div>
                    <div class="progress">Progress: <span id="quest-progress">${progress}%</span></div>
                </div>
            </div>
            <div class="history-main">
                <div class="scenario" id="history-scenario">
                    <h3>Historical Scenario</h3>
                    <div id="scenario-description"></div>
                </div>
                <div class="decisions" id="decision-options"></div>
                <div class="artifacts" id="discovered-artifacts"></div>
                <div class="timeline" id="historical-timeline"></div>
            </div>
            <div class="history-feedback" id="history-feedback"></div>
        </div>
    `;

    // Start the first scenario
    loadHistoricalScenario(currentPeriod);
}

function startLanguageLabGame(container) {
    let score = 0;
    let level = 1;
    let currentLanguage = 'spanish';
    
    // Create game UI
    container.innerHTML = `
        <div class="language-lab-container">
            <div class="language-header">
                <h2>Language Lab</h2>
                <div class="language-stats">
                    <div class="score">Score: <span id="language-score">${score}</span></div>
                    <div class="level">Level: <span id="language-level">${level}</span></div>
                    <div class="language">Language: 
                        <select id="language-select">
                            <option value="spanish">Spanish</option>
                            <option value="french">French</option>
                            <option value="german">German</option>
                            <option value="italian">Italian</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="language-main">
                <div class="exercise-area" id="exercise-area"></div>
                <div class="word-bank" id="word-bank"></div>
                <div class="controls">
                    <button id="check-answer">Check Answer</button>
                    <button id="next-exercise">Next Exercise</button>
                </div>
            </div>
            <div class="pronunciation-area">
                <div id="pronunciation-feedback"></div>
                <button id="practice-pronunciation">Practice Pronunciation</button>
            </div>
        </div>
    `;

    // Initialize language learning
    loadLanguageExercise(currentLanguage, level);
    setupLanguageControls();
}

// Helper functions for Code Master
function generateCodingChallenge(level) {
    const challenges = {
        1: {
            description: `
                <h3>Function Challenge</h3>
                <p>Write a function that takes a number and returns its factorial.</p>
                <p>Example: factorial(5) should return 120 (5 * 4 * 3 * 2 * 1)</p>
            `,
            testCases: [
                { input: '5', output: '120' },
                { input: '0', output: '1' },
                { input: '3', output: '6' }
            ],
            solution: 'function factorial(n) {\n  if (n === 0) return 1;\n  return n * factorial(n-1);\n}'
        },
        2: {
            description: `
                <h3>Array Challenge</h3>
                <p>Write a function that finds the missing number in an array of consecutive numbers.</p>
                <p>Example: findMissing([1,2,4,5]) should return 3</p>
            `,
            testCases: [
                { input: '[1,2,4,5]', output: '3' },
                { input: '[1,3,4,5]', output: '2' },
                { input: '[2,3,4,6]', output: '5' }
            ]
        }
    };
    return challenges[level] || challenges[1];
}

function runCode(code, testCases) {
    const feedback = document.getElementById('code-feedback');
    try {
        // In a real implementation, this would run in a sandbox
        const result = eval(code);
        feedback.innerHTML = '<div class="success">Code runs successfully!</div>';
    } catch (error) {
        feedback.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}

function submitCode(code, challenge) {
    const feedback = document.getElementById('code-feedback');
    // In a real implementation, this would:
    // 1. Run the code against all test cases
    // 2. Check code quality and efficiency
    // 3. Provide detailed feedback
    // 4. Update score and level
    feedback.innerHTML = '<div class="success">Challenge completed! Moving to next level...</div>';
}

// Helper functions for Business Tycoon
function initializeMarket() {
    const trends = document.getElementById('market-trends');
    trends.innerHTML = `
        <h3>Market Trends</h3>
        <div class="trend-item">Consumer Demand: High</div>
        <div class="trend-item">Competition Level: Medium</div>
        <div class="trend-item">Economic Conditions: Stable</div>
    `;
}

function initializeInventory() {
    const inventory = document.getElementById('inventory');
    inventory.innerHTML = `
        <h3>Inventory</h3>
        <div class="inventory-item">Product A: 50 units</div>
        <div class="inventory-item">Product B: 30 units</div>
        <div class="inventory-item">Product C: 20 units</div>
    `;
}

function initializeStaff() {
    const staff = document.getElementById('staff-list');
    staff.innerHTML = `
        <h3>Staff</h3>
        <div class="staff-member">Sales Associate (2)</div>
        <div class="staff-member">Manager (1)</div>
    `;
}

function startBusinessDay() {
    // Simulate daily business operations
    updateMarketConditions();
    processCustomers();
    updateFinances();
}

// Helper functions for History Quest
function loadHistoricalScenario(period) {
    const scenarios = {
        ancient: {
            title: 'Ancient Egypt: The Pyramid Construction',
            description: 'You are the chief architect of the Great Pyramid. Make decisions about its construction.',
            options: [
                'Use limestone blocks',
                'Use granite blocks',
                'Experiment with new materials'
            ]
        }
    };

    const scenario = scenarios[period];
    document.getElementById('scenario-description').innerHTML = `
        <h3>${scenario.title}</h3>
        <p>${scenario.description}</p>
    `;

    const options = document.getElementById('decision-options');
    options.innerHTML = scenario.options.map(opt => 
        `<button class="decision-btn">${opt}</button>`
    ).join('');
}

// Helper functions for Language Lab
function loadLanguageExercise(language, level) {
    const exercises = {
        spanish: {
            vocabulary: [
                { word: 'casa', translation: 'house' },
                { word: 'perro', translation: 'dog' },
                { word: 'gato', translation: 'cat' }
            ],
            grammar: [
                { sentence: 'Yo ___ a la escuela', answer: 'voy', options: ['voy', 'vas', 'va'] }
            ]
        }
    };

    const exercise = exercises[language];
    const area = document.getElementById('exercise-area');
    area.innerHTML = `
        <div class="vocabulary-exercise">
            <h3>Vocabulary Practice</h3>
            <div class="word-pairs">
                ${exercise.vocabulary.map(pair => `
                    <div class="word-pair">
                        <div class="target-word">${pair.word}</div>
                        <input type="text" class="translation-input" data-answer="${pair.translation}">
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function setupLanguageControls() {
    const languageSelect = document.getElementById('language-select');
    languageSelect.addEventListener('change', (e) => {
        loadLanguageExercise(e.target.value, 1);
    });

    const checkButton = document.getElementById('check-answer');
    checkButton.addEventListener('click', () => {
        checkLanguageExercise();
    });
}

function checkLanguageExercise() {
    const inputs = document.querySelectorAll('.translation-input');
    let correct = 0;
    inputs.forEach(input => {
        if (input.value.toLowerCase() === input.dataset.answer.toLowerCase()) {
            input.classList.add('correct');
            correct++;
        } else {
            input.classList.add('incorrect');
        }
    });
    
    const score = Math.round((correct / inputs.length) * 100);
    document.getElementById('language-score').textContent = score;
}

function startMemoryMasterGame(container) {
    console.warn('startMemoryMasterGame in dashboard.js should not be called, use profile.js version instead');
    // This is intentionally left empty to avoid conflicts with profile.js
    return;
}