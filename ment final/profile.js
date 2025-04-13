// Profile functionality for Mentaura

document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile.js loaded - initializing profile functionality');
    
    // Get DOM elements
    const profileAvatar = document.getElementById('profile-avatar');
    const dropdownMenu = document.getElementById('profile-dropdown');

    console.log('Profile elements found:', {
        profileAvatar: !!profileAvatar,
        dropdownMenu: !!dropdownMenu
    });

    // Initialize user data
    const user = JSON.parse(localStorage.getItem('mentaura_user') || '{}');

    // Update profile avatar
    function updateProfileAvatar() {
        if (profileAvatar) {
            const firstLetter = user.name ? user.name.charAt(0).toUpperCase() : 'A';
            profileAvatar.innerHTML = `<div class="avatar-circle">${firstLetter}</div>`;
        }
    }

    // Position dropdown menu
    function positionDropdown() {
        if (profileAvatar && dropdownMenu) {
            const avatarRect = profileAvatar.getBoundingClientRect();
            dropdownMenu.style.position = 'fixed';
            dropdownMenu.style.top = `${avatarRect.bottom + 5}px`;
            dropdownMenu.style.right = `${window.innerWidth - avatarRect.right}px`;
            console.log('Positioning dropdown menu');
        }
    }

    // Toggle dropdown menu
    if (profileAvatar && dropdownMenu) {
        profileAvatar.addEventListener('click', function(e) {
            e.stopPropagation();
            positionDropdown();
            dropdownMenu.classList.toggle('active');
            console.log('Profile avatar clicked, dropdown toggled');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (dropdownMenu.classList.contains('active') && 
                !profileAvatar.contains(e.target) && 
                !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('active');
                console.log('Clicking outside, closing dropdown');
            }
        });

        // Reposition dropdown on window resize
        window.addEventListener('resize', function() {
            if (dropdownMenu.classList.contains('active')) {
                positionDropdown();
            }
        });
    }

    // Initialize
    updateProfileAvatar();

    // Apply dark mode if enabled
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
}); 