require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const helmet = require('helmet');
const nocache = require('nocache');
const cors = require('cors');
const path = require('path');

// Create an instance of Express
const app = express();
const server = http.createServer(app); // Create the HTTP server instance
const io = socketIO(server); // Bind socket.io to the server

app.use(cors({ origin: '*' }));


// Apply Helmet for security headers
app.use(helmet());

// Disable caching using nocache middleware
app.use(nocache());

// Set the headers explicitly in lowercase for the tests
app.use((req, res, next) => {
  console.log('Headers are being set for:', req.path); // Debugging
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-xss-protection', '1; mode=block');
  res.setHeader('cache-control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('pragma', 'no-cache');
  res.setHeader('expires', '0');
  res.setHeader('surrogate-control', 'no-store');
  res.setHeader('x-powered-by', 'PHP 7.4.3');
  next();
});


// Middleware for body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from the public folder
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Serve index.html from the views folder
app.get('/', (req, res) => {
  console.log("Serving index.html");
  res.sendFile(path.join(__dirname, 'views', 'index.html'), (err) => {
    if (err) {
      console.error("Error serving index.html:", err);
      res.status(err.status).end();
    }
  });
});

// Handle the /_api/app-info route to prevent 404 errors
app.get('/_api/app-info', (req, res) => {
  res.json({ 
    appName: "Secure Real-Time Multiplayer Game", 
    version: "1.0.0"
  });
});

// 404 Not Found middleware
app.use((req, res, next) => {
  res.status(404).type('text').send('Not Found');
});

// Store players and collectibles
let players = {};
let collectibles = [];
let collectibleId = 1;

// Function to spawn a random collectible
function spawnCollectible() {
  const x = Math.floor(Math.random() * 600);
  const y = Math.floor(Math.random() * 400);
  const value = Math.floor(Math.random() * 10) + 1;
  const id = collectibleId++;

  const collectible = { x, y, value, id };
  collectibles.push(collectible);

  // Send new collectible to all connected players
  io.emit('updateCollectibles', collectibles);
}

// Spawn a new collectible every 10 seconds
setInterval(spawnCollectible, 10000);

// Socket.io event handlers for real-time game logic
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Add new player
  players[socket.id] = {
    id: socket.id,
    x: 100, // Default spawn position
    y: 100,
    score: 0
  };

  // Send the current game state to the new player
  io.emit('updatePlayers', players);
  io.emit('updateCollectibles', collectibles);

  // Handle player movement
  socket.on('movePlayer', (data) => {
    const player = players[socket.id];
    if (player) {
      switch (data.dir) {
        case 'up':
          player.y -= data.speed;
          break;
        case 'down':
          player.y += data.speed;
          break;
        case 'left':
          player.x -= data.speed;
          break;
        case 'right':
          player.x += data.speed;
          break;
      }

      // Check for collision with collectibles
      collectibles.forEach((item, index) => {
        const isColliding = (
          player.x < item.x + 50 &&
          player.x + 50 > item.x &&
          player.y < item.y + 50 &&
          player.y + 50 > item.y
        );

        if (isColliding) {
          // Increment player's score
          player.score += item.value;

          // Remove the collected item
          collectibles.splice(index, 1);

          // Update all clients with the new collectibles and player data
          io.emit('updateCollectibles', collectibles);
          io.emit('updatePlayers', players);
        }
      });

      // Update all clients with the new player data
      io.emit('updatePlayers', players);
    }
  });

  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit('updatePlayers', players); // Update all clients
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export the server instance for testing
module.exports = server;
