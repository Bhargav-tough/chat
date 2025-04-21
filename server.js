const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();

// Create an HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server);

// Serve static files from the "public" folder
app.use(express.static('public'));

// Serve the index.html file at the root route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Listen for incoming connections on the Socket.io server
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('chatMessage', (msg) => {
    socket.broadcast.emit('chatMessage', msg);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Listen on all available network interfaces (0.0.0.0)
const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => { // Allow access from other devices on the network
  console.log(`Server is running on http://localhost:${PORT}`);
});
