const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bunyan = require('bunyan');
const { PORT } = require('./env');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  pingInterval: 55000, // 55 seconds
  pingTimeout: 60000, // 60 seconds
  transports: ['websocket'],
});

const log = bunyan.createLogger({ name: 'socket-app' });

let connectionCount = 0;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Endpoint for long polling
app.get('/poll', (req, res) => {
  log.info('Received long poll request');
  res.send('Long poll response');
});

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

  socket.on('keep-alive', () => {
    const now = new Date();
    const duration = now - connectionStartTime;
    log.info(
      `${socket.data.name} is still connected after ${formatDuration(
        duration,
      )}`,
    );
  });
});

server.listen(PORT, () => {
  log.info(`Server is running on port ${PORT}`);
});
