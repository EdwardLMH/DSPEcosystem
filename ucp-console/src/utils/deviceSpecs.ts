// ─── Device frame definitions ────────────────────────────────────────────────
// All sizes are in logical (CSS) pixels at 1× scale.

export type DeviceOS = 'ios' | 'android' | 'harmonyos';

export interface DeviceSpec {
  id: string;
  label: string;
  shortLabel: string;
  os: DeviceOS;
  icon: string;
  // Logical screen resolution
  screenW: number;
  screenH: number;
  // Physical bezels around the screen (adds to total frame size)
  bezelTop: number;
  bezelSide: number;
  bezelBottom: number;
  cornerRadius: number;       // screen corner radius
  frameRadius: number;        // outer frame corner radius
  frameColor: string;
  frameAccent: string;        // button colour
  // Notch / island / punch-hole / no cutout
  cutout: 'island' | 'notch' | 'hole' | 'pill' | 'none';
  cutoutW: number;
  cutoutH: number;
  statusBarH: number;
  // Android / HarmonyOS navigation bar
  navBarH?: number;
  // Extra brand badge shown inside the frame label
  brandBadge?: string;
}

export const DEVICES: DeviceSpec[] = [
  // ── iPhone 17 (2025, 6.1-inch, Dynamic Island) ─────────────────────────────
  {
    id: 'iphone17',
    label: 'iPhone 17',
    shortLabel: 'iPhone 17',
    os: 'ios',
    icon: '',
    screenW: 393, screenH: 852,
    bezelTop: 14, bezelSide: 10, bezelBottom: 18,
    cornerRadius: 46, frameRadius: 54,
    frameColor: '#2C2C2E',
    frameAccent: '#48484A',
    cutout: 'island', cutoutW: 120, cutoutH: 34,
    statusBarH: 59,
  },
  // ── iPhone 17 Pro (2025, 6.3-inch, titanium, Dynamic Island) ───────────────
  {
    id: 'iphone17pro',
    label: 'iPhone 17 Pro',
    shortLabel: '17 Pro',
    os: 'ios',
    icon: '',
    screenW: 402, screenH: 874,
    bezelTop: 14, bezelSide: 10, bezelBottom: 18,
    cornerRadius: 50, frameRadius: 58,
    frameColor: '#8B7355',   // natural titanium
    frameAccent: '#A08060',
    cutout: 'island', cutoutW: 126, cutoutH: 37,
    statusBarH: 62,
  },
  // ── iPhone 16 (for reference/existing users) ────────────────────────────────
  {
    id: 'iphone16',
    label: 'iPhone 16',
    shortLabel: 'iPhone 16',
    os: 'ios',
    icon: '',
    screenW: 390, screenH: 844,
    bezelTop: 12, bezelSide: 10, bezelBottom: 18,
    cornerRadius: 44, frameRadius: 52,
    frameColor: '#1C1C1E',
    frameAccent: '#3A3A3C',
    cutout: 'island', cutoutW: 120, cutoutH: 34,
    statusBarH: 59,
  },
  // ── Samsung Galaxy S25 ───────────────────────────────────────────────────────
  {
    id: 'galaxy-s25',
    label: 'Samsung Galaxy S25',
    shortLabel: 'S25',
    os: 'android',
    icon: '',
    screenW: 384, screenH: 832,
    bezelTop: 12, bezelSide: 9, bezelBottom: 16,
    cornerRadius: 36, frameRadius: 42,
    frameColor: '#1A1A2C',
    frameAccent: '#2C2C40',
    cutout: 'hole', cutoutW: 12, cutoutH: 12,
    statusBarH: 40,
    navBarH: 36,
  },
  // ── Samsung Galaxy S25 Ultra ─────────────────────────────────────────────────
  {
    id: 'galaxy-s25-ultra',
    label: 'Galaxy S25 Ultra',
    shortLabel: 'S25 Ultra',
    os: 'android',
    icon: '',
    screenW: 384, screenH: 880,
    bezelTop: 12, bezelSide: 9, bezelBottom: 16,
    cornerRadius: 20, frameRadius: 26,
    frameColor: '#2A2820',
    frameAccent: '#3C3830',
    cutout: 'hole', cutoutW: 12, cutoutH: 12,
    statusBarH: 40,
    navBarH: 36,
  },
  // ── Google Pixel 9 ──────────────────────────────────────────────────────────
  {
    id: 'pixel9',
    label: 'Google Pixel 9',
    shortLabel: 'Pixel 9',
    os: 'android',
    icon: '',
    screenW: 393, screenH: 852,
    bezelTop: 14, bezelSide: 10, bezelBottom: 22,
    cornerRadius: 32, frameRadius: 38,
    frameColor: '#F0EDE8',
    frameAccent: '#E0DDD8',
    cutout: 'hole', cutoutW: 12, cutoutH: 12,
    statusBarH: 40,
    navBarH: 40,
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // HUAWEI — HarmonyOS 5
  // Specs derived from official Huawei press materials & teardown reports.
  // Mate 80 series uses a centre pill-shaped front camera (not a punch-hole).
  // Pura 70 retains a classic centre punch-hole.
  // ══════════════════════════════════════════════════════════════════════════════

  // ── Huawei Mate 80 Pro (2025, 6.8-inch, curved LTPO OLED, nano-silver body) ─
  {
    id: 'huawei-mate80pro',
    label: 'Huawei Mate 80 Pro',
    shortLabel: 'Mate 80 Pro',
    os: 'harmonyos',
    icon: '',
    // 1344 × 2992 @ ~460 ppi → logical ~402 × 895 at 3.33× density
    screenW: 402, screenH: 895,
    bezelTop: 13, bezelSide: 10, bezelBottom: 18,
    cornerRadius: 48, frameRadius: 56,
    frameColor: '#1C1A22',          // black nano-silver
    frameAccent: '#35323C',
    // Mate 80 Pro: elongated pill camera (wider than a single hole)
    cutout: 'pill', cutoutW: 28, cutoutH: 12,
    statusBarH: 44,
    navBarH: 34,
    brandBadge: 'HUAWEI',
  },
  // ── Huawei Mate 80 (standard, 6.7-inch, flat display) ───────────────────────
  {
    id: 'huawei-mate80',
    label: 'Huawei Mate 80',
    shortLabel: 'Mate 80',
    os: 'harmonyos',
    icon: '',
    // 1260 × 2800 @ ~461 ppi → logical ~378 × 840
    screenW: 378, screenH: 840,
    bezelTop: 12, bezelSide: 10, bezelBottom: 16,
    cornerRadius: 40, frameRadius: 48,
    frameColor: '#2B2830',          // deep purple
    frameAccent: '#3E3A48',
    cutout: 'hole', cutoutW: 12, cutoutH: 12,
    statusBarH: 40,
    navBarH: 34,
    brandBadge: 'HUAWEI',
  },
  // ── Huawei Pura 70 (2024, 6.6-inch, XMAGE camera, Ultra design language) ────
  {
    id: 'huawei-pura70',
    label: 'Huawei Pura 70',
    shortLabel: 'Pura 70',
    os: 'harmonyos',
    icon: '',
    // 1256 × 2760 @ ~460 ppi → logical ~376 × 828
    screenW: 376, screenH: 828,
    bezelTop: 12, bezelSide: 10, bezelBottom: 16,
    cornerRadius: 44, frameRadius: 52,
    frameColor: '#5A3A2A',          // roasted cocoa (signature Pura 70 colour)
    frameAccent: '#7A5040',
    cutout: 'hole', cutoutW: 11, cutoutH: 11,
    statusBarH: 40,
    navBarH: 34,
    brandBadge: 'HUAWEI',
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // XIAOMI — HyperOS 3
  // Xiaomi 17 Ultra: 6.73-inch 2K+ LTPO OLED, no punch-hole (under-display camera)
  // ══════════════════════════════════════════════════════════════════════════════

  // ── Xiaomi 17 Ultra (2025, under-display camera, ceramic back) ──────────────
  {
    id: 'xiaomi17ultra',
    label: 'Xiaomi 17 Ultra',
    shortLabel: 'Mi 17 Ultra',
    os: 'android',
    icon: '',
    // 1440 × 3200 @ ~522 ppi → logical ~432 × 960 — but reported CSS width ≈ 393
    screenW: 393, screenH: 875,
    bezelTop: 12, bezelSide: 9, bezelBottom: 16,
    cornerRadius: 42, frameRadius: 50,
    frameColor: '#F5F0EC',          // white ceramic
    frameAccent: '#DDD8D4',
    // Under-display camera — no visible cutout
    cutout: 'none', cutoutW: 0, cutoutH: 0,
    statusBarH: 38,
    navBarH: 34,
    brandBadge: 'Xiaomi',
  },
];

export const DEVICE_GROUPS: { label: string; ids: string[] }[] = [
  { label: '🍎 iPhone',  ids: ['iphone17', 'iphone17pro', 'iphone16'] },
  { label: '🤖 Samsung', ids: ['galaxy-s25', 'galaxy-s25-ultra'] },
  { label: '🔵 Google',  ids: ['pixel9'] },
  { label: '🔴 Huawei',  ids: ['huawei-mate80pro', 'huawei-mate80', 'huawei-pura70'] },
  { label: '🟠 Xiaomi',  ids: ['xiaomi17ultra'] },
];

