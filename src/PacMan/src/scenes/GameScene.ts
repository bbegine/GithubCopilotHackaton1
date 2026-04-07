import Phaser from "phaser";
import { PLAYER_SPEED, TILE_SIZE } from "../config";
import { createPlayer } from "../entities/Player";
import { MAZE_DATA } from "../maps/mazeData";

type Direction = "left" | "right" | "up" | "down" | "none";

export class GameScene extends Phaser.Scene {
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private pellets!: Phaser.Physics.Arcade.StaticGroup;
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private currentDirection: Direction = "none";
  private nextDirection: Direction = "none";

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

    this.player = createPlayer(this, 14, 26);
    this.cursors = this.input.keyboard!.createCursorKeys();

    this.physics.add.collider(this.player, this.walls);
  }

  update(): void {
    this.captureDirectionInput();

    if (this.isPlayerAlignedToGrid()) {
      this.snapPlayerToGrid();

      const { tileX, tileY } = this.getPlayerTile();
      if (this.nextDirection !== "none" && this.canMove(tileX, tileY, this.nextDirection)) {
        this.currentDirection = this.nextDirection;
      }

      if (this.currentDirection !== "none" && !this.canMove(tileX, tileY, this.currentDirection)) {
        this.currentDirection = "none";
      }
    }

    this.applyVelocityFromDirection();
  }

  private captureDirectionInput(): void {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left!)) {
      this.nextDirection = "left";
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.right!)) {
      this.nextDirection = "right";
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
      this.nextDirection = "up";
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.down!)) {
      this.nextDirection = "down";
    }
  }

  private isPlayerAlignedToGrid(): boolean {
    const x = this.player.x - TILE_SIZE / 2;
    const y = this.player.y - TILE_SIZE / 2;
    const epsilon = 1;

    return Math.abs(x % TILE_SIZE) < epsilon && Math.abs(y % TILE_SIZE) < epsilon;
  }

  private snapPlayerToGrid(): void {
    const { tileX, tileY } = this.getPlayerTile();
    this.player.setPosition(tileX * TILE_SIZE + TILE_SIZE / 2, tileY * TILE_SIZE + TILE_SIZE / 2);
  }

  private getPlayerTile(): { tileX: number; tileY: number } {
    return {
      tileX: Math.round((this.player.x - TILE_SIZE / 2) / TILE_SIZE),
      tileY: Math.round((this.player.y - TILE_SIZE / 2) / TILE_SIZE),
    };
  }

  private canMove(tileX: number, tileY: number, direction: Direction): boolean {
    const { dx, dy } = this.directionVector(direction);
    const nextX = tileX + dx;
    const nextY = tileY + dy;

    if (nextY < 0 || nextY >= MAZE_DATA.length || nextX < 0 || nextX >= MAZE_DATA[0].length) {
      return false;
    }

    return MAZE_DATA[nextY][nextX] !== 1;
  }

  private directionVector(direction: Direction): { dx: number; dy: number } {
    switch (direction) {
      case "left":
        return { dx: -1, dy: 0 };
      case "right":
        return { dx: 1, dy: 0 };
      case "up":
        return { dx: 0, dy: -1 };
      case "down":
        return { dx: 0, dy: 1 };
      default:
        return { dx: 0, dy: 0 };
    }
  }

  private applyVelocityFromDirection(): void {
    const { dx, dy } = this.directionVector(this.currentDirection);
    this.player.setVelocity(dx * PLAYER_SPEED, dy * PLAYER_SPEED);

    if (this.currentDirection === "none") {
      this.player.setVelocity(0, 0);
    }
  }
}
