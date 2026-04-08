import Phaser from "phaser";

type GameOverData = {
  message?: string;
  score?: number;
};

export class GameOverScene extends Phaser.Scene {
  private message = "Game Over";
  private score = 0;

  constructor() {
    super("GameOverScene");
  }

  init(data: GameOverData): void {
    this.message = data.message ?? "Game Over";
    this.score = data.score ?? 0;
  }

  create(): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.add
      .text(centerX, centerY - 48, this.message, {
        fontFamily: "monospace",
        fontSize: "36px",
        color: "#ffeb3b",
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 4, `SCORE ${this.score}`, {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 56, "PRESS SPACE OR ENTER TO RESTART", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#b0bec5",
      })
      .setOrigin(0.5);

    this.input.keyboard?.once("keydown-SPACE", () => this.scene.start("GameScene"));
    this.input.keyboard?.once("keydown-ENTER", () => this.scene.start("GameScene"));
  }
}
