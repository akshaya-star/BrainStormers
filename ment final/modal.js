// Modal functionality for Mentaura login/signup

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyANsW-Y1hA_ce2uFdfS1XPpDcrgUQ8JVHA",
    authDomain: "mentaura-75fa0.firebaseapp.com",
    projectId: "mentaura-75fa0",
    storageBucket: "mentaura-75fa0.appspot.com",
    messagingSenderId: "1038073222666",
    appId: "1:1038073222666:web:32bd9614ac68dc7678f1f3",
    measurementId: "G-TCG5D5YH83"
};

// Global variables for Firebase services
let firebaseInitialized = false;
let db = null;
let auth = null;
let analytics = null;

// Initialize Firebase and catch any errors
function initializeFirebase() {
    try {
        // Check if Firebase is already initialized
        if (firebase.apps.length === 0) {
            // Initialize Firebase
            firebase.initializeApp(firebaseConfig);
            console.log('Firebase initialized successfully');
        } else {
            console.log('Firebase already initialized');
        }
        
        // Initialize services
        firebaseInitialized = true;
        db = firebase.firestore();
        auth = firebase.auth();
        
        // Initialize analytics if available
        if (typeof firebase.analytics === 'function') {
            analytics = firebase.analytics();
            console.log('Firebase Analytics initialized');
        }
        
        // Set persistence to LOCAL for better user experience
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .catch(error => {
                console.error('Error setting persistence:', error);
            });
            
        return true;
    } catch (e) {
        console.error('Firebase initialization error:', e);
        firebaseInitialized = false;
        return false;
    }
}

// Initialize Firebase when the script loads
initializeFirebase();

