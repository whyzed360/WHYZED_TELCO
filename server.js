const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Counter to track sequential IDs
// Note: This resets if the Render service restarts.
let nextId = 1;

io.on('connection', (socket) => {
  console.log('Secure channel established: ' + socket.id);

  // Handle request for sequential ID
  socket.on('request-id', () => {
    // Pads number to 6 digits (e.g., 1 becomes 000001)
    const paddedId = String(nextId).padStart(6, '0');
    const fullNumber = `060${paddedId}`;
    
    socket.emit('assigned-id', fullNumber);
    console.log(`Assigned ID ${fullNumber} to user`);
    
    nextId++;
  });

  // Signaling: Relay call initiation
  socket.on('start_call', (data) => {
    console.log('Call initiated from: ' + data.from);
    socket.broadcast.emit('incoming_call', { from: data.from });
  });

  socket.on('disconnect', () => {
    console.log('System ID ' + socket.id + ' disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('WHYZED VNP Backend active on port ' + PORT);
});
