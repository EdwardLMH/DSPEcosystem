/**
 * Pure TypeScript QR Code encoder — no dependencies.
 *
 * Supports QR versions 1-10 (up to ~174 bytes), error correction level M.
 * Output: a boolean[][] matrix where true = dark module.
 *
 * Based on the ISO/IEC 18004:2015 specification.
 */

// ─── GF(256) arithmetic ───────────────────────────────────────────────────────

const EXP: number[] = new Array(256);
const LOG: number[] = new Array(256);
(function initGF() {
  let x = 1;
  for (let i = 0; i < 256; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[(LOG[a] + LOG[b]) % 255];
}

function gfPow(x: number, p: number): number {
  return EXP[(LOG[x] * p) % 255];
}

// ─── Reed-Solomon error correction ────────────────────────────────────────────

function rsGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const root = gfPow(2, i);
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], root);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: number[], ecCount: number): number[] {
  const gen = rsGeneratorPoly(ecCount);
  const msg = [...data, ...new Array(ecCount).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const coeff = msg[i];
    if (coeff !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coeff);
      }
    }
  }
  return msg.slice(data.length);
}

// ─── Character count bits by version & mode ───────────────────────────────────

function charCountBits(version: number): number {
  if (version <= 9) return 8;
  if (version <= 26) return 16;
  return 16;
}

// ─── QR version capacity table (mode=byte, ECL=M) ────────────────────────────
// [dataCodewords, ecCodewordsPerBlock, block1Count, block1DataWords, block2Count, block2DataWords]
const VERSION_TABLE: Record<number, { totalData: number; ec: number; b1: number; d1: number; b2: number; d2: number }> = {
  1:  { totalData:  16, ec:  10, b1: 1, d1: 16,  b2: 0, d2: 0  },
  2:  { totalData:  28, ec:  16, b1: 1, d1: 28,  b2: 0, d2: 0  },
  3:  { totalData:  44, ec:  26, b1: 1, d1: 44,  b2: 0, d2: 0  },
  4:  { totalData:  64, ec:  18, b1: 2, d1: 32,  b2: 0, d2: 0  },
  5:  { totalData:  86, ec:  24, b1: 2, d1: 43,  b2: 0, d2: 0  },
  6:  { totalData: 108, ec:  16, b1: 4, d1: 27,  b2: 0, d2: 0  },
  7:  { totalData: 124, ec:  18, b1: 4, d1: 31,  b2: 0, d2: 0  },
  8:  { totalData: 154, ec:  22, b1: 2, d1: 38,  b2: 2, d2: 39 },
  9:  { totalData: 182, ec:  22, b1: 3, d1: 36,  b2: 2, d2: 37 },
  10: { totalData: 216, ec:  26, b1: 4, d1: 43,  b2: 1, d2: 44 },
};

function pickVersion(byteLen: number): number {
  for (const [v, cfg] of Object.entries(VERSION_TABLE)) {
    if (cfg.totalData >= byteLen) return Number(v);
  }
  throw new Error(`String too long for QR (max ~${VERSION_TABLE[10].totalData} bytes)`);
}

// ─── Bit buffer ───────────────────────────────────────────────────────────────

class BitBuffer {
  private buf: number[] = [];
  private bitLen = 0;

  put(val: number, bits: number) {
    for (let i = bits - 1; i >= 0; i--) {
      const bit = (val >> i) & 1;
      if (this.bitLen % 8 === 0) this.buf.push(0);
      if (bit) this.buf[this.buf.length - 1] |= 1 << (7 - (this.bitLen % 8));
      this.bitLen++;
    }
  }

  get length() { return this.bitLen; }
  get bytes() { return this.buf; }
}

// ─── Matrix helpers ───────────────────────────────────────────────────────────

type Matrix = (boolean | null)[][];

function makeMatrix(size: number): Matrix {
  return Array.from({ length: size }, () => new Array(size).fill(null));
}

function setRect(m: Matrix, row: number, col: number, h: number, w: number, val: boolean) {
  for (let r = row; r < row + h; r++)
    for (let c = col; c < col + w; c++)
      m[r][c] = val;
}

function drawFinder(m: Matrix, row: number, col: number) {
  setRect(m, row, col, 7, 7, true);
  setRect(m, row + 1, col + 1, 5, 5, false);
  setRect(m, row + 2, col + 2, 3, 3, true);
}

