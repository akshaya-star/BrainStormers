// Tab-fixing script to ensure navigation tabs work properly
document.addEventListener('DOMContentLoaded', function() {
    console.log('Tab fix loaded - initializing tab functionality');
    
    // Define initialization functions if they don't exist already
    if (typeof window.initializeLearningTab !== 'function') {
        window.initializeLearningTab = function() {
            console.log('Default learning tab initialization');
            // Basic initialization for learning tab
            const learningContent = document.getElementById('learning-content');
            if (learningContent) {
                console.log('Learning tab content found and activated');
            }
        };
    }
    
    if (typeof window.initializeFunTalks !== 'function') {
        window.initializeFunTalks = function() {
            console.log('Default fun talks tab initialization');
            // Basic initialization for fun talks tab
            const funTalksContent = document.getElementById('fun-talks-content');
            if (funTalksContent) {
                console.log('Fun talks tab content found and activated');
            }
        };
    }
    
    if (typeof window.initializeGames !== 'function') {
        window.initializeGames = function() {
            console.log('Default games tab initialization');
            // Basic initialization for games tab
            const gamesContent = document.getElementById('games-content');
            if (gamesContent) {
                console.log('Games tab content found and activated');
            }
        };
    }
    
    // Apply tab fixes after a short delay to ensure all elements are loaded
    setTimeout(fixTabs, 200);
});

// Fix tab navigation functionality
function fixTabs() {
    console.log('Applying tab navigation fixes');
    const navTabs = document.querySelectorAll('.nav-tabs li');
    const tabContents = document.querySelectorAll('.tab-content');
    
    console.log(`Found ${navTabs.length} navigation tabs and ${tabContents.length} tab contents`);
    
    // Add click event to tabs
    navTabs.forEach(tab => {
        // Remove existing listeners to prevent duplicates by cloning and replacing
        const newTab = tab.cloneNode(true);
        tab.parentNode.replaceChild(newTab, tab);
        
        // Add fresh event listener
        newTab.addEventListener('click', function(e) {
            console.log(`Tab clicked: ${this.textContent.trim()} (${this.getAttribute('data-tab')})`);
            e.preventDefault();
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
                console.log(`Activated tab content: ${tabId}-content`);
                
                // Initialize specific tab content based on the tab
                if (tabId === 'learning') {
                    if (typeof window.initializeLearningTab === 'function') {
                        window.initializeLearningTab();
                        console.log('Learning tab initialized');
                    } else {
                        console.log('Learning tab initialization function not found');
                    }
                } else if (tabId === 'fun-talks') {
                    // Initialize fun talks when the tab is clicked
                    if (typeof window.initializeFunTalks === 'function') {
                        window.initializeFunTalks();
                        console.log('Fun Talks tab initialized');
                    } else {
                        console.log('Fun Talks tab initialization function not found');
                    }
                } else if (tabId === 'games') {
                    // Initialize games when the tab is clicked
                    if (typeof window.initializeGames === 'function') {
                        window.initializeGames();
                        console.log('Games tab initialized');
                    } else {
                        console.log('Games tab initialization function not found');
                    }
                } else if (tabId === 'customize') {
                    console.log('Customize AI tab activated');
                }
            } else {
                console.error(`Tab content element not found: ${tabId}-content`);
            }
        });
    });
    
    // Ensure the currently active tab is properly set
    const activeTab = document.querySelector('.nav-tabs li.active');
    if (!activeTab && navTabs.length > 0) {
        // If no active tab, set the first one as active
        navTabs[0].classList.add('active');
        if (tabContents.length > 0) {
            tabContents[0].classList.add('active');
        }
    }
    
    console.log('Tab navigation fix applied successfully');
} 