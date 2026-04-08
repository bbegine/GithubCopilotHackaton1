import Phaser from "phaser";
import { TILE_SIZE } from "../config";

export type GhostColor = "red" | "pink" | "cyan" | "orange";

const GHOST_TEXTURE_BY_COLOR: Record<GhostColor, string> = {
  red: "ghost",
  pink: "ghost-pink",
  cyan: "ghost-cyan",
  orange: "ghost-orange",
};

export function createGhost(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: GhostColor,
): Phaser.Physics.Arcade.Sprite {
  const worldX = x * TILE_SIZE + TILE_SIZE / 2;
  const worldY = y * TILE_SIZE + TILE_SIZE / 2;
  const ghost = scene.physics.add.sprite(worldX, worldY, GHOST_TEXTURE_BY_COLOR[color]);

  ghost.setDisplaySize(TILE_SIZE, TILE_SIZE);
  ghost.body.setSize(TILE_SIZE, TILE_SIZE);
  ghost.setData("ghostColor", color);
  ghost.setData("direction", "none");

  return ghost;
}
