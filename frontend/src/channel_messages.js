/**
 * Message functionality for Slackr channels
 * Implements Milestone 2.3 - Channel messages
 */

import {
    getMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    pinMessage,
    unpinMessage,
    reactMessage,
    unreactMessage,
    getUserProfile
} from './api.js';
import { getUserId, showError, showNotice, formatTimestamp, fileToDataUrl } from './helpers.js';
import { showUserProfile } from './user_profile.js';

// Available emoji reactions (Milestone 2.3.6)
const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

// Image gallery state (Milestone 2.5.2)
let currentImageIndex = 0;
let channelImages = [];

/**
 * Load and display messages for a channel
 * Implements 2.3.1 - Viewing channel messages
 * @param {number} channelId - Channel ID
 */
export const loadMessages = (channelId) => {
    getMessages(channelId, 0)
        .then(data => {
            renderMessages(data.messages, channelId);
        })
        .catch(error => {
            console.error('Failed to load messages:', error);
        });
};

/**
 * Render messages in the messages container
 * Pinned messages are displayed at the top, then regular messages in chronological order
 * @param {Array} messages - Array of message objects
 * @param {number} channelId - Channel ID
 */
const renderMessages = (messages, channelId) => {
    const container = document.getElementById('messages-container');
    container.textContent = '';

    if (!messages || messages.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.textContent = 'No messages yet. Start the conversation!';
        emptyMsg.className = 'empty-message';
        container.appendChild(emptyMsg);
        return;
    }

    // Backend returns messages newest first, we need oldest first (reverse)
    const reversedMessages = [...messages].reverse();
    const currentUserId = getUserId();

    // Separate pinned and regular messages
    const pinnedMessages = reversedMessages.filter(msg => msg.pinned);
    const regularMessages = reversedMessages.filter(msg => !msg.pinned);

    // Display pinned messages section if there are any
    if (pinnedMessages.length > 0) {
        const pinnedSection = document.createElement('div');
        pinnedSection.className = 'pinned-messages-section';

        const pinnedHeader = document.createElement('div');
        pinnedHeader.className = 'pinned-messages-header';
        pinnedHeader.textContent = `📌 Pinned Messages (${pinnedMessages.length})`;
        pinnedSection.appendChild(pinnedHeader);

        pinnedMessages.forEach(msg => {
            const messageEl = createMessageElement(msg, currentUserId, channelId, true);
            pinnedSection.appendChild(messageEl);
        });

        container.appendChild(pinnedSection);

        // Add separator between pinned and regular messages
        const separator = document.createElement('div');
        separator.className = 'pinned-messages-separator';
        container.appendChild(separator);
    }

    // Display regular messages
    regularMessages.forEach(msg => {
        const messageEl = createMessageElement(msg, currentUserId, channelId, false);
        container.appendChild(messageEl);
    });

    // Scroll to bottom to show newest messages (but pinned stay at top)
    container.scrollTop = container.scrollHeight;
};

/**
 * Create a single message DOM element
 * Implements 2.3.1 - Message display with sender, photo, timestamp
 * @param {object} msg - Message object
 * @param {number} currentUserId - Current user ID
 * @param {number} channelId - Channel ID
 * @param {boolean} isPinnedSection - Whether this message is in the pinned section
 * @return {HTMLElement} Message container element
 */
