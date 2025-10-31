/**
 * Helper functions for the Slackr application
 * These utilities support common operations like file handling and API calls
 */

/**
 * Given a js file object representing a jpg or png image, such as one taken
 * from a html file input element, return a promise which resolves to the file
 * data as a data url.
 * More info:
 *   https://developer.mozilla.org/en-US/docs/Web/API/File
 *   https://developer.mozilla.org/en-US/docs/Web/API/FileReader
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
 *
 * Example Usage:
 *   const file = document.querySelector('input[type="file"]').files[0];
 *   console.log(fileToDataUrl(file));
 * @param {File} file The file to be read.
 * @return {Promise<string>} Promise which resolves to the file as a data url.
 */
export const fileToDataUrl = (file) => {
    const validFileTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const valid = validFileTypes.find(type => type === file.type);

    // Bad data, return rejected promise instead of throwing
    if (!valid) {
        return Promise.reject(new Error('provided file is not a png, jpg or jpeg image.'));
    }

    const reader = new FileReader();
    const dataUrlPromise = new Promise((resolve, reject) => {
        reader.onerror = reject;
        reader.onload = () => resolve(reader.result);
    });
    reader.readAsDataURL(file);
    return dataUrlPromise;
};

/**
 * Show an error popup to the user
 * Uses #error-popup and #error-body DOM elements
 * @param {string} message - The error message to display
 */
export const showError = (message) => {
    const errorPopup = document.getElementById('error-popup');
    const errorBody = document.getElementById('error-body');

    errorBody.textContent = message;
    errorPopup.style.display = 'flex';
};

/**
 * Hide the error popup
 * Hides #error-popup DOM element
 */
export const hideError = () => {
    const errorPopup = document.getElementById('error-popup');
    errorPopup.style.display = 'none';
};

/**
 * Check if token is valid (not null, undefined, or string 'null'/'undefined')
 * @param {string} token - Token to validate
 * @return {boolean} True if token is valid
 */
export const isValidToken = (token) => {
    return token &&
           token !== 'null' &&
           token !== 'undefined' &&
           token.trim() !== '';
};

/**
 * Show a success notice popup to the user
 * Uses #notice-popup and #notice-body DOM elements
 * @param {string} message - The success message to display
 */
export const showNotice = (message) => {
    const noticePopup = document.getElementById('notice-popup');
    const noticeBody = document.getElementById('notice-body');

    noticeBody.textContent = message;
    noticePopup.style.display = 'flex';
};

/**
 * Hide the notice popup
 * Hides #notice-popup DOM element
 */
export const hideNotice = () => {
    const noticePopup = document.getElementById('notice-popup');
    noticePopup.style.display = 'none';
};

/**
 * Format ISO timestamp to readable date/time string
 * Returns friendly format like "2 hours ago" or "Jan 15, 2025"
 * @param {string} isoString - ISO 8601 timestamp
 * @return {string} Formatted date/time string
 */
export const formatTimestamp = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    // Less than a minute ago
    if (diffInSeconds < 60) {
        return 'Just now';
    }

    // Less than an hour ago
    if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }

    // Less than a day ago
    if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }

    // More than a day ago - show date
    return date.toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Store authentication token in localStorage
 * @param {string} token - The authentication token
 */
export const setToken = (token) => {
    localStorage.setItem('slackr-token', token);
};

/**
 * Retrieve authentication token from localStorage
 * @return {string|null} The authentication token or null if not found
 */
export const getToken = () => {
  const raw = localStorage.getItem('slackr-token');
  return isValidToken(raw) ? raw : null;
};

/**
 * Remove authentication token from localStorage
 */
export const clearToken = () => {
    localStorage.removeItem('slackr-token');
};

/**
 * Store user ID in localStorage
 * @param {number} userId - The user ID
 */
export const setUserId = (userId) => {
    localStorage.setItem('slackr-user-id', userId);
};

/**
 * Retrieve user ID from localStorage
 * @return {number|null} The user ID or null if not found
 */
export const getUserId = () => {
    const userId = localStorage.getItem('slackr-user-id');
    return userId ? parseInt(userId) : null;
};

/**
 * Remove user ID from localStorage
 */
export const clearUserId = () => {
    localStorage.removeItem('slackr-user-id');
};
