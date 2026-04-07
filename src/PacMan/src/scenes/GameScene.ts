import Phaser from "phaser";
import { MAP_HEIGHT, MAP_WIDTH, TILE_SIZE } from "../config";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create(): void {
    const width = MAP_WIDTH * TILE_SIZE;
    const height = MAP_HEIGHT * TILE_SIZE;

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1f355e, 0.6);

    for (let x = 0; x <= width; x += TILE_SIZE) {
      grid.beginPath();
      grid.moveTo(x, 0);
      grid.lineTo(x, height);
      grid.strokePath();
    }

    for (let y = 0; y <= height; y += TILE_SIZE) {
      grid.beginPath();
      grid.moveTo(0, y);
      grid.lineTo(width, y);
      grid.strokePath();
    }

    // Placeholder player marker for Phase 6 visual verification.
    this.add.rectangle(width / 2, height - TILE_SIZE * 3, TILE_SIZE, TILE_SIZE, 0xffeb3b);
  }

  update(): void {
    // Game logic intentionally stubbed for this phase.
  }
}