const createMessageElement = (msg, currentUserId, channelId, isPinnedSection = false) => {
    const container = document.createElement('div');
    container.className = 'message-container';
    if (isPinnedSection) {
        container.classList.add('message-container-pinned');
    }
    container.setAttribute('data-message-id', msg.id);

    // Message header with sender photo and info
    const header = document.createElement('div');
    header.className = 'message-header';

    // Sender profile photo
    const photo = document.createElement('img');
    photo.className = 'message-sender-photo';
    photo.alt = 'Sender profile photo';
    // Default photo if not available
    photo.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23ccc"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23fff" font-size="40"%3EU%3C/text%3E%3C/svg%3E';

    // Fetch user profile for photo and name
    getUserProfile(msg.sender)
        .then(user => {
            if (user.image) {
                photo.src = user.image;
            }
            senderName.textContent = user.name || `User #${msg.sender}`;
        })
        .catch(() => {
            senderName.textContent = `User #${msg.sender}`;
        });

    header.appendChild(photo);

    // Sender info container
    const senderInfo = document.createElement('div');
    senderInfo.className = 'message-sender-info';

    const senderName = document.createElement('strong');
    senderName.className = 'message-user-name';
    senderName.textContent = `User #${msg.sender}`; // Fallback, will be updated
    senderName.style.cursor = 'pointer'; // Make it look clickable

    // Add click handler to show user profile (Milestone 2.4.2)
    senderName.addEventListener('click', () => {
        showUserProfile(msg.sender);
    });

    const timestamp = document.createElement('span');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = formatTimestamp(msg.sentAt);

    senderInfo.appendChild(senderName);
    senderInfo.appendChild(timestamp);
    header.appendChild(senderInfo);

    // Edited indicator (Milestone 2.3.5)
    if (msg.edited) {
        const editedIndicator = document.createElement('span');
        editedIndicator.className = 'message-edited';
        editedIndicator.textContent = ` (edited ${formatTimestamp(msg.editedAt)})`;
        senderInfo.appendChild(editedIndicator);
    }

    // Pin indicator (Milestone 2.3.7)
    if (msg.pinned) {
        const pinIndicator = document.createElement('span');
        pinIndicator.className = 'message-pinned-indicator';
        pinIndicator.textContent = ' 📌';
        pinIndicator.title = 'Pinned message';
        senderInfo.appendChild(pinIndicator);
    }

    container.appendChild(header);

    // Create message body container for content and image
    const messageBody = document.createElement('div');
    messageBody.className = 'message-body';

    // Message content
    if (msg.message) {
        const content = document.createElement('p');
        content.className = 'message-content';
        content.textContent = msg.message;
        messageBody.appendChild(content);
    }

    // Message image (Milestone 2.5.1, 2.5.2)
    if (msg.image) {
        const img = document.createElement('img');
        img.src = msg.image;
        img.alt = 'Message image';
        img.className = 'message-image';
        img.style.cursor = 'pointer';
        // Click to view enlarged image
        img.addEventListener('click', () => {
            showImageViewer(msg.image, channelId);
        });
        messageBody.appendChild(img);
    }

    container.appendChild(messageBody);

    // Message actions (edit/delete/pin/react)
    const actions = createMessageActions(msg, currentUserId, channelId);
    container.appendChild(actions);

    // Reactions display (Milestone 2.3.6)
    if (msg.reacts && msg.reacts.length > 0) {
        const reactionsEl = createReactionsDisplay(msg.reacts, msg.id, currentUserId, channelId);
        container.appendChild(reactionsEl);
    }

    return container;
};

/**
 * Create message action buttons
 * @param {object} msg - Message object
 * @param {number} currentUserId - Current user ID
 * @param {number} channelId - Channel ID
 * @return {HTMLElement} Actions container
 */
const createMessageActions = (msg, currentUserId, channelId) => {
    const actions = document.createElement('div');
    actions.className = 'message-actions';

    const isOwnMessage = msg.sender === currentUserId;

    // Edit button (Milestone 2.3.5 - only for own messages)
    if (isOwnMessage) {
        const editBtn = document.createElement('button');
        editBtn.className = 'message-edit-button';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => handleEditMessage(msg, channelId));
        actions.appendChild(editBtn);
    }

    // Delete button (Milestone 2.3.4 - only for own messages)
    if (isOwnMessage) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'message-delete-button';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => handleDeleteMessage(msg.id, channelId));
        actions.appendChild(deleteBtn);
    }

    // Pin/Unpin button (Milestone 2.3.7)
    const pinBtn = document.createElement('button');
    pinBtn.className = 'message-pin-button';
    pinBtn.textContent = msg.pinned ? 'Unpin' : 'Pin';
    pinBtn.addEventListener('click', () => handlePinMessage(msg.id, msg.pinned, channelId));
    actions.appendChild(pinBtn);

    // React button (Milestone 2.3.6)
    const reactBtn = document.createElement('button');
    reactBtn.className = 'message-react-button';
    reactBtn.textContent = 'React';
    reactBtn.addEventListener('click', () => showReactionsMenu(msg.id, channelId));
    actions.appendChild(reactBtn);

    return actions;
};

/**
 * Create reactions display
 * @param {Array} reacts - Array of reaction objects
 * @param {number} messageId - Message ID
 * @param {number} currentUserId - Current user ID
 * @param {number} channelId - Channel ID
 * @return {HTMLElement} Reactions container
 */
const createReactionsDisplay = (reacts, messageId, currentUserId, channelId) => {
    const container = document.createElement('div');
    container.className = 'message-reactions';

    // Group reactions by emoji
    const grouped = {};
    reacts.forEach(react => {
        if (!grouped[react.react]) {
            grouped[react.react] = [];
        }
        grouped[react.react].push(react.user);
    });

    // Create button for each unique reaction
    Object.entries(grouped).forEach(([emoji, users]) => {
        const reactBtn = document.createElement('button');
        reactBtn.className = 'reaction-item';
        reactBtn.textContent = `${emoji} ${users.length}`;

        // Highlight if current user reacted
        if (users.includes(currentUserId)) {
            reactBtn.classList.add('reacted');
        }

        // Click to toggle reaction
        reactBtn.addEventListener('click', () => {
            if (users.includes(currentUserId)) {
                handleUnreact(messageId, emoji, channelId);
            } else {
                handleReact(messageId, emoji, channelId);
            }
        });

        container.appendChild(reactBtn);
    });

    return container;
};

