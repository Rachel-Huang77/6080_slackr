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

console.log('Slackr application started!');

/**
 * Initialize the application
 */
function init() {
    // Check if user is already logged in
    const token = getToken();
    if (token) {
        showDashboard();
    } else {
        showAuthScreen();
    }

    setupEventListeners();
}

/**
 * Set up all event listeners for the application
 */
function setupEventListeners() {
    // Authentication listeners
    setupAuthListeners();

    // Error popup close listener
    const errorClose = document.getElementById('error-close');
    errorClose.addEventListener('click', hideError);

    // Logout listener
    const logoutButton = document.getElementById('logout-button');
    logoutButton.addEventListener('click', handleLogout);
}

/**
 * Set up authentication-related event listeners
 */
function setupAuthListeners() {
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
}

/**
 * Handle login form submission
 * @param {Event} event - The form submit event
 */
function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // Make API call to login
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
}

/**
 * Handle register form submission
 * @param {Event} event - The form submit event
 */
function handleRegister(event) {
    event.preventDefault();

    const email = document.getElementById('register-email').value;
    const name = document.getElementById('register-name').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-password-confirm').value;

    // Validate passwords match
    if (password !== confirmPassword) {
        showError('Passwords do not match!');
        return;
    }

    // Make API call to register
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
}

/**
 * Handle logout
 */
function handleLogout() {
    // Make API call to logout
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
}

/**
 * Show the authentication screen (login/register)
 */
function showAuthScreen() {
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('dashboard-container').style.display = 'none';

    // Show login by default
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('register-container').style.display = 'none';
}

/**
 * Show the dashboard screen
 */
function showDashboard() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('dashboard-container').style.display = 'block';

    // TODO: Load channels and user data
    console.log('Dashboard loaded');
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
