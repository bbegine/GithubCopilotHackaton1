import type { ScoreEntry, ScoreStore } from "./ScoreStore";

export class MemoryScoreStore implements ScoreStore {
  public saveScore(_name: string, _score: number): void {
    // Placeholder implementation to be completed in Phase 7.
  }

  public getTopScores(_limit: number): ScoreEntry[] {
    // Placeholder implementation to be completed in Phase 7.
    return [];
  }
}
