class Player {
  constructor({ x, y, score = 0, id }) {
    this.x = x;
    this.y = y;
    this.score = score;
    this.id = id;
  }

  // Method to move player based on direction and speed
  movePlayer(dir, speed) {
    switch (dir) {
      case 'up':
        this.y -= speed;
        break;
      case 'down':
        this.y += speed;
        break;
      case 'left':
        this.x -= speed;
        break;
      case 'right':
        this.x += speed;
        break;
    }
  }

  // Method to check collision with a collectible
  collision(item) {
    // Assume both player and item have a size of 50px
    const playerSize = 50;
    const itemSize = 50;
    
    const colliding = (
      this.x < item.x + itemSize &&
      this.x + playerSize > item.x &&
      this.y < item.y + itemSize &&
      this.y + playerSize > item.y
    );
    return colliding;
  }

  // Calculate player's rank based on scores of all players
  calculateRank(playersArray) {
    // Sort players by score in descending order
    const sortedPlayers = playersArray.sort((a, b) => b.score - a.score);
    
    // Find current player's rank
    const rank = sortedPlayers.findIndex(player => player.id === this.id) + 1;
    const totalPlayers = playersArray.length;
    
    return `Rank: ${rank}/${totalPlayers}`;
  }
}

export default Player;
