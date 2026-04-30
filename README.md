# Nicosia Chaos League — V8.2 Makis NPC

This version adds the first moving NPC hazard.

## What V8.2 includes

Everything from V8.1:

- Multiplayer movement
- Server-owned items
- Server-resolved duels
- Fighter names and abilities
- Item combos
- Leaderboard and duel history

New in V8.2:

- Renamed `Central Chaos Square` to `Stasikratous`
- Added NPC called `Makis`
- Makis patrols up and down Stasikratous
- Makis is server-owned and synced to all players
- If Makis touches a player, he steals all carried items
- Makis theft is announced globally
- The robbed player's inventory is cleared by the server
- Makis has a visible red warning radius

## Run locally

From the project root:

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:5173
```

## Test Makis

1. Join with one or more players.
2. Collect items.
3. Walk to Stasikratous.
4. Let Makis touch your player.
5. Confirm your inventory becomes empty.
6. Confirm a global announcement says Makis robbed you.

## V9 recommendation

Add more map hazards and polish:

- Makis speed bursts every 20 seconds
- safe zones near buildings
- item respawn sparkle
- mini-map or location compass
- more NPCs with different effects


## Patch notes — v8.3

- Makis title now displays only `Makis`.
- Makis steal radius increased to match the duel-style danger radius.
- Makis now patrols left and right across Stasikratous instead of up and down.
- Makis movement remains server-owned and synced to all players.
- Updated landing page and in-game version to `Game v8.3`.


## Patch notes — v8.4

- Replaced the generated Makis NPC icon with a cropped face icon from the provided image.
- Added `client/public/assets/makis-face.png`.
- Makis still patrols left-right across Stasikratous and steals carried items on contact.
- Updated landing page and in-game version to `Game v8.4`.


## Patch notes — v8.5

- Changed the in-game item tag from `Special` to `Pouttozoumo`.
- Changed New Division subtitle from `The curse factory` to `Aloutoi`.
- Improved text readability across the game:
  - cleaner canvas rendering settings
  - higher-resolution Phaser text
  - stronger HUD contrast
  - larger HUD and map-label fonts
  - clearer player name plates
  - improved landing card contrast
- Updated landing page and in-game version to `Game v8.5`.


## Patch notes — v8.6

- Changed item tag `Shot` to `Wray`.
- Changed item tag `Boom` to `Tsakra`.
- Changed item tag `Powder` to `Shonia`.
- Updated landing page and in-game version to `Game v8.6`.


## Patch notes — v8.7

- Fixed duel overlay timing so the win/loss outcome is no longer visible before the duel starts.
- The overlay now first shows `DUEL STARTING`.
- The actual winner, loser, score and combo breakdown reveal after the short duel-start moment.
- Extended the duel result window duration by 1 second so players have more time to read the outcome.
- Updated landing page and in-game version to `Game v8.7`.


## Patch notes — v8.8

- Duel overlay still starts with neutral `DUEL STARTING`.
- When the duel breakdown appears, the title now changes clearly to `YOU WON` or `YOU LOST` for the player involved.
- Spectators still see `DUEL RESULT`.
- The winner/loser details, combo, ability and score breakdown remain hidden until the reveal moment.
- Updated landing page and in-game version to `Game v8.8`.


## Patch notes — v8.9

- Fixed duel title reveal properly.
- Initial duel phase now shows `DUEL STARTING` on a white banner.
- Result phase changes the title to `YOU WON`, `YOU LOST`, or `DUEL RESULT`.
- Result banner turns green for win and red for loss.
- Winner/loser breakdown remains hidden until the reveal phase.
- Updated landing page and in-game version to `Game v8.9`.


## Patch notes — v9.0

- Added V9.0 visual polish/game-feel pass.
- Improved map with sidewalks, Stasikratous street strip, crosswalks, trees and extra ground detail.
- Added item glow, sparkle and bobbing animation.
- Added Makis danger pulse and `MAKIS NEARBY` warning.
- Added character-select ability descriptions on desktop.
- Improved character card hover/selection feel.
- Updated landing page and in-game version to `Game v9.0`.


## Patch notes — v9.1

- Fixed the landing page fighter list not appearing.
- The issue was the ability description variable being referenced before it was defined in `client/src/main.js`.
- Fighter cards now correctly show fighter name, ability name and desktop ability description.
- Updated landing page and in-game version to `Game v9.1`.


## Patch notes — v9.2

- Removed the `MAKIS NEARBY` warning banner.
- Removed the yellow line showing Makis' patrol path.
- Added Makis robbery speech bubble below the NPC.
- When Makis steals items, he now says `Efa sou ta`.
- Updated landing page and in-game version to `Game v9.2`.


## Patch notes — v9.3

- Added mobile landscape Option 1 UI redesign.
- Landscape phone now uses a compact top HUD bar instead of large stacked panels.
- FEED and RANK buttons now sit side-by-side in the top-right.
- FEED opens a bottom-center drawer instead of appearing in the middle of the screen.
- RANK opens a compact bottom-center top-3 leaderboard drawer.
- Only one drawer opens at a time.
- Mobile landscape drawers auto-close after 5 seconds.
- Desktop and portrait layouts remain mostly unchanged.
- Updated landing page and in-game version to `Game v9.3`.


## Patch notes — v9.4

- Reworked the mobile landscape detection after testing simulated phone landscape viewports.
- Previous landscape detection was too strict on some phones because the Phaser canvas can report a height above 500px.
- FEED and RANK now switch to drawer mode for wider phone landscape ranges.
- Bottom drawers now reserve space for the joystick and DUEL button.
- RANK drawer now appears as a compact bottom-center panel with top 3 only.
- FEED drawer stays bottom-center and no longer uses the old mid-screen feed placement.
- Desktop and portrait layouts remain mostly unchanged.
- Updated landing page and in-game version to `Game v9.4`.

## Simulated viewport checks

Checked the UI layout formulas for common landscape sizes:

- 667 × 375
- 740 × 360
- 812 × 375
- 844 × 390
- 896 × 414
- 932 × 430
- 1024 × 576

All now route to the mobile landscape drawer layout.


## Patch notes — v9.5

- Replaced the problematic Phaser-only mobile landscape HUD with a DOM overlay.
- The DOM overlay uses real browser CSS media queries, so it does not depend on Phaser canvas sizing.
- In phone landscape:
  - Phaser HUD/feed/rank panels are hidden.
  - A compact HTML HUD appears at the top.
  - FEED and RANK are HTML buttons at the top-right.
  - FEED/RANK open a bottom drawer.
  - The drawer auto-closes after 5 seconds.
- Fixed mobile movement feeling slower:
  - joystick now snaps to full speed after a small drag threshold
  - mobile landscape camera zoom is closer
  - Arcade physics now uses variable timestep instead of fixed-step 60fps
- Updated landing page and in-game version to `Game v9.5`.


## Patch notes — v9.6

- FEED is now a true toggle on/off in phone landscape.
- FEED no longer auto-disappears after a few seconds.
- Removed the `FEED` title inside the feed drawer to save vertical space.
- Kept the `FEED` label on the top-right button.
- Moved the feed drawer under the score/items HUD box.
- RANK still opens as its own drawer.
- Updated landing page and in-game version to `Game v9.6`.


## Patch notes — v9.7

- FEED and RANK are now autonomous in phone landscape.
- Opening RANK no longer closes FEED.
- Opening FEED no longer closes RANK.
- FEED box is now roughly half the previous width.
- FEED box is now roughly double the previous height.
- FEED remains under the score/items HUD box.
- Updated landing page and in-game version to `Game v9.7`.


## Patch notes — v9.8

- Increased feed capacity from 4 to 8 messages.
- Added extra spacing between feed bullet points.
- Removed the black background and outline behind player nickname labels.
- Player nicknames now appear directly above players as colored text.
- The server assigns each entering player a name color.
- Mobile landscape FEED and RANK boxes use the same player colors for names.
- Duel result winner line uses the winner's player color.
- Updated landing page and in-game version to `Game v9.8`.


## Patch notes — v9.9

- Applied the same no-box label logic to Makis.
- Makis name now appears as colored text only, without black background or outline box.
- Makis robbery announcement `Efa sou ta` now appears as colored text only, without black background or outline box.
- Added mobile CSS and event guards to prevent selecting text in FEED, RANK and HUD boxes.
- This should prevent accidental text selection from blocking joystick or tap-to-move controls.
- Updated landing page and in-game version to `Game v9.9`.


## Patch notes — v10.0

- Changed Makis to a unique cyan color that is not used by player names.
- Makis name in the FEED box now uses the same cyan color.
- Score / W-L / inventory HUD box is now the same width as the FEED box in phone landscape.
- Mobile HUD now uses two rows:
  - Row 1: Score and W/L
  - Row 2: Inventory
- Item names in the mobile HUD and feed are now purple.
- Moved joystick and ACT/DUEL button inward toward the center on mobile.
- Updated landing page and in-game version to `Game v10.0`.


## Patch notes — v10.1

- Moved joystick further inward toward the center on mobile.
- Moved ACT/DUEL button further inward toward the center on mobile.
- Moved both mobile controls slightly upward.
- Changed Makis' unique color from cyan to red.
- Removed red from the player name color rotation and replaced it with cyan.
- Makis name and Makis feed mentions now use the same red color.
- Updated landing page and in-game version to `Game v10.1`.


## Patch notes — v10.2

- Added custom in-game item icons:
  - Wray: bottle icon
  - Pouttozoumo: wet splash icon
  - Shonia: white powder baggie icon
  - Tsakra: firework rocket icon
  - Malaria: toxic icon
- Increased item icon texture size from 22px to 34px.
- Adjusted item labels and sparkle positions to fit the larger icons.
- Updated landing page and in-game version to `Game v10.2`.


## Patch notes — v10.3

- Removed outline/border from the score HUD box.
- Removed outline/border from the FEED box.
- Removed outline/border from the RANK box.
- Removed shadow from the mobile score / FEED / RANK boxes.
- Changed these boxes to a 50% transparent black background.
- Updated landing page and in-game version to `Game v10.3`.


## Patch notes — v10.4

- Added face portraits for all fighters using the uploaded image filenames.
- Hohos uses the green rabbit image.
- Landing page fighter cards now show circular face portraits instead of colored squares.
- In-game fighter sprites now use the assigned face portraits instead of colored square markers.
- Kept a subtle circular rim around portraits so they remain visible on the map.
- Updated landing page and in-game version to `Game v10.4`.

## Fighter face assignment

- A / Fuhrer → Fuhrer.jpeg
- B / Que te la Pompos → Que Te La Pompos.jpeg
- C / Karaflos Igetis → Karaflos Igetis.jpeg
- D / Eva → Eva.jpeg
- E / PPekris → PPekris.jpeg
- F / Straight Outta Jerusalem → Straight Outta Jerusalem.jpeg
- G / Hohos → Hohos.jpg
- H / Greek Lover → Greek Lover.jpeg
- I / Immigrant → Immigrant.jpeg
- J / Pollis → Pollis.jpeg


## Patch notes — v10.5

- Fixed landing page fighter cards not appearing.
- Cause: `faceAsset` was referenced before being defined in `client/src/main.js`.
- Fixed local in-game player sprite to use the assigned face portrait.
- Ensured remote players use face portraits at a readable size.
- Updated landing page and in-game version to `Game v10.5`.


## Patch notes — v10.6

- Fixed blank blue screen after pressing `ENTER NICOSIA`.
- Cause: the fallback colored texture generator in `createTextures()` referenced `playerState`, which does not exist there.
- The runtime error stopped Phaser before the world loaded.
- Restored fallback texture generation to `player_${character.id}` while keeping face portraits for actual fighters.
- Updated landing page and in-game version to `Game v10.6`.


## Patch notes — v10.7

- Reprocessed fighter portraits with better face alignment.
- Cropped unnecessary background from the uploaded images.
- Recentered faces inside the circular frames.
- Fixed Greek Lover portrait so the face is visible in the frame.
- Kept Hohos as the green rabbit.
- Slightly increased in-game portrait size for better readability.
- Updated landing page and in-game version to `Game v10.7`.


## Patch notes — v10.8

- Switched the control locations:
  - Joystick is now on the right side.
  - ACT/DUEL button is now on the left side.
- Preserved the previous inward and upward mobile positioning.
- Updated landing page and in-game version to `Game v10.8`.


## Patch notes — v10.9

- Fixed joystick not working after switching joystick and ACT/DUEL sides.
- Cause: the old joystick activation rule only allowed touches on the left side of the screen.
- Since the joystick moved to the right, that rule blocked it.
- Removed the old left-side restriction while keeping ACT/DUEL separate on the left.
- Updated landing page and in-game version to `Game v10.9`.


## Patch notes — v11.0

- Removed the duel box outline.
- Changed duel box black background to 50% transparent.
- Removed `Winner items: empty pockets` and `Loser items: empty pockets` text from the duel breakdown.
- Removed the `Victory/Defeat. Items consumed.` footer text.
- Duel winner and loser nicknames now use each player’s assigned name color.
- Kept the score and ability/combo breakdown visible.
- Updated landing page and in-game version to `Game v11.0`.


## Patch notes — v11.1

- Added fighter face cards to the duel result screen.
- Winner and loser now appear as two visual cards with face portraits.
- Added power score under each fighter.
- Added a combo badge when the winner triggers a combo.
- Added a short savage duel quote.
- Kept the cleaned-up V11 duel box style: no outline and 50% transparent black background.
- Kept inventory UI unchanged, as requested.
- Updated landing page and in-game version to `Game v11.1`.


## Patch notes — v11.2

- Made the fighter face cards in the duel screen smaller.
- Moved the duel face cards slightly lower so `YOU WON` / `YOU LOST` remains clear.
- Fixed the actual cause of the oversized faces:
  - V11.1 was tweening image scale back to `1`.
  - The portrait source textures are 160px, so this overrode `setDisplaySize()` and made the faces huge.
  - V11.2 no longer scale-tweens the portrait images.
- Kept the duel card animation on the background cards only.
- Updated landing page and in-game version to `Game v11.2`.


## Patch notes — v11.3

- Removed the central `31.6 vs 28.3` power score from the duel screen.
- Added each player’s duel items under their POWER score.
- Added the combo name at the bottom of each player’s item list.
- If a player had no combo, the card shows `no combo`.
- Kept the winner/loser POWER text under each fighter.
- Adjusted duel card height and spacing to fit the item lists.
- Updated landing page and in-game version to `Game v11.3`.


## Patch notes — v11.4

- Removed the `Winner: Fighter • Ability` and `Loser: Fighter • Ability` lines from the duel screen.
- Removed the final stats formula line: `Stats + Items + Combo + Ability + Roll`.
- Removed the central combo badge so combo names do not appear twice.
- Combo now appears only once, under the player whose items triggered that combo.
- Combo line keeps its combo icon, e.g. `☣️ Toxic Pyro`.
- Players without a combo no longer show `no combo`.
- Kept the savage duel quote.
- Updated landing page and in-game version to `Game v11.4`.


## Patch notes — v11.5

- Fixed duel item lists showing literal `\n` text.
- Items now appear one under each other.
- Combo appears below the item list, with its icon, only under the player who triggered it.
- Removed the visible extra inner background box around each player’s POWER/items section.
- Made fighter faces bigger again while keeping them below the `YOU WON` / `YOU LOST` banner.
- Adjusted spacing around items and the savage duel quote.
- Updated landing page and in-game version to `Game v11.5`.


## Patch notes — v11.6

- Increased duel fighter face size again.
- Kept faces below the `YOU WON` / `YOU LOST` banner so they do not overlap the outcome.
- Increased font sizes for player names, POWER, item lists and the savage quote.
- Added stronger text stroke to item lists and quote for better readability.
- Adjusted item list spacing and quote position to keep the duel screen clean.
- Updated landing page and in-game version to `Game v11.6`.


## Patch notes — v11.7

- Improved player nickname color assignment.
- Server now assigns colors based on currently active player colors, not player count.
- This prevents two active players from receiving the same nickname color after joins/leaves.
- Expanded the player color palette with more high-contrast colors.
- Reserved Makis red so no player gets the same red as Makis.
- Player colors continue to apply consistently in:
  - game world nickname labels
  - mobile feed
  - mobile rank
  - duel screen winner/loser names
- Increased nickname text stroke slightly for clearer readability.
- Updated landing page and in-game version to `Game v11.7`.


## Patch notes — v11.8

- Reduced duel screen width by approximately 25%.
- Reduced duel banner width accordingly.
- Tightened the spacing between winner/loser fighter cards.
- Adjusted text wrapping to fit the narrower duel screen.
- Kept the duel screen height, faces and readability improvements from V11.7.
- Updated landing page and in-game version to `Game v11.8`.


## Patch notes — v11.9

- Reduced duel screen width by a further 30% versus V11.8.
- New approximate max widths:
  - Desktop: 336px
  - Phone landscape: 315px
  - Phone portrait: 235px
- Tightened fighter card spacing so the two players still fit inside the narrower duel screen.
- Slightly reduced duel face size only as needed to prevent overlap.
- Adjusted text wrapping and banner width for the narrower layout.
- Updated landing page and in-game version to `Game v11.9`.


## Patch notes — v12.0

- Prepared project for public deployment.
- Node server now serves the built Phaser client from `client/dist`.
- Socket.IO multiplayer and the browser game run from the same public URL.
- Added Railway deployment config: `railway.json`.
- Added Render deployment config: `render.yaml`.
- Added `Procfile`, `.gitignore`, and `.env.example`.
- Added `/version` endpoint.
- `/health` now includes game version.
- Added `DEPLOYMENT.md` with step-by-step deployment instructions.
- Updated landing page and in-game version to `Game v12.0`.

## Production commands

```bash
npm install
npm run build
npm start
```

Then open:

```txt
http://localhost:3000
```


## Patch notes — v12.1

- Fixed Railway build issue where `vite` was not found.
- Moved `vite` into `client/package.json` dependencies so build tools are available during Railway deployment.
- Updated `railway.json` build command to:
  `npm install --include=dev --no-audit --no-fund && npm run build`
- Added `.npmrc` with `production=false`, `audit=false`, and `fund=false`.
- Updated `/version`, health version and landing page to `Game v12.1`.


## Patch notes — v12.2

- Fixed Railway `vite: not found` issue by removing npm workspaces from the production build path.
- Root `package.json` now contains all dependencies needed to install, build and run the game.
- `npm run build` now runs `vite build --config client/vite.config.js` directly from the root.
- `client/vite.config.js` now explicitly sets the client root and dist output.
- Updated `railway.json` build command to:
  `npm install --no-audit --no-fund && npm run build`
- Updated landing page, in-game text and `/version` to `Game v12.2`.


## Patch notes — v12.3

- Changed Railway deployment strategy to use a prebuilt client.
- Railway no longer runs Vite during deployment.
- `client/dist` is included and must be pushed to GitHub.
- Root `package.json` now includes only server runtime dependencies: `express` and `socket.io`.
- `railway.json` now installs server dependencies only:
  `npm install --omit=dev --no-audit --no-fund`
- `.gitignore` now allows `client/dist` so the built game is uploaded.
- This is intended to bypass Railway's repeated `vite: not found` / npm install issue.


## Patch notes — v12.4

- Changed Railway deploy strategy from npm to pnpm/corepack.
- Added `nixpacks.toml` to force Railway to use pnpm install and skip Vite build.
- Railway build now uses the already-built `client/dist` folder.
- Start command is now direct: `node server/src/index.js`, avoiding npm at runtime.
- Root `package.json` uses `packageManager: pnpm@9.15.4`.
- Intended to bypass Railway's recurring npm error: `Exit handler never called`.


## Patch notes — v12.5

- Added Dockerfile deployment to bypass Railway/Nixpacks npm install behavior.
- Removed `nixpacks.toml` to avoid Nixpacks config conflict.
- Dockerfile uses Node 20 and pnpm through corepack.
- Dockerfile copies only server, shared, and prebuilt `client/dist`.
- Railway should now deploy using the Dockerfile rather than Nixpacks.
- `client/dist` remains required and must be committed to GitHub.
