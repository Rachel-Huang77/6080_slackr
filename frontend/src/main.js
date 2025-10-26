/**
 * Main entry point for the Slackr application
 * This file initializes the app and sets up event listeners
 */

import { BACKEND_URL } from './config.js';
import {
    fileToDataUrl,
    showError,
    hideError,
    showNotice,
    hideNotice,
    formatTimestamp,
    setToken,
    getToken,
    isValidToken,
    clearToken,
    setUserId,
    getUserId,
    clearUserId
} from './helpers.js';
import { initChannels } from './channel.js';

console.log('Slackr application started!');

/**
 * Show the authentication screen (login/register)
 */
const showAuthScreen = () => {
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('dashboard-container').style.display = 'none';

    // Show login by default
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('register-container').style.display = 'none';
};

/**
 * Show the dashboard screen and initialize channel functionality
 */
const showDashboard = () => {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('dashboard-container').style.display = 'block';

    // Initialize channel module (M2.2.1, 2.2.2, 2.2.3)
    initChannels();

    console.log('Dashboard loaded with channels');
};

/**
 * Handle login form submission
 * @param {Event} event - The form submit event
 */
const handleLogin = (event) => {
    event.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    // Validate input
    if (!email) {
        showError('Email is required');
        return;
    }
    if (!password) {
        showError('Password is required');
        return;
    }

    // Make API call to login using Promise chain
    fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showError(data.error);
            return Promise.reject(new Error(data.error));
        }
        // Store token and user ID
        setToken(data.token);
        setUserId(data.userId);

        // Show dashboard
        showDashboard();
        showNotice('Login successful!');
    })
    .catch(error => {
        console.error('Login error:', error);
    });
};

/**
 * Handle register form submission
 * @param {Event} event - The form submit event
 */
const handleRegister = (event) => {
    event.preventDefault();

    const email = document.getElementById('register-email').value.trim();
    const name = document.getElementById('register-name').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-password-confirm').value;

    // Validate required fields
    if (!email) {
        showError('Email is required');
        return;
    }
    if (!name) {
        showError('Name is required');
        return;
    }
    if (!password) {
        showError('Password is required');
        return;
    }
    if (!confirmPassword) {
        showError('Password confirmation is required');
        return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
        showError('Passwords do not match!');
        return;
    }

    // Make API call to register using Promise chain
    fetch(`${BACKEND_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showError(data.error);
            return Promise.reject(new Error(data.error));
        }
        // Store token and user ID
        setToken(data.token);
        setUserId(data.userId);

        // Show dashboard
        showDashboard();
        showNotice('Registered successfully!');
    })
    .catch(error => {
        console.error('Register error:', error);
    });
};

/**
 * Handle logout - clears session and returns to auth screen
 */
const handleLogout = () => {
    // Make API call to logout using Promise chain
    const token = getToken();

    fetch(`${BACKEND_URL}/auth/logout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        // Clear local storage
        clearToken();
        clearUserId();

        // Show auth screen
        showAuthScreen();
    })
    .catch(error => {
        // Even if logout fails, clear local data and show auth screen
        clearToken();
        clearUserId();
        showAuthScreen();
        console.error('Logout error:', error);
    });
};

/**
 * Set up authentication-related event listeners
 */
const setupAuthListeners = () => {
    // Login form
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', handleLogin);

    // Register form
    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', handleRegister);

    // Switch to register
    const registerLink = document.getElementById('register-link');
    registerLink.addEventListener('click', () => {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('register-container').style.display = 'block';
    });

    // Switch to login
    const loginLink = document.getElementById('login-link');
    loginLink.addEventListener('click', () => {
        document.getElementById('register-container').style.display = 'none';
        document.getElementById('login-container').style.display = 'block';
    });
};

/**
 * Set up all event listeners for the application
 */
const setupEventListeners = () => {
    // Authentication listeners
    setupAuthListeners();

    // Error popup close listener
    const errorClose = document.getElementById('error-close');
    errorClose.addEventListener('click', hideError);

    // Notice popup close listener
    const noticeClose = document.getElementById('notice-close');
    noticeClose.addEventListener('click', hideNotice);

    // Logout listener
    const logoutButton = document.getElementById('logout-button');
    logoutButton.addEventListener('click', handleLogout);
};

/**
 * Initialize the application - entry point
 */
const init = () => {
    // Set up event listeners first
    setupEventListeners();

    // Check if user is already logged in with valid token
    const token = getToken();

    if (isValidToken(token)) {
        // Verify token with backend by making an API call
        fetch(`${BACKEND_URL}/channel`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                // Token is valid, user is authenticated
                showDashboard();
            } else {
                // Token is invalid (401/403), clear and show login
                clearToken();
                clearUserId();
                showAuthScreen();
            }
        })
        .catch(error => {
            // Network error or token invalid, clear and show login
            console.error('Token validation error:', error);
            clearToken();
            clearUserId();
            showAuthScreen();
        });
    } else {
        // No valid token, clear any invalid tokens and show login
        clearToken();
        clearUserId();
        showAuthScreen();
    }
};

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
