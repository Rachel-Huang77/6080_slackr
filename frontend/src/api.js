/**
 * Unified API wrapper for Slackr backend
 * Handles all HTTP requests with Promise-based approach
 * Includes automatic token injection and error handling
 */

import { BACKEND_URL } from './config.js';
import { getToken, showError } from './helpers.js';

/**
 * Make an authenticated API call to the backend
 * @param {string} path - API endpoint path (e.g., '/channel')
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {object|null} body - Request body for POST/PUT requests
 * @param {boolean} requireAuth - Whether to include Authorization header
 * @return {Promise<any>} Promise resolving to response data
 */

export const getUserProfile = (userId) => apiCall(`/user/${userId}`, 'GET');

export const apiCall = (path, method = 'GET', body = null, requireAuth = true) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    // Add authorization token if required
    if (requireAuth) {
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const config = {
        method,
        headers,
    };

    // Add body for POST/PUT/DELETE requests
    if (body && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
        config.body = JSON.stringify(body);
    }

    // Build URL with query params for GET requests with body
    let url = `${BACKEND_URL}${path}`;
    if (method === 'GET' && body) {
        const params = new URLSearchParams(body);
        url += `?${params.toString()}`;
    }

    return fetch(url, config)
        .then(response => {
            // Check if response is ok (status 200-299)
            if (!response.ok) {
                // For non-2xx responses, try to parse error message
                return response.json()
                    .then(data => {
                        showError(data.error || `HTTP Error: ${response.status}`);
                        return Promise.reject(data.error || `HTTP ${response.status}`);
                    })
                    .catch(() => {
                        showError(`HTTP Error: ${response.status}`);
                        return Promise.reject(`HTTP ${response.status}`);
                    });
            }
            return response.json();
        })
        .then(data => {
            // Check for API-level errors in successful responses
            if (data && data.error) {
                showError(data.error);
                return Promise.reject(data.error);
            }
            return data;
        })
        .catch(error => {
            // Only handle network errors here (fetch failures)
            // API errors are already handled above
            if (error instanceof TypeError || error.message === 'Failed to fetch') {
                console.error(`Network Error [${method} ${path}]:`, error);
                showError('Network error. Please check your connection and try again.');
                return Promise.reject('Network error');
            }
            // Re-throw API errors without additional handling
            console.error(`API Error [${method} ${path}]:`, error);
            return Promise.reject(error);
        });
};

/**
 * Get list of all channels (public + joined private)
 * @return {Promise<object>} Promise resolving to { channels: [...] }
 */
export const getChannels = () => {
    return apiCall('/channel', 'GET');
};

/**
 * Create a new channel
 * @param {string} name - Channel name
 * @param {string} description - Channel description
 * @param {boolean} isPrivate - Whether channel is private
 * @return {Promise<object>} Promise resolving to { channelId: number }
 */
export const createChannel = (name, description, isPrivate) => {
    return apiCall('/channel', 'POST', {
        name,
        description: description || ' ', // Backend requires description, use space if empty
        private: isPrivate
    });
};

/**
 * Get detailed information about a specific channel
 * @param {number} channelId - Channel ID
 * @return {Promise<object>} Promise resolving to channel details
 */
export const getChannelDetails = (channelId) => {
    return apiCall(`/channel/${channelId}`, 'GET');
};

/**
 * Update channel details (name and/or description)
 * @param {number} channelId - Channel ID
 * @param {string} name - New channel name
 * @param {string} description - New channel description
 * @return {Promise<object>} Promise resolving to success response
 */
export const updateChannel = (channelId, name, description) => {
    return apiCall(`/channel/${channelId}`, 'PUT', {
        name,
        description
    });
};

/**
 * Join a channel (for non-members)
 * @param {number} channelId - Channel ID
 * @return {Promise<object>} Promise resolving to success response
 */
export const joinChannel = (channelId) => {
    return apiCall(`/channel/${channelId}/join`, 'POST');
};

/**
 * Leave a channel (for members)
 * @param {number} channelId - Channel ID
 * @return {Promise<object>} Promise resolving to success response
 */
export const leaveChannel = (channelId) => {
    return apiCall(`/channel/${channelId}/leave`, 'POST');
};
