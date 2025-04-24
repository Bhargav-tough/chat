const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');

// Create express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Rooms storage
const rooms = {
  'public': {
    messages: [],
    users: []
  }
};

// Generate random room code
function generateRoomCode() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removing confusing characters
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle creating a room
  socket.on('createRoom', (data, callback) => {
    try {
      const username = data.username || 'Anonymous';
      let roomCode;
      
      // Generate unique room code
      do {
        roomCode = generateRoomCode();
      } while (rooms[roomCode]);
      
      // Create new room
      rooms[roomCode] = {
        messages: [],
        users: []
      };
      
      console.log(`Room created: ${roomCode} by ${username}`);
      
      // Return the room code to the client
      callback({
        success: true,
        roomCode: roomCode
      });
      
    } catch (error) {
      console.error('Error creating room:', error);
      callback({
        success: false,
        message: 'Error creating room'
      });
    }
  });

  // Handle joining a room
  socket.on('joinRoom', (data) => {
    const { room, username } = data;
    const user = username || 'Anonymous';
    
    // Leave current rooms
    Array.from(socket.rooms).forEach(r => {
      if (r !== socket.id) {
        socket.leave(r);
        
        // Remove from the room's users list
        if (rooms[r] && rooms[r].users) {
          rooms[r].users = rooms[r].users.filter(u => u.id !== socket.id);
        }
      }
    });
    
    // Check if room exists, create if not
    if (!rooms[room]) {
      // Only create room if it's not public (public should already exist)
      if (room !== 'public') {
        rooms[room] = {
          messages: [],
          users: []
        };
      }
    }
    
    // Add user to the room
    socket.join(room);
    rooms[room].users.push({ id: socket.id, username: user });
    
    console.log(`${user} joined room: ${room}`);
    
    // Send room joined confirmation with message history
    socket.emit('roomJoined', {
      room: room,
      messages: rooms[room].messages
    });
    
    // Broadcast to other users in the room
    socket.to(room).emit('message', {
      username: 'System',
      message: `${user} has joined the room`,
      timestamp: new Date().getTime()
    });
  });

  // Handle chat messages
  socket.on('chatMessage', (data) => {
    const { room, username, message } = data;
    
    // Check if user is in the room
    if (!socket.rooms.has(room)) {
      return;
    }
    
    const messageObj = {
      username: username || 'Anonymous',
      message: message,
      timestamp: new Date().getTime()
    };
    
    // Store message in room history (limit to last 100 messages)
    if (rooms[room]) {
      rooms[room].messages.push(messageObj);
      if (rooms[room].messages.length > 100) {
        rooms[room].messages.shift();
      }
    }
    
    // Broadcast to all users in the room including the sender
    io.in(room).emit('message', messageObj);
    
    console.log(`Message in ${room}: ${username}: ${message}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Remove from all rooms
    for (const roomName in rooms) {
      if (rooms[roomName].users) {
        const user = rooms[roomName].users.find(u => u.id === socket.id);
        
        if (user) {
          // Remove user from room
          rooms[roomName].users = rooms[roomName].users.filter(u => u.id !== socket.id);
          
          // Notify other users
          socket.to(roomName).emit('message', {
            username: 'System',
            message: `${user.username} has left the room`,
            timestamp: new Date().getTime()
          });
          
          console.log(`${user.username} left room: ${roomName}`);
        }
      }
      
      // Clean up empty rooms (except public room)
      if (roomName !== 'public' && rooms[roomName].users.length === 0) {
        console.log(`Removing empty room: ${roomName}`);
        delete rooms[roomName];
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});