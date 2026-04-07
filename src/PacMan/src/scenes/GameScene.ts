import Phaser from "phaser";
import { TILE_SIZE } from "../config";
import { MAZE_DATA } from "../maps/mazeData";

export class GameScene extends Phaser.Scene {
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private pellets!: Phaser.Physics.Arcade.StaticGroup;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.walls = this.physics.add.staticGroup();
    this.pellets = this.physics.add.staticGroup();

    for (let row = 0; row < MAZE_DATA.length; row += 1) {
      for (let col = 0; col < MAZE_DATA[row].length; col += 1) {
        const tile = MAZE_DATA[row][col];
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;

        if (tile === 1) {
          this.walls.create(x, y, "wall");
          continue;
        }

        if (tile === 2) {
          this.pellets.create(x, y, "pellet");
          continue;
        }

        if (tile === 3) {
          this.pellets.create(x, y, "power-pellet");
        }
      }
    }
  }

  update(): void {
    // Game logic intentionally stubbed for this phase.
  }
}
