const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bunyan = require('bunyan');
const { PORT } = require('./env');

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

function formatDuration(ms) {
  let totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0',
  )}:${String(seconds).padStart(2, '0')}`;
}

io.on('connection', (socket) => {
  const connectionStartTime = new Date();

  socket.on('set name', (name) => {
    socket.data.name = name;
    log.info(`${socket.data.name} connected`);
    connectionCount++;
    io.emit('connection count', connectionCount);
  });

  socket.on('disconnect', () => {
    const connectionEndTime = new Date();
    const duration = connectionEndTime - connectionStartTime;
    log.info(
      `${socket.data.name} disconnected after ${formatDuration(duration)}`,
    );
    connectionCount--;
    io.emit('connection count', connectionCount);
  });
});

server.listen(PORT, () => {
  log.info(`Server is running on port ${PORT}`);
});
