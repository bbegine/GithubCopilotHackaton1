export interface ScoreEntry {
  name: string;
  score: number;
}

export interface ScoreStore {
  saveScore(name: string, score: number): void;
  getTopScores(limit: number): ScoreEntry[];
}
