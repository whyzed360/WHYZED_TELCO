const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

let nextId = 1;

io.on('connection', (socket) => {
  console.log('User connected: ' + socket.id);

  socket.on('request-id', () => {
    const paddedId = String(nextId).padStart(6, '0');
    const fullNumber = `060${paddedId}`;
    
    socket.emit('assigned-id', fullNumber);
    console.log(`Assigned ID: ${fullNumber} (Next counter is now ${nextId + 1})`);
    
    nextId++;
  });

  socket.on('start_call', (data) => {
    socket.broadcast.emit('incoming_call', { from: data.from });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('WHYZED VNP Backend active on port ' + PORT);
});
