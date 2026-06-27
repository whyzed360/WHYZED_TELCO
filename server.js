const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs'); // Added file system module

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

const ID_FILE = './next_id.txt';

// Helper to get ID
function getNextId() {
    if (!fs.existsSync(ID_FILE)) return 1;
    return parseInt(fs.readFileSync(ID_FILE, 'utf8'));
}

// Helper to save ID
function saveNextId(id) {
    fs.writeFileSync(ID_FILE, id.toString());
}

io.on('connection', (socket) => {
  socket.on('request-id', () => {
    let currentId = getNextId();
    const paddedId = String(currentId).padStart(6, '0');
    const fullNumber = `060${paddedId}`;
    
    socket.emit('assigned-id', fullNumber);
    
    // Increment and save to file
    saveNextId(currentId + 1);
    console.log(`Assigned ID ${fullNumber} and saved state.`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('WHYZED Backend active on ' + PORT));
