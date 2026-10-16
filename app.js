// Chess Recorder App
// Uses chess.js for rules / SAN / PGN (via ESM CDN)
// ESM import note: if offline, swap to a local copy of chess.js
import { Chess } from 'https://cdn.jsdelivr.net/npm/chess.js@1.4.0/dist/esm/chess.js';

const boardEl = document.getElementById('board');
const moveListEl = document.getElementById('moveList');
const statusEl = document.getElementById('status');
const pgnText = document.getElementById('pgnText');

// Controls
const newGameBtn = document.getElementById('newGameBtn');
const flipBtn = document.getElementById('flipBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');

// Customization controls
const lightColor = document.getElementById('lightColor');
const darkColor = document.getElementById('darkColor');
const pieceStyle = document.getElementById('pieceStyle');
const whitePieceColor = document.getElementById('whitePieceColor');
const blackPieceColor = document.getElementById('blackPieceColor');
const pieceSize = document.getElementById('pieceSize');
const pieceSizeVal = document.getElementById('pieceSizeVal');

// PGN Header fields
const hdrEvent = document.getElementById('hdrEvent');
const hdrSite = document.getElementById('hdrSite');
const hdrDate = document.getElementById('hdrDate');
const hdrRound = document.getElementById('hdrRound');
const hdrWhite = document.getElementById('hdrWhite');
const pieceSize = document.getElementById('pieceSize');
const pieceSizeVal = document.getElementById('pieceSizeVal');


// Promotion dialog
const promoDialog = document.getElementById('promotionDialog');
const promoForm = document.getElementById('promotionForm');
const cancelPromotion = document.getElementById('cancelPromotion');

// State
let chess = new Chess();
let orientation = 'w'; // 'w' at bottom or 'b'
let selectedSquare = null;
let legalTargets = [];
let redoStack = [];

// Piece rendering presets
const PIECE_GLYPHS = {
  unicode: {
    w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
    b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
  },
  alpha: {
    w: { k: 'K', q: 'Q', r: 'R', b: 'B', n: 'N', p: 'P' },
    b: { k: 'k', q: 'q', r: 'r', b: 'b', n: 'n', p: 'p' },
  },
  minimal: {
    w: { k: 'K', q: 'Q', r: 'R', b: 'B', n: 'N', p: '•' },
    b: { k: 'K', q: 'Q', r: 'R', b: 'B', n: 'N', p: '•' },
  },
  // Merida icon font mapping (characters) [32]
  merida: {
    w: { k: '\u004B', q: '\u0051', r: '\u0052', b: '\u0042', n: '\u004E', p: '\u0050' },
    b: { k: '\u006B', q: '\u0071', r: '\u0072', b: '\u0062', n: '\u006E', p: '\u0070' },
  },
};

