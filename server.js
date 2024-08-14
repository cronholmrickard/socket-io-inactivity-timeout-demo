const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bunyan = require('bunyan');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  pingInterval: 25000, // 25 seconds
  pingTimeout: 120000, // 2 minutes
  transports: ['websocket'],
});

const log = bunyan.createLogger({ name: 'socket-app' });

let connectionCount = 0;

// Serve static files from the 'public' directory
app.use(express.static('public'));

io.on('connection', (socket) => {
  connectionCount++;
  log.info(`Connection established. Total connections: ${connectionCount}`);

  // Notify all clients about the new connection count
  io.emit('connection count', connectionCount);

  socket.on('disconnect', () => {
    connectionCount--;
    log.info(`Connection terminated. Total connections: ${connectionCount}`);

    // Notify all clients about the new connection count
    io.emit('connection count', connectionCount);
  });
});

const PORT = process.env.PORT || 3300;
server.listen(PORT, () => {
  log.info(`Server is running on port ${PORT}`);
});
