import { LocalStorageScoreStore } from "./LocalStorageScoreStore";
import { MemoryScoreStore } from "./MemoryScoreStore";
import type { ScoreStore } from "./ScoreStore";

export function createScoreStore(): ScoreStore {
  if (isLocalStorageAvailable()) {
    return new LocalStorageScoreStore();
  }

  return new MemoryScoreStore();
}

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }

    const testKey = "__pacman_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
