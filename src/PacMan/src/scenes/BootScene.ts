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
    this.createRectTexture("wall", 0x3949ab, 16, 16);
    this.createPelletTexture("pellet", 6, 0xfff59d);
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
