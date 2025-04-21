// Connect to the Socket.io server
const socket = io();

// Get elements
const textarea = document.querySelector('textarea');
const sendButton = document.querySelector('button');
const messagesContainer = document.querySelector('.messages');

// Set up a static username or dynamically prompt for one
const username = prompt("Enter your name:", "User1"); // You can replace this with hardcoded names for testing

// Function to generate a random color based on username
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = '#' + ((hash >> 8) & 0x00FFFFFF).toString(16).padStart(6, '0');
  return color;
}

// Assign a unique color to the user
const userColor = stringToColor(username);

// Function to send a new message
function sendMessage() {
  const message = textarea.value.trim();

  if (message !== "") {
    // Emit the message to the server, including the username
    socket.emit('chatMessage', { message, username });

    // Create message element for the outgoing message
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'outgoing');
    messageElement.style.backgroundColor = userColor; // Use the unique color for this user
    messageElement.innerHTML = `<p>${message}</p>`;

    // Add message to chat
    messagesContainer.appendChild(messageElement);

    // Scroll to the latest message
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Clear the input field
    textarea.value = "";
  }
}

// Event listener for the send button
sendButton.addEventListener('click', sendMessage);

// Event listener for "Enter" key to send message
textarea.addEventListener('keypress', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Listen for incoming messages from other users
socket.on('chatMessage', (data) => {
  const { message, username: sender } = data;

  // Generate a unique color for the sender (if not the current user)
  const senderColor = sender === username ? userColor : stringToColor(sender);

  // Create message element for the incoming message
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', sender === username ? 'outgoing' : 'incoming');
  messageElement.style.backgroundColor = senderColor; // Apply the sender's color
  messageElement.innerHTML = `<p><strong>${sender}: </strong>${message}</p>`;

  // Add message to chat
  messagesContainer.appendChild(messageElement);

  // Scroll to the latest message
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});
