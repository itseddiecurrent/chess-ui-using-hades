# Chess UI (Recording Interface)

A simple, static chess recording interface. Customize the board and pieces, click-to-move with legality checks, automatic SAN/PGN, copy/download PGN, and load PGN.

Live (GitHub Pages)
- After enabling Pages (Settings → Pages → Deploy from a branch → main, /(root)), your site will be at:
  https://itseddiecurrent.github.io/chess-ui-using-hades/

Features
- Legal move validation, check/mate/draw via chess.js
- Customizable board colors and multiple piece styles
- Self-play (both sides), promotions via dialog
- SAN move list and PGN export/import

Attributions and licenses
- chess.js (TypeScript chess library)
  - npm: https://www.npmjs.com/package/chess.js
  - GitHub: https://github.com/jhlywa/chess.js
- Piece sets included:
  - Cburnett (SVG) — Wikimedia Commons category: SVG chess pieces. Files on Commons generally under CC BY-SA; check each file page for exact terms.
    - https://commons.wikimedia.org/wiki/Category:SVG_chess_pieces
  - Merida (icon font) — chess-merida-font via jsDelivr (MPL-2.0)
    - https://www.jsdelivr.com/package/npm/chess-merida-font
  - Skak (SVG) — skak-svg
    - https://github.com/MuTsunTsai/skak-svg
  - 1echecs (SVG) — 1echecs-svg
    - https://github.com/MuTsunTsai/1echecs-svg

Notes on usage and licensing
- Cburnett SVGs are widely used; most are CC BY-SA 3.0/4.0 on their file pages on Commons. If you redistribute, include proper attribution and share-alike where required.
- Merida icon font is MPL‑2.0; keep the license notice if you redistribute.
- For skak-svg and 1echecs-svg, see each repo for details.

Local preview
- Open index.html in a browser, or serve the folder locally (e.g., `python -m http.server 8000`).

