/**
 * Channel management module for Slackr
 * Handles channel list display, creation, and details
 * Implements Milestone 2.2.1, 2.2.2, 2.2.3
 */

import {
    getChannels,
    createChannel,
    getChannelDetails,
    updateChannel,
    joinChannel,
    leaveChannel,
    getUserProfile
} from './api.js';
import { getUserId, showError, formatTimestamp } from './helpers.js';
import { loadMessages, handleSendMessage, showPinnedMessages } from './channel_messages.js';
import { showInviteModal } from './channel_invite.js';

// Current selected channel state
let currentChannelId = null;
let currentChannelData = null;
let allChannels = []; // Store all channels list for non-member access
let isEditMode = false; // Track if create channel modal is in edit mode
let editingChannelId = null; // Store the channel ID being edited

/**
 * Initialize channel functionality
 * Sets up event listeners and loads initial channel list
 */
export const initChannels = () => {
    // Load channels when dashboard is shown
    loadChannels();

    // Set up create channel button
    const createChannelBtn = document.getElementById('create-channel-button');
    createChannelBtn.addEventListener('click', showCreateChannelModal);

    // Set up create channel form submission
    const createChannelForm = document.getElementById('create-channel-form');
    createChannelForm.addEventListener('submit', handleCreateChannel);

    // Set up cancel button
    const cancelBtn = document.getElementById('create-channel-cancel');
    cancelBtn.addEventListener('click', hideCreateChannelModal);

    // Set up message send button (Milestone 2.3.3)
    const sendBtn = document.getElementById('message-send-button');
    sendBtn.addEventListener('click', () => handleSendMessage(currentChannelId));

    // Set up image upload button (Milestone 2.5.1)
    const imageBtn = document.getElementById('message-image-button');
    const imageInput = document.getElementById('message-image-input');
    imageBtn.addEventListener('click', () => {
        imageInput.click();
    });

    // Set up Enter key for message input
    const messageInput = document.getElementById('message-input');
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(currentChannelId);
        }
    });
};

/**
 * Load and display all channels (public + joined private)
 * Implements 2.2.1 - Viewing a list of channels
 */
export const loadChannels = () => {
    getChannels()
        .then(data => {
            allChannels = data.channels; // Store for non-member access
            renderChannelList(data.channels);
        })
        .catch(error => {
            // Error already displayed by api.js
            console.error('Failed to load channels:', error);
        });
};

/**
 * Render channel list in the sidebar
 * Creates DOM elements using createElement (no innerHTML)
 * @param {Array} channels - Array of channel objects
 */
const renderChannelList = (channels) => {
    const channelList = document.getElementById('channel-list');

    // Clear existing list
    channelList.textContent = '';

    // Separate public and private channels
    const publicChannels = channels.filter(ch => !ch.private);
    const privateChannels = channels.filter(ch => ch.private);

    // Render public channels section
    if (publicChannels.length > 0) {
        const publicHeader = document.createElement('h3');
        publicHeader.textContent = 'Public Channels';
        publicHeader.className = 'channel-section-header';
        channelList.appendChild(publicHeader);

        publicChannels.forEach(channel => {
            const channelElement = createChannelElement(channel, false);
            channelList.appendChild(channelElement);
        });
    }

    // Render private channels section
    if (privateChannels.length > 0) {
        const privateHeader = document.createElement('h3');
        privateHeader.textContent = 'Private Channels';
        privateHeader.className = 'channel-section-header';
        channelList.appendChild(privateHeader);

        privateChannels.forEach(channel => {
            const channelElement = createChannelElement(channel, true);
            channelList.appendChild(channelElement);
        });
    }

    // Show message if no channels
    if (channels.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = 'No channels available. Create one to get started!';
        emptyMessage.className = 'empty-message';
        channelList.appendChild(emptyMessage);
    }
};

