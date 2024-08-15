self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

let userName = '';

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'start-polling') {
    userName = event.data.name;
    startLongPolling();
  }
});

function startLongPolling() {
  setInterval(() => {
    fetch(`/poll?name=${encodeURIComponent(userName)}`)
      .then((response) => response.text())
      .then((data) => {
        console.log('Long polling response:', data);
      })
      .catch((error) => {
        console.error('Long polling error:', error);
      });
  }, 30000); // Poll every 30 seconds
}
