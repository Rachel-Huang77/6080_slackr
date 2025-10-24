# Slackr Development Guide

## Project Overview

**6080_slackr** is a Slack-like messaging application built with Vanilla JavaScript as part of the COMP6080 Web Frontend Programming course. This is a Single Page Application (SPA) that interacts with a RESTful API backend.

**Assignment Due**: Friday, 31st October, 8pm

## Key Requirements

### Critical Constraints
- ⚠️ **Single Page App (SPA)**: Only ONE HTML file allowed
- ⚠️ **No async/await**: Must use JavaScript Promises only (50% penalty if violated)
- ⚠️ **No innerHTML**: Cannot use innerHTML, DOMParser, or insertAdjacentHTML (50% penalty if violated)
- ⚠️ **Vanilla JavaScript**: No React, jQuery, Angular, or other frameworks
- ⚠️ **Git Commits**: Max 100 lines per commit (enforced by pre-commit hook)

### Allowed
- External CSS libraries (Bootstrap, etc.) with attribution
- Bootstrap JavaScript and jQuery (but only for Bootstrap, not for your code)
- Small code snippets (<10 lines) from Stack Overflow with attribution
- `innerText` property
- Building HTML elements via JavaScript DOM manipulation

## Project Structure

```
6080_slackr/
├── frontend/
│   ├── index.html              # Single page app HTML
│   ├── src/
│   │   ├── config.js           # Backend API configuration
│   │   ├── helpers.js          # Utility functions
│   │   └── main.js             # Main application logic
│   └── styles/
│       └── global.css          # Application styles
├── util/
│   ├── setup.sh                # Git pre-commit hook setup
│   └── pre-commit.sh           # Pre-commit validation script
├── progress.csv                # Milestone tracking (REQUIRED)
├── CLAUDE.md                   # Claude Code guidelines
└── README.md                   # Project documentation
```

## Setup Instructions

### 1. Install Prerequisites
```bash
# Install http-server globally (once)
npm install --global http-server
```

### 2. Set up Git Pre-commit Hooks
```bash
# Run this from project root
./util/setup.sh
```

### 3. Clone Backend Server
```bash
# In a separate directory
git clone git@nw-syd-gitlab.cseunsw.tech:COMP6080/24T3/ass3-backend.git
cd ass3-backend
npm install
```

### 4. Start Backend Server
```bash
# In backend directory
npm start
# Server runs on http://localhost:5005
```

### 5. Start Frontend Server
```bash
# In project root directory
npx http-server frontend -c 1 -p 8080
# Frontend runs on http://localhost:8080
```

## Development Workflow

### Before Starting Any Feature
1. Read the spec section carefully
2. Update `progress.csv` to track your progress
3. Plan DOM structure with required IDs/classes
4. Write code in small increments
5. Test frequently
6. Commit regularly (max 100 lines per commit)
7. Push to GitHub for backup

### Making API Calls

**POST Request Example (Login/Register)**:
```javascript
fetch('http://localhost:5005/auth/login', {
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
        // Handle success
    }
});
```