document.addEventListener('DOMContentLoaded', function() {
    console.log('Modal script loaded');
    
    // Check if user is already logged in
    const storedUser = localStorage.getItem('mentaura_user');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.username && user.isOnline) {
            console.log('User already logged in:', user.username);
            window.location.href = 'dashboard.html';
            return;
        }
    }
    
    // Get modal elements
    const modal = document.getElementById('auth-modal');
    const startJourneyBtn = document.querySelector('.primary-btn');
    const closeBtn = document.querySelector('.close-modal');
    const authTabs = document.querySelectorAll('.auth-tab');
    const formContainers = document.querySelectorAll('.auth-form-container');
    
    // Open modal when "START YOUR JOURNEY" is clicked
    if (startJourneyBtn) {
        startJourneyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Start journey button clicked');
            if (modal) {
                modal.style.display = 'block';
                console.log('Modal displayed');
            }
        });
    }
    
    // Close modal when X is clicked
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside of it
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Tab switching functionality
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            authTabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all form containers
            formContainers.forEach(container => container.classList.remove('active'));
            
            // Show selected form container
            const tabType = this.getAttribute('data-tab');
            document.getElementById(`${tabType}-form-container`).classList.add('active');
        });
    });
    
    // Password validation function
    function validatePassword(password) {
        // Password must be at least 8 characters
        if (password.length < 8) return false;
        
        // Password must contain at least one uppercase letter
        if (!/[A-Z]/.test(password)) return false;
        
        // Password must contain at least one number
        if (!/[0-9]/.test(password)) return false;
        
        // Password must contain at least one special character
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
        
        return true;
    }
    
    // Handle login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            
            if (!username || !password) {
                alert('Please enter both username and password');
                return;
            }
            
            console.log('Login attempt with username:', username);
            
            // Show loading indicator
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Logging in...';
            submitBtn.disabled = true;
            
            // Only use Firebase authentication, no demo mode unless Firebase fails
            if (firebaseInitialized && db && auth) {
                tryFirebaseLogin();
            } else {
                alert('Authentication service is not available. Please try again later.');
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
            
            // Try to login with Firebase
            function tryFirebaseLogin() {
                console.log('Attempting Firebase login for user:', username);
                
                // Show informative feedback
                const statusMsg = document.createElement('div');
                statusMsg.className = 'status-message';
                statusMsg.textContent = 'Authenticating...';
                loginForm.appendChild(statusMsg);
                
                // Create email from username
                const email = `${username}@mentaura.com`;
                
                // Try direct authentication first (faster)
                auth.signInWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        console.log('Login successful, fetching user data');
                        
                        // Get user data from Firestore
                        return db.collection('users').doc(userCredential.user.uid).get()
                            .then(docSnapshot => {
                                if (docSnapshot.exists) {
                                    // User document exists
                                    const userData = docSnapshot.data();
                                    return { userCredential, userData };
                                } else {
                                    // Create basic user data if missing
                                    const userData = {
                                        uid: userCredential.user.uid,
                                        username: username,
                                        name: username,
                                        learningType: 'Personal Growth',
                                        createdAt: new Date().toISOString(),
                                        lastLogin: new Date().toISOString()
                                    };
                                    
                                    // Save the new user data
                                    return db.collection('users').doc(userCredential.user.uid).set(userData)
                                        .then(() => {
                                            return { userCredential, userData };
                                        });
                                }
                            });
                    })
                    .then(({ userCredential, userData }) => {
                        // Save detailed user data to localStorage
                        const userProfile = {
                            uid: userCredential.user.uid,
                            username: username,
                            name: userData.name || username,
                            learningType: userData.learningType || 'Personal Growth',
                            isOnline: true,
                            lastLogin: new Date().toISOString()
                        };
                        
                        localStorage.setItem('mentaura_user', JSON.stringify(userProfile));
                        
                        // Also save to sessionStorage for consistency with app.js
                        sessionStorage.setItem('currentUser', JSON.stringify(userProfile));
                        
                        // Update user's last login time in Firestore
                        db.collection('users').doc(userCredential.user.uid)
                            .update({
                                lastLogin: new Date().toISOString()
                            })
                            .catch(err => console.log('Error updating last login:', err));
                        
                        // Update status message
                        if (loginForm.contains(statusMsg)) {
                            statusMsg.textContent = 'Login successful! Redirecting...';
                            statusMsg.className = 'status-message success';
                        }
                        
                        // Redirect after a brief delay to show success message
                        setTimeout(() => {
                            window.location.href = 'dashboard.html';
                        }, 1000);
                    })
                    .catch((error) => {
                        console.error('Authentication error:', error);
                        
                        // Check for specific error codes for better feedback
                        let errorMessage = 'Invalid username or password';
                        
                        if (error.code === 'auth/user-not-found') {
                            errorMessage = 'No account found with this username';
                        } else if (error.code === 'auth/wrong-password') {
                            errorMessage = 'Incorrect password';
                        } else if (error.code === 'auth/too-many-requests') {
                            errorMessage = 'Too many failed login attempts. Please try again later.';
                        } else if (error.code === 'auth/network-request-failed') {
                            errorMessage = 'Network error. Please check your connection.';
                        }
                        
                        // Show error message in UI
                        if (loginForm.contains(statusMsg)) {
                            statusMsg.textContent = errorMessage;
                            statusMsg.className = 'status-message error';
                        } else {
                            alert(errorMessage);
                        }
                        
                        submitBtn.innerHTML = originalBtnText;
                        submitBtn.disabled = false;
                    });
            }
        });
    }
    
    // Handle signup form submission
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const username = document.getElementById('signup-username').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;
            const learningType = document.getElementById('signup-learning-type').value;
            
            // Validate form inputs
            if (!name || !username || !password || !confirmPassword || !learningType) {
                alert('Please fill out all required fields');
                return;
            }
            
            // Username validation (alphanumeric only, 3-20 characters)
            if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
                alert('Username must be 3-20 characters and contain only letters, numbers, and underscores');
                return;
            }
            
            // Validate password
            if (!validatePassword(password)) {
                alert('Password does not meet the criteria. Please ensure it has at least 8 characters, one uppercase letter, one number, and one special character.');
                return;
            }
            
            // Check if passwords match
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            // Show loading indicator
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Creating Account...';
            submitBtn.disabled = true;
            
            // Get learning type text
            const learningTypeText = document.querySelector(`#signup-learning-type option[value="${learningType}"]`).textContent;
            
            // Only use Firebase, no demo mode for registration
            if (firebaseInitialized && db && auth) {
                tryFirebaseSignup();
            } else {
                alert('Registration service is not available. Please try again later.');
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
            
            // Try to register with Firebase
            function tryFirebaseSignup() {
                console.log('Attempting Firebase signup for username:', username);
                
                // Show informative feedback
                const statusMsg = document.createElement('div');
                statusMsg.className = 'status-message';
                statusMsg.textContent = 'Creating your account...';
                signupForm.appendChild(statusMsg);
                
                // Create email from username
                const email = `${username}@mentaura.com`;
                
                // First check if username already exists (now allowed without auth)
                db.collection('users')
                    .where('username', '==', username)
                    .get()
                    .then((querySnapshot) => {
                        if (!querySnapshot.empty) {
                            // Username already exists
                            statusMsg.textContent = 'Username already exists. Please try a different one.';
                            statusMsg.className = 'status-message error';
                            submitBtn.innerHTML = originalBtnText;
                            submitBtn.disabled = false;
                            return Promise.reject(new Error('Username already exists'));
                        }
                        
                        // Create the user in Firebase Auth
                        return auth.createUserWithEmailAndPassword(email, password);
                    })
                    .then((userCredential) => {
                        // Prepare user data
                        const userId = userCredential.user.uid;
                        const userData = {
                            uid: userId,
                            name: name,
                            username: username,
                            learningType: learningTypeText,
                            createdAt: new Date().toISOString(),
                            lastLogin: new Date().toISOString()
                        };
                        
                        // Add the user to Firestore (now allowed without auth)
                        return db.collection('users').doc(userId).set(userData)
                            .then(() => {
                                return { userCredential, userData };
                            });
                    })
                    .then(({ userCredential, userData }) => {
                        console.log('User registered in Firebase:', userCredential.user.uid);
                        
                        // Update status message
                        statusMsg.textContent = 'Account created successfully! Please login with your credentials.';
                        statusMsg.className = 'status-message success';
                        
                        // Clear form fields
                        document.getElementById('signup-name').value = '';
                        document.getElementById('signup-username').value = '';
                        document.getElementById('signup-password').value = '';
                        document.getElementById('signup-confirm-password').value = '';
                        
                        // Reset learning type dropdown if it exists
                        const learningTypeSelect = document.getElementById('signup-learning-type');
                        if (learningTypeSelect) {
                            learningTypeSelect.value = '';
                        }
                        
                        // Reset button
                        submitBtn.innerHTML = originalBtnText;
                        submitBtn.disabled = false;
                        
                        // Store username for login form
                        const registeredUsername = username;
                        
                        // Sign out the user since we want them to log in explicitly
                        return auth.signOut().then(() => {
                            // Wait a moment to show success message, then switch to login tab
                            setTimeout(() => {
                                // Find and click the login tab to switch to login form
                                const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
                                if (loginTab) {
                                    loginTab.click();
                                    
                                    // Focus on the username field and prefill with the registered username
                                    const loginUsername = document.getElementById('login-username');
                                    if (loginUsername) {
                                        loginUsername.value = registeredUsername;
                                        
                                        // Focus on password field since we've prefilled the username
                                        const loginPassword = document.getElementById('login-password');
                                        if (loginPassword) {
                                            loginPassword.focus();
                                        }
                                    }
                                    
                                    // Remove the status message if it still exists
                                    if (signupForm.contains(statusMsg)) {
                                        signupForm.removeChild(statusMsg);
                                    }
                                }
                            }, 2000);
                        });
                    })
                    .catch((error) => {
                        console.error('Registration error:', error);
                        
                        // Check for specific error codes for better feedback
                        let errorMessage = 'Registration failed: ' + (error.message || '');
                        
                        if (error.code === 'auth/email-already-in-use') {
                            errorMessage = 'This username is already registered. Please try a different username.';
                        } else if (error.code === 'auth/invalid-email') {
                            errorMessage = 'Invalid username format. Please use only letters and numbers.';
                        } else if (error.code === 'auth/operation-not-allowed') {
                            errorMessage = 'Account creation is temporarily disabled. Please try again later.';
                        } else if (error.code === 'auth/weak-password') {
                            errorMessage = 'Password is too weak. Please use a stronger password.';
                        } else if (error.code === 'auth/network-request-failed') {
                            errorMessage = 'Network error. Please check your connection and try again.';
                        } else if (error.message === 'Username already exists') {
                            errorMessage = 'This username is already taken. Please choose another one.';
                        }
                        
                        // Show error in UI
                        statusMsg.textContent = errorMessage;
                        statusMsg.className = 'status-message error';
                        
                        // Make sure we reset the button
                        submitBtn.innerHTML = originalBtnText;
                        submitBtn.disabled = false;
                    });
            }
        });
    }

    // Add CSS styles for status messages
    if (!document.getElementById('auth-status-styles')) {
        const style = document.createElement('style');
        style.id = 'auth-status-styles';
        style.innerHTML = `
            .status-message {
                padding: 10px;
                margin: 10px 0;
                border-radius: 4px;
                text-align: center;
                font-size: 14px;
                transition: all 0.3s ease;
            }
            
            .status-message.success {
                background-color: rgba(76, 175, 80, 0.1);
                color: #4CAF50;
                border: 1px solid rgba(76, 175, 80, 0.3);
            }
            
            .status-message.error {
                background-color: rgba(244, 67, 54, 0.1);
                color: #F44336;
                border: 1px solid rgba(244, 67, 54, 0.3);
            }
            
            .auth-form-container {
                position: relative;
            }
            
            .form-group {
                margin-bottom: 15px;
            }
            
            .password-criteria {
                font-size: 12px;
                color: #666;
                margin-top: 5px;
                display: block;
            }
        `;
        document.head.appendChild(style);
    }

    // Add auth state change listener
    console.log('Setting up auth state listener');
    
    // Check if auth is available
    if (auth) {
        // Listen for auth state changes
        auth.onAuthStateChanged(function(user) {
            console.log('Auth state changed:', user ? 'User logged in' : 'No user');
            
            // Check for URL parameter to bypass auto-redirect (for debugging)
            const urlParams = new URLSearchParams(window.location.search);
            const bypassRedirect = urlParams.get('noredirect') === 'true';
            
            if (bypassRedirect) {
                console.log('Automatic redirect bypassed due to URL parameter');
                return;
            }
            
            if (user) {
                // User is signed in
                const storedUser = localStorage.getItem('mentaura_user');
                
                // If we're on the login page but have a user, redirect to dashboard
                const isIndexPage = window.location.pathname.includes('index.html') || 
                                    window.location.pathname === '/' || 
                                    window.location.pathname.endsWith('/');
                
                // Only redirect from index page, not all pages                    
                if (isIndexPage) {
                    // Only redirect if we have user data in localStorage
                    if (storedUser) {
                        console.log('User already logged in, redirecting to dashboard');
                        window.location.href = 'dashboard.html';
                    } else {
                        // We have auth but no local data, fetch from Firestore
                        db.collection('users').doc(user.uid).get()
                            .then(doc => {
                                if (doc.exists) {
                                    // User data found, save it locally
                                    const userData = doc.data();
                                    console.log('Restored user data from Firestore');
                                    
                                    // Create user profile
                                    const userProfile = {
                                        uid: user.uid,
                                        username: userData.username || user.email.split('@')[0],
                                        name: userData.name || userData.username,
                                        learningType: userData.learningType || 'Personal Growth',
                                        isOnline: true,
                                        lastLogin: new Date().toISOString()
                                    };
                                    
                                    // Save to local storage
                                    localStorage.setItem('mentaura_user', JSON.stringify(userProfile));
                                    sessionStorage.setItem('currentUser', JSON.stringify(userProfile));
                                    
                                    // Redirect to dashboard
                                    window.location.href = 'dashboard.html';
                                } else {
                                    // No user data found, log out
                                    console.warn('No user data found for authenticated user');
                                    auth.signOut().then(() => {
                                        localStorage.removeItem('mentaura_user');
                                        sessionStorage.removeItem('currentUser');
                                    });
                                }
                            })
                            .catch(error => {
                                console.error('Error fetching user data:', error);
                            });
                    }
                }
            } else {
                // User is signed out
                // If we're on dashboard but no user, redirect to login
                if (window.location.pathname.includes('dashboard.html')) {
                    console.log('No user logged in, redirecting to login page');
                    window.location.href = 'index.html';
                }
            }
        });
    }
}); 