function savePrefs() {
  const prefs = {
    light: lightColor.value,
    dark: darkColor.value,
    style: pieceStyle.value,
    white: whitePieceColor.value,
    black: blackPieceColor.value,
    showCoords: showCoords.checked,
    highlight: highlightMoves.checked,
    orientation,
    pieceScale: pieceSize ? Number(pieceSize.value) : 98,

}
function loadPrefs() {
  try {
    const raw = localStorage.getItem('chessRecorderPrefs');
    if (!raw) return;
    const p = JSON.parse(raw);
    lightColor.value = p.light ?? lightColor.value;
    darkColor.value = p.dark ?? darkColor.value;
    pieceStyle.value = p.style ?? pieceStyle.value;
    whitePieceColor.value = p.white ?? whitePieceColor.value;
    blackPieceColor.value = p.black ?? blackPieceColor.value;
    showCoords.checked = p.showCoords ?? showCoords.checked;
    highlightMoves.checked = p.highlight ?? highlightMoves.checked;
    if (typeof p.pieceScale === 'number' && pieceSize) {
      pieceSize.value = String(p.pieceScale);
    }
    applyPieceScale();


function applyPieceScale() {
  const scale = pieceSize ? Number(pieceSize.value) : 98;
  const clamped = Math.max(85, Math.min(100, scale));
  document.documentElement.style.setProperty('--piece-scale', String(clamped / 100));
  if (pieceSizeVal) pieceSizeVal.textContent = `${clamped}%`;
}

function coordToIndex(file, rank) {
  // file: a..h rank: 1..8
  const f = file.charCodeAt(0) - 97; // a=0
  const r = rank - 1; // 0..7 bottom is rank 1 (white orientation)
  // UI orientation flips display order, not mapping
  return r * 8 + f;
}

function indexToCoord(idx) {
  const r = Math.floor(idx / 8); // 0..7
  const f = idx % 8; // 0..7
  const file = String.fromCharCode(97 + f);
  const rank = 1 + r;
  return file + rank;
}

function buildBoard() {
  boardEl.innerHTML = '';
  const board = chess.board(); // 8x8 array, a8..h1 by rows
  for (let rank = 8; rank >= 1; rank--) {
    for (let f = 0; f < 8; f++) {
      const file = String.fromCharCode(97 + f);
      const sq = file + rank;
      const sqData = chess.get(sq);
      const sqEl = document.createElement('div');
      sqEl.className = 'square';
      const isLight = ((file.charCodeAt(0) - 97) + (rank - 1)) % 2 === 0;
      sqEl.classList.add(isLight ? 'light' : 'dark');
      sqEl.dataset.square = sq;
      sqEl.role = 'gridcell';

      if (sqData) {
        const styleKey = pieceStyle.value;
        if (styleKey === 'cburnett') {
          // SVG image pieces from Wikimedia Commons [19]
          const url = PIECE_SVGS.cburnett[sqData.color][sqData.type];
          const wrap = document.createElement('span');
          wrap.className = `piece img ${sqData.color === 'w' ? 'white' : 'black'}`;
          const img = document.createElement('img');
          img.alt = `${sqData.color === 'w' ? 'White' : 'Black'} ${sqData.type}`;
          img.decoding = 'async';
          img.loading = 'lazy';
          img.src = url;
          wrap.appendChild(img);
          sqEl.appendChild(wrap);
        } else {
          const pieceEl = document.createElement('span');
          const glyphSet = PIECE_GLYPHS[styleKey] || PIECE_GLYPHS.unicode;
          pieceEl.textContent = glyphSet[sqData.color][sqData.type];
          pieceEl.className = `piece ${styleKey === 'merida' ? 'font' : ''} ${sqData.color === 'w' ? 'white' : 'black'}`.trim();
          pieceEl.style.color = sqData.color === 'w' ? getComputedStyle(document.documentElement).getPropertyValue('--piece-w') : getComputedStyle(document.documentElement).getPropertyValue('--piece-b');
          sqEl.appendChild(pieceEl);
        }
      }

      sqEl.addEventListener('click', () => onSquareClick(sq));
      boardEl.appendChild(sqEl);
    }
  }
  applyOrientation();
  renderCoords();
}

function applyOrientation() {
  const squares = Array.from(boardEl.children);
  if (orientation === 'w') return; // default order already has a8..h1, but we want h1 at end
  // Reverse for black-at-bottom: simply reverse the DOM order
  squares.reverse().forEach((el) => boardEl.appendChild(el));
}

function renderCoords() {
  const filesEl = document.querySelector('.coord-files');
  const ranksEl = document.querySelector('.coord-ranks');
  filesEl.innerHTML = '';
  ranksEl.innerHTML = '';
  const files = orientation === 'w' ? ['a','b','c','d','e','f','g','h'] : ['h','g','f','e','d','c','b','a'];
  const ranks = orientation === 'w' ? ['1','2','3','4','5','6','7','8'] : ['8','7','6','5','4','3','2','1'];
  files.forEach(f => { const s = document.createElement('span'); s.textContent = f; filesEl.appendChild(s); });
  ranks.forEach(r => { const s = document.createElement('span'); s.textContent = r; ranksEl.appendChild(s); });
  const show = showCoords.checked;
  filesEl.style.display = show ? 'grid' : 'none';
  ranksEl.style.display = show ? 'grid' : 'none';
}

function refreshBoard() {
  // Repaint pieces and colors only
  document.documentElement.style.setProperty('--light', lightColor.value);
  document.documentElement.style.setProperty('--dark', darkColor.value);
  document.documentElement.style.setProperty('--piece-w', whitePieceColor.value);
  document.documentElement.style.setProperty('--piece-b', blackPieceColor.value);

  // Rebuild contents to reflect moves and piece style
  buildBoard();
  // Highlight if applicable
  if (selectedSquare) highlightSquares(selectedSquare);
  updateStatus();
  updateMoves();
  updatePGN();
}

function updateStatus() {
  let status = chess.turn() === 'w' ? 'White' : 'Black';
  if (chess.isCheckmate()) status += ' to move — checkmate.';
  else if (chess.isDraw()) status += ' to move — draw.';
  else if (chess.inCheck()) status += ' to move — check!';
  else status += ' to move.';
  statusEl.textContent = status;
}

function updateMoves() {
  // Render SAN list as an ordered list
  moveListEl.innerHTML = '';
  const history = chess.history({ verbose: true });
  let line = [];
  history.forEach((m, i) => {
    const turnNumber = Math.floor(i / 2) + 1;
    if (i % 2 === 0) {
      line = document.createElement('li');
      line.textContent = `${turnNumber}. ${m.san}`;
      moveListEl.appendChild(line);
    } else {
      line.textContent += `  ${m.san}`;
    }
  });
  // Scroll to bottom
  moveListEl.parentElement?.scrollTo({ top: moveListEl.scrollHeight });
}

function updatePGN() {
  const headers = {};
  if (hdrEvent.value) headers.Event = hdrEvent.value;
  if (hdrSite.value) headers.Site = hdrSite.value;
  if (hdrDate.value) headers.Date = hdrDate.value;
  if (hdrRound.value) headers.Round = hdrRound.value;
  if (hdrWhite.value) headers.White = hdrWhite.value;
  if (hdrBlack.value) headers.Black = hdrBlack.value;
  chess.header(...Object.entries(headers).flat());
  pgnText.value = chess.pgn();
}

function clearHighlights() {
  for (const el of boardEl.querySelectorAll('.square')) {
    el.classList.remove('highlight', 'legal', 'capture', 'selected');
  }
}

function highlightSquares(from) {
  clearHighlights();
  const fromEl = [...boardEl.children].find(el => el.dataset.square === from);
  if (fromEl) fromEl.classList.add('selected');
  if (!highlightMoves.checked) return;
  const moves = chess.moves({ square: from, verbose: true });
  for (const m of moves) {
    const toEl = [...boardEl.children].find(el => el.dataset.square === m.to);
    if (!toEl) continue;
    toEl.classList.add(m.captured ? 'capture' : 'legal');
  }
}

function onSquareClick(sq) {
  // If selecting first square
  if (!selectedSquare) {
    const piece = chess.get(sq);
    if (!piece) return; // empty square
    selectedSquare = sq;
    legalTargets = chess.moves({ square: sq, verbose: true }).map(m => m.to);
    highlightSquares(sq);
    return;
  }

  if (sq === selectedSquare) {
    selectedSquare = null;
    legalTargets = [];
    clearHighlights();
    return;
  }

  // Try move
  const isPromotionAttempt = isPromotionMove(selectedSquare, sq);
  if (isPromotionAttempt) {
    // Open dialog and wait
    openPromotionDialog(selectedSquare, sq).then((promotionPiece) => {
      if (!promotionPiece) return; // canceled
      tryMove(selectedSquare, sq, promotionPiece);
    });
  } else {
    tryMove(selectedSquare, sq, undefined);
  }
}

function isPromotionMove(from, to) {
  const piece = chess.get(from);
  if (!piece || piece.type !== 'p') return false;
  const rank = parseInt(to[1], 10);
  return (piece.color === 'w' && rank === 8) || (piece.color === 'b' && rank === 1);
}

function openPromotionDialog(from, to) {
  return new Promise((resolve) => {
    const onSubmit = (ev) => {
      ev.preventDefault();
      const btn = ev.submitter; // clicked button
      if (!btn) return resolve(null);
      const piece = btn.getAttribute('data-piece');
      cleanup();
      resolve(piece);
    };
    const onCancel = () => { cleanup(); resolve(null); };
    function cleanup() {
      promoForm.removeEventListener('submit', onSubmit);
      cancelPromotion.removeEventListener('click', onCancel);
      promoDialog.close();
    }
    promoForm.addEventListener('submit', onSubmit);
    cancelPromotion.addEventListener('click', onCancel);
    promoDialog.showModal();
  });
}

function tryMove(from, to, promotion) {
  const move = { from, to, promotion };
  const result = chess.move(move);
  if (result) {
    selectedSquare = null;
    legalTargets = [];
    redoStack = []; // new branch clears redo
    clearHighlights();
    refreshBoard();
  } else {
    // illegal move feedback
    const fromEl = [...boardEl.children].find(el => el.dataset.square === from);
    const toEl = [...boardEl.children].find(el => el.dataset.square === to);
    [fromEl, toEl].forEach(el => { if (el) el.classList.add('highlight'); });
    setTimeout(clearHighlights, 600);
  }
}

function newGame() {
  chess = new Chess();
  redoStack = [];
  selectedSquare = null;
  legalTargets = [];
  refreshBoard();
}

function flipBoard() {
  orientation = orientation === 'w' ? 'b' : 'w';
  savePrefs();
  refreshBoard();
}

function undo() {
  const mv = chess.undo();
  if (mv) redoStack.push(mv);
  refreshBoard();
}

function redo() {
  if (redoStack.length === 0) return;
  const mv = redoStack.pop();
  if (!mv) return;
  chess.move({ from: mv.from, to: mv.to, promotion: mv.promotion });
  refreshBoard();
}

function copyPgn() {
  updatePGN();
  navigator.clipboard.writeText(pgnText.value).then(() => {
    statusEl.textContent = 'PGN copied to clipboard';
    setTimeout(updateStatus, 1200);
  }).catch(() => {
    statusEl.textContent = 'Copy failed';
    setTimeout(updateStatus, 1200);
  });
}

function downloadPgn() {
  updatePGN();
  const blob = new Blob([pgnText.value], { type: 'application/x-chess-pgn' });
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0,10);
  a.download = `game-${date}.pgn`;
  a.href = URL.createObjectURL(blob);
  a.click();
  URL.revokeObjectURL(a.href);
}

function loadFromText() {
  const text = pgnText.value.trim();
  if (!text) return;
  const ok = chess.loadPgn(text, { sloppy: true });
  if (ok) {
    redoStack = [];
    refreshBoard();
  } else {
    statusEl.textContent = 'Failed to parse PGN';
    setTimeout(updateStatus, 1200);
  }
}

// Event listeners
newGameBtn.addEventListener('click', newGame);
flipBtn.addEventListener('click', flipBoard);
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

lightColor.addEventListener('input', () => { savePrefs(); refreshBoard(); });
darkColor.addEventListener('input', () => { savePrefs(); refreshBoard(); });
pieceStyle.addEventListener('change', () => { savePrefs(); refreshBoard(); });
whitePieceColor.addEventListener('input', () => { savePrefs(); refreshBoard(); });
blackPieceColor.addEventListener('input', () => { savePrefs(); refreshBoard(); });
if (pieceSize) {
  pieceSize.addEventListener('input', () => { applyPieceScale(); savePrefs(); });
}


document.getElementById('copyPgnBtn').addEventListener('click', copyPgn);
document.getElementById('downloadPgnBtn').addEventListener('click', downloadPgn);
document.getElementById('loadPgnBtn').addEventListener('click', loadFromText);

hdrEvent.addEventListener('input', updatePGN);
hdrSite.addEventListener('input', updatePGN);
hdrDate.addEventListener('input', updatePGN);
hdrRound.addEventListener('input', updatePGN);
hdrWhite.addEventListener('input', updatePGN);
hdrBlack.addEventListener('input', updatePGN);

// Piece size display and persistence
if (pieceSize) {
  pieceSize.addEventListener('input', () => { applyPieceScale(); savePrefs(); });
}

// Init
loadPrefs();
applyPieceScale();
refreshBoard();

const PIECE_SVGS = {
  // Cburnett set from Wikimedia Commons [19]
  cburnett: {
    w: { k: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg', q: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg', r: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg', b: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg', n: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg', p: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg' },
    b: { k: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg', q: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg', r: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg', b: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg', n: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg', p: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg' }
  },
  // Skak SVG set [37]
  skak: {
    w: { k: 'https://raw.githubusercontent.com/MuTsunTsai/skak-svg/main/svg/wk.svg', q: 'https://raw.githubusercontent.com/MuTsunTsai/skak-svg/main/svg/wq.svg', r: 'https://raw.githubusercontent.com/MuTsunTsai/skak-svg/main/svg/wr.svg', b: 'https://raw.githubusercontent.com/MuTsunTsai/skak-svg/main/svg/wb.svg', n: 'https://raw.githubusercontent.com/MuTsunTsai/skak-svg/main/svg/wn.svg', p: 'https://raw.githubusercontent.com/MuTsunTsai/skak-svg/main/svg/wp.svg' },
    b: { k: 'https://raw.githubusercontent.com/MuTsunTsai/skak-svg/main/svg/bk.svg', q: 'https://raw.githubusercontent.com/MuTsunTsai/skak-svg/main/svg/bq.svg', r: 'https://raw.githubusercontent.com/MuTsunTsai/skak-svg/main/svg/br.svg', b: 'https://raw.githubusercontent.com/MuTsunTsai/skak-svg/main/svg/bb.svg', n: 'https://raw.githubusercontent.com/MuTsunTsai/skak-svg/main/svg/bn.svg', p: 'https://raw.githubusercontent.com/MuTsunTsai/skak-svg/main/svg/bp.svg' }
  },
  // 1echecs SVG set [39]
  '1echecs': {
    w: { k: 'https://raw.githubusercontent.com/MuTsunTsai/1echecs-svg/main/svg/wk.svg', q: 'https://raw.githubusercontent.com/MuTsunTsai/1echecs-svg/main/svg/wq.svg', r: 'https://raw.githubusercontent.com/MuTsunTsai/1echecs-svg/main/svg/wr.svg', b: 'https://raw.githubusercontent.com/MuTsunTsai/1echecs-svg/main/svg/wb.svg', n: 'https://raw.githubusercontent.com/MuTsunTsai/1echecs-svg/main/svg/wn.svg', p: 'https://raw.githubusercontent.com/MuTsunTsai/1echecs-svg/main/svg/wp.svg' },
    b: { k: 'https://raw.githubusercontent.com/MuTsunTsai/1echecs-svg/main/svg/bk.svg', q: 'https://raw.githubusercontent.com/MuTsunTsai/1echecs-svg/main/svg/bq.svg', r: 'https://raw.githubusercontent.com/MuTsunTsai/1echecs-svg/main/svg/br.svg', b: 'https://raw.githubusercontent.com/MuTsunTsai/1echecs-svg/main/svg/bb.svg', n: 'https://raw.githubusercontent.com/MuTsunTsai/1echecs-svg/main/svg/bn.svg', p: 'https://raw.githubusercontent.com/MuTsunTsai/1echecs-svg/main/svg/bp.svg' }
  }
};
