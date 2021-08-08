const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 800,
  heigth: 640,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: {
    preload,
    create,
    update,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 500 },
    },
  }
};

const game = new Phaser.Game(config);

function preload() {
  // Image layers from Tiled can't be exported to Phaser 3 (as yet)
  // So we add the background image separately
  this.load.image('background', 'assets/images/background.png');
  // Load the tileset image file, needed for the map to know what
  // tiles to draw on the screen
  this.load.image('tiles', 'assets/tilesets/platformPack_tilesheet.png');
  // Even though we load the tilesheet with the spike image, we need to
  // load the Spike image separately for Phaser 3 to render it
  this.load.image('spike', 'assets/images/spike.png');
  // Load the export Tiled JSON
  this.load.tilemapTiledJSON('map', 'assets/tilemaps/level1.json');
  // Load player animations from the player spritesheet and atlas JSON
  this.load.atlas('player', 'assets/images/kenney_player.png',
    'assets/images/kenney_player_atlas.json');
}

function create() {
  // Create a tile map, which is used to bring our level in Tiled
  // to our game world in Phaser
  const map = this.make.tilemap({ key: 'map' });
  // Add the tileset to the map so the images would load correctly in Phaser
  const tileset = map.addTilesetImage('kenney_simple_platformer', 'tiles');
  // Place the background image in our game world
  const backgroundImage = this.add.image(0, 0, 'background').setOrigin(0, 0);
  // Scale the image to better match our game's resolution
  backgroundImage.setScale(2, 0.8);
  // Add the platform layer as a static group, the player would be able
  // to jump on platforms like world collisions but they shouldn't move
  const platforms = map.createStaticLayer('Platforms', tileset, 0, 200);
  // There are many ways to set collision between tiles and players
  // As we want players to collide with all of the platforms, we tell Phaser to
  // set collisions for every tile in our platform layer whose index isn't -1.
  // Tiled indices can only be >= 0, therefore we are colliding with all of
  // the platform layer
  platforms.setCollisionByExclusion(-1, true);

  // Add the player to the game world
  this.player = this.physics.add.sprite(50, 300, 'player');
  this.player.setBounce(0.1); // our player will bounce from items
  this.player.setCollideWorldBounds(true); // don't go out of the map
  this.physics.add.collider(this.player, platforms);

  // Create the walking animation using the last 2 frames of
  // the atlas' first row
  this.anims.create({
    key: 'walk',
    frames: this.anims.generateFrameNames('player', {
      prefix: 'robo_player_',
      start: 2,
      end: 3,
    }),
    frameRate: 10,
    repeat: -1
  });

  // Create an idle animation i.e the first frame
  this.anims.create({
    key: 'idle',
    frames: [{ key: 'player', frame: 'robo_player_0' }],
    frameRate: 10,
  });

  // Use the second frame of the atlas for jumping
  this.anims.create({
    key: 'jump',
    frames: [{ key: 'player', frame: 'robo_player_1' }],
    frameRate: 10,
  });

  // Enable user input via cursor keys
  this.cursors = this.input.keyboard.createCursorKeys();

  // Create a sprite group for all spikes, set common properties to ensure that
  // sprites in the group don't move via gravity or by player collisions
  this.spikes = this.physics.add.group({
    allowGravity: false,
    immovable: true
  });

  // Get the spikes from the object layer of our Tiled map. Phaser has a
  // createFromObjects function to do so, but it creates sprites automatically
  // for us. We want to manipulate the sprites a bit before we use them
  map.getObjectLayer('Spikes').objects.forEach((spike) => {
    // Add new spikes to our sprite group
    const spikeSprite = this.spikes.create(spike.x, spike.y + 200 - spike.height, 'spike').setOrigin(0);
    // By default the sprite has loads of whitespace from the base image, we
    // resize the sprite to reduce the amount of whitespace used by the sprite
    // so collisions can be more precise
    spikeSprite.body.setSize(spike.width, spike.height - 20).setOffset(0, 20);
  });

  // Add collision between the player and the spikes
  this.physics.add.collider(this.player, this.spikes, playerHit, null, this);
}

function update() {
  // Control the player with left or right keys
  if (this.cursors.left.isDown) {
    this.player.setVelocityX(-200);
    if (this.player.body.onFloor()) {
      this.player.play('walk', true);
    }
  } else if (this.cursors.right.isDown) {
    this.player.setVelocityX(200);
    if (this.player.body.onFloor()) {
      this.player.play('walk', true);
    }
  } else {
    // If no keys are pressed, the player keeps still
    this.player.setVelocityX(0);
    // Only show the idle animation if the player is footed
    // If this is not included, the player would look idle while jumping
    if (this.player.body.onFloor()) {
      this.player.play('idle', true);
    }
  }

  // Player can jump while walking any direction by pressing the space bar
  // or the 'UP' arrow
  if ((this.cursors.space.isDown || this.cursors.up.isDown) && this.player.body.onFloor()) {
    this.player.setVelocityY(-350);
    this.player.play('jump', true);
  }

  // If the player is moving to the right, keep them facing forward
  if (this.player.body.velocity.x > 0) {
    this.player.setFlipX(false);
  } else if (this.player.body.velocity.x < 0) {
    // otherwise, make them face the other side
    this.player.setFlipX(true);
  }
}

/**
 * playerHit resets the player's state when it dies from colliding with a spike
 * @param {*} player - player sprite
 * @param {*} spike - spike player collided with
 */
function playerHit(player, spike) {
  // Set velocity back to 0
  player.setVelocity(0, 0);
  // Put the player back in its original position
  player.setX(50);
  player.setY(300);
  // Use the default `idle` animation
  player.play('idle', true);
  // Set the visibility to 0 i.e. hide the player
  player.setAlpha(0);
  // Add a tween that 'blinks' until the player is gradually visible
  let tw = this.tweens.add({
    targets: player,
    alpha: 1,
    duration: 100,
    ease: 'Linear',
    repeat: 5,
  });
}