/**
 * Create a single channel list item element
 * Uses required class 'channel-container'
 * @param {object} channel - Channel data object
 * @param {boolean} isPrivate - Whether channel is private
 * @return {HTMLElement} Channel container element
 */
const createChannelElement = (channel, isPrivate) => {
    const container = document.createElement('div');
    container.className = 'channel-container';

    // Add active class if this is the current channel
    if (currentChannelId === channel.id) {
        container.classList.add('active');
    }

    // Channel prefix icon
    const prefix = document.createElement('span');
    prefix.className = 'channel-prefix';
    prefix.textContent = isPrivate ? '🔒 ' : '# ';

    // Channel name
    const name = document.createElement('span');
    name.className = 'channel-name';
    name.textContent = channel.name;

    container.appendChild(prefix);
    container.appendChild(name);

    // Click handler to select channel
    container.addEventListener('click', () => {
        selectChannel(channel.id);
    });

    return container;
};

/**
 * Select a channel and display its details
 * Implements navigation to single channel screen
 * @param {number} channelId - Channel ID to select
 */
export const selectChannel = (channelId) => {
    currentChannelId = channelId;

    // Update active state in channel list
    document.querySelectorAll('.channel-container').forEach(el => {
        el.classList.remove('active');
    });

    // Hide welcome screen, show channel view
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('channel-view').style.display = 'flex';

    // Load channel details
    loadChannelDetails(channelId);

    // Reload channel list to update active state
    loadChannels();
};

/**
 * Load and display detailed channel information
 * Implements 2.2.3 - Viewing and editing channel details
 * @param {number} channelId - Channel ID
 */
const loadChannelDetails = (channelId) => {
    const userId = getUserId();

    // Find channel in allChannels list
    const channelBasicInfo = allChannels.find(ch => ch.id === channelId);

    if (!channelBasicInfo) {
        showError('Channel not found');
        return;
    }

    // Check if user is a member
    const isMember = channelBasicInfo.members.includes(userId);

    if (isMember) {
        // User is member - fetch full details from API
        getChannelDetails(channelId)
            .then(data => {
                // IMPORTANT: API doesn't return 'id' field, we need to add it manually
                data.id = channelId;
                currentChannelData = data;
                renderChannelDetails(data);
                // Load messages for this channel (Milestone 2.3.1)
                loadMessages(channelId);
            })
            .catch(error => {
                // Error already displayed by api.js
                console.error('Failed to load channel details:', error);
            });
    } else {
        // User is NOT member - use basic info and show join button
        // channelBasicInfo already has 'id' field from GET /channel list
        currentChannelData = channelBasicInfo;
        renderChannelDetails(channelBasicInfo);
        // Clear messages container for non-members
        document.getElementById('messages-container').textContent = '';
    }
};

/**
 * Render channel details section
 * Shows name, description, type, creator, timestamp
 * Shows edit options for members, join button for non-members
 * @param {object} channelData - Channel details object
 */
