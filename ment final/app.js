// Use existing Firebase instance instead of importing modules
// Since this file is now loaded with type="module", we need to make sure it doesn't
// conflict with the Firebase initialization in modal.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("🔄 DOM fully loaded in app.js");
    
    // Check for existing Firebase instance
    if (typeof firebase !== 'undefined') {
        console.log("✅ Using existing Firebase instance from modal.js");
        testExistingFirebase();
    } else {
        console.log("⚠️ Firebase not available from modal.js, please check initialization");
    }

    // Debug function to validate existing Firestore connection
    async function testExistingFirebase() {
        try {
            const db = firebase.firestore();
            const usersRef = db.collection("users");
        console.log("✅ Firestore connection established", usersRef);
        return true;
    } catch (error) {
        console.error("❌ Firestore connection failed:", error);
        return false;
    }
}
});

// Mentaura Landing Page JavaScript
// This script adds dynamic functionality to the landing page

// Prevent Firebase errors if the file is loaded before Firebase
window.addEventListener('load', function() {
    // Particle animation
    const particles = document.querySelectorAll('.particle');
    particles.forEach(particle => {
        animateParticle(particle);
    });
    
    // Network node animation
    const nodes = document.querySelectorAll('.network-node');
    nodes.forEach(node => {
        animateNode(node);
    });
    
    // Floating icon animation
    const icons = document.querySelectorAll('.floating-icon');
    icons.forEach(icon => {
        animateIcon(icon);
    });
    
    // Animate the glow
    animateGlow();
    
    // Contact form submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            
            // Simulate form submission success
            alert(`Thank you, ${name}! Your message has been sent.`);
            
            // Reset form
            contactForm.reset();
        });
    }
});

// Function to animate a particle with random movement
function animateParticle(particle) {
    // Create random animation parameters
    const duration = 10 + Math.random() * 20; // Random duration between 10-30s
    const delay = Math.random() * 5; // Random delay between 0-5s
    const xDistance = Math.random() * 120 - 60; // Random distance between -60px and 60px
    const yDistance = Math.random() * 120 - 60; // Random distance between -60px and 60px
    
    // Set animation properties
    particle.style.animation = `float ${duration}s ease-in-out ${delay}s infinite alternate`;
    
    // Apply random transforms
    particle.animate([
        { transform: 'translate(0, 0)' },
        { transform: `translate(${xDistance}px, ${yDistance}px)` }
    ], {
        duration: duration * 1000,
        delay: delay * 1000,
        iterations: Infinity,
        direction: 'alternate',
        easing: 'ease-in-out'
    });
}

// Function to animate network nodes
function animateNode(node) {
    // Create pulse animation
    const duration = 3 + Math.random() * 4; // Random duration between 3-7s
    const delay = Math.random() * 2; // Random delay between 0-2s
    
    // Apply animation
    node.animate([
        { opacity: 0.2, transform: 'scale(0.8)' },
        { opacity: 1, transform: 'scale(1.1)' },
        { opacity: 0.2, transform: 'scale(0.8)' }
    ], {
        duration: duration * 1000,
        delay: delay * 1000,
        iterations: Infinity,
        easing: 'ease-in-out'
    });
}

// Function to animate floating icons
function animateIcon(icon) {
    // Create float animation
    const duration = 5 + Math.random() * 5; // Random duration between 5-10s
    const delay = Math.random() * 3; // Random delay between 0-3s
    const xDistance = Math.random() * 40 - 20; // Random distance between -20px and 20px
    const yDistance = Math.random() * 40 - 20; // Random distance between -20px and 20px
    
    // Apply animation
    icon.animate([
        { transform: 'translate(0, 0) rotate(0deg)' },
        { transform: `translate(${xDistance}px, ${yDistance}px) rotate(${Math.random() * 20 - 10}deg)` }
    ], {
        duration: duration * 1000,
        delay: delay * 1000,
        iterations: Infinity,
        direction: 'alternate',
        easing: 'ease-in-out'
    });
}

// Function to animate the glow
function animateGlow() {
    const glow = document.querySelector('.glow');
    if (glow) {
        glow.animate([
            { opacity: 0.2, transform: 'scale(0.8) translate(-50%, -50%)' },
            { opacity: 0.5, transform: 'scale(1.2) translate(-40%, -40%)' },
            { opacity: 0.2, transform: 'scale(0.8) translate(-50%, -50%)' }
        ], {
            duration: 10000,
            iterations: Infinity,
            easing: 'ease-in-out'
        });
    }
}
