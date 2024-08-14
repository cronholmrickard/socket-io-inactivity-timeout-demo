importScripts('/socket.io/socket.io.js');

let socket;

function connect() {
  socket = io({
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000, // 20 seconds
  });

  socket.on('connection count', (count) => {
    postMessage({ type: 'connection count', data: count });
  });

  socket.on('connect', () => {
    postMessage({ type: 'connect' });
    startKeepAlive();
  });

  socket.on('disconnect', () => {
    postMessage({ type: 'disconnect' });
    stopKeepAlive();
  });

  socket.on('reconnect_attempt', () => {
    postMessage({ type: 'reconnect_attempt' });
  });

  socket.on('reconnect_error', (error) => {
    postMessage({ type: 'reconnect_error', data: error });
  });

  socket.on('reconnect_failed', () => {
    postMessage({ type: 'reconnect_failed' });
  });
}

let keepAliveInterval;

function startKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
  keepAliveInterval = setInterval(() => {
    socket.emit('keep-alive');
  }, 20000); // Send a keep-alive message every 20 seconds
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

// Initial connection
connect();
