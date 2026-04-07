## PacMan — Gameplay Phases 9–12

**Stack**: Phaser 3 + TypeScript + Vite | No backend | localStorage highscores

Extend the existing scaffold (Phases 1–8) with a playable maze, PacMan continuous movement, 4 ghosts, pellets, and scoring. All rendering uses the existing programmatic placeholder textures from BootScene — no external assets required.

---

### Phase 9: Maze Data & Rendering
- [ ] 22. Create `src/maps/mazeData.ts` — export a `MAZE_DATA: number[][]` constant (28×36 grid). Values: `0` = empty, `1` = wall, `2` = pellet, `3` = power pellet, `4` = ghost house. Use the classic PacMan layout (symmetrical, tunnel on row 17, ghost pen in center).
- [ ] 23. Update `BootScene.ts` — add a `power-pellet` texture (larger circle, brighter color) alongside existing textures.
- [ ] 24. Update `GameScene.create()` — replace the debug grid with maze rendering: iterate `MAZE_DATA`, place `wall` sprites into a Phaser **static physics group** at each `1` cell, place `pellet` / `power-pellet` sprites into a separate static group at `2` / `3` cells. Store groups as scene properties (`this.walls`, `this.pellets`).

### Phase 10: PacMan Entity & Continuous Movement
- [ ] 25. Rewrite `src/entities/Player.ts` — export a factory function `createPlayer(scene, x, y): Phaser.Physics.Arcade.Sprite` that creates an arcade sprite using the `player` texture at the given tile coords, sets body size to `TILE_SIZE`, and enables physics.
- [ ] 26. Update `GameScene.create()` — spawn PacMan at tile (14, 26) using `createPlayer()`. Store as `this.player`.
- [ ] 27. Add keyboard input in `GameScene.create()` — create cursor keys via `this.input.keyboard!.createCursorKeys()`. Store as `this.cursors`.
- [ ] 28. Implement continuous movement in `GameScene.update()`:
    - On arrow key press, store a `nextDirection` and an active `currentDirection`.
    - Each frame, if PacMan is aligned to the tile grid (position divisible by `TILE_SIZE`): try `nextDirection` first — if no wall collision at the next tile, adopt it as `currentDirection`; otherwise keep `currentDirection`.
    - Set velocity from `currentDirection` × `PLAYER_SPEED`. If the next tile in `currentDirection` is a wall, set velocity to zero (PacMan stops).
    - Add `this.physics.add.collider(this.player, this.walls)` for hard wall stops.

### Phase 11: Ghosts & Basic AI
- [ ] 29. Rewrite `src/entities/Ghost.ts` — export `createGhost(scene, x, y, color): Phaser.Physics.Arcade.Sprite`. BootScene already generates a red `ghost` texture; add 3 more colored ghost textures in BootScene (`ghost-pink` 0xf48fb1, `ghost-cyan` 0x4dd0e1, `ghost-orange` 0xffb74d).
- [ ] 30. Spawn 4 ghosts in `GameScene.create()` at their pen positions (tiles ~13–14, 14–15 area). Store in a Phaser group `this.ghosts`. Add wall collider for ghosts.
- [ ] 31. Implement `src/systems/GhostAi.ts` with a simple movement pattern:
    - Each ghost picks a random valid direction at each tile-grid-aligned step (no reversing).
    - On scatter mode (timer-based from config `SCATTER_DURATION`): random wandering.
    - On chase mode (`CHASE_DURATION`): bias direction toward PacMan's tile using Manhattan distance.
    - Ghosts cannot move through walls (validated before setting velocity).
- [ ] 32. Call `GhostAi.update()` for each ghost in `GameScene.update()`.

### Phase 12: Pellets, Collisions, Scoring & Win/Lose
- [ ] 33. Add pellet collection — `this.physics.add.overlap(this.player, this.pellets, collectPellet)`. In `collectPellet`: destroy the pellet sprite, increment score (+10 normal, +50 power pellet).
- [ ] 34. Add power pellet effect — when a power pellet is collected, set all ghosts to "frightened" mode for `FRIGHTENED_DURATION` ms (change tint to blue, reduce speed, allow PacMan to eat them for +200 points). Reset ghost to pen on eaten.
- [ ] 35. Add ghost-player collision — `this.physics.add.overlap(this.player, this.ghosts, hitGhost)`. If ghost is frightened → eat ghost. If ghost is normal → lose a life.
- [ ] 36. Add HUD — render score text and lives count at the top or bottom of the canvas using `this.add.text()`.
- [ ] 37. Add win condition — when all pellets are collected, show "You Win" text, pause physics, transition to GameOverScene after delay.
- [ ] 38. Add lose condition — start with 3 lives. On death, respawn PacMan at start tile. On 0 lives, transition to GameOverScene. Save score via `createScoreStore().saveScore()`.

---

### Verification
1. **Phase 9**: `npm run dev` → blue wall maze visible, pellet dots in corridors, no console errors
2. **Phase 10**: arrow keys move PacMan continuously; PacMan stops at walls; direction queuing works at corners
3. **Phase 11**: 4 colored ghosts patrol the maze; they don't walk through walls; they change behavior on timer
4. **Phase 12**: pellets disappear on contact and score increments; power pellets trigger frightened mode; ghost collision kills PacMan or eats ghost; win/lose screens appear correctly

### Files Affected
- `src/maps/mazeData.ts` — new file, 28×36 number grid defining the maze layout
- `src/scenes/BootScene.ts` — add `power-pellet` + 3 extra ghost color textures in `generatePlaceholderTextures()`
- `src/scenes/GameScene.ts` — major rewrite: maze rendering, player spawn, input, ghost spawn, collisions, HUD, win/lose
- `src/entities/Player.ts` — rewrite to Phaser arcade sprite factory
- `src/entities/Ghost.ts` — rewrite to Phaser arcade sprite factory with color param
- `src/systems/GhostAi.ts` — implement scatter/chase/frightened direction picking
- `src/config.ts` — add `POWER_PELLET_SCORE`, `PELLET_SCORE`, `GHOST_EAT_SCORE`, `INITIAL_LIVES`
- `src/scenes/GameOverScene.ts` — implement score display and restart option

### Design Decisions
- Maze is hardcoded as a 2D array (not loaded from JSON/Tiled) — keeps it simple with no asset pipeline
- Ghost AI uses random + Manhattan-distance bias rather than full A* pathfinding — good enough for initial gameplay, can be upgraded later
- Tunnel wrapping (row 17 left/right edges) handled by checking x bounds and teleporting in `update()`
- Power pellet ghost-eat scoring is flat +200 (not escalating 200→1600 like the arcade original) — simplicity first
- Ghost release from pen is staggered (one every 3 seconds via a simple timer queue)
