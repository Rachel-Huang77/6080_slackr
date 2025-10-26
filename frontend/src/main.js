/**
 * Main entry point for the Slackr application
 * This file initializes the app and sets up event listeners
 */

import { BACKEND_URL } from './config.js';
import {
    fileToDataUrl,
    showError,
    hideError,
    formatTimestamp,
    setToken,
    getToken,
    clearToken,
    setUserId,
    getUserId,
    clearUserId
} from './helpers.js';
import { initChannels } from './channels.js';

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
        } else {
            // Store token and user ID
            setToken(data.token);
            setUserId(data.userId);

            // Show dashboard
            showDashboard();
        }
    })
    .catch(error => {
        showError('Failed to login. Please try again.');
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
        } else {
            // Store token and user ID
            setToken(data.token);
            setUserId(data.userId);

            // Show dashboard
            showDashboard();
        }
    })
    .catch(error => {
        showError('Failed to register. Please try again.');
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

    // Logout listener
    const logoutButton = document.getElementById('logout-button');
    logoutButton.addEventListener('click', handleLogout);
};

/**
 * Initialize the application - entry point
 */
const init = () => {
    // Check if user is already logged in
    const token = getToken();
    if (token) {
        showDashboard();
    } else {
        showAuthScreen();
    }

    setupEventListeners();
};

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
