import Phaser from "phaser";
import {
  FRIGHTENED_DURATION,
  FRIGHTENED_GHOST_SPEED,
  GHOST_EAT_SCORE,
  GHOST_RELEASE_INTERVAL,
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
  private moveFrameCounter = 0;
  private readonly MOVE_INTERVAL = Math.max(1, Math.ceil((TILE_SIZE / (PLAYER_SPEED / 60)) * 0.5));
  private ghostReleaseIndex = 0;
  private nextGhostReleaseAt = 0;

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
      { x: 12, y: 17, color: "red" },
      { x: 13, y: 17, color: "pink" },
      { x: 14, y: 17, color: "cyan" },
      { x: 15, y: 17, color: "orange" },
    ];

    ghostSpawns.forEach((spawn, index) => {
      const ghost = createGhost(this, spawn.x, spawn.y, spawn.color);
      ghost.setData("spawnX", spawn.x);
      ghost.setData("spawnY", spawn.y);
      ghost.setData("released", index === 0);
      ghost.setData("exitingPen", index === 0);
      ghost.setData("moveCounter", 0);
      ghost.setData("direction", "none");
      this.ghosts.add(ghost);
    });

    this.ghostReleaseIndex = 1;
    this.nextGhostReleaseAt = this.time.now + GHOST_RELEASE_INTERVAL;

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

    this.releaseGhostsOverTime();

    this.captureDirectionInput();
    this.snapPlayerToGrid();

    this.moveFrameCounter += 1;
    if (this.moveFrameCounter >= this.MOVE_INTERVAL) {
      this.moveFrameCounter = 0;

      const { tileX, tileY } = this.getPlayerTile();

      if (this.nextDirection !== "none" && this.canMove(tileX, tileY, this.nextDirection)) {
        this.currentDirection = this.nextDirection;
        this.nextDirection = "none";
      }

      if (this.currentDirection !== "none" && this.canMove(tileX, tileY, this.currentDirection)) {
        const { dx, dy } = this.directionVector(this.currentDirection);
        const newX = (tileX + dx) * TILE_SIZE + TILE_SIZE / 2;
        const newY = (tileY + dy) * TILE_SIZE + TILE_SIZE / 2;
        this.player.setPosition(newX, newY);
      } else if (this.currentDirection !== "none") {
        this.player.setVelocity(0, 0);
      }
    }

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

    this.ghostReleaseIndex = 1;
    this.nextGhostReleaseAt = this.time.now + GHOST_RELEASE_INTERVAL;
  }

  private resetGhostToSpawn(ghost: Phaser.Physics.Arcade.Sprite): void {
    const spawnX = (ghost.getData("spawnX") as number | undefined) ?? 14;
    const spawnY = (ghost.getData("spawnY") as number | undefined) ?? 14;
    ghost.setPosition(spawnX * TILE_SIZE + TILE_SIZE / 2, spawnY * TILE_SIZE + TILE_SIZE / 2);
    ghost.setData("released", true);
    ghost.setData("exitingPen", true);
    ghost.setData("moveCounter", 0);
    ghost.setData("direction", "none");
  }

  private releaseGhostsOverTime(): void {
    if (this.ghostReleaseIndex >= this.ghosts.getLength()) {
      return;
    }

    if (this.time.now < this.nextGhostReleaseAt) {
      return;
    }

    const children = this.ghosts.getChildren() as Phaser.Physics.Arcade.Sprite[];
    const ghost = children[this.ghostReleaseIndex];
    if (ghost) {
      ghost.setData("released", true);
      ghost.setData("exitingPen", true);
      ghost.setData("moveCounter", 0);
      ghost.setData("direction", "none");
    }

    this.ghostReleaseIndex += 1;
    this.nextGhostReleaseAt = this.time.now + GHOST_RELEASE_INTERVAL;
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
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right!)) {
      this.nextDirection = "right";
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
      this.nextDirection = "up";
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down!)) {
      this.nextDirection = "down";
    }
  }



  private snapPlayerToGrid(): void {
    const x = Math.round((this.player.x - TILE_SIZE / 2) / TILE_SIZE);
    const y = Math.round((this.player.y - TILE_SIZE / 2) / TILE_SIZE);
    this.player.setPosition(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
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

    const tile = MAZE_DATA[nextY][nextX];
    if (tile === 1 || tile === 4) {
      return false;
    }

    // Block player from entering ghost pen interior.
    if (nextX >= 11 && nextX <= 16 && nextY >= 16 && nextY <= 18) {
      return false;
    }

    return true;
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


}
