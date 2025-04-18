// Profile dropdown fix script
document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile dropdown fix loaded');
    
    // Apply fix after a short delay to ensure all elements are properly loaded
    setTimeout(fixProfileDropdown, 100);
    
    // Add custom event listeners immediately
    setupEventListeners();
});

// Setup custom event listeners
function setupEventListeners() {
    // Add custom event listeners
    document.addEventListener('showProfile', function(e) {
        console.log('showProfile event received', e.detail);
        showProfileModal(e.detail.user);
    });
    
    document.addEventListener('showSettings', function() {
        console.log('showSettings event received');
        showSettingsModal();
    });
    
    document.addEventListener('showEditProfile', function(e) {
        console.log('showEditProfile event received', e.detail);
        showEditProfileModal(e.detail.user);
    });
}

// Fix for profile dropdown functionality
function fixProfileDropdown() {
    console.log('Applying profile dropdown fix');
    const dropdownItems = document.querySelectorAll('#profile-dropdown .dropdown-item');
    console.log('Found dropdown items:', dropdownItems.length);
    
    // Add click event listeners directly to dropdown items
    dropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.id;
            console.log('Dropdown item clicked:', id);
            
            // Hide dropdown
            const dropdown = document.getElementById('profile-dropdown');
            if (dropdown) {
                dropdown.classList.remove('active');
            }
            
            // Handle specific actions
            if (id === 'view-profile') {
                console.log('Opening profile view');
                const user = JSON.parse(localStorage.getItem('mentaura_user') || '{}');
                console.log('User data:', user);
                
                // Directly show the profile modal
                createAndShowProfileModal(user);
            } else if (id === 'settings') {
                console.log('Opening settings');
                
                // Directly show the settings modal
                createAndShowSettingsModal();
            } else if (id === 'logout') {
                console.log('Logging out');
                if (confirm('Are you sure you want to log out?')) {
                    localStorage.removeItem('mentaura_user');
                    window.location.href = 'index.html';
                }
            }
        });
    });
}