const renderChannelDetails = (channelData) => {
    const container = document.getElementById('channel-details-container');
    container.textContent = '';

    const userId = getUserId();
    const isMember = channelData.members.includes(userId);
    const isCreator = channelData.creator === userId;

    // Channel header with name
    const header = document.createElement('div');
    header.className = 'channel-header';

    const nameDisplay = document.createElement('h2');
    nameDisplay.textContent = `${channelData.private ? '🔒 ' : '# '}${channelData.name}`;
    header.appendChild(nameDisplay);

    // Action buttons container
    const actions = document.createElement('div');
    actions.className = 'channel-actions';

    if (isMember) {
        // Edit button (for members)
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit Channel';
        editBtn.className = 'btn-secondary';
        editBtn.addEventListener('click', () => showEditChannelModal(channelData));
        actions.appendChild(editBtn);

        // View pinned messages button (Milestone 2.3.7)
        const pinnedBtn = document.createElement('button');
        pinnedBtn.textContent = 'View Pinned';
        pinnedBtn.className = 'btn-secondary';
        pinnedBtn.addEventListener('click', () => showPinnedMessages(channelData.id));
        actions.appendChild(pinnedBtn);

        // Invite users button (Milestone 2.4.1)
        const inviteBtn = document.createElement('button');
        inviteBtn.textContent = 'Invite Users';
        inviteBtn.id = 'invite-user-button';
        inviteBtn.className = 'btn-secondary';
        inviteBtn.addEventListener('click', () => {
            showInviteModal(channelData.id, () => {
                // Reload channel details after successful invite
                loadChannelDetails(channelData.id);
                loadChannels();
            });
        });
        actions.appendChild(inviteBtn);

        // Leave button (for non-creators)
        if (!isCreator) {
            const leaveBtn = document.createElement('button');
            leaveBtn.textContent = 'Leave Channel';
            leaveBtn.className = 'btn-danger';
            leaveBtn.addEventListener('click', () => handleLeaveChannel(channelData.id));
            actions.appendChild(leaveBtn);
        }
    } else {
        // Join button (for non-members)
        const joinBtn = document.createElement('button');
        joinBtn.textContent = 'Join Channel';
        joinBtn.className = 'btn-primary';
        joinBtn.addEventListener('click', () => handleJoinChannel(channelData.id));
        actions.appendChild(joinBtn);
    }

    header.appendChild(actions);
    container.appendChild(header);

    // Channel info section (only visible to members)
    if (isMember) {
        const infoSection = document.createElement('div');
        infoSection.className = 'channel-info';

        // Description
        const descLabel = document.createElement('strong');
        descLabel.textContent = 'Description: ';
        const descText = document.createElement('span');
        descText.textContent = channelData.description || 'No description';

        const descP = document.createElement('p');
        descP.appendChild(descLabel);
        descP.appendChild(descText);
        infoSection.appendChild(descP);

        // Type
        const typeLabel = document.createElement('strong');
        typeLabel.textContent = 'Type: ';
        const typeText = document.createElement('span');
        typeText.textContent = channelData.private ? 'Private' : 'Public';

        const typeP = document.createElement('p');
        typeP.appendChild(typeLabel);
        typeP.appendChild(typeText);
        infoSection.appendChild(typeP);

        // Created time (only if available)
        if (channelData.createdAt) {
            const timeLabel = document.createElement('strong');
            timeLabel.textContent = 'Created: ';
            const timeText = document.createElement('span');
            timeText.textContent = formatTimestamp(channelData.createdAt);

            const timeP = document.createElement('p');
            timeP.appendChild(timeLabel);
            timeP.appendChild(timeText);
            infoSection.appendChild(timeP);
        }

        // Creator (fetch name from API)
        const creatorRow = document.createElement('p');
        const creatorLabel = document.createElement('strong');
        creatorLabel.textContent = 'Creator: ';
        const creatorName = document.createElement('span');
        creatorName.textContent = `User #${channelData.creator}`; // fallback
        creatorRow.appendChild(creatorLabel);
        creatorRow.appendChild(creatorName);
        infoSection.appendChild(creatorRow);

        // Append info section to container
        container.appendChild(infoSection);

        // Fetch creator name asynchronously
        getUserProfile(channelData.creator)
            .then(userData => {
                if (userData && userData.name) {
                    creatorName.textContent = userData.name;
                }
            })
            .catch(() => {
                // Keep fallback ID if fetch fails
            });
    }
};

/**
 * Show create channel modal
 * Implements 2.2.2 - Creating a new channel
 */
const showCreateChannelModal = () => {
    // Reset edit mode flags
    isEditMode = false;
    editingChannelId = null;

    // Update modal UI
    const modal = document.getElementById('create-channel-container');
    const modalTitle = modal.querySelector('h2');
    const submitBtn = document.getElementById('create-channel-submit');

    modalTitle.textContent = 'Create New Channel';
    submitBtn.textContent = 'Create';

    // Clear and enable form
    document.getElementById('create-channel-name').value = '';
    document.getElementById('create-channel-description').value = '';
    document.getElementById('create-channel-is-private').checked = false;
    document.getElementById('create-channel-is-private').disabled = false;

    // Show modal
    modal.style.display = 'flex';
};

