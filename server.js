require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bunyan = require('bunyan');

const PORT = process.env.SERVER_PORT || 3300;
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'; // Default to 'info' if not set

// Custom log format function
function logFormat() {
  return {
    write: (logRecord) => {
      const log = JSON.parse(logRecord);
      const time = new Date(log.time)
        .toISOString()
        .replace('T', ' ')
        .replace('Z', '');
      const level = bunyan.nameFromLevel[log.level].toUpperCase();
      console.log(`${time} ${level} ${log.msg}`);
    },
  };
}

const log = bunyan.createLogger({
  name: 'socket-app',
  streams: [
    {
      level: LOG_LEVEL, // Use the log level from .env
      stream: logFormat(), // Custom format
    },
  ],
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  pingInterval: 10000, // 10 seconds
  pingTimeout: 600000, // 10 minutes
  transports: ['websocket'],
});

let connectionCount = 0;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Long polling endpoint
app.get('/poll', (req, res) => {
  const userName = req.query.name || 'Unknown user';
  log.info(`${userName} polled the server`);
  setTimeout(() => {
    res.status(200).send('polling');
  }, 25000); // Respond after 25 seconds
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

  socket.on('disconnect', (reason) => {
    const connectionEndTime = new Date();
    const duration = connectionEndTime - connectionStartTime;
    log.info(
      `${socket.data.name} disconnected due to ${reason} after ${formatDuration(
        duration,
      )}`,
    );
    connectionCount--;
    io.emit('connection count', connectionCount);
  });

  socket.on('keep-alive', () => {
    const now = new Date();
    const duration = now - connectionStartTime;
    log.debug(
      `${socket.data.name} is still connected after ${formatDuration(
        duration,
      )}`,
    );
  });
});

server.listen(PORT, () => {
  log.info(`Server is running on port ${PORT}`);
});