function drawTiming(m: Matrix, size: number) {
  for (let i = 8; i < size - 8; i++) {
    const val = i % 2 === 0;
    m[6][i] = val;
    m[i][6] = val;
  }
}

function drawAlignment(m: Matrix, version: number) {
  const ALIGN: Record<number, number[]> = {
    2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
    6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
  };
  const pos = ALIGN[version];
  if (!pos) return;
  for (const r of pos) {
    for (const c of pos) {
      if (m[r][c] !== null) continue; // skip if already set (finder overlap)
      setRect(m, r - 2, c - 2, 5, 5, true);
      setRect(m, r - 1, c - 1, 3, 3, false);
      m[r][c] = true;
    }
  }
}

// ─── Format info (ECL=M, mask pattern p) ─────────────────────────────────────

const FORMAT_MASK = 0b101010000010010;

function formatBits(mask: number): number {
  // ECL M = 0b00, combined with mask id
  const data = (0b00 << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) {
    rem = (rem << 1) ^ ((rem >> 9) * 0x537);
  }
  return ((data << 10) | rem) ^ FORMAT_MASK;
}

function drawFormat(m: Matrix, size: number, mask: number) {
  const bits = formatBits(mask);
  const seq = [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14];
  for (let i = 0; i < 15; i++) {
    const bit = (bits >> i) & 1;
    // Horizontal: row 8, various cols
    const hCol = i < 6 ? i : i < 7 ? 7 : size - 15 + i;
    m[8][i < 8 ? (i < 6 ? i : 7) : size - 15 + i] = !!bit;
    // Vertical: col 8, various rows
    m[i < 8 ? (i < 6 ? i : i === 7 ? 7 : 8) : size - 15 + i][8] = !!bit;
  }
  // Dark module
  m[size - 8][8] = true;
}

// Simplified format placement (correct bit positions)
function drawFormatCorrect(m: Matrix, size: number, mask: number) {
  const bits = formatBits(mask);
  for (let i = 0; i < 6; i++) {
    const b = !!(bits & (1 << i));
    m[i][8] = b;
    m[8][i] = b;
  }
  m[7][8] = !!(bits & (1 << 6));
  m[8][7] = !!(bits & (1 << 6));
  m[8][8] = !!(bits & (1 << 7));
  m[8][5] = !!(bits & (1 << 8));  // correction: col 5 not 6 was already set
  // upper-right
  for (let i = 0; i < 8; i++) {
    m[8][size - 1 - i] = !!(bits & (1 << i));
  }
  // lower-left
  for (let i = 0; i < 7; i++) {
    m[size - 7 + i][8] = !!(bits & (1 << (i + 8)));
  }
  m[size - 8][8] = true; // dark module
}

// ─── Data placement ───────────────────────────────────────────────────────────

function isReserved(m: Matrix, r: number, c: number): boolean {
  return m[r][c] !== null;
}

function placeData(m: Matrix, data: number[], size: number) {
  let bit = 0;
  let up = true;
  let col = size - 1;

  while (col > 0) {
    if (col === 6) col--; // skip timing column

    for (let rowIdx = 0; rowIdx < size; rowIdx++) {
      const r = up ? size - 1 - rowIdx : rowIdx;
      for (let dc = 0; dc < 2; dc++) {
        const c = col - dc;
        if (!isReserved(m, r, c)) {
          const byteIdx = Math.floor(bit / 8);
          const bitIdx = 7 - (bit % 8);
          const val = byteIdx < data.length ? !!(data[byteIdx] & (1 << bitIdx)) : false;
          m[r][c] = val;
          bit++;
        }
      }
    }
    up = !up;
    col -= 2;
  }
}

// ─── Masking ──────────────────────────────────────────────────────────────────