/**
 * Handle sending a new message
 * Implements 2.3.3 - Sending messages
 * Implements 2.5.1 - Sending photos (text OR image, not both)
 */
export const handleSendMessage = (channelId) => {
    const messageInput = document.getElementById('message-input');
    const imageInput = document.getElementById('message-image-input');
    const previewContainer = document.getElementById('message-image-preview-container');
    const messageText = messageInput.value.trim();

    // Check if there's text or image (at least one required)
    const hasText = messageText.length > 0;
    const hasImage = imageInput.files && imageInput.files[0];

    if (!hasText && !hasImage) {
        showError('Message cannot be empty');
        return;
    }

    // Prepare image data if exists
    const imagePromise = hasImage
        ? fileToDataUrl(imageInput.files[0])
        : Promise.resolve(null);

    // Send message with both text and image (if available)
    imagePromise
        .then(imageData => {
            // Send message with text (or null) and image (or null)
            return sendMessage(
                channelId,
                hasText ? messageText : null,
                imageData
            );
        })
        .then(() => {
            // Clear inputs after successful send
            messageInput.value = '';
            imageInput.value = '';
            previewContainer.style.display = 'none';
            previewContainer.textContent = '';
            loadMessages(channelId);
        })
        .catch(error => {
            console.error('Failed to send message:', error);
        });
};

/**
 * Handle deleting a message
 * Implements 2.3.4 - Deleting messages
 */
const handleDeleteMessage = (messageId, channelId) => {
    if (!confirm('Are you sure you want to delete this message?')) {
        return;
    }

    deleteMessage(channelId, messageId)
        .then(() => {
            loadMessages(channelId);
            showNotice('Message deleted');
        })
        .catch(error => {
            console.error('Failed to delete message:', error);
        });
};

/**
 * Handle editing a message
 * Implements 2.3.5 - Editing messages
 */
const handleEditMessage = (msg, channelId) => {
    const newMessage = prompt('Edit message:', msg.message);

    if (newMessage === null) {
        return; // User cancelled
    }

    const trimmedMessage = newMessage.trim();

    // Validate: cannot be empty
    if (!trimmedMessage) {
        showError('Message cannot be empty');
        return;
    }

    // Validate: cannot be same as existing (2.3.5 requirement)
    if (trimmedMessage === msg.message) {
        showError('Message must be different from the existing message');
        return;
    }

    editMessage(channelId, msg.id, trimmedMessage)
        .then(() => {
            loadMessages(channelId);
            showNotice('Message edited');
        })
        .catch(error => {
            console.error('Failed to edit message:', error);
        });
};

/**
 * Handle pinning/unpinning a message
 * Implements 2.3.7 - Pinning messages
 */
const handlePinMessage = (messageId, isPinned, channelId) => {
    const action = isPinned ? unpinMessage : pinMessage;

    action(channelId, messageId)
        .then(() => {
            loadMessages(channelId);
            showNotice(isPinned ? 'Message unpinned' : 'Message pinned');
        })
        .catch(error => {
            console.error('Failed to pin/unpin message:', error);
        });
};

/**
 * Show reactions menu
 * Implements 2.3.6 - Reacting to messages
 */
const showReactionsMenu = (messageId, channelId) => {
    // Remove existing emoji picker if any
    const existing = document.getElementById('emoji-picker-modal');
    if (existing) {
        existing.remove();
    }

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'emoji-picker-modal';
    modal.className = 'modal';
    modal.style.display = 'flex';

    const content = document.createElement('div');
    content.className = 'modal-content';

    const title = document.createElement('h2');
    title.textContent = 'Choose a reaction:';
    content.appendChild(title);

    // Create emoji picker
    const picker = document.createElement('div');
    picker.className = 'emoji-picker';

    REACTIONS.forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'emoji-option';
        btn.textContent = emoji;
        btn.addEventListener('click', () => {
            handleReact(messageId, emoji, channelId);
            modal.remove();
        });
        picker.appendChild(btn);
    });

    content.appendChild(picker);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Cancel';
    closeBtn.className = 'btn-secondary';
    closeBtn.addEventListener('click', () => modal.remove());
    content.appendChild(closeBtn);

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
 * Handle adding a reaction
 */
const handleReact = (messageId, emoji, channelId) => {
    reactMessage(channelId, messageId, emoji)
        .then(() => {
            loadMessages(channelId);
        })
        .catch(error => {
            console.error('Failed to react:', error);
        });
};

/**
 * Handle removing a reaction
 */
