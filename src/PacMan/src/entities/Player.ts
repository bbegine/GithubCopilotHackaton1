import Phaser from "phaser";
import { TILE_SIZE } from "../config";

export function createPlayer(
  scene: Phaser.Scene,
  x: number,
  y: number,
): Phaser.Physics.Arcade.Sprite {
  const worldX = x * TILE_SIZE + TILE_SIZE / 2;
  const worldY = y * TILE_SIZE + TILE_SIZE / 2;
  const player = scene.physics.add.sprite(worldX, worldY, "player");

  player.setDisplaySize(TILE_SIZE, TILE_SIZE);
  player.body.setSize(TILE_SIZE, TILE_SIZE);

  return player;
}
