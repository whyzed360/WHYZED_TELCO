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

io.on('connection', (socket) => {
  console.log('Secure channel established: ' + socket.id);

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
