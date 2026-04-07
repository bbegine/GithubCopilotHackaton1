const PLAYABLE_MAZE_ROWS = [
  "############################",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#o####.#####.##.#####.####o#",
  "#.####.#####.##.#####.####.#",
  "#..........................#",
  "#.####.##.########.##.####.#",
  "#.####.##.########.##.####.#",
  "#......##....##....##......#",
  "######.#####.##.#####.######",
  "     #.#####.##.#####.#     ",
  "     #.##..........##.#     ",
  "     #.##.###44###.##.#     ",
  "######.##.#      #.##.######",
  "..........#      #..........",
  "######.##.#      #.##.######",
  "     #.##.########.##.#     ",
  "     #.##..........##.#     ",
  "     #.##.########.##.#     ",
  "######.##.########.##.######",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#.####.#####.##.#####.####.#",
  "#o..##................##..o#",
  "###.##.##.########.##.##.###",
  "###.##.##.########.##.##.###",
  "#......##....##....##......#",
  "#.##########.##.##########.#",
  "#.##########.##.##########.#",
  "#..........................#",
  "############################",
] as const;

const TILE_MAP: Record<string, number> = {
  "#": 1,
  ".": 2,
  o: 3,
  "4": 4,
  " ": 0,
};

const HUD_TOP_ROWS = 3;
const HUD_BOTTOM_ROWS = 2;

const playableMaze = PLAYABLE_MAZE_ROWS.map((row, rowIndex) => {
  if (row.length !== 28) {
    throw new Error(`maze row ${rowIndex} has length ${row.length}; expected 28`);
  }

  return Array.from(row, (cell) => {
    const value = TILE_MAP[cell];
    if (value === undefined) {
      throw new Error(`unsupported maze tile '${cell}' at row ${rowIndex}`);
    }
    return value;
  });
});

const emptyHudRow = Array.from({ length: 28 }, () => 0);

export const MAZE_DATA: number[][] = [
  ...Array.from({ length: HUD_TOP_ROWS }, () => [...emptyHudRow]),
  ...playableMaze,
  ...Array.from({ length: HUD_BOTTOM_ROWS }, () => [...emptyHudRow]),
];
