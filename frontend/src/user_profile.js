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
 * Show user's own profile modal for viewing (first) then editing
 * Implements 2.4.3 - Viewing and editing user's own profile
 */
export const showOwnProfile = () => {
    const userId = getUserId();

    // Fetch current user profile first
    getUserProfile(userId)
        .then(user => {
            // Show view mode first
            showProfileViewMode(user);
        })
        .catch(error => {
            console.error('Failed to load own profile:', error);
            showError('Failed to load profile');
        });
};

/**
 * Show profile in view mode (before editing)
 * @param {object} user - User profile data
 */
const showProfileViewMode = (user) => {
    // Remove existing view modal if any
    const existing = document.getElementById('profile-view-modal');
    if (existing) {
        existing.remove();
    }

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'profile-view-modal';
    modal.className = 'modal';
    modal.style.display = 'flex';

    const content = document.createElement('div');
    content.className = 'modal-content';

    // Title
    const title = document.createElement('h2');
    title.textContent = 'My Profile';
    content.appendChild(title);

    // Profile image
    if (user.image) {
        const img = document.createElement('img');
        img.src = user.image;
        img.alt = 'Profile photo';
        img.style.width = '100px';
        img.style.height = '100px';
        img.style.borderRadius = '4px';
        img.style.objectFit = 'cover';
        img.style.display = 'block';
        img.style.margin = '0 auto var(--spacing-md)';
        content.appendChild(img);
    }

    // Name
    const nameP = document.createElement('p');
    const nameLabel = document.createElement('strong');
    nameLabel.textContent = 'Name: ';
    nameP.appendChild(nameLabel);
    nameP.appendChild(document.createTextNode(user.name || 'N/A'));
    content.appendChild(nameP);

    // Email
    const emailP = document.createElement('p');
    const emailLabel = document.createElement('strong');
    emailLabel.textContent = 'Email: ';
    emailP.appendChild(emailLabel);
    emailP.appendChild(document.createTextNode(user.email || 'N/A'));
    content.appendChild(emailP);

    // Bio
    const bioP = document.createElement('p');
    const bioLabel = document.createElement('strong');
    bioLabel.textContent = 'Bio: ';
    bioP.appendChild(bioLabel);
    bioP.appendChild(document.createTextNode(user.bio || 'No bio available'));
    content.appendChild(bioP);

    // Buttons
    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = 'var(--spacing-sm)';
    btnContainer.style.marginTop = 'var(--spacing-md)';

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit Profile';
    editBtn.className = 'btn-primary';
    editBtn.addEventListener('click', () => {
        modal.remove();
        showProfileEditMode(user);
    });
    btnContainer.appendChild(editBtn);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.className = 'btn-secondary';
    closeBtn.addEventListener('click', () => modal.remove());
    btnContainer.appendChild(closeBtn);

    content.appendChild(btnContainer);
    modal.appendChild(content);
    document.body.appendChild(modal);

    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
};

/**
 * Show profile in edit mode
 * @param {object} user - User profile data
 */
const showProfileEditMode = (user) => {
    const modal = document.getElementById('own-profile-container');
    const form = document.getElementById('own-profile-form');
    const cancelBtn = document.getElementById('own-profile-cancel');

    // Show modal
    modal.style.display = 'flex';

    // Populate form with current values
    document.getElementById('own-profile-name').value = user.name || '';
    document.getElementById('own-profile-email').value = user.email || '';
    document.getElementById('own-profile-bio').value = user.bio || '';
    document.getElementById('own-profile-password').value = '';

    // Store current image for preview
    modal.dataset.currentImage = user.image || '';

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
