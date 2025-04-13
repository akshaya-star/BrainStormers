import './style.css';

// Sample data
const channels = {
  general: [
    {
      id: 1,
      username: 'User1',
      content: 'Hello everyone in general!',
      timestamp: new Date().toLocaleTimeString(),
      avatar: 'U1'
    },
    {
      id: 2,
      username: 'User2',
      content: 'Hey there! How are you?',
      timestamp: new Date().toLocaleTimeString(),
      avatar: 'U2'
    }
  ],
  announcements: [
    {
      id: 1,
      username: 'Admin',
      content: 'Welcome to announcements channel!',
      timestamp: new Date().toLocaleTimeString(),
      avatar: 'A'
    }
  ]
};

// Stories data
const stories = [
  {
    id: 1,
    username: 'User1',
    avatar: 'U1',
    viewed: false,
    timestamp: new Date().toLocaleTimeString()
  },
  {
    id: 2,
    username: 'User2',
    avatar: 'U2',
    viewed: false,
    timestamp: new Date().toLocaleTimeString()
  }
];

let currentChannel = 'general';

// Function to create a message element
function createMessageElement(message) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message';
  messageDiv.setAttribute('role', 'article');
  messageDiv.setAttribute('aria-label', `Message from ${message.username} at ${message.timestamp}`);
  messageDiv.innerHTML = `
    <div class="message-avatar" role="img" aria-label="Avatar for ${message.username}">
      ${message.avatar}
    </div>
    <div class="message-content">
      <div class="message-header">
        <span class="message-username">${message.username}</span>
        <span class="message-timestamp" aria-label="Sent at ${message.timestamp}">${message.timestamp}</span>
      </div>
      <div class="message-text" role="text">
        ${message.content}
      </div>
    </div>
  `;
  return messageDiv;
}

// Function to create a story element
function createStoryElement(story) {
  const storyDiv = document.createElement('div');
  storyDiv.className = `story-avatar ${story.viewed ? 'viewed' : ''}`;
  storyDiv.setAttribute('role', 'button');
  storyDiv.setAttribute('aria-label', `${story.username}'s story from ${story.timestamp}`);
  storyDiv.innerHTML = `
    <div class="story-content">
      <img src="${story.imageUrl}" alt="${story.username}'s story" class="story-image">
      <div class="story-avatar-overlay">${story.avatar}</div>
    </div>
    <div class="story-username">${story.username}</div>
  `;
  storyDiv.addEventListener('click', () => viewStory(story));
  return storyDiv;
}

function viewStory(story) {
  // Update story viewed state
  story.viewed = true;
  const storyElement = document.querySelector(`[aria-label="${story.username}'s story from ${story.timestamp}"]`);
  if (storyElement) {
    storyElement.classList.add('viewed');
  }
  
  // Show story in viewer
  const viewer = document.getElementById('story-viewer');
  const viewerImage = document.getElementById('viewer-image');
  const viewerUsername = document.getElementById('viewer-username');
  const viewerAvatar = document.getElementById('viewer-avatar');
  const viewerTimestamp = document.getElementById('viewer-timestamp');
  
  viewerImage.src = story.imageUrl;
  viewerUsername.textContent = story.username;
  viewerAvatar.textContent = story.avatar;
  viewerTimestamp.textContent = story.timestamp;
  
  viewer.classList.remove('hidden');
  
  // Announce story view to screen readers
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'sr-only';
  announcement.textContent = `Viewing ${story.username}'s story`;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
}

// Handle story viewer close button
const closeStoryBtn = document.getElementById('close-story');
closeStoryBtn.addEventListener('click', () => {
  document.getElementById('story-viewer').classList.add('hidden');
});

// Function to add a new message
function addMessage(content) {
  const newMessage = {
    id: channels[currentChannel].length + 1,
    username: 'You',
    content: content,
    timestamp: new Date().toLocaleTimeString(),
    avatar: 'Y'
  };
  channels[currentChannel].push(newMessage);
  const messagesContainer = document.getElementById('messages');
  const messageElement = createMessageElement(newMessage);
  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Announce new message to screen readers
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'sr-only';
  announcement.textContent = `New message from ${newMessage.username}: ${newMessage.content}`;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
}

// Initialize messages and stories
function initializeChannel(channelName) {
  // Add safety check for channel existence
  if (!channels[channelName]) {
    channels[channelName] = [];
  }
  
  const messagesContainer = document.getElementById('messages');
  messagesContainer.innerHTML = '';
  channels[channelName].forEach(message => {
    messagesContainer.appendChild(createMessageElement(message));
  });
}

const storiesContainer = document.getElementById('stories-container');
stories.forEach(story => {
  storiesContainer.appendChild(createStoryElement(story));
});

// Handle message input
const messageInput = document.getElementById('messageInput');
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && messageInput.value.trim() !== '') {
    addMessage(messageInput.value);
    messageInput.value = '';
  }
});

// Handle channel switching with keyboard navigation
const channelButtons = document.querySelectorAll('.channel');
channelButtons.forEach((channel, index) => {
  channel.addEventListener('click', () => {
    selectChannel(channel);
  });
  
  channel.addEventListener('keydown', (e) => {
    switch(e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        selectChannel(channel);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (index > 0) channelButtons[index - 1].focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (index < channelButtons.length - 1) channelButtons[index + 1].focus();
        break;
    }
  });
});

function selectChannel(channel) {
  const channelName = channel.textContent.trim().replace('#', '').trim();
  currentChannel = channelName;
  
  channelButtons.forEach(c => {
    c.classList.remove('bg-discord-primary');
    c.setAttribute('aria-selected', 'false');
  });
  channel.classList.add('bg-discord-primary');
  channel.setAttribute('aria-selected', 'true');
  messageInput.placeholder = `Message ${channel.textContent.trim()}`;
  
  // Update messages for the selected channel
  initializeChannel(channelName);
  
  // Announce channel change to screen readers
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'sr-only';
  announcement.textContent = `Switched to channel ${channel.textContent.trim()}`;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
}

// Initialize with general channel
initializeChannel('general');

// Handle story upload
const addStoryBtn = document.getElementById('add-story-btn');
const storyUpload = document.getElementById('story-upload');

addStoryBtn.addEventListener('click', () => {
  storyUpload.click();
});

storyUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const newStory = {
        id: stories.length + 1,
        username: 'You',
        avatar: 'Y',
        imageUrl: event.target.result,
        viewed: false,
        timestamp: new Date().toLocaleTimeString()
      };
      stories.push(newStory);
      const storiesContainer = document.getElementById('stories-container');
      // Insert the new story before the "Add Story" button
      storiesContainer.insertBefore(createStoryElement(newStory), addStoryBtn);
    };
    reader.readAsDataURL(file);
  }
});