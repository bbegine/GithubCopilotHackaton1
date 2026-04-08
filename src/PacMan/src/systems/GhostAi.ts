import Phaser from "phaser";
import { CHASE_DURATION, GHOST_SPEED, SCATTER_DURATION, TILE_SIZE } from "../config";
import { MAZE_DATA } from "../maps/mazeData";

type Direction = "left" | "right" | "up" | "down" | "none";
type Mode = "scatter" | "chase";

// Pen interior in MAZE_DATA tile coordinates (playable rows 13-15 -> MAZE_DATA rows 16-18)
const PEN_MIN_X = 11;
const PEN_MAX_X = 16;
const PEN_MIN_Y = 16;
const PEN_MAX_Y = 18;

// Ghost-house door in MAZE_DATA coordinates (playable row 12 -> MAZE_DATA row 15, cols 13-14)
const PEN_DOOR_ROW = 15;
const PEN_DOOR_MIN_COL = 13;
const PEN_DOOR_MAX_COL = 14;

const PEN_EXIT_COL = 13;
const PEN_FREE_ROW = 14;

const GHOST_MOVE_INTERVAL = 6;

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
    if (!ghost.getData("released")) {
      return;
    }

    const effectiveInterval = Math.max(1, Math.round(GHOST_MOVE_INTERVAL * (GHOST_SPEED / speed)));
    const counter = ((ghost.getData("moveCounter") as number | undefined) ?? 0) + 1;
    ghost.setData("moveCounter", counter);
    if (counter < effectiveInterval) {
      return;
    }
    ghost.setData("moveCounter", 0);

    const tileX = Math.round((ghost.x - TILE_SIZE / 2) / TILE_SIZE);
    const tileY = Math.round((ghost.y - TILE_SIZE / 2) / TILE_SIZE);
    ghost.setPosition(tileX * TILE_SIZE + TILE_SIZE / 2, tileY * TILE_SIZE + TILE_SIZE / 2);

    const lastDir = (ghost.getData("direction") as Direction | undefined) ?? "none";
    const exitingPen = !!(ghost.getData("exitingPen") as boolean | undefined);

    let nextDir: Exclude<Direction, "none">;

    if (exitingPen) {
      nextDir = this.pickExitDirection(tileX, tileY);
      if (tileY <= PEN_FREE_ROW && !this.isInDoor(tileX, tileY) && !this.isInPenInterior(tileX, tileY)) {
        ghost.setData("exitingPen", false);
      }
    } else {
      this.updateMode(now);
      const dirs = this.getValidDirections(tileX, tileY, lastDir);
      nextDir = this.pickMoveDirection(dirs, tileX, tileY, player);
    }

    const { dx, dy } = this.directionVector(nextDir);
    ghost.setData("direction", nextDir);
    ghost.setPosition(
      (tileX + dx) * TILE_SIZE + TILE_SIZE / 2,
      (tileY + dy) * TILE_SIZE + TILE_SIZE / 2,
    );
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

  private pickExitDirection(tileX: number, tileY: number): Exclude<Direction, "none"> {
    if (this.isInPenInterior(tileX, tileY)) {
      if (tileX < PEN_EXIT_COL) {
        return "right";
      }
      if (tileX > PEN_EXIT_COL) {
        return "left";
      }
      return "up";
    }
    return "up";
  }

  private isInPenInterior(tileX: number, tileY: number): boolean {
    return tileX >= PEN_MIN_X && tileX <= PEN_MAX_X && tileY >= PEN_MIN_Y && tileY <= PEN_MAX_Y;
  }

  private isInDoor(tileX: number, tileY: number): boolean {
    return tileY === PEN_DOOR_ROW && tileX >= PEN_DOOR_MIN_COL && tileX <= PEN_DOOR_MAX_COL;
  }

  private getValidDirections(tileX: number, tileY: number, lastDirection: Direction): Array<Exclude<Direction, "none">> {
    const candidates: Array<Exclude<Direction, "none">> = ["left", "right", "up", "down"];
    const passable = candidates.filter((direction) => this.canMove(tileX, tileY, direction));

    if (passable.length === 0) {
      return candidates.filter((direction) => this.canMoveRelaxed(tileX, tileY, direction));
    }

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

    const tile = MAZE_DATA[nextY][nextX];
    if (tile === 1 || tile === 4 || this.isInPenInterior(nextX, nextY)) {
      return false;
    }

    return true;
  }

  private canMoveRelaxed(tileX: number, tileY: number, direction: Exclude<Direction, "none">): boolean {
    const { dx, dy } = this.directionVector(direction);
    const nextX = tileX + dx;
    const nextY = tileY + dy;

    if (nextY < 0 || nextY >= MAZE_DATA.length || nextX < 0 || nextX >= MAZE_DATA[0].length) {
      return false;
    }

    return MAZE_DATA[nextY][nextX] !== 1;
  }

  private pickMoveDirection(
    directions: Array<Exclude<Direction, "none">>,
    ghostX: number,
    ghostY: number,
    player: Phaser.Physics.Arcade.Sprite,
  ): Exclude<Direction, "none"> {
    if (directions.length === 0) {
      return "left";
    }

    if (directions.length === 1) {
      return directions[0];
    }

    if (this.mode === "scatter" || Math.random() < 0.3) {
      return Phaser.Utils.Array.GetRandom(directions);
    }

    const targetX = Math.round((player.x - TILE_SIZE / 2) / TILE_SIZE);
    const targetY = Math.round((player.y - TILE_SIZE / 2) / TILE_SIZE);

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

}
