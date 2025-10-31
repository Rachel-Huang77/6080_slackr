/**
 * User profile module for Slackr
 * Handles viewing and editing user profiles
 * Implements Milestone 2.4.2 and 2.4.3
 */

import { getUserProfile, updateUserProfile } from './api.js';
import { getUserId, showError, showNotice, fileToDataUrl } from './helpers.js';

/**
 * Show a user's profile modal (for viewing other users)
 * Implements 2.4.2 - User profiles
 * @param {number} userId - User ID to display
 */
export const showUserProfile = (userId) => {
    const modal = document.getElementById('profile-container');
    const closeBtn = document.getElementById('profile-close');

    // Show loading state
    modal.style.display = 'flex';

    // Fetch user profile
    getUserProfile(userId)
        .then(user => {
            // Update modal content
            const profileImage = document.getElementById('profile-image');
            const profileName = document.getElementById('profile-name');
            const profileEmail = document.getElementById('profile-email');
            const profileBio = document.getElementById('profile-bio');

            // Set profile image with fallback
            if (user.image) {
                profileImage.src = user.image;
            } else {
                profileImage.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23ccc"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23fff" font-size="40"%3EU%3C/text%3E%3C/svg%3E';
            }
            profileImage.alt = `${user.name}'s profile photo`;

            // Set profile info
            profileName.textContent = user.name || 'Unknown User';
            profileEmail.textContent = user.email || '';
            profileBio.textContent = user.bio || 'No bio available';
        })
        .catch(error => {
            console.error('Failed to load user profile:', error);
            modal.style.display = 'none';
        });

    // Close button handler
    const closeHandler = () => {
        modal.style.display = 'none';
        closeBtn.removeEventListener('click', closeHandler);
        modal.removeEventListener('click', outsideClickHandler);
    };

    // Click outside to close
    const outsideClickHandler = (e) => {
        if (e.target === modal) {
            closeHandler();
        }
    };

    closeBtn.addEventListener('click', closeHandler);
    modal.addEventListener('click', outsideClickHandler);
};

/**
 * Show user's own profile modal for viewing and editing
 * Implements 2.4.3 - Viewing and editing user's own profile
 */
export const showOwnProfile = () => {
    const modal = document.getElementById('own-profile-container');
    const form = document.getElementById('own-profile-form');
    const cancelBtn = document.getElementById('own-profile-cancel');

    const userId = getUserId();

    // Show modal
    modal.style.display = 'flex';

    // Fetch current user profile
    getUserProfile(userId)
        .then(user => {
            // Populate form with current values
            document.getElementById('own-profile-name').value = user.name || '';
            document.getElementById('own-profile-email').value = user.email || '';
            document.getElementById('own-profile-bio').value = user.bio || '';
            document.getElementById('own-profile-password').value = '';

            // Store current image for preview
            modal.dataset.currentImage = user.image || '';
        })
        .catch(error => {
            console.error('Failed to load own profile:', error);
            modal.style.display = 'none';
        });

    // Handle form submission
    const submitHandler = (e) => {
        e.preventDefault();

        const name = document.getElementById('own-profile-name').value.trim();
        const email = document.getElementById('own-profile-email').value.trim();
        const bio = document.getElementById('own-profile-bio').value;
        const password = document.getElementById('own-profile-password').value;
        const imageInput = document.getElementById('own-profile-image-input');

        // Validate required fields
        if (!name) {
            showError('Name is required');
            return;
        }
        if (!email) {
            showError('Email is required');
            return;
        }

        // Handle image upload if file selected
        const handleImageUpload = imageInput.files && imageInput.files[0]
            ? fileToDataUrl(imageInput.files[0])
            : Promise.resolve(null);

        handleImageUpload
            .then(imageData => {
                // Update profile with new values
                // Only send password if user entered one
                const passwordValue = password.trim() ? password : null;
                return updateUserProfile(
                    email,
                    passwordValue,
                    name,
                    bio,
                    imageData
                );
            })
            .then(() => {
                showNotice('Profile updated successfully');
                closeOwnProfile();
            })
            .catch(error => {
                console.error('Failed to update profile:', error);
                // Error already displayed by api.js or showError
            });
    };

    // Handle cancel button
    const cancelHandler = () => {
        closeOwnProfile();
    };

    // Close function
    const closeOwnProfile = () => {
        modal.style.display = 'none';
        form.removeEventListener('submit', submitHandler);
        cancelBtn.removeEventListener('click', cancelHandler);
        modal.removeEventListener('click', outsideClickHandler);
        form.reset();
    };

    // Click outside to close
    const outsideClickHandler = (e) => {
        if (e.target === modal) {
            closeOwnProfile();
        }
    };

    form.addEventListener('submit', submitHandler);
    cancelBtn.addEventListener('click', cancelHandler);
    modal.addEventListener('click', outsideClickHandler);
};

/**
 * Initialize password visibility toggle for own profile
 * Implements password show/hide requirement in 2.4.3
 */
export const initPasswordToggle = () => {
    const passwordInput = document.getElementById('own-profile-password');

    if (!passwordInput) return;

    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.textContent = 'Show';
    toggleBtn.className = 'password-toggle-btn';

    // Insert after password input
    passwordInput.parentNode.appendChild(toggleBtn);

    // Toggle handler
    toggleBtn.addEventListener('click', () => {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.textContent = 'Hide';
        } else {
            passwordInput.type = 'password';
            toggleBtn.textContent = 'Show';
        }
    });
};
