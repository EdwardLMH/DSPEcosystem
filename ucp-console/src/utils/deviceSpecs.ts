// ─── Device frame definitions ────────────────────────────────────────────────
// All sizes are in logical (CSS) pixels at 1× scale.

export type DeviceOS = 'ios' | 'android';

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
  cutout: 'island' | 'notch' | 'hole' | 'none';
  cutoutW: number;
  cutoutH: number;
  statusBarH: number;
  // Android navigation bar
  navBarH?: number;
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
  // ── Samsung Galaxy S25 Ultra ─────────────────────────────────────────────────
  {
    id: 'galaxy-s25',
    label: 'Samsung Galaxy S25',
    shortLabel: 'S25',
    os: 'android',
    icon: '',
    screenW: 384, screenH: 832,
    bezelTop: 12, bezelSide: 9, bezelBottom: 16,
    cornerRadius: 36, frameRadius: 42,
    frameColor: '#1A1A2C',    // phantom navy
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
    cornerRadius: 20, frameRadius: 26,   // flat corners
    frameColor: '#2A2820',    // titanium black
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
    frameColor: '#F0EDE8',    // porcelain
    frameAccent: '#E0DDD8',
    cutout: 'hole', cutoutW: 12, cutoutH: 12,
    statusBarH: 40,
    navBarH: 40,
  },
];

export const DEVICE_GROUPS: { label: string; ids: string[] }[] = [
  { label: 'iPhone', ids: ['iphone17', 'iphone17pro', 'iphone16'] },
  { label: 'Samsung', ids: ['galaxy-s25', 'galaxy-s25-ultra'] },
  { label: 'Google',  ids: ['pixel9'] },
];