type MaskFn = (r: number, c: number) => boolean;
const MASKS: MaskFn[] = [
  (r, c) => (r + c) % 2 === 0,
  (r, _) => r % 2 === 0,
  (_, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2 + (r * c) % 3) === 0,
  (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
  (r, c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0,
];

function applyMask(m: Matrix, maskId: number, reserved: boolean[][]): boolean[][] {
  const fn = MASKS[maskId];
  return m.map((row, r) =>
    row.map((cell, c) => {
      if (reserved[r][c]) return cell as boolean;
      return (cell as boolean) !== fn(r, c);
    })
  );
}

function penaltyScore(m: boolean[][]): number {
  const size = m.length;
  let score = 0;

  // Rule 1: 5+ consecutive same-colour in row/col
  for (let r = 0; r < size; r++) {
    let run = 1;
    for (let c = 1; c < size; c++) {
      if (m[r][c] === m[r][c - 1]) { run++; }
      else { if (run >= 5) score += run - 2; run = 1; }
    }
    if (run >= 5) score += run - 2;
  }
  for (let c = 0; c < size; c++) {
    let run = 1;
    for (let r = 1; r < size; r++) {
      if (m[r][c] === m[r - 1][c]) { run++; }
      else { if (run >= 5) score += run - 2; run = 1; }
    }
    if (run >= 5) score += run - 2;
  }

  // Rule 2: 2×2 same-colour blocks
  for (let r = 0; r < size - 1; r++)
    for (let c = 0; c < size - 1; c++)
      if (m[r][c] === m[r][c+1] && m[r][c] === m[r+1][c] && m[r][c] === m[r+1][c+1])
        score += 3;

  return score;
}

// ─── Main encode function ─────────────────────────────────────────────────────

export function encodeQR(text: string): boolean[][] {
  const bytes = Array.from(new TextEncoder().encode(text));
  const version = pickVersion(bytes.length + 3); // 3 = mode indicator + length + terminator overhead estimate
  const cfg = VERSION_TABLE[version];
  const size = version * 4 + 17;

  // Build data codewords
  const buf = new BitBuffer();
  buf.put(0b0100, 4); // byte mode
  buf.put(bytes.length, charCountBits(version));
  for (const b of bytes) buf.put(b, 8);
  // Terminator
  buf.put(0, Math.min(4, cfg.totalData * 8 - buf.length));
  // Pad to byte boundary
  while (buf.length % 8 !== 0) buf.put(0, 1);
  // Pad codewords
  const pads = [0xEC, 0x11];
  let pi = 0;
  while (buf.bytes.length < cfg.totalData) { buf.put(pads[pi++ % 2], 8); }

  // Interleave data blocks
  const blocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let dataIdx = 0;
  for (let b = 0; b < cfg.b1; b++) {
    blocks.push(buf.bytes.slice(dataIdx, dataIdx + cfg.d1));
    dataIdx += cfg.d1;
  }
  for (let b = 0; b < cfg.b2; b++) {
    blocks.push(buf.bytes.slice(dataIdx, dataIdx + cfg.d2));
    dataIdx += cfg.d2;
  }
  for (const blk of blocks) ecBlocks.push(rsEncode(blk, cfg.ec));

  const finalData: number[] = [];
  const maxD = Math.max(cfg.d1, cfg.d2);
  for (let i = 0; i < maxD; i++)
    for (const blk of blocks) if (i < blk.length) finalData.push(blk[i]);
  for (let i = 0; i < cfg.ec; i++)
    for (const blk of ecBlocks) finalData.push(blk[i]);

  // Build matrix
  const m = makeMatrix(size);

  // Finder patterns + separators
  drawFinder(m, 0, 0);
  drawFinder(m, 0, size - 7);
  drawFinder(m, size - 7, 0);
  // Separators (white border around finders)
  for (let i = 0; i < 8; i++) {
    m[7][i] ??= false; m[i][7] ??= false; // TL h/v
    m[7][size - 1 - i] ??= false; m[i][size - 8] ??= false; // TR
    m[size - 8][i] ??= false; m[size - 1 - i][7] ??= false; // BL
  }

  // Timing
  drawTiming(m, size);
  // Alignment
  drawAlignment(m, version);
  // Format placeholders (reserve)
  drawFormatCorrect(m, size, 0);

  // Mark reserved cells
  const reserved: boolean[][] = m.map(row => row.map(c => c !== null));

  // Place data
  placeData(m, finalData, size);

  // Find best mask
  let bestMask = 0, bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const masked = applyMask(m, mask, reserved);
    const s = penaltyScore(masked);
    if (s < bestScore) { bestScore = s; bestMask = mask; }
  }

  // Apply best mask and draw final format
  const finalMatrix = applyMask(m, bestMask, reserved) as Matrix;
  drawFormatCorrect(finalMatrix, size, bestMask);

  return finalMatrix as boolean[][];
}