**GET Request Example (Authenticated)**:
```javascript
fetch(`http://localhost:5005/channel?start=0&limit=25`, {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }
})
.then(response => response.json())
.then(data => {
    if (data.error) {
        showError(data.error);
    } else {
        // Handle data
    }
});
```

## Assignment Milestones

### Milestone 1 - Registration & Login (15%)
- [x] 2.1.1 Login form with required IDs
- [ ] 2.1.2 Registration form with required IDs
- [ ] 2.1.3 Error popup system
- [ ] 2.1.4 Home page with logout

### Milestone 2 - Channels (10%)
- [ ] 2.2.1 View list of channels
- [ ] 2.2.2 Create new channel
- [ ] 2.2.3 View and edit channel details

### Milestone 3 - Messages (18%)
- [ ] 2.3.1 View channel messages
- [ ] 2.3.2 Message pagination
- [ ] 2.3.3 Send messages
- [ ] 2.3.4 Delete messages
- [ ] 2.3.5 Edit messages
- [ ] 2.3.6 React to messages
- [ ] 2.3.7 Pin messages

### Milestone 4 - Multi-user (10%)
- [ ] 2.4.1 Invite users to channel
- [ ] 2.4.2 View user profiles
- [ ] 2.4.3 Edit own profile

### Milestone 5 - Photos (7%)
- [ ] 2.5.1 Send photos in channels
- [ ] 2.5.2 View photos in modal

### Milestone 6 - Challenge (5%)
- [ ] 2.6.1 Infinite scroll
- [ ] 2.6.2 Push notifications

### Milestone 7 - Extra Challenge (5%)
- [ ] 2.7.1 Offline access
- [ ] 2.7.2 Fragment-based URL routing

### Bonus (5%)
- [ ] Your creative features

## Marking Breakdown
- **70%** - Compliance to task requirements
- **15%** - Mobile responsiveness (400px+ width)
- **10%** - Code style and quality
- **5%** - Usability & accessibility
- **5%** - Bonus features

## Required DOM Element IDs

### Authentication
- `login-email` - Login email input
- `login-password` - Login password input
- `login-submit` - Login submit button
- `register-link` - Link to register form
- `register-email` - Register email input
- `register-name` - Register name input
- `register-password` - Register password input
- `register-password-confirm` - Register confirm password input
- `register-submit` - Register submit button

### Dashboard
- `dashboard-container` - Main dashboard
- `logout-button` - Logout button
- `channel-list` - Channel list container
- `create-channel-button` - Create channel trigger
- `avatar-label` or `avatar-image` - User profile trigger

### Channels
- `create-channel-container` - Create channel modal
- `create-channel-name` - Channel name input
- `create-channel-description` - Channel description input
- `create-channel-is-private` - Private checkbox
- `create-channel-submit` - Create submit button
- `channel-details-container` - Channel details display
- Class: `channel-container` - Individual channel items

### Messages
- `message-input` - Message input field
- `message-send-button` - Send message button
- Class: `message-container` - Individual messages
- Class: `message-user-name` - Clickable username
- Class: `message-delete-button` - Delete button
- Class: `message-edit-button` - Edit button
- Class: `message-image` - Image in message

### Invites
- `channel-invite-container` - Invite modal
- `invite-user-button` - Invite trigger button
- Class: `invite-member-name` - User name
- Class: `invite-member-checkbox` - User checkbox
- `invite-submit-button` - Submit invites button

### Profiles
- `profile-container` - Profile modal
- `profile-image` - Profile photo
- `profile-name` - Profile name
- `profile-email` - Profile email
- `profile-bio` - Profile bio
- `own-profile-container` - Own profile modal

### Errors
- `error-body` - Error message text
- `error-close` - Close error button

## Tips for Success

1. **Start Early**: Don't wait until the last week
2. **Test Frequently**: Test in browser after every small change
3. **Use Browser DevTools**: Console, Network tab, and Elements inspector
4. **Read Spec Carefully**: All required IDs must be exact
5. **Update progress.csv**: Keep it current (5% penalty if not)
6. **Mobile First**: Design for mobile, then scale up
7. **Commit Often**: Small commits are better than large ones
8. **Backup to GitHub**: Use the auto-push feature
9. **Ask for Help**: Use course forums and consultation hours
10. **Code Quality**: Clean, commented, well-structured code

## Common Pitfalls to Avoid

❌ Using async/await instead of Promises
❌ Using innerHTML or similar DOM parsers
❌ Creating multiple HTML files
❌ Using jQuery in your own code
❌ Forgetting to update progress.csv
❌ Not testing on mobile sizes
❌ Committing more than 100 lines at once
❌ Missing required DOM element IDs
❌ Not handling errors properly
❌ Hardcoding values that should be configurable

## Resources

- **Backend API Docs**: http://localhost:5005 (when backend is running)
- **MDN Web Docs**: https://developer.mozilla.org/
- **Course Materials**: Check course website
- **Stack Overflow**: For small code snippets (with attribution)

## Next Steps

1. ✅ Project structure set up
2. ✅ Frontend skeleton created
3. ⏳ Implement Milestone 1 (Login/Register)
4. ⏳ Test login/register with backend
5. ⏳ Implement Milestone 2 (Channels)
6. ⏳ Continue through remaining milestones

## Contact

For questions, use:
- Course forum
- Consultation hours
- Tutor help sessions

Good luck with your assignment! 🚀
