import type { ScoreEntry, ScoreStore } from "./ScoreStore";

export class MemoryScoreStore implements ScoreStore {
  private readonly scores: ScoreEntry[] = [];

  public saveScore(name: string, score: number): void {
    this.scores.push({ name, score });
  }

  public getTopScores(limit: number): ScoreEntry[] {
    return [...this.scores].sort((a, b) => b.score - a.score).slice(0, limit);
  }
}