/**
 * Hide create channel modal and reset edit mode
 */
const hideCreateChannelModal = () => {
    const modal = document.getElementById('create-channel-container');
    modal.style.display = 'none';

    // Reset edit mode flags
    isEditMode = false;
    editingChannelId = null;

    // Reset modal UI
    const modalTitle = modal.querySelector('h2');
    const submitBtn = document.getElementById('create-channel-submit');
    modalTitle.textContent = 'Create New Channel';
    submitBtn.textContent = 'Create';
    document.getElementById('create-channel-is-private').disabled = false;
};

/**
 * Handle create/edit channel form submission
 * Uses isEditMode flag to determine whether to create or update
 * @param {Event} event - Form submit event
 */
const handleCreateChannel = (event) => {
    event.preventDefault();

    const name = document.getElementById('create-channel-name').value.trim();
    const description = document.getElementById('create-channel-description').value.trim();
    const isPrivate = document.getElementById('create-channel-is-private').checked;

    // Validate name
    if (!name) {
        showError('Channel name is required');
        return;
    }

    if (isEditMode && editingChannelId) {
        // Update existing channel
        updateChannel(editingChannelId, name, description)
            .then(() => {
                hideCreateChannelModal();
                loadChannelDetails(editingChannelId);
                loadChannels();
            })
            .catch(error => {
                console.error('Failed to update channel:', error);
            });
    } else {
        // Create new channel
        createChannel(name, description, isPrivate)
            .then(data => {
                console.log('Channel created:', data.channelId);
                hideCreateChannelModal();
                loadChannels();
                selectChannel(data.channelId);
            })
            .catch(error => {
                console.error('Failed to create channel:', error);
            });
    }
};

/**
 * Show edit channel modal
 * Reuses create channel modal but sets edit mode flag
 * @param {object} channelData - Current channel data
 */
const showEditChannelModal = (channelData) => {
    // Set edit mode flags
    isEditMode = true;
    editingChannelId = channelData.id;

    // Update modal UI
    const modal = document.getElementById('create-channel-container');
    const modalTitle = modal.querySelector('h2');
    const submitBtn = document.getElementById('create-channel-submit');

    modalTitle.textContent = 'Edit Channel';
    submitBtn.textContent = 'Save Changes';

    // Populate form with current values
    document.getElementById('create-channel-name').value = channelData.name;
    document.getElementById('create-channel-description').value = channelData.description || '';
    document.getElementById('create-channel-is-private').checked = channelData.private;
    document.getElementById('create-channel-is-private').disabled = true; // Can't change privacy

    // Show modal
    modal.style.display = 'flex';
};

/**
 * Handle joining a channel
 * @param {number} channelId - Channel ID to join
 */
const handleJoinChannel = (channelId) => {
    joinChannel(channelId)
        .then(() => {
            loadChannelDetails(channelId);
            loadChannels();
        })
        .catch(error => {
            // Error already displayed by api.js
            console.error('Failed to join channel:', error);
        });
};

/**
 * Handle leaving a channel
 * @param {number} channelId - Channel ID to leave
 */
const handleLeaveChannel = (channelId) => {
    leaveChannel(channelId)
        .then(() => {
            // Return to welcome screen
            document.getElementById('channel-view').style.display = 'none';
            document.getElementById('welcome-screen').style.display = 'flex';
            currentChannelId = null;
            currentChannelData = null;

            // Reload channel list
            loadChannels();
        })
        .catch(error => {
            // Error already displayed by api.js
            console.error('Failed to leave channel:', error);
        });
};

/**
 * Get current selected channel ID
 * @return {number|null} Current channel ID or null
 */
export const getCurrentChannelId = () => currentChannelId;
