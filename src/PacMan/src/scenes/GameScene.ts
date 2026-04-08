import Phaser from "phaser";
import {
  FRIGHTENED_DURATION,
  FRIGHTENED_GHOST_SPEED,
  GHOST_EAT_SCORE,
  GHOST_SPEED,
  INITIAL_LIVES,
  PELLET_SCORE,
  PLAYER_SPEED,
  POWER_PELLET_SCORE,
  TILE_SIZE,
} from "../config";
import { createGhost, GhostColor } from "../entities/Ghost";
import { createPlayer } from "../entities/Player";
import { MAZE_DATA } from "../maps/mazeData";
import { createScoreStore } from "../persistence/createScoreStore";
import { GhostAi } from "../systems/GhostAi";

type Direction = "left" | "right" | "up" | "down" | "none";

export class GameScene extends Phaser.Scene {
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private pellets!: Phaser.Physics.Arcade.StaticGroup;
  private player!: Phaser.Physics.Arcade.Sprite;
  private ghosts!: Phaser.Physics.Arcade.Group;
  private ghostAi!: GhostAi;
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private currentDirection: Direction = "none";
  private nextDirection: Direction = "none";
  private score = 0;
  private lives = INITIAL_LIVES;
  private frightenedUntil = 0;
  private invulnerableUntil = 0;
  private gameFinished = false;

  private readonly playerStart = { x: 14, y: 26 };

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
    this.ghostAi = new GhostAi();

    this.ghosts = this.physics.add.group();
    const ghostSpawns: Array<{ x: number; y: number; color: GhostColor }> = [
      { x: 13, y: 14, color: "red" },
      { x: 14, y: 14, color: "pink" },
      { x: 13, y: 15, color: "cyan" },
      { x: 14, y: 15, color: "orange" },
    ];

    ghostSpawns.forEach((spawn) => {
      const ghost = createGhost(this, spawn.x, spawn.y, spawn.color);
      ghost.setData("spawnX", spawn.x);
      ghost.setData("spawnY", spawn.y);
      this.ghosts.add(ghost);
    });

    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.ghosts, this.walls);
    this.physics.add.overlap(this.player, this.pellets, this.collectPellet, undefined, this);
    this.physics.add.overlap(this.player, this.ghosts, this.hitGhost, undefined, this);

    this.scoreText = this.add.text(8, 8, "SCORE 0", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#ffffff",
    });
    this.livesText = this.add.text(320, 8, `LIVES ${this.lives}`, {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#ffffff",
    });
  }

  update(): void {
    if (this.gameFinished) {
      return;
    }

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

    const frightened = this.isFrightenedMode();
    this.ghosts.children.each((child) => {
      const ghost = child as Phaser.Physics.Arcade.Sprite;
      this.ghostAi.update(ghost, this.player, this.time.now, frightened ? FRIGHTENED_GHOST_SPEED : GHOST_SPEED);
      if (frightened) {
        ghost.setTint(0x42a5f5);
      } else {
        ghost.clearTint();
      }
      return true;
    });
  }

  private collectPellet(
    _playerObject: Phaser.GameObjects.GameObject,
    pelletObject: Phaser.GameObjects.GameObject,
  ): void {
    const pellet = pelletObject as Phaser.Physics.Arcade.Sprite;
    if (!pellet.active || this.gameFinished) {
      return;
    }

    const isPowerPellet = pellet.texture.key === "power-pellet";
    pellet.destroy();

    this.score += isPowerPellet ? POWER_PELLET_SCORE : PELLET_SCORE;
    this.refreshHud();

    if (isPowerPellet) {
      this.frightenedUntil = this.time.now + FRIGHTENED_DURATION;
    }

    if (this.pellets.countActive(true) === 0) {
      this.finishRound("You Win");
    }
  }

  private hitGhost(
    _playerObject: Phaser.GameObjects.GameObject,
    ghostObject: Phaser.GameObjects.GameObject,
  ): void {
    if (this.gameFinished || this.time.now < this.invulnerableUntil) {
      return;
    }

    const ghost = ghostObject as Phaser.Physics.Arcade.Sprite;
    if (this.isFrightenedMode()) {
      this.score += GHOST_EAT_SCORE;
      this.refreshHud();
      this.resetGhostToSpawn(ghost);
      return;
    }

    this.lives -= 1;
    this.refreshHud();

    if (this.lives <= 0) {
      this.finishRound("Game Over");
      return;
    }

    this.respawnAfterHit();
  }

  private respawnAfterHit(): void {
    this.currentDirection = "none";
    this.nextDirection = "none";
    this.player.setVelocity(0, 0);
    this.player.setPosition(
      this.playerStart.x * TILE_SIZE + TILE_SIZE / 2,
      this.playerStart.y * TILE_SIZE + TILE_SIZE / 2,
    );
    this.invulnerableUntil = this.time.now + 1000;
    this.frightenedUntil = 0;

    this.ghosts.children.each((child) => {
      const ghost = child as Phaser.Physics.Arcade.Sprite;
      this.resetGhostToSpawn(ghost);
      return true;
    });
  }

  private resetGhostToSpawn(ghost: Phaser.Physics.Arcade.Sprite): void {
    const spawnX = (ghost.getData("spawnX") as number | undefined) ?? 14;
    const spawnY = (ghost.getData("spawnY") as number | undefined) ?? 14;
    ghost.setPosition(spawnX * TILE_SIZE + TILE_SIZE / 2, spawnY * TILE_SIZE + TILE_SIZE / 2);
    ghost.setVelocity(0, 0);
    ghost.setData("direction", "none");
  }

  private isFrightenedMode(): boolean {
    return this.time.now < this.frightenedUntil;
  }

  private refreshHud(): void {
    this.scoreText.setText(`SCORE ${this.score}`);
    this.livesText.setText(`LIVES ${this.lives}`);
  }

  private finishRound(message: string): void {
    if (this.gameFinished) {
      return;
    }

    this.gameFinished = true;
    this.player.setVelocity(0, 0);
    this.physics.pause();

    this.ghosts.children.each((child) => {
      const ghost = child as Phaser.Physics.Arcade.Sprite;
      ghost.setVelocity(0, 0);
      return true;
    });

    this.add
      .text(this.scale.width / 2, this.scale.height / 2, message, {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#ffeb3b",
      })
      .setOrigin(0.5);

    void createScoreStore().saveScore({ name: "AAA", score: this.score });

    this.time.delayedCall(1500, () => {
      this.scene.start("GameOverScene", {
        score: this.score,
        message,
      });
    });
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
