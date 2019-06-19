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
      debug: true
    },
  }
};

const game = new Phaser.Game(config);

function preload() {
  this.load.image('background', 'assets/images/backgroundEmpty.png');
  this.load.image('spike', 'assets/images/spike.png');
  this.load.image('tiles', 'assets/tilesets/platformPack_tilesheet.png');
  this.load.tilemapTiledJSON('map', 'assets/tilemaps/level1.json');
  // Load player animations
  this.load.atlas('player', 'assets/images/kenney_player.png', 'assets/images/kenney_player_atlas.json');
}

function create() {
  const map = this.make.tilemap({ key: 'map' });
  const tileset = map.addTilesetImage('kenney_simple_platformer', 'tiles');
  const backgroundImage = this.add.image(0, 0, 'background').setOrigin(0, 0).setScale(2, 0.8);
  const platforms = map.createStaticLayer('Platforms', tileset, 0, 200);
  platforms.setCollisionByExclusion(-1, true);
  this.spikes = map.createFromObjects('Spikes', 71, {key: 'spike'}, this);
  // Move spikes down 200 pixel to match their original positions on the platforms
  this.spikes.forEach(element => {
    element.y += 200;
  });

  this.player = this.physics.add.sprite(50, 300, 'player');
  this.player.setBounce(0.1); // our player will bounce from items
  this.player.setCollideWorldBounds(true); // don't go out of the map
  this.physics.add.collider(this.player, platforms);

}

function update() { }

