## PacMan — Full Init Setup Todo
 
**Stack**: Phaser 3 + TypeScript + Vite | No backend | localStorage highscores
 
---
 
### Phase 1: Project Scaffolding
- [ ] 1. Create project folder `src/PacMan`
- [ ] 2. Run `npm init -y`, set name to `pacman`
- [ ] 3. Install runtime dep: `phaser`
- [ ] 4. Install dev deps: `typescript`, `vite`, `@types/node`
- [ ] 5. Create `tsconfig.json` — strict mode, ES2020 target, bundler module resolution
- [ ] 6. Create `vite.config.ts` — dev server on port 3000
- [ ] 7. Add npm scripts: `dev` (vite), `build` (vite build), `preview` (vite preview)
 
### Phase 2: Entry Point and HTML Shell
- [ ] 8. Create `index.html` with `<div id="game">` container, title "PacMan"
- [ ] 9. Create `src/main.ts` — Phaser bootstrap with AUTO renderer, arcade physics, 448x576 canvas (28x36 tiles at 16px), register BootScene + GameScene
 
### Phase 3: Folder Structure
- [ ] 10. Create folder layout:
  - `src/config.ts` — game constants
  - `src/scenes/` — BootScene, GameScene, GameOverScene (placeholders)
  - `src/entities/` — Player, Ghost (placeholder classes)
  - `src/systems/` — GhostAi, CollisionSystem (placeholders)
  - `src/audio/` — SfxManager (placeholder)
  - `src/persistence/` — ScoreStore interface + LocalStorage + Memory implementations
  - `src/assets/sprites/`, `src/assets/audio/`, `src/assets/maps/` — empty asset folders
 
### Phase 4: Core Config Module
- [ ] 11. Create `src/config.ts` with constants: `TILE_SIZE` (16), `MAP_WIDTH` (28), `MAP_HEIGHT` (36), `PLAYER_SPEED` (120), `GHOST_SPEED` (100), `FRIGHTENED_DURATION` (6000ms), `SCATTER_DURATION` (7000ms), `CHASE_DURATION` (20000ms), `MAX_HIGHSCORES` (10)
 
### Phase 5: Boot Scene
- [ ] 12. Implement `BootScene.ts` — generate placeholder textures programmatically (colored rectangles for player, ghosts, walls, pellets) so no external assets are needed to start. Transition to GameScene on complete.
 
### Phase 6: Minimal GameScene Shell
- [ ] 13. Implement `GameScene.ts` scaffold — render a static placeholder grid and a yellow square for the player. Stub `update()` with no logic yet. Confirm it renders on `npm run dev`.
 
### Phase 7: Persistence Layer
- [ ] 14. Define `ScoreStore` interface: `saveScore(name, score)`, `getTopScores(limit): ScoreEntry[]`
- [ ] 15. Implement `LocalStorageScoreStore` — read/write JSON array to key `pacman_highscores`
- [ ] 16. Implement `MemoryScoreStore` — same interface, backed by in-memory array
- [ ] 17. Add factory function that returns localStorage store if available, else memory fallback
 
### Phase 8: Verify Setup
- [ ] 18. Run `npm run dev` — browser opens with colored canvas and placeholder grid
- [ ] 19. Check DevTools console — no errors, Phaser version logged
- [ ] 20. Verify score store works (localStorage read/write)
- [ ] 21. Commit initial setup to git