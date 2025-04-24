document.addEventListener('DOMContentLoaded', function () {
  const messagesContainer = document.getElementById('messages-container');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const optionsBtn = document.getElementById('options-btn');
  const optionsMenu = document.getElementById('options-menu');
  const createRoomOption = document.getElementById('create-room-option');
  const joinRoomOption = document.getElementById('join-room-option');
  const publicRoomOption = document.getElementById('public-room-option');
  const createRoomModal = document.getElementById('create-room-modal');
  const joinRoomModal = document.getElementById('join-room-modal');
  const roomCodeDisplay = document.getElementById('room-code');
  const copyCodeBtn = document.getElementById('copy-code-btn');
  const createCloseBtn = document.getElementById('create-close-btn');
  const joinCloseBtn = document.getElementById('join-close-btn');
  const joinCodeInput = document.getElementById('join-code-input');
  const joinRoomBtn = document.getElementById('join-room-btn');
  const currentRoomLabel = document.getElementById('current-room');
  const connectionStatus = document.getElementById('connection-status');
  const refreshBtn = document.getElementById('refresh-btn');

  let currentUser = '';
  let currentRoom = 'public';

  promptForUsername();

  const socket = io();

  socket.on('connect', function () {
    connectionStatus.textContent = 'Connected';
    addSystemMessage('Connected to chat server!');
    socket.emit('joinRoom', { room: 'public', username: currentUser });
  });

  socket.on('disconnect', function () {
    connectionStatus.textContent = 'Disconnected';
    addSystemMessage('Disconnected from chat server');
  });

  socket.on('message', function (data) {
    displayMessage(data.username, data.message, data.username === currentUser);
  });

  socket.on('roomJoined', function (data) {
    clearMessages(); // Always clear message history first

    currentRoom = data.room;
    currentRoomLabel.textContent = currentRoom === 'public' ? 'Public' : currentRoom;
    addSystemMessage(`Joined ${currentRoom === 'public' ? 'public chat' : 'private room: ' + currentRoom}`);

    // Don't show any previous messages
    // You can add the message history back here if needed
  });

  sendButton.addEventListener('click', function () {
    sendMessage();
  });

  messageInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  optionsBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    optionsMenu.style.display = optionsMenu.style.display === 'none' ? 'block' : 'none';
  });

  document.addEventListener('click', function () {
    optionsMenu.style.display = 'none';
  });

  createRoomOption.addEventListener('click', function () {
    socket.emit('createRoom', { username: currentUser }, function (response) {
      if (response.success) {
        roomCodeDisplay.textContent = response.roomCode;
        createRoomModal.style.display = 'flex';
      } else {
        addSystemMessage('Error creating room: ' + response.message);
      }
    });
    optionsMenu.style.display = 'none';
  });

  joinRoomOption.addEventListener('click', function () {
    joinRoomModal.style.display = 'flex';
    joinCodeInput.value = '';
    optionsMenu.style.display = 'none';
  });

  publicRoomOption.addEventListener('click', function () {
    promptForUsername().then(() => {
      socket.emit('joinRoom', { room: 'public', username: currentUser });
    });
    optionsMenu.style.display = 'none';
  });

  copyCodeBtn.addEventListener('click', function () {
    const roomCode = roomCodeDisplay.textContent;
    navigator.clipboard.writeText(roomCode).then(() => {
      copyCodeBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyCodeBtn.textContent = 'Copy Code';
      }, 2000);
    });
  });

  createCloseBtn.addEventListener('click', function () {
    createRoomModal.style.display = 'none';
    socket.emit('joinRoom', { room: roomCodeDisplay.textContent, username: currentUser });
  });

  joinCloseBtn.addEventListener('click', function () {
    joinRoomModal.style.display = 'none';
  });

  joinRoomBtn.addEventListener('click', function () {
    const roomCode = joinCodeInput.value.trim().toUpperCase();
    if (roomCode) {
      joinRoomModal.style.display = 'none';
      promptForUsername().then(() => {
        socket.emit('joinRoom', { room: roomCode, username: currentUser });
      });
    }
  });

  refreshBtn.addEventListener('click', function () {
    window.location.reload();
  });

  function sendMessage() {
    const message = messageInput.value.trim();
    if (message && socket.connected) {
      socket.emit('chatMessage', {
        room: currentRoom,
        username: currentUser,
        message: message
      });
      messageInput.value = '';
      messageInput.focus();
    }
  }

  function displayMessage(user, text, isSelf) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSelf ? 'sent' : 'received'}`;

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    const userSpan = document.createElement('div');
    userSpan.style.fontWeight = 'bold';
    userSpan.style.marginBottom = '3px';
    userSpan.style.fontSize = '0.8rem';
    userSpan.textContent = user;

    const textSpan = document.createElement('div');
    textSpan.textContent = text;

    messageContent.appendChild(userSpan);
    messageContent.appendChild(textSpan);
    messageDiv.appendChild(messageContent);

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function addSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message system';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = text;

    messageDiv.appendChild(messageContent);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function clearMessages() {
    while (messagesContainer.firstChild) {
      messagesContainer.removeChild(messagesContainer.firstChild);
    }
  }

  function promptForUsername() {
    return new Promise((resolve) => {
      const usernameModal = document.createElement('div');
      usernameModal.className = 'modal';
      usernameModal.style.display = 'flex';

      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content';

      const heading = document.createElement('h2');
      heading.textContent = 'Enter Your Username';

      const usernameInput = document.createElement('input');
      usernameInput.type = 'text';
      usernameInput.className = 'join-room-input';
      usernameInput.placeholder = 'Your username';
      usernameInput.value = currentUser || '';

      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'modal-buttons';

      const confirmButton = document.createElement('button');
      confirmButton.className = 'copy-btn';
      confirmButton.textContent = 'Join Chat';

      buttonContainer.appendChild(confirmButton);

      modalContent.appendChild(heading);
      modalContent.appendChild(usernameInput);
      modalContent.appendChild(buttonContainer);
      usernameModal.appendChild(modalContent);

      document.body.appendChild(usernameModal);

      setTimeout(() => {
        usernameInput.focus();
      }, 100);

      function submitUsername() {
        const username = usernameInput.value.trim();
        currentUser = username || 'User_' + Math.floor(Math.random() * 1000);
        document.body.removeChild(usernameModal);
        resolve();
      }

      confirmButton.addEventListener('click', submitUsername);

      usernameInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitUsername();
        }
      });
    });
  }
});
