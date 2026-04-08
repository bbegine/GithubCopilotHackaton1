import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    this.generatePlaceholderTextures();
    this.scene.start("GameScene");
  }

  private generatePlaceholderTextures(): void {
    this.createRectTexture("player", 0xffeb3b, 16, 16);
    this.createRectTexture("ghost", 0xef5350, 16, 16);
    this.createRectTexture("ghost-pink", 0xf48fb1, 16, 16);
    this.createRectTexture("ghost-cyan", 0x4dd0e1, 16, 16);
    this.createRectTexture("ghost-orange", 0xffb74d, 16, 16);
    this.createRectTexture("wall", 0x3949ab, 16, 16);
    this.createPelletTexture("pellet", 6, 0xfff59d);
    this.createPelletTexture("power-pellet", 10, 0xffff8d);
  }

  private createRectTexture(key: string, color: number, width: number, height: number): void {
    if (this.textures.exists(key)) {
      return;
    }

    const graphics = this.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.fillRect(0, 0, width, height);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  private createPelletTexture(key: string, size: number, color: number): void {
    if (this.textures.exists(key)) {
      return;
    }

    const graphics = this.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.fillCircle(size / 2, size / 2, size / 2);
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }
}