// Create and show profile modal directly without using events
function createAndShowProfileModal(user) {
    console.log('Creating and showing profile modal directly');
    // Clean up any existing modals first
    removeExistingModals();
    
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'profile-modal';
    modal.style.display = 'flex'; // Ensure it displays as flex
    modal.style.opacity = '0'; // Start with 0 opacity for transition
    
    modal.innerHTML = `
        <div class="modal-content profile-modal-content">
            <button class="close-modal">&times;</button>
            <h2>Your Profile</h2>
            <div class="profile-details">
                <div class="profile-avatar-large">
                    <div class="avatar-circle-large">${user.name ? user.name.charAt(0).toUpperCase() : 'A'}</div>
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
    
    // Add modal to the DOM
    document.body.appendChild(modal);
    
    // Ensure it's properly added to DOM before adding active class
    setTimeout(() => {
        console.log('Adding active class to modal');
        modal.classList.add('active');
        modal.style.opacity = '1';
    }, 10);
    
    // Handle close button
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        console.log('Closing profile modal');
        modal.classList.remove('active');
        modal.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300);
    });
    
    // Handle edit profile button
    const editBtn = modal.querySelector('#edit-profile-btn');
    editBtn.addEventListener('click', () => {
        console.log('Edit profile button clicked');
        modal.classList.remove('active');
        modal.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            createAndShowEditProfileModal(user);
        }, 300);
    });
}

// Create and show settings modal directly without using events
function createAndShowSettingsModal() {
    console.log('Creating and showing settings modal directly');
    // Clean up any existing modals first
    removeExistingModals();
    
    // Get current settings
    const darkMode = localStorage.getItem('darkMode') === 'true';
    const notifications = localStorage.getItem('notifications') === 'true';
    
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'settings-modal';
    modal.style.display = 'flex'; // Ensure it displays as flex
    modal.style.opacity = '0'; // Start with 0 opacity for transition
    
    modal.innerHTML = `
        <div class="modal-content profile-modal-content">
            <button class="close-modal">&times;</button>
            <h2>Settings</h2>
            <div class="settings-section">
                <h3>Appearance</h3>
                <div class="setting-item">
                    <span>Dark Mode</span>
                    <input type="checkbox" class="toggle-switch" id="dark-mode-toggle" ${darkMode ? 'checked' : ''}>
                </div>
            </div>
            <div class="settings-section">
                <h3>Notifications</h3>
                <div class="setting-item">
                    <span>Enable Notifications</span>
                    <input type="checkbox" class="toggle-switch" id="notifications-toggle" ${notifications ? 'checked' : ''}>
                </div>
            </div>
            <div class="form-actions">
                <button class="primary-btn" id="save-settings">Save Settings</button>
            </div>
        </div>
    `;
    
    // Add modal to the DOM
    document.body.appendChild(modal);
    
    // Ensure it's properly added to DOM before adding active class
    setTimeout(() => {
        console.log('Adding active class to settings modal');
        modal.classList.add('active');
        modal.style.opacity = '1';
    }, 10);
    
    // Handle close button
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        console.log('Closing settings modal');
        modal.classList.remove('active');
        modal.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300);
    });
    
    // Handle save settings
    const saveBtn = modal.querySelector('#save-settings');
    saveBtn.addEventListener('click', () => {
        console.log('Save settings button clicked');
        const newDarkMode = document.getElementById('dark-mode-toggle').checked;
        const newNotifications = document.getElementById('notifications-toggle').checked;
        
        // Save settings
        localStorage.setItem('darkMode', newDarkMode);
        localStorage.setItem('notifications', newNotifications);
        
        // Apply dark mode
        if (newDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        // Close modal and show notification
        modal.classList.remove('active');
        modal.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            showNotification('Settings saved successfully!');
        }, 300);
    });
}

// Create and show edit profile modal directly without using events
function createAndShowEditProfileModal(user) {
    console.log('Creating and showing edit profile modal directly');
    // Clean up any existing modals first
    removeExistingModals();
    
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'edit-profile-modal';
    modal.style.display = 'flex'; // Ensure it displays as flex
    modal.style.opacity = '0'; // Start with 0 opacity for transition
    
    modal.innerHTML = `
        <div class="modal-content profile-modal-content">
            <button class="close-modal">&times;</button>
            <h2>Edit Profile</h2>
            <div class="edit-profile-container">
                <div class="form-group">
                    <label for="edit-name">Name</label>
                    <input type="text" id="edit-name" value="${user.name || ''}" placeholder="Enter your name">
                </div>
                <div class="form-group">
                    <label for="edit-learning-type">Learning Type</label>
                    <select id="edit-learning-type">
                        <option value="Personal Growth" ${user.learningType === 'Personal Growth' ? 'selected' : ''}>Personal Growth</option>
                        <option value="Academic" ${user.learningType === 'Academic' ? 'selected' : ''}>Academic</option>
                        <option value="Professional" ${user.learningType === 'Professional' ? 'selected' : ''}>Professional</option>
                        <option value="Creative" ${user.learningType === 'Creative' ? 'selected' : ''}>Creative</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button class="secondary-btn" id="cancel-edit">Cancel</button>
                    <button class="primary-btn" id="save-changes">Save Changes</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to the DOM
    document.body.appendChild(modal);
    
    // Ensure it's properly added to DOM before adding active class
    setTimeout(() => {
        console.log('Adding active class to edit profile modal');
        modal.classList.add('active');
        modal.style.opacity = '1';
    }, 10);
    
    // Handle close button
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        console.log('Closing edit profile modal');
        modal.classList.remove('active');
        modal.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300);
    });
    
    // Handle cancel button
    const cancelBtn = modal.querySelector('#cancel-edit');
    cancelBtn.addEventListener('click', () => {
        console.log('Cancel edit button clicked');
        modal.classList.remove('active');
        modal.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300);
    });
    
    // Handle save changes
    const saveBtn = modal.querySelector('#save-changes');
    saveBtn.addEventListener('click', () => {
        console.log('Save changes button clicked');
        const newName = document.getElementById('edit-name').value;
        const newLearningType = document.getElementById('edit-learning-type').value;
        
        // Update user object
        user.name = newName;
        user.learningType = newLearningType;
        
        // Save to localStorage
        localStorage.setItem('mentaura_user', JSON.stringify(user));
        
        // Update UI
        const usernameEl = document.getElementById('username');
        const learningTypeEl = document.getElementById('learning-type');
        
        if (usernameEl) usernameEl.textContent = newName || user.username;
        if (learningTypeEl) learningTypeEl.textContent = newLearningType;
        
        // Update avatar
        const profileAvatar = document.getElementById('profile-avatar');
        if (profileAvatar) {
            const firstLetter = newName ? newName.charAt(0).toUpperCase() : 'A';
            profileAvatar.innerHTML = `<div class="avatar-circle">${firstLetter}</div>`;
        }
        
        // Close modal
        modal.classList.remove('active');
        modal.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            showNotification('Profile updated successfully!');
        }, 300);
    });
}

// Legacy functions kept for event handling compatibility
function showProfileModal(user) {
    console.log('Legacy showProfileModal called, redirecting to direct method');
    createAndShowProfileModal(user);
}

function showSettingsModal() {
    console.log('Legacy showSettingsModal called, redirecting to direct method');
    createAndShowSettingsModal();
}

function showEditProfileModal(user) {
    console.log('Legacy showEditProfileModal called, redirecting to direct method');
    createAndShowEditProfileModal(user);
}

// Helper function to remove any existing modals
function removeExistingModals() {
    console.log('Removing any existing modals');
    const existingModals = document.querySelectorAll('.modal');
    existingModals.forEach(modal => {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    });
}

// Show notification function
function showNotification(message) {
    console.log('Showing notification:', message);
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('active'), 10);
    setTimeout(() => {
        notification.classList.remove('active');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
