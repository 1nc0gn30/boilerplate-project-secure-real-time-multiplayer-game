import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');

// Store game state
let players = {};
let collectibles = [];

// Update players and collectibles when receiving data from the server
socket.on('updatePlayers', (data) => {
  players = data;
  drawGame();
});

socket.on('updateCollectibles', (data) => {
  collectibles = data;
  drawGame();
});

// Draw players and collectibles on the canvas
function drawGame() {
  context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

  // Draw players
  for (let id in players) {
    const player = players[id];
    context.fillStyle = 'blue'; // Player color
    context.fillRect(player.x, player.y, 50, 50); // Player size (50x50)

    // Display the player's score above the avatar
    context.fillStyle = 'white';
    context.fillText(`Score: ${player.score}`, player.x, player.y - 10);
  }

  // Draw collectibles
  collectibles.forEach(item => {
    context.fillStyle = 'green'; // Collectible color
    context.fillRect(item.x, item.y, 50, 50); // Collectible size (50x50)
  });
}

// Handle player movement (WASD and arrow keys)
document.addEventListener('keydown', (e) => {
  let direction = '';
  const speed = 5; // Movement speed in pixels

  switch (e.key) {
    case 'ArrowUp':
    case 'w':
      direction = 'up';
      break;
    case 'ArrowDown':
    case 's':
      direction = 'down';
      break;
    case 'ArrowLeft':
    case 'a':
      direction = 'left';
      break;
    case 'ArrowRight':
    case 'd':
      direction = 'right';
      break;
  }

  // If a valid key is pressed, emit the player's movement to the server
  if (direction) {
    socket.emit('movePlayer', { dir: direction, speed: speed });
  }
});
