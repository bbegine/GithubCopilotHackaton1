import type { ScoreEntry, ScoreStore } from "./ScoreStore";

const HIGHSCORE_KEY = "pacman_highscores";

export class LocalStorageScoreStore implements ScoreStore {
  public saveScore(name: string, score: number): void {
    const scores = this.readScores();
    scores.push({ name, score });
    this.writeScores(scores);
  }

  public getTopScores(limit: number): ScoreEntry[] {
    return this.readScores()
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private readScores(): ScoreEntry[] {
    const raw = localStorage.getItem(HIGHSCORE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(this.isScoreEntry);
    } catch {
      return [];
    }
  }

  private writeScores(scores: ScoreEntry[]): void {
    localStorage.setItem(HIGHSCORE_KEY, JSON.stringify(scores));
  }

  private isScoreEntry(value: unknown): value is ScoreEntry {
    if (typeof value !== "object" || value === null) {
      return false;
    }

    const maybeEntry = value as Partial<ScoreEntry>;
    return typeof maybeEntry.name === "string" && typeof maybeEntry.score === "number";
  }
}