const handleUnreact = (messageId, emoji, channelId) => {
    unreactMessage(channelId, messageId, emoji)
        .then(() => {
            loadMessages(channelId);
        })
        .catch(error => {
            console.error('Failed to unreact:', error);
        });
};

/**
 * Show all pinned messages in a modal
 * Implements 2.3.7 - Viewing all pinned messages
 */
export const showPinnedMessages = (channelId) => {
    // Get all messages (not just first 25) by fetching multiple times if needed
    // For now, we'll show pinned messages from the first 25
    getMessages(channelId, 0)
        .then(data => {
            const pinnedMessages = data.messages.filter(msg => msg.pinned);

            if (pinnedMessages.length === 0) {
                showNotice('No pinned messages in this channel');
                return;
            }

            // Create and show modal
            displayPinnedMessagesModal(pinnedMessages, channelId);
        })
        .catch(error => {
            console.error('Failed to load pinned messages:', error);
        });
};

/**
 * Display pinned messages in a modal
 */
const displayPinnedMessagesModal = (pinnedMessages, channelId) => {
    // Check if modal already exists, remove it
    const existingModal = document.getElementById('pinned-messages-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'pinned-messages-modal';
    modal.className = 'modal';
    modal.style.display = 'flex';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    // Modal header
    const header = document.createElement('h2');
    header.textContent = `Pinned Messages (${pinnedMessages.length})`;
    modalContent.appendChild(header);

    // Messages container
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'pinned-messages-list';
    messagesContainer.style.maxHeight = '400px';
    messagesContainer.style.overflowY = 'auto';

    const currentUserId = getUserId();

    // Render pinned messages (newest first)
    pinnedMessages.forEach(msg => {
        const messageEl = createMessageElement(msg, currentUserId, channelId);
        messagesContainer.appendChild(messageEl);
    });

    modalContent.appendChild(messagesContainer);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
    modalContent.appendChild(closeBtn);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
};

/**
 * Show image viewer modal with navigation
 * Implements 2.5.2 - Viewing photos with navigation
 * @param {string} imageSrc - Image source URL to display
 * @param {number} channelId - Channel ID to fetch all images from
 */
const showImageViewer = (imageSrc, channelId) => {
    // Fetch all messages to get all images in channel
    getMessages(channelId, 0)
        .then(data => {
            // Extract all images from messages
            channelImages = data.messages
                .filter(msg => msg.image)
                .map(msg => msg.image)
                .reverse(); // Oldest first

            // Find current image index
            currentImageIndex = channelImages.findIndex(img => img === imageSrc);
            if (currentImageIndex === -1) currentImageIndex = 0;

            // Show the modal
            displayImageViewer();
        })
        .catch(error => {
            console.error('Failed to load images:', error);
        });
};

/**
 * Display the image viewer modal
 */
const displayImageViewer = () => {
    const modal = document.getElementById('image-viewer-modal');
    const image = document.getElementById('image-viewer-image');
    const prevBtn = document.getElementById('image-viewer-prev');
    const nextBtn = document.getElementById('image-viewer-next');
    const closeBtn = document.getElementById('image-viewer-close');
    const info = document.getElementById('image-viewer-info');

    // Set current image
    image.src = channelImages[currentImageIndex];

    // Update navigation buttons visibility
    prevBtn.style.display = currentImageIndex > 0 ? 'block' : 'none';
    nextBtn.style.display = currentImageIndex < channelImages.length - 1 ? 'block' : 'none';

    // Update info text
    info.textContent = `Image ${currentImageIndex + 1} of ${channelImages.length}`;

    // Show modal
    modal.style.display = 'flex';

    // Navigation handlers
    const prevHandler = () => {
        if (currentImageIndex > 0) {
            currentImageIndex--;
            displayImageViewer();
        }
    };

    const nextHandler = () => {
        if (currentImageIndex < channelImages.length - 1) {
            currentImageIndex++;
            displayImageViewer();
        }
    };

    const closeHandler = () => {
        modal.style.display = 'none';
        prevBtn.removeEventListener('click', prevHandler);
        nextBtn.removeEventListener('click', nextHandler);
        closeBtn.removeEventListener('click', closeHandler);
        modal.removeEventListener('click', outsideClickHandler);
    };

    const outsideClickHandler = (e) => {
        if (e.target === modal) {
            closeHandler();
        }
    };

    // Remove old listeners and add new ones
    prevBtn.removeEventListener('click', prevHandler);
    nextBtn.removeEventListener('click', nextHandler);
    closeBtn.removeEventListener('click', closeHandler);
    modal.removeEventListener('click', outsideClickHandler);

    prevBtn.addEventListener('click', prevHandler);
    nextBtn.addEventListener('click', nextHandler);
    closeBtn.addEventListener('click', closeHandler);
    modal.addEventListener('click', outsideClickHandler);
};
