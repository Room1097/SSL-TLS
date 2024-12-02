require('dotenv').config(); // Load .env file
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello, client! You have connected to the server.\n');
});

const PORT = process.env.PORT_SERVER;
const HOST = process.env.IP;

server.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});
