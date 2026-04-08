import Phaser from "phaser";
import { CHASE_DURATION, GHOST_SPEED, SCATTER_DURATION, TILE_SIZE } from "../config";
import { MAZE_DATA } from "../maps/mazeData";

type Direction = "left" | "right" | "up" | "down" | "none";
type Mode = "scatter" | "chase";

const OPPOSITE_DIRECTION: Record<Exclude<Direction, "none">, Exclude<Direction, "none">> = {
  left: "right",
  right: "left",
  up: "down",
  down: "up",
};

export class GhostAi {
  private mode: Mode = "scatter";
  private modeSwitchAt = 0;

  public update(
    ghost: Phaser.Physics.Arcade.Sprite,
    player: Phaser.Physics.Arcade.Sprite,
    now: number,
    speed = GHOST_SPEED,
  ): void {
    this.updateMode(now);

    if (!this.isAlignedToGrid(ghost)) {
      return;
    }

    this.snapToGrid(ghost);

    const ghostTile = this.getTilePosition(ghost);
    const playerTile = this.getTilePosition(player);
    const lastDirection = (ghost.getData("direction") as Direction | undefined) ?? "none";
    const validDirections = this.getValidDirections(ghostTile.tileX, ghostTile.tileY, lastDirection);

    if (validDirections.length === 0) {
      ghost.setVelocity(0, 0);
      ghost.setData("direction", "none");
      return;
    }

    const nextDirection =
      this.mode === "chase"
        ? this.pickChaseDirection(validDirections, ghostTile.tileX, ghostTile.tileY, playerTile.tileX, playerTile.tileY)
        : Phaser.Utils.Array.GetRandom(validDirections);

    ghost.setData("direction", nextDirection);
    this.applyVelocity(ghost, nextDirection, speed);
  }

  private updateMode(now: number): void {
    if (this.modeSwitchAt === 0) {
      this.modeSwitchAt = now + SCATTER_DURATION;
      return;
    }

    if (now < this.modeSwitchAt) {
      return;
    }

    if (this.mode === "scatter") {
      this.mode = "chase";
      this.modeSwitchAt = now + CHASE_DURATION;
      return;
    }

    this.mode = "scatter";
    this.modeSwitchAt = now + SCATTER_DURATION;
  }

  private isAlignedToGrid(sprite: Phaser.Physics.Arcade.Sprite): boolean {
    const x = sprite.x - TILE_SIZE / 2;
    const y = sprite.y - TILE_SIZE / 2;
    const epsilon = 1;

    return Math.abs(x % TILE_SIZE) < epsilon && Math.abs(y % TILE_SIZE) < epsilon;
  }

  private snapToGrid(sprite: Phaser.Physics.Arcade.Sprite): void {
    const { tileX, tileY } = this.getTilePosition(sprite);
    sprite.setPosition(tileX * TILE_SIZE + TILE_SIZE / 2, tileY * TILE_SIZE + TILE_SIZE / 2);
  }

  private getTilePosition(sprite: Phaser.Physics.Arcade.Sprite): { tileX: number; tileY: number } {
    return {
      tileX: Math.round((sprite.x - TILE_SIZE / 2) / TILE_SIZE),
      tileY: Math.round((sprite.y - TILE_SIZE / 2) / TILE_SIZE),
    };
  }

  private getValidDirections(tileX: number, tileY: number, lastDirection: Direction): Array<Exclude<Direction, "none">> {
    const candidates: Array<Exclude<Direction, "none">> = ["left", "right", "up", "down"];
    const passable = candidates.filter((direction) => this.canMove(tileX, tileY, direction));

    if (lastDirection === "none" || passable.length <= 1) {
      return passable;
    }

    const oppositeDirection = OPPOSITE_DIRECTION[lastDirection as Exclude<Direction, "none">];
    const withoutReverse = passable.filter((direction) => direction !== oppositeDirection);
    return withoutReverse.length > 0 ? withoutReverse : passable;
  }

  private canMove(tileX: number, tileY: number, direction: Exclude<Direction, "none">): boolean {
    const { dx, dy } = this.directionVector(direction);
    const nextX = tileX + dx;
    const nextY = tileY + dy;

    if (nextY < 0 || nextY >= MAZE_DATA.length || nextX < 0 || nextX >= MAZE_DATA[0].length) {
      return false;
    }

    return MAZE_DATA[nextY][nextX] !== 1;
  }

  private pickChaseDirection(
    directions: Array<Exclude<Direction, "none">>,
    ghostX: number,
    ghostY: number,
    targetX: number,
    targetY: number,
  ): Exclude<Direction, "none"> {
    const ranked = directions
      .map((direction) => {
        const { dx, dy } = this.directionVector(direction);
        const score = Math.abs(targetX - (ghostX + dx)) + Math.abs(targetY - (ghostY + dy));
        return { direction, score };
      })
      .sort((a, b) => a.score - b.score);

    const bestScore = ranked[0].score;
    const bestDirections = ranked.filter((item) => item.score === bestScore).map((item) => item.direction);
    return Phaser.Utils.Array.GetRandom(bestDirections);
  }

  private directionVector(direction: Exclude<Direction, "none">): { dx: number; dy: number } {
    switch (direction) {
      case "left":
        return { dx: -1, dy: 0 };
      case "right":
        return { dx: 1, dy: 0 };
      case "up":
        return { dx: 0, dy: -1 };
      case "down":
        return { dx: 0, dy: 1 };
    }
  }

  private applyVelocity(
    ghost: Phaser.Physics.Arcade.Sprite,
    direction: Exclude<Direction, "none">,
    speed: number,
  ): void {
    const { dx, dy } = this.directionVector(direction);
    ghost.setVelocity(dx * speed, dy * speed);
  }
}
