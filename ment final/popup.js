// Break reminder popup functionality
document.addEventListener('DOMContentLoaded', function() {
    // Show popup after 1 minute
    setTimeout(showBreakReminder, 60000);
});

function showBreakReminder() {
    // Create popup container
    const popup = document.createElement('div');
    popup.className = 'break-reminder-popup';
    popup.innerHTML = `
        <div class="break-reminder-content">
            <h3>Time for a Break! 🎮</h3>
            <p>Would you like to:</p>
            <div class="break-options">
                <button class="break-option-btn" onclick="startFunTalk()">
                    <i class="fas fa-comments"></i>
                    Have Fun Talks
                </button>
                <button class="break-option-btn" onclick="startInteractiveLearning()">
                    <i class="fas fa-gamepad"></i>
                    Learn Through Games
                </button>
                <button class="break-option-btn" onclick="closePopup()">
                    <i class="fas fa-times"></i>
                    Maybe Later
                </button>
            </div>
        </div>
    `;

    // Add popup to the page
    document.body.appendChild(popup);

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .break-reminder-popup {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .break-reminder-content {
            background-color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .break-reminder-content h3 {
            color: #0066cc;
            margin-bottom: 20px;
        }

        .break-options {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .break-option-btn {
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            background-color: #f0f7ff;
            color: #0066cc;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }

        .break-option-btn:hover {
            background-color: #0066cc;
            color: white;
        }

        .break-option-btn i {
            font-size: 1.2em;
        }
    `;
    document.head.appendChild(style);
}

function closePopup() {
    const popup = document.querySelector('.break-reminder-popup');
    if (popup) {
        popup.remove();
    }
}

function startFunTalk() {
    // Navigate to Fun Talks tab
    const funTalksTab = document.querySelector('li[data-tab="fun-talks"]');
    if (funTalksTab) {
        // Remove active class from current tab
        document.querySelector('.nav-tabs li.active').classList.remove('active');
        // Add active class to Fun Talks tab
        funTalksTab.classList.add('active');
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        // Show Fun Talks content
        document.getElementById('fun-talks-content').classList.add('active');
    }
    closePopup();
}

function startInteractiveLearning() {
    // Navigate to Games tab
    const gamesTab = document.querySelector('li[data-tab="games"]');
    if (gamesTab) {
        // Remove active class from current tab
        document.querySelector('.nav-tabs li.active').classList.remove('active');
        // Add active class to Games tab
        gamesTab.classList.add('active');
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        // Show Games content
        document.getElementById('games-content').classList.add('active');
    }
    closePopup();
} 