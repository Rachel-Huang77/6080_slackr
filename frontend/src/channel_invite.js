/**
 * Channel invite module for Slackr
 * Handles inviting users to channels
 * Implements Milestone 2.4.1
 */

import { getAllUsers, inviteUserToChannel, getChannelDetails } from './api.js';
import { showError, showNotice } from './helpers.js';

/**
 * Show invite users modal for a channel
 * Implements 2.4.1 - Inviting users to a channel
 * @param {number} channelId - Channel ID to invite users to
 * @param {Function} onSuccess - Callback function called after successful invite
 */
export const showInviteModal = (channelId, onSuccess) => {
    const modal = document.getElementById('channel-invite-container');
    const submitBtn = document.getElementById('invite-submit-button');
    const cancelBtn = document.getElementById('invite-cancel-button');
    const userListContainer = document.getElementById('invite-user-list');

    // Show modal
    modal.style.display = 'flex';

    // Clear previous list
    userListContainer.textContent = '';

    // Fetch channel details to get current members
    getChannelDetails(channelId)
        .then(channelData => {
            const currentMembers = channelData.members || [];

            // Fetch all users
            return getAllUsers()
                .then(data => {
                    return { allUsers: data.users, currentMembers };
                });
        })
        .then(({ allUsers, currentMembers }) => {
            // Filter out users who are already members
            const nonMembers = allUsers.filter(user => !currentMembers.includes(user.id));

            // Sort by name alphabetically (case-insensitive)
            nonMembers.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

            // Check if there are any users to invite
            if (nonMembers.length === 0) {
                const emptyMsg = document.createElement('p');
                emptyMsg.textContent = 'All users are already members of this channel';
                emptyMsg.className = 'empty-message';
                userListContainer.appendChild(emptyMsg);
                submitBtn.disabled = true;
                return;
            }

            submitBtn.disabled = false;

            // Create user list with checkboxes
            nonMembers.forEach(user => {
                const userItem = createUserInviteItem(user);
                userListContainer.appendChild(userItem);
            });
        })
        .catch(error => {
            console.error('Failed to load users for invite:', error);
            const errorMsg = document.createElement('p');
            errorMsg.textContent = 'Failed to load users';
            errorMsg.className = 'error-message';
            userListContainer.appendChild(errorMsg);
        });

    // Handle submit button
    const submitHandler = () => {
        // Get all checked checkboxes
        const checkedBoxes = Array.from(userListContainer.querySelectorAll('.invite-member-checkbox:checked'));

        if (checkedBoxes.length === 0) {
            showError('Please select at least one user to invite');
            return;
        }

        // Get user IDs from checked boxes
        const userIds = checkedBoxes.map(checkbox => parseInt(checkbox.dataset.userId));

        // Invite all selected users (Promise chain for each)
        const invitePromises = userIds.map(userId => inviteUserToChannel(channelId, userId));

        Promise.all(invitePromises)
            .then(() => {
                showNotice(`Successfully invited ${userIds.length} user(s)`);
                closeModal();
                if (onSuccess) {
                    onSuccess();
                }
            })
            .catch(error => {
                console.error('Failed to invite users:', error);
            });
    };

    // Handle cancel button
    const cancelHandler = () => {
        closeModal();
    };

    // Close modal function
    const closeModal = () => {
        modal.style.display = 'none';
        userListContainer.textContent = '';
        submitBtn.removeEventListener('click', submitHandler);
        cancelBtn.removeEventListener('click', cancelHandler);
        modal.removeEventListener('click', outsideClickHandler);
    };

    // Click outside to close
    const outsideClickHandler = (e) => {
        if (e.target === modal) {
            closeModal();
        }
    };

    submitBtn.addEventListener('click', submitHandler);
    cancelBtn.addEventListener('click', cancelHandler);
    modal.addEventListener('click', outsideClickHandler);
};

/**
 * Create a user invite item with checkbox
 * @param {object} user - User object with id and name
 * @return {HTMLElement} User invite item element
 */
const createUserInviteItem = (user) => {
    const container = document.createElement('div');
    container.className = 'invite-member-item';

    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'invite-member-checkbox';
    checkbox.id = `invite-user-${user.id}`;
    checkbox.dataset.userId = user.id;

    // Create label with user name
    const label = document.createElement('label');
    label.htmlFor = `invite-user-${user.id}`;
    label.className = 'invite-member-name';
    label.textContent = user.name;

    container.appendChild(checkbox);
    container.appendChild(label);

    return container;
};
