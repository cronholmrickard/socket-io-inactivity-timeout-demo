importScripts('/socket.io/socket.io.js');

let socket = null;
let keepAliveInterval = null;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  const { type, name, serverHost } = event.data;

  if (type === 'set name' && !socket) {
    connectSocket(name, serverHost);
  }

  if (type === 'disconnect' && socket) {
    disconnectSocket();
  }
});

function connectSocket(name) {
  socket = io({
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000, // 20 seconds
  });

  socket.on('connect', () => {
    console.log('Socket connected');
    socket.emit('set name', name);
    sendMessageToClients('Socket connected');
    startKeepAlive();
  });

  socket.on('connection count', (count) => {
    sendMessageToClients(`Current connections: ${count}`);
  });

  socket.on('disconnect', (reason) => {
    sendMessageToClients(`Socket disconnected: ${reason}`);
    stopKeepAlive();
  });

  socket.on('reconnect_attempt', () => {
    sendMessageToClients('Reconnecting...');
  });

  socket.on('reconnect_error', (error) => {
    sendMessageToClients(`Reconnection error: ${error}`);
  });

  socket.on('reconnect_failed', () => {
    sendMessageToClients('Reconnection failed.');
    stopKeepAlive();
  });
}

function startKeepAlive() {
  console.log('startKeepAlive');
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
  keepAliveInterval = setInterval(() => {
    if (socket && socket.connected) {
      socket.emit('keep-alive');
      sendMessageToClients('Keep-alive sent');
    }
  }, 10000); // Emit a keep-alive message every 10 seconds
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    stopKeepAlive();
  }
}

function sendMessageToClients(message) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage(message);
    });
  });
}
