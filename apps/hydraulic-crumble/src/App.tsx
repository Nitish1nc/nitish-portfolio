// @ts-nocheck
import React, { useCallback, useEffect, useRef } from 'react';
import { create } from 'zustand';

/* ============================================================
   THE HYDRAULIC CRUMBLE — Dual Mode Edition (PATCHED)
   FIX 1: Infinite Zen crash — every ref access is now null-guarded
          (quick-only refs like stats/catharsis/timer no longer
          explode when they don't exist in infinite mode).
   FIX 2: Quick Relief now has a PAUSE button (⏸) with a calm
          overlay, and BOTH modes have an exit (✕) button.
   No redesign. Surgical patches only.
   ============================================================ */

/* ---------- PALETTES ---------- */
const PALETTES = {
  sunset:    { name: 'Sunset',    colors: ['#f0a070', '#d97858', '#b85a42', '#f5c896', '#8a3a2a'] },
  ocean:     { name: 'Ocean',     colors: ['#7ab8c4', '#4a8a96', '#2e6470', '#a8d4dc', '#1e4450'] },
  matcha:    { name: 'Matcha',    colors: ['#a8c888', '#7aa060', '#5a7840', '#c8e0a8', '#3a5828'] },
  lavender:  { name: 'Lavender',  colors: ['#c8a8d8', '#9878b0', '#705088', '#e0c8ec', '#503068'] },
  charcoal:  { name: 'Charcoal',  colors: ['#a8a8a8', '#787878', '#505050', '#c8c8c8', '#303030'] },
  terracotta:{ name: 'Terracotta',colors: ['#d88868', '#b06040', '#884020', '#e8a888', '#602810'] },
  midnight:  { name: 'Midnight',  colors: ['#6878a8', '#405080', '#283060', '#8898c0', '#182048'] },
  cherry:    { name: 'Cherry',    colors: ['#d86070', '#b03848', '#882030', '#e88898', '#601020'] },
};

/* ---------- TEXTURES ---------- */
const TEXTURES = {
  chalk: {
    w: 0.6, h: 1.28, radius: '10px',
    bgBase: (p) => `linear-gradient(150deg, ${p[0]} 0%, ${p[1]} 45%, ${p[2]} 100%)`,
    grain: 'repeating-linear-gradient(178deg, rgba(0,0,0,.05) 0 3px, transparent 3px 9px)',
    crunchType: 'brittle', tone: 1.25,
  },
  sand: {
    w: 1.16, h: 0.72, radius: '8px',
    bgBase: (p) => `linear-gradient(155deg, ${p[0]} 0%, ${p[1]} 48%, ${p[2]} 100%)`,
    grain: 'repeating-linear-gradient(92deg, rgba(255,255,255,.10) 0 2px, rgba(0,0,0,.06) 2px 5px)',
    crunchType: 'soft', tone: 0.72,
  },
  foam: {
    w: 0.92, h: 0.92, radius: '6px',
    bgBase: (p) => `linear-gradient(160deg, ${p[0]} 0%, ${p[1]} 50%, ${p[2]} 100%)`,
    grain: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,.18) 0 3px, transparent 4px), radial-gradient(circle at 70% 60%, rgba(0,0,0,.12) 0 4px, transparent 5px)',
    crunchType: 'dusty', tone: 0.85,
  },
  soap: {
    w: 1.08, h: 0.54, radius: '14px',
    bgBase: (p) => `linear-gradient(150deg, ${p[0]} 0%, ${p[1]} 46%, ${p[2]} 100%)`,
    grain: 'linear-gradient(180deg, rgba(255,255,255,.22) 0 4px, transparent 4px)',
    crunchType: 'brittle', tone: 1.4,
  },
  honeycomb: {
    w: 1.06, h: 0.54, radius: '16px',
    bgBase: (p) => `linear-gradient(160deg, ${p[0]} 0%, ${p[1]} 46%, ${p[2]} 100%)`,
    grain: 'radial-gradient(circle at 22% 40%, rgba(255,255,255,.30) 0 4px, transparent 5px), radial-gradient(circle at 58% 62%, rgba(0,0,0,.25) 0 5px, transparent 6px)',
    crunchType: 'sticky', tone: 1.5,
  },
};

const TEXTURE_KEYS = Object.keys(TEXTURES);
const PALETTE_KEYS = Object.keys(PALETTES);

const TEXTURE_NAMES = {
  chalk: 'Chalk Block', sand: 'Kinetic Sand Brick', foam: 'Floral Foam Block',
  soap: 'Dry Soap Bar', honeycomb: 'Honeycomb Candy',
};
const TEXTURE_NOTES = {
  chalk: 'classroom grade · dusty', sand: 'oddly satisfying · smooth',
  foam: 'dense · crumbles to dust', soap: 'brittle · sharp snap',
  honeycomb: 'sticky · golden shards',
};

/* ---------- CORE MATERIALS (Quick Relief) ---------- */
const CORE_MATERIALS = [
  { id: 'bathbomb', name: 'Dry Bath Bomb', note: 'lavender · slightly expired', w: 1.0, h: 0.86, radius: '48% 48% 46% 46% / 52% 52% 48% 48%', bg: 'radial-gradient(circle at 32% 26%, #efdff8 0%, #c39edb 42%, #8b63a8 78%, #6a4785 100%)', grain: 'radial-gradient(circle at 68% 62%, rgba(255,255,255,.22) 0 2px, transparent 3px)', shard: ['#e6d2f4', '#b98fd4', '#8b63a8', '#f4e9fb', '#6f4d8c'], tone: 1.0, crunchType: 'brittle' },
  { id: 'chalk', name: 'Chalk Block', note: 'classroom grade · dusty', w: 0.6, h: 1.28, radius: '10px', bg: 'linear-gradient(150deg, #fbf8f0 0%, #ece7d9 45%, #d3ccbb 100%)', grain: 'repeating-linear-gradient(178deg, rgba(0,0,0,.05) 0 3px, transparent 3px 9px)', shard: ['#ffffff', '#f2efe6', '#dcd7c8', '#c4bdab', '#eae5d8'], tone: 1.25, crunchType: 'brittle' },
  { id: 'sand', name: 'Kinetic Sand Brick', note: 'oddly satisfying · terracotta', w: 1.16, h: 0.72, radius: '8px', bg: 'linear-gradient(155deg, #f0c08c 0%, #d9955c 48%, #b26f3c 100%)', grain: 'repeating-linear-gradient(92deg, rgba(255,255,255,.10) 0 2px, rgba(0,0,0,.06) 2px 5px)', shard: ['#f3cfa2', '#dd9f68', '#b97442', '#e8b98a', '#a4612f'], tone: 0.72, crunchType: 'soft' },
  { id: 'honeycomb', name: 'Honeycomb Candy', note: 'dalgona-adjacent · brittle', w: 1.06, h: 0.54, radius: '16px', bg: 'linear-gradient(160deg, #ffd98a 0%, #e8a94a 46%, #c07d24 100%)', grain: 'radial-gradient(circle at 22% 40%, rgba(255,255,255,.30) 0 4px, transparent 5px)', shard: ['#ffe4a8', '#f0bb62', '#cf8f2c', '#a86a1c', '#ffefc9'], tone: 1.5, crunchType: 'sticky' },
  { id: 'sugar', name: 'Sugar Cube Stack', note: 'three cubes · precarious', w: 0.74, h: 1.06, radius: '7px', bg: 'linear-gradient(150deg, #ffffff 0%, #f2eee4 50%, #ddd6c7 100%)', grain: 'repeating-linear-gradient(180deg, rgba(0,0,0,.13) 0 1px, transparent 1px 33.33%)', shard: ['#ffffff', '#f6f2e8', '#e2dbcb', '#cdc5b3', '#faf7ef'], tone: 1.35, crunchType: 'brittle' },
  { id: 'clay', name: 'Terracotta Pot', note: 'already cracked · no regrets', w: 0.96, h: 1.0, radius: '14px 14px 22px 22px', bg: 'linear-gradient(155deg, #e0906a 0%, #c4714a 46%, #96492c 100%)', grain: 'repeating-linear-gradient(88deg, rgba(0,0,0,.08) 0 2px, transparent 2px 8px)', shard: ['#e7a37f', '#c4714a', '#9c5133', '#f0bfa3', '#7d3d24'], tone: 0.9, crunchType: 'brittle' },
  { id: 'foam', name: 'Floral Foam Block', note: 'dense · crumbles to dust', w: 0.92, h: 0.92, radius: '6px', bg: 'linear-gradient(160deg, #a8d8a0 0%, #6aa860 50%, #3a7830 100%)', grain: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,.18) 0 3px, transparent 4px)', shard: ['#c8e8c0', '#88c080', '#508848', '#a8d8a0', '#306028'], tone: 0.85, crunchType: 'dusty' },
  { id: 'soap', name: 'Dry Soap Bar', note: 'brittle · sharp snap', w: 1.08, h: 0.54, radius: '14px', bg: 'linear-gradient(150deg, #f8f0e8 0%, #d8c8b8 46%, #b8a090 100%)', grain: 'linear-gradient(180deg, rgba(255,255,255,.22) 0 4px, transparent 4px)', shard: ['#ffffff', '#f0e8e0', '#d8c8b8', '#c0a898', '#e8e0d8'], tone: 1.4, crunchType: 'brittle' },
];

const randomMaterial = () => {
  const texKey = TEXTURE_KEYS[Math.floor(Math.random() * TEXTURE_KEYS.length)];
  const palKey = PALETTE_KEYS[Math.floor(Math.random() * PALETTE_KEYS.length)];
  const tex = TEXTURES[texKey];
  const pal = PALETTES[palKey];
  return {
    id: `${texKey}-${palKey}`,
    name: `${pal.name} ${TEXTURE_NAMES[texKey]}`,
    note: TEXTURE_NOTES[texKey],
    w: tex.w, h: tex.h, radius: tex.radius,
    bg: tex.bgBase(pal.colors), grain: tex.grain,
    shard: pal.colors, tone: tex.tone, crunchType: tex.crunchType,
  };
};

const RELEASE_LINES = [
  'Tension: released. Exhale properly this time.',
  'Shoulders: officially unclenched.',
  'Jaw: unclenched. You looked extremely fierce.',
  'Cortisol: down. Smugness: measurably up.',
  'The cramps have been notified. They are unimpressed, but quieter.',
  'Pressure valve: emptied. Warmth: incoming.',
  'You are doing great. Keep going.',
  'Every crush is a tiny victory.',
];

const COUNT_LINES = [
  { at: 10, text: 'Ten things destroyed, zero things required of you.' },
  { at: 25, text: 'Quarter hundred. Your thumb is doing all the work. Respect.' },
  { at: 50, text: 'Fifty. This is now a professional demolition career.' },
  { at: 100, text: 'One hundred. Somewhere, a physiotherapist is proud.' },
];

const CHARGE_MS = 1150;
const MAX_SHARDS = 120;
const MAX_DUST = 18;
const MAX_FLOAT = 6;
const GRAVITY = 1750;
const QUICK_DURATION = 5 * 60 * 1000;
const RARE_CHANCE = 0.05;
const WHISPER_MIN = 10;
const WHISPER_MAX = 15;
const RETRACT_MS = 480;
const TIMER_R = 21;
const TIMER_C = 2 * Math.PI * TIMER_R;

const IMPACT_PROFILES = {
  brittle: { slamMs: 210, squashTo: 0.34, squashMs: 90,  holdMs: 80,  overshoot: 16, ease: 'cubic', haptic: [12, 22, 72], hapticMax: [18, 18, 90, 35, 140] },
  soft:    { slamMs: 250, squashTo: 0.42, squashMs: 185, holdMs: 150, overshoot: 10, ease: 'quad',  haptic: [16, 28, 48, 36, 88], hapticMax: [20, 24, 70, 40, 120] },
  dusty:   { slamMs: 230, squashTo: 0.32, squashMs: 155, holdMs: 125, overshoot: 12, ease: 'cubic', haptic: [10, 26, 50, 30, 80], hapticMax: [14, 22, 70, 40, 110] },
  sticky:  { slamMs: 240, squashTo: 0.48, squashMs: 205, holdMs: 165, overshoot: 8,  ease: 'quad',  haptic: [14, 36, 40, 48, 100], hapticMax: [18, 30, 60, 50, 130] },
};

const energyOf = (power) => {
  const p = Math.max(0.12, Math.min(1, power / 100));
  return p * p;
};
const lerp = (a, b, t) => a + (b - a) * t;

/* Per-material crush look. Arrays are [tap, overload]. Energy (p^2) interpolates. */
const IMPACT_LOOK = {
  brittle: {
    slamMs: [240, 138], squashTo: [0.46, 0.24], squashX: [0.10, 0.20], squashMs: [110, 68],
    holdMs: [70, 88], overshoot: [10, 22], anvil: [4, 12],
    shards: [0.85, 1.65], shardSpeed: [0.9, 1.75], shardSize: [0.95, 0.72],
    dust: [0.45, 0.85], lift: [1, 1.15], roundBias: 0.88, kick: 1.2,
    flash: 'rgba(255,244,228,',
  },
  soft: {
    slamMs: [280, 168], squashTo: [0.56, 0.30], squashX: [0.18, 0.42], squashMs: [170, 210],
    holdMs: [120, 175], overshoot: [7, 14], anvil: [3, 9],
    shards: [0.55, 0.95], shardSpeed: [0.55, 0.95], shardSize: [1.05, 1.35],
    dust: [0.5, 1.05], lift: [0.7, 0.85], roundBias: 0.42, kick: 0.85,
    flash: 'rgba(255,186,120,',
  },
  dusty: {
    slamMs: [255, 148], squashTo: [0.44, 0.22], squashX: [0.12, 0.26], squashMs: [130, 150],
    holdMs: [100, 130], overshoot: [8, 16], anvil: [3, 8],
    shards: [0.7, 1.2], shardSpeed: [0.7, 1.15], shardSize: [0.8, 0.62],
    dust: [1.15, 2.15], lift: [0.85, 1.05], roundBias: 0.55, kick: 0.95,
    flash: 'rgba(214,186,152,',
  },
  sticky: {
    slamMs: [270, 175], squashTo: [0.62, 0.40], squashX: [0.22, 0.48], squashMs: [190, 240],
    holdMs: [150, 250], overshoot: [6, 12], anvil: [5, 10],
    shards: [0.45, 0.8], shardSpeed: [0.4, 0.7], shardSize: [1.1, 1.45],
    dust: [0.35, 0.7], lift: [0.45, 0.6], roundBias: 0.28, kick: 0.75,
    flash: 'rgba(255,210,120,',
  },
};

const bakeHit = (type, power, isRare) => {
  const look = IMPACT_LOOK[type] || IMPACT_LOOK.brittle;
  const e = isRare ? Math.max(energyOf(power), 0.92) : energyOf(power);
  const mix = (pair) => lerp(pair[0], pair[1], e);
  return {
    type,
    energy: e,
    slamMs: mix(look.slamMs),
    squashTo: mix(look.squashTo),
    squashX: mix(look.squashX),
    squashMs: mix(look.squashMs),
    holdMs: mix(look.holdMs),
    overshoot: mix(look.overshoot),
    anvil: mix(look.anvil),
    shardMul: mix(look.shards),
    speedMul: mix(look.shardSpeed),
    sizeMul: mix(look.shardSize),
    dustMul: mix(look.dust),
    liftMul: mix(look.lift),
    roundBias: look.roundBias,
    kick: look.kick,
    flash: look.flash,
  };
};

/* Ordered light → max so pickHit can stay inside an intensity band. */
const HIT_VARIANTS = {
  brittle: [
    { click: 1980, thud: 118, crunch: 1040, grains: 4, rate: 0.92, body: 0.22 },
    { click: 2200, thud: 132, crunch: 1210, grains: 5, rate: 1.08, body: 0.26 },
    { click: 2500, thud: 145, crunch: 1380, grains: 7, rate: 1.35, body: 0.30 },
    { click: 2860, thud: 168, crunch: 1620, grains: 9, rate: 1.55, body: 0.34 },
  ],
  soft: [
    { click: 760,  thud: 72,  crunch: 480,  grains: 2, rate: 0.66, body: 0.18 },
    { click: 900,  thud: 88,  crunch: 520,  grains: 3, rate: 0.72, body: 0.22 },
    { click: 1100, thud: 94,  crunch: 640,  grains: 4, rate: 0.84, body: 0.26 },
    { click: 1240, thud: 102, crunch: 700,  grains: 5, rate: 0.90, body: 0.30 },
  ],
  dusty: [
    { click: 1280, thud: 76,  crunch: 640,  grains: 5, rate: 0.88, body: 0.18 },
    { click: 1400, thud: 84,  crunch: 700,  grains: 7, rate: 0.98, body: 0.21 },
    { click: 1600, thud: 100, crunch: 820,  grains: 8, rate: 1.12, body: 0.24 },
    { click: 1850, thud: 110, crunch: 940,  grains: 10, rate: 1.22, body: 0.28 },
  ],
  sticky: [
    { click: 1320, thud: 118, crunch: 690,  grains: 2, rate: 0.70, body: 0.24 },
    { click: 1480, thud: 130, crunch: 760,  grains: 3, rate: 0.76, body: 0.27 },
    { click: 1700, thud: 140, crunch: 880,  grains: 4, rate: 0.84, body: 0.30 },
    { click: 1960, thud: 150, crunch: 1020, grains: 5, rate: 0.92, body: 0.34 },
  ],
};

/* ---------- STORE ---------- */
const useStore = create((set) => ({
  screen: 'select',
  soundOn: true,
  hapticsOn: true,
  setScreen: (screen) => set({ screen }),
  toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
}));

const canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

const HIT_HAPTICS = {
  light: [0, 40, 80],
  firm: [0, 30, 50, 40, 120],
  max: [0, 20, 40, 40, 180, 60, 80],
};

const hitHapticPattern = (energy, isRare) => {
  if (isRare || energy >= 0.72) return HIT_HAPTICS.max;
  if (energy >= 0.22) return HIT_HAPTICS.firm;
  return HIT_HAPTICS.light;
};

const patternMs = (p) => {
  if (typeof p === 'number') return p;
  if (!p || !p.length) return 0;
  return p.reduce((sum, n) => sum + n, 0);
};

const buzz = (pattern, enabled) => {
  if (!enabled || !canVibrate) return false;
  try {
    return navigator.vibrate(pattern) !== false;
  } catch (e) {
    return false;
  }
};

/* ---------- AUDIO ---------- */
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.noiseBuffer = null;
    this.droneOsc = null;
    this.droneGain = null;
    this.scrapeSrc = null;
    this.scrapeGain = null;
    this.scrapeFilter = null;
    this.master = null;
    this.unlocked = false;
    this.muted = false;
    this.lastHit = {};
    this.lastStrike = null;
  }
  live() {
    return this.unlocked && this.ctx && this.master && !this.muted;
  }
  dest() {
    return this.master;
  }
  setMuted(muted) {
    this.muted = muted;
    if (!this.ctx || !this.master) return;
    try {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(muted ? 0.0001 : 1, now, 0.05);
    } catch (e) {}
    if (muted) {
      this.stopDrone();
      this.stopScrape();
    }
  }
  unlock() {
    if (this.unlocked) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0.0001 : 1;
      this.master.connect(this.ctx.destination);
      const len = Math.floor(this.ctx.sampleRate * 0.7);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buf;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.unlocked = true;
    } catch (e) {}
  }
  pickHit(crunchType, energy) {
    const bank = HIT_VARIANTS[crunchType] || HIT_VARIANTS.brittle;
    const bandName = energy >= 0.72 ? 'max' : energy >= 0.22 ? 'firm' : 'light';
    const band = bandName === 'max' ? [2, 3] : bandName === 'firm' ? [1, 2] : [0, 1];
    const key = `${crunchType}:${bandName}`;
    let idx = band[Math.floor(Math.random() * band.length)];
    if (idx === this.lastHit[key] && band.length > 1) idx = idx === band[0] ? band[1] : band[0];
    this.lastHit[key] = idx;
    return { ...bank[idx], band: bandName };
  }
  playStrike(power, tone, crunchType) {
    const e = energyOf(power);
    const v = this.pickHit(crunchType, e);
    const amp = 0.38 + 0.82 * e;
    const clickPeak = (0.07 + 0.12 * e) * amp;
    const bodyPeak = v.body * (0.55 + 0.85 * e);
    const crunchPeak = (0.10 + 0.26 * e) * amp;
    const grainExtra = crunchType === 'brittle' ? 8 : crunchType === 'dusty' ? 7 : crunchType === 'sticky' ? 3 : 4;
    const grains = Math.min(16, v.grains + Math.round(e * grainExtra));
    this.lastStrike = { energy: e, amp, band: v.band, grains, boom: e >= 0.55, type: crunchType };
    if (!this.live() || !this.noiseBuffer) return;
    const t0 = this.ctx.currentTime;

    const click = this.ctx.createBufferSource();
    click.buffer = this.noiseBuffer;
    click.playbackRate.value = 2.2 + e * 0.9 + Math.random() * 0.5;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = v.click;
    const cg = this.ctx.createGain();
    cg.gain.setValueAtTime(0.0001, t0);
    cg.gain.exponentialRampToValueAtTime(clickPeak, t0 + 0.004);
    cg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.022 + e * 0.012);
    click.connect(hp); hp.connect(cg); cg.connect(this.dest());
    click.start(t0); click.stop(t0 + 0.06);

    const osc = this.ctx.createOscillator();
    const og = this.ctx.createGain();
    osc.type = crunchType === 'soft' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(Math.max(48, v.thud - e * 22), t0);
    osc.frequency.exponentialRampToValueAtTime(28, t0 + 0.22 + e * 0.18);
    og.gain.setValueAtTime(0.0001, t0);
    og.gain.exponentialRampToValueAtTime(bodyPeak, t0 + 0.012);
    og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28 + e * 0.22);
    osc.connect(og); og.connect(this.dest());
    osc.start(t0); osc.stop(t0 + 0.55 + e * 0.2);

    if (e >= 0.55) {
      const sub = this.ctx.createOscillator();
      const sg = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(crunchType === 'soft' ? 42 : 52, t0);
      sub.frequency.exponentialRampToValueAtTime(22, t0 + 0.18);
      sg.gain.setValueAtTime(0.0001, t0);
      sg.gain.exponentialRampToValueAtTime((crunchType === 'soft' ? 0.22 : 0.14) * e, t0 + 0.01);
      sg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.26 + e * 0.12);
      sub.connect(sg); sg.connect(this.dest());
      sub.start(t0); sub.stop(t0 + 0.42);
    }

    const punch = this.ctx.createOscillator();
    const pg = this.ctx.createGain();
    punch.type = 'sine';
    const punchHz = 128 + e * 48;
    punch.frequency.setValueAtTime(punchHz, t0);
    punch.frequency.exponentialRampToValueAtTime(Math.max(110, punchHz * 0.78), t0 + 0.07);
    pg.gain.setValueAtTime(0.0001, t0);
    pg.gain.exponentialRampToValueAtTime((0.06 + 0.07 * e) * amp, t0 + 0.006);
    pg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09 + e * 0.03);
    punch.connect(pg); pg.connect(this.dest());
    punch.start(t0); punch.stop(t0 + 0.14);

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = v.rate * (0.8 + tone * 0.16 + e * 0.12);
    const band = this.ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.setValueAtTime(v.crunch + e * 180 * tone, t0);
    band.frequency.exponentialRampToValueAtTime(180, t0 + 0.28 + e * 0.16);
    band.Q.value = crunchType === 'sticky' ? 1.5 : crunchType === 'dusty' ? 0.7 : 0.85;
    const bg = this.ctx.createGain();
    bg.gain.setValueAtTime(0.0001, t0);
    bg.gain.exponentialRampToValueAtTime(crunchPeak, t0 + 0.008);
    bg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.24 + e * 0.22);
    src.connect(band); band.connect(bg); bg.connect(this.dest());
    src.start(t0); src.stop(t0 + 0.8);

    for (let i = 0; i < grains; i++) {
      const gs = this.ctx.createBufferSource();
      gs.buffer = this.noiseBuffer;
      gs.playbackRate.value = 1.3 + Math.random() * (2.0 + e * 1.2);
      const ghp = this.ctx.createBiquadFilter();
      ghp.type = 'highpass'; ghp.frequency.value = 1200 + Math.random() * (2200 + e * 800);
      const gg = this.ctx.createGain();
      const at = t0 + Math.random() * (0.12 + e * 0.12);
      const gPeak = (0.012 + e * 0.028) + Math.random() * 0.03;
      gg.gain.setValueAtTime(0.0001, at);
      gg.gain.exponentialRampToValueAtTime(gPeak, at + 0.004);
      gg.gain.exponentialRampToValueAtTime(0.0001, at + 0.03 + Math.random() * 0.05);
      gs.connect(ghp); ghp.connect(gg); gg.connect(this.dest());
      gs.start(at); gs.stop(at + 0.16);
    }

    this.playSettle(t0 + 0.06, e, crunchType);
  }
  playSettle(at, energy = 0.2, crunchType = 'brittle') {
    if (!this.live() || !this.noiseBuffer) return;
    const e = Math.max(0, Math.min(1, energy));
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = crunchType === 'dusty' ? 0.72 : 0.5;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = crunchType === 'dusty' ? 780 : crunchType === 'sticky' ? 360 : 420;
    const g = this.ctx.createGain();
    const peak = (crunchType === 'dusty' ? 0.03 : 0.018) + e * (crunchType === 'dusty' ? 0.08 : 0.05);
    const dur = 0.16 + e * (crunchType === 'sticky' ? 0.28 : 0.14);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(lp); lp.connect(g); g.connect(this.dest());
    src.start(at); src.stop(at + dur + 0.08);
  }
  playChime() {
    if (!this.live()) return;
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const t0 = this.ctx.currentTime + i * 0.1;
      const osc = this.ctx.createOscillator(); const g = this.ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(f, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.045, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7);
      osc.connect(g); g.connect(this.dest());
      osc.start(t0); osc.stop(t0 + 0.8);
    });
  }
  startDrone() {
    if (!this.live()) return;
    this.stopDrone();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(58, now);
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 280;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.018, now + 0.45);
    osc.connect(lp); lp.connect(g); g.connect(this.dest());
    osc.start(now);
    this.droneOsc = osc; this.droneGain = g;
  }
  stopDrone() {
    if (!this.ctx || !this.droneOsc) return;
    try {
      const now = this.ctx.currentTime;
      if (this.droneGain) { this.droneGain.gain.cancelScheduledValues(now); this.droneGain.gain.setTargetAtTime(0.0001, now, 0.08); }
      this.droneOsc.stop(now + 0.18);
    } catch (e) {}
    this.droneOsc = null; this.droneGain = null;
  }
  bendDrone(pct) {
    if (!this.ctx || !this.droneOsc) return;
    try {
      const now = this.ctx.currentTime;
      this.droneOsc.frequency.setTargetAtTime(58 + pct * 1.8, now, 0.07);
      if (this.droneGain) this.droneGain.gain.setTargetAtTime(0.016 + pct * 0.0007, now, 0.1);
    } catch (e) {}
  }
  startScrape() {
    if (!this.live() || !this.noiseBuffer) return;
    this.stopScrape();
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    src.playbackRate.value = 0.42;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 640;
    bp.Q.value = 1.8;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    src.connect(bp); bp.connect(g); g.connect(this.dest());
    src.start(now);
    this.scrapeSrc = src;
    this.scrapeFilter = bp;
    this.scrapeGain = g;
  }
  stopScrape() {
    if (!this.ctx || !this.scrapeSrc) return;
    try {
      const now = this.ctx.currentTime;
      if (this.scrapeGain) { this.scrapeGain.gain.cancelScheduledValues(now); this.scrapeGain.gain.setTargetAtTime(0.0001, now, 0.06); }
      this.scrapeSrc.stop(now + 0.16);
    } catch (e) {}
    this.scrapeSrc = null;
    this.scrapeGain = null;
    this.scrapeFilter = null;
  }
  bendScrape(pct) {
    if (!this.ctx || !this.scrapeGain) return;
    try {
      const now = this.ctx.currentTime;
      const p = Math.max(0, Math.min(1, pct / 100));
      this.scrapeGain.gain.setTargetAtTime(0.006 + p * p * 0.055, now, 0.08);
      if (this.scrapeFilter) this.scrapeFilter.frequency.setTargetAtTime(520 + p * 420, now, 0.08);
      if (this.scrapeSrc) this.scrapeSrc.playbackRate.setTargetAtTime(0.38 + p * 0.35, now, 0.1);
    } catch (e) {}
  }
}

/* ---------- POOLS ---------- */
const newShard = () => ({ on: false, x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0, size: 4, ratio: 1, round: false, color: '#fff', life: 0, max: 1, settled: false });
const newDust = () => ({ on: false, x: 0, y: 0, vx: 0, vy: 0, r: 20, grow: 0, life: 0, max: 1, sprite: null });
const newFloat = () => ({ on: false, x: 0, y: 0, vy: 0, text: '', color: '#fff', size: 16, weight: 800, life: 0, max: 1 });

/* ---------- MODE SELECT ---------- */
function ModeSelect() {
  const { setScreen, soundOn, toggleSound } = useStore();
  return (
    <div className="mode-select screen-enter">
      <div className="breath-glow" />
      <header className="ms-head">
        <h1 className="ms-title">Relief Valve</h1>
        <p className="ms-sub">choose your session</p>
      </header>
      <div className="ms-cards">
        <button className="ms-card ms-card--quick" onClick={() => setScreen('quick')}>
          <span className="ms-card__icon">⏳</span>
          <h2 className="ms-card__title">Quick Relief</h2>
          <p className="ms-card__desc">5 minutes of pure destruction. A gentle session with a satisfying finish. Pause anytime.</p>
        </button>
        <button className="ms-card ms-card--infinite" onClick={() => setScreen('infinite')}>
          <span className="ms-card__icon">♾️</span>
          <h2 className="ms-card__title">Infinite Zen</h2>
          <p className="ms-card__desc">No timer. No score. No end. Just you and the crunch. Tap ✕ to leave.</p>
        </button>
      </div>
      <footer className="ms-foot">
        <button className="ms-sound-btn" onClick={toggleSound}>
          {soundOn ? '🔊 Sound On' : '🔇 Sound Off'}
        </button>
      </footer>
    </div>
  );
}

/* ---------- GAME STAGE ---------- */
function GameStage({ mode }) {
  const { soundOn, hapticsOn, setScreen, toggleSound } = useStore();
  const soundOnRef = useRef(soundOn);
  const hapticsOnRef = useRef(hapticsOn);
  useEffect(() => { soundOnRef.current = soundOn; }, [soundOn]);
  useEffect(() => { hapticsOnRef.current = hapticsOn; }, [hapticsOn]);

  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const pressRef = useRef(null);
  const objRef = useRef(null);
  const grainRef = useRef(null);
  const canvasRef = useRef(null);
  const flashRef = useRef(null);
  const chipNameRef = useRef(null);
  const chipNoteRef = useRef(null);
  const anvilRef = useRef(null);
  const dustRef = useRef(null);
  const meterFillRef = useRef(null);
  const meterLblRef = useRef(null);
  const crushSubRef = useRef(null);
  const btnRef = useRef(null);
  const cathFillRef = useRef(null);
  const cathPctRef = useRef(null);
  const sCrushedRef = useRef(null);
  const sShardsRef = useRef(null);
  const sBestRef = useRef(null);
  const toastRef = useRef(null);
  const timerRingRef = useRef(null);
  const timerLblRef = useRef(null);
  const rareOverlayRef = useRef(null);
  const completionOverlayRef = useRef(null);
  const pauseOverlayRef = useRef(null);
  const pauseBtnRef = useRef(null);
  const shadowRef = useRef(null);

  const G = useRef({
    matIdx: 0, phase: 'idle', charge: 0, tier: '',
    crushed: 0, shards: 0, best: 0, catharsis: 0, lineIdx: 0,
    geo: null, dpr: 1, ctx: null,
    shardsPool: Array.from({ length: MAX_SHARDS }, newShard),
    dustPool: Array.from({ length: MAX_DUST }, newDust),
    floatPool: Array.from({ length: MAX_FLOAT }, newFloat),
    dustSprites: new Map(),
    loopRaf: 0, chargeRaf: 0, animRaf: 0, lastT: 0, chargeStart: 0, nextTick: 20,
    timers: new Set(),
    audio: new AudioEngine(),
    mode,
    startTime: 0, timerRaf: 0,
    paused: false, pauseStart: 0,
    nextWhisper: WHISPER_MIN + Math.floor(Math.random() * (WHISPER_MAX - WHISPER_MIN)),
    currentMaterial: null, isRare: false,
    inactivityTimer: 0, lastInteraction: 0, completed: false,
    profile: IMPACT_PROFILES.brittle,
    hit: bakeHit('brittle', 26, false),
    slamStart: 0, slamFromY: 0, slamToY: 0,
    squashStart: 0, holdStart: 0, crushPower: 0,
    slamTick: 0, nextHaptic: 24,
    hapticFiredAt: 0, hapticUntil: 0, hapticGen: 0,
    vibeCanaryDone: false, vibeCanaryOk: null,
  }).current;
  const animStepRef = useRef(null);

  useEffect(() => {
    G.audio.setMuted(!soundOn);
  }, [soundOn]);

  const later = useCallback((fn, ms) => {
    const id = window.setTimeout(() => { G.timers.delete(id); fn(); }, ms);
    G.timers.add(id);
    return id;
  }, []);

  const doBuzz = useCallback((p) => {
    if (performance.now() < (G.hapticUntil || 0)) return;
    buzz(p, hapticsOnRef.current);
  }, []);

  const fireHitHaptic = useCallback((energy, isRare) => {
    const now = performance.now();
    if (G.hapticFiredAt && now - G.hapticFiredAt < 160) return;
    const pattern = hitHapticPattern(energy, isRare);
    G.hapticFiredAt = now;
    buzz(pattern, hapticsOnRef.current);
    G.hapticUntil = now + patternMs(pattern);
  }, []);

  const dustSprite = useCallback((color) => {
    if (G.dustSprites.has(color)) return G.dustSprites.get(color);
    const s = document.createElement('canvas');
    s.width = 64; s.height = 64;
    const sc = s.getContext('2d');
    const grad = sc.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, `${color}B0`);
    grad.addColorStop(0.45, `${color}55`);
    grad.addColorStop(1, `${color}00`);
    sc.fillStyle = grad; sc.fillRect(0, 0, 64, 64);
    G.dustSprites.set(color, s);
    return s;
  }, []);

  const sizeCanvas = useCallback(() => {
    const cv = canvasRef.current;
    const g = G.geo;
    if (!cv || !g) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    G.dpr = dpr;
    cv.width = Math.round(g.w * dpr);
    cv.height = Math.round(g.h * dpr);
    cv.style.width = `${g.w}px`;
    cv.style.height = `${g.h}px`;
    const ctx = cv.getContext('2d', { alpha: true });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    G.ctx = ctx;
  }, []);

  const applyMaterial = useCallback((mat, animate) => {
    const g = G.geo;
    const obj = objRef.current;
    if (!obj || !g || !mat) return;
    const unit = Math.min(g.w * 0.44, 152);
    let ow = unit * mat.w;
    let oh = unit * mat.h;
    const maxH = g.h * 0.3;
    if (oh > maxH) { const sc = maxH / oh; oh = maxH; ow *= sc; }
    g.objW = ow; g.objH = oh;
    g.objTop = g.groundY - oh;
    g.hitY = g.objTop;
    g.headW = Math.min(g.w * 0.7, ow + 80);
    g.pressX = g.cx - g.headW / 2;
    g.restY = Math.max(4, g.objTop - g.headH - g.h * 0.34);
    g.impactY = g.objTop - g.headH;

    obj.style.width = `${ow}px`;
    obj.style.height = `${oh}px`;
    obj.style.left = `${g.cx - ow / 2}px`;
    obj.style.top = `${g.objTop}px`;
    obj.style.borderRadius = mat.radius;
    obj.style.background = mat.bg;
    obj.style.opacity = '1';
    obj.style.transform = '';
    obj.style.animation = '';
    if (grainRef.current) grainRef.current.style.background = mat.grain;
    if (chipNameRef.current) chipNameRef.current.textContent = mat.name;
    if (chipNoteRef.current) chipNoteRef.current.textContent = mat.note;

    if (anvilRef.current) {
      const pw = Math.min(g.w * 0.86, ow + 116);
      anvilRef.current.style.width = `${pw}px`;
      anvilRef.current.style.left = `${g.cx - pw / 2}px`;
      anvilRef.current.style.top = `${g.groundY}px`;
      anvilRef.current.style.transform = 'translateY(0)';
    }
    if (shadowRef.current) {
      const sw = Math.min(g.w * 0.78, ow + 90);
      shadowRef.current.style.width = `${sw}px`;
      shadowRef.current.style.left = `${g.cx}px`;
      shadowRef.current.style.top = `${g.groundY - 14}px`;
      shadowRef.current.style.opacity = '0.12';
      shadowRef.current.style.transform = 'translateX(-50%) scaleX(0.52)';
    }
    if (dustRef.current) {
      const dw = Math.min(g.w * 0.8, ow + 96);
      dustRef.current.style.width = `${dw}px`;
      dustRef.current.style.left = `${g.cx - dw / 2}px`;
      dustRef.current.style.top = `${g.groundY - 10}px`;
    }
    if (pressRef.current) {
      pressRef.current.style.width = `${g.headW}px`;
      pressRef.current.style.height = `${g.headH}px`;
      if (G.phase === 'idle' || G.phase === 'charging') {
        pressRef.current.style.transform = `translate3d(${g.pressX}px, ${g.restY}px, 0)`;
      }
    }
    if (animate) {
      obj.classList.remove('is-in');
      void obj.offsetWidth;
      obj.classList.add('is-in');
    }
  }, []);

  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return; /* PATCH: null-guard */
    const r = stage.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return;
    const prev = G.geo;
    if (prev && Math.abs(prev.w - r.width) < 1 && Math.abs(prev.h - r.height) < 1) return;
    G.geo = { w: r.width, h: r.height, cx: r.width / 2, groundY: r.height * 0.76, headH: 56, objW: 0, objH: 0, objTop: 0, hitY: 0, headW: 0, pressX: 0, restY: 0, impactY: 0 };
    sizeCanvas();
    if (G.currentMaterial) applyMaterial(G.currentMaterial, false);
    if (dustRef.current) {
      const dustScale = Math.min(1.6, 0.35 + (G.shards / 900) * 1.25);
      dustRef.current.style.transform = `scaleX(${dustScale})`;
    }
    if (objRef.current && (G.phase === 'idle' || G.phase === 'charging')) {
      objRef.current.classList.remove('is-gone');
    }
    if (pressRef.current && G.geo && (G.phase === 'idle' || G.phase === 'charging')) {
      pressRef.current.style.transition = 'none';
      pressRef.current.style.transform = `translate3d(${G.geo.pressX}px, ${G.geo.restY}px, 0)`;
    }
  }, [sizeCanvas, applyMaterial]);

  const stopLoop = useCallback(() => {
    if (G.loopRaf) { window.cancelAnimationFrame(G.loopRaf); G.loopRaf = 0; }
  }, []);

  const loop = useCallback((t) => {
    const ctx = G.ctx;
    const g = G.geo;
    if (!ctx || !g) { G.loopRaf = 0; return; }
    const dt = Math.min(0.048, (t - G.lastT) / 1000 || 0.016);
    G.lastT = t;
    ctx.clearRect(0, 0, g.w, g.h);
    let busy = false;

    for (let i = 0; i < MAX_DUST; i++) {
      const d = G.dustPool[i];
      if (!d.on) continue;
      busy = true;
      d.life -= dt;
      if (d.life <= 0) { d.on = false; continue; }
      d.x += d.vx * dt; d.y += d.vy * dt; d.r += d.grow * dt; d.vy -= 26 * dt;
      const p = d.life / d.max;
      ctx.globalAlpha = Math.max(0, p * 0.5);
      if (d.sprite) ctx.drawImage(d.sprite, d.x - d.r, d.y - d.r, d.r * 2, d.r * 2);
    }

    const floor = g.groundY - 3;
    for (let i = 0; i < MAX_SHARDS; i++) {
      const s = G.shardsPool[i];
      if (!s.on) continue;
      busy = true;
      s.life -= dt;
      if (s.life <= 0) { s.on = false; continue; }
      if (!s.settled) {
        s.vy += GRAVITY * dt; s.vx *= 0.992;
        s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.vr * dt;
        if (s.y >= floor) {
          s.y = floor;
          if (Math.abs(s.vy) < 90) { s.settled = true; s.vy = 0; s.vx = 0; s.life = Math.min(s.life, 0.42); }
          else { s.vy *= -0.34; s.vx *= 0.66; s.vr *= 0.5; }
        }
      } else { s.life -= dt * 1.4; }
      const a = Math.max(0, Math.min(1, s.life / (s.max * 0.55)));
      ctx.globalAlpha = a;
      ctx.fillStyle = s.color;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      if (s.round) { ctx.beginPath(); ctx.arc(0, 0, s.size * 0.55, 0, 6.2832); ctx.fill(); }
      else { ctx.fillRect(-s.size * 0.5, -s.size * 0.5 * s.ratio, s.size, s.size * s.ratio); }
      ctx.restore();
    }

    ctx.textAlign = 'center';
    for (let i = 0; i < MAX_FLOAT; i++) {
      const f = G.floatPool[i];
      if (!f.on) continue;
      busy = true;
      f.life -= dt;
      if (f.life <= 0) { f.on = false; continue; }
      f.y += f.vy * dt; f.vy *= 0.965;
      const p = f.life / f.max;
      ctx.globalAlpha = p > 0.75 ? (1 - p) * 4 : Math.min(1, p * 1.6);
      ctx.font = `${f.weight} ${f.size}px Nunito, system-ui, sans-serif`;
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }

    ctx.globalAlpha = 1;
    if (busy) G.loopRaf = window.requestAnimationFrame(loop);
    else { G.loopRaf = 0; ctx.clearRect(0, 0, g.w, g.h); }
  }, []);

  const ensureLoop = useCallback(() => {
    if (!G.loopRaf) { G.lastT = performance.now(); G.loopRaf = window.requestAnimationFrame(loop); }
  }, [loop]);

  const spawnBurst = useCallback((power, mat, isRare) => {
    const g = G.geo;
    if (!g || !mat) return;
    const hit = G.hit || bakeHit(mat.crunchType, power, isRare);
    const count = isRare ? 100 : Math.min(MAX_SHARDS, Math.round((18 + power * 0.42) * hit.shardMul));
    let placed = 0;
    for (let i = 0; i < MAX_SHARDS && placed < count; i++) {
      const s = G.shardsPool[i];
      if (s.on) continue;
      s.on = true; s.settled = false;
      s.x = g.cx + (Math.random() - 0.5) * g.objW * 0.92;
      s.y = g.objTop + Math.random() * 6;
      s.vx = (Math.random() - 0.5) * (220 + power * 2.4) * hit.speedMul;
      s.vy = (-28 - Math.random() * (70 + power * 0.6)) * hit.liftMul;
      s.rot = Math.random() * 6.28;
      s.vr = (Math.random() - 0.5) * (10 + hit.speedMul * 8);
      s.size = (3 + Math.random() * (6 + power * 0.045)) * hit.sizeMul;
      s.ratio = hit.type === 'brittle' ? 0.35 + Math.random() * 0.7 : 0.55 + Math.random() * 0.9;
      s.round = Math.random() > hit.roundBias;
      s.color = mat.shard[Math.floor(Math.random() * mat.shard.length)];
      s.max = (hit.type === 'dusty' ? 1.15 : 0.95) + Math.random() * (hit.type === 'sticky' ? 1.1 : 0.8);
      s.life = s.max;
      placed++;
    }
    const puffCount = Math.min(MAX_DUST, Math.round((3 + power / 28) * hit.dustMul));
    let puffs = 0;
    const sprite = dustSprite(mat.shard[mat.shard.length - 1]);
    for (let i = 0; i < MAX_DUST && puffs < puffCount; i++) {
      const d = G.dustPool[i];
      if (d.on) continue;
      d.on = true;
      d.x = g.cx + (Math.random() - 0.5) * g.objW * (hit.type === 'dusty' ? 1.45 : 1.15);
      d.y = g.objTop + (Math.random() - 0.5) * 10;
      d.vx = (Math.random() - 0.5) * (hit.type === 'dusty' ? 110 : 78);
      d.vy = -12 - Math.random() * (hit.type === 'dusty' ? 38 : 26);
      d.r = (22 + Math.random() * 34) * (hit.type === 'dusty' ? 1.25 : 1);
      d.grow = (34 + Math.random() * 46) * hit.dustMul;
      d.max = 1.05 + Math.random() * (hit.type === 'dusty' ? 0.9 : 0.6);
      d.life = d.max;
      d.sprite = sprite;
      puffs++;
    }
    if (dustRef.current) {
      const dustScale = Math.min(1.85, 0.35 + (G.shards / 900) * 1.25) * (0.72 + hit.dustMul * 0.28);
      dustRef.current.style.transform = `scaleX(${dustScale})`;
    }
    ensureLoop();
  }, [dustSprite, ensureLoop]);

  const spawnFloat = useCallback((text, size, color, weight) => {
    const g = G.geo;
    if (!g) return;
    for (let i = 0; i < MAX_FLOAT; i++) {
      const f = G.floatPool[i];
      if (f.on) continue;
      f.on = true;
      f.x = g.cx + (Math.random() - 0.5) * 34;
      f.y = g.objTop - 28;
      f.vy = -52;
      f.text = text; f.size = size; f.color = color; f.weight = weight || 800;
      f.max = 1.15; f.life = 1.15;
      break;
    }
    ensureLoop();
  }, [ensureLoop]);

  const retrigger = useCallback((el, cls) => {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }, []);

  let toastTimer = 0;
  const showToast = useCallback((text) => {
    const el = toastRef.current;
    if (!el) return;
    el.textContent = text;
    el.classList.remove('is-on');
    void el.offsetWidth;
    el.classList.add('is-on');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => el.classList.remove('is-on'), 2900);
  }, []);

  const setPressY = useCallback((y, animate) => {
    const press = pressRef.current;
    const g = G.geo;
    if (!press || !g) return;
    press.style.transition = animate
      ? `transform ${RETRACT_MS}ms cubic-bezier(.22,.9,.36,1)`
      : 'none';
    press.style.transform = `translate3d(${g.pressX}px, ${y}px, 0)`;
  }, []);

  const paintCloseness = useCallback((p) => {
    const el = shadowRef.current;
    const g = G.geo;
    if (!el || !g) return;
    const u = Math.max(0, Math.min(1, p));
    el.style.opacity = String(0.12 + u * 0.55);
    el.style.transform = `translateX(-50%) scaleX(${0.52 + u * 0.62})`;
  }, []);

  const kickStage = useCallback((hit, isRare) => {
    const e = isRare ? 1 : (hit?.energy ?? 0.2);
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stage = stageRef.current;
    const stageW = (stage && stage.clientWidth) || G.geo?.w || 360;
    const noVibe = !canVibrate || G.vibeCanaryOk === false;
    const boost = noVibe ? 1.35 : 1;
    let amp = (0.018 + e * 0.05) * stageW * boost;
    if (isRare) amp *= 1.18;
    amp = Math.min(42, amp);
    const ms = 240 + e * 200;
    const peak = (0.18 + e * 0.62) * boost;
    const flash = flashRef.current;
    if (flash && !reduce) {
      const tint = hit?.flash || 'rgba(255,214,150,';
      flash.style.setProperty('--flash-peak', String(peak));
      flash.style.setProperty('--flash-ms', `${100 + e * 130}ms`);
      flash.style.background = `radial-gradient(52% 42% at 50% 58%, ${tint}${0.32 + e * 0.42}), ${tint}0) 72%)`;
      retrigger(flash, 'is-flash');
    }
    if (stage && !reduce) {
      stage.style.setProperty('--kick-x', `${amp.toFixed(1)}px`);
      stage.style.setProperty('--kick-y', `${(amp * 0.72).toFixed(1)}px`);
      stage.style.setProperty('--kick-ms', `${ms}ms`);
      retrigger(stage, 'is-shake');
    }
    paintCloseness(0.72 + e * 0.28);
  }, [retrigger, paintCloseness]);

  const stopAnim = useCallback(() => {
    if (G.animRaf) { window.cancelAnimationFrame(G.animRaf); G.animRaf = 0; }
  }, []);

  const setPhase = useCallback((next) => {
    G.phase = next;
    const btn = btnRef.current;
    const obj = objRef.current;
    const g = G.geo;
    if (!g) return;
    if (next === 'slam') {
      if (btn) btn.classList.add('is-busy');
      if (crushSubRef.current) crushSubRef.current.textContent = 'press in progress';
      if (obj) {
        obj.classList.remove('is-in', 'is-squash', 'is-gone');
        obj.style.animation = 'none';
        obj.style.transition = 'none';
        obj.style.transformOrigin = 'center bottom';
        obj.style.transform = 'scale(1, 1)';
        obj.style.opacity = '1';
      }
    } else if (next === 'reload') {
      if (obj) {
        obj.style.transition = 'opacity .18s ease';
        obj.style.opacity = '0';
        obj.classList.add('is-gone');
      }
      setPressY(g.restY, true);
      paintCloseness(0);
    } else if (next === 'idle') {
      if (btn) btn.classList.remove('is-busy');
      if (crushSubRef.current) crushSubRef.current.textContent = mode === 'quick' ? 'tap quick · hold to overload' : 'hold to overload';
      if (obj) {
        obj.classList.remove('is-squash', 'is-gone');
        obj.style.animation = '';
        obj.style.transition = 'none';
        obj.style.transform = '';
        obj.style.opacity = '1';
      }
    }
  }, [mode, setPressY, paintCloseness]);

  const paintCharge = useCallback((pct) => {
    if (!meterFillRef.current || !meterLblRef.current) return;
    meterFillRef.current.style.transform = `scaleX(${pct / 100})`;
    const tier = pct >= 95 ? 'maximum pressure' : pct >= 55 ? 'deep press' : pct >= 18 ? 'firm press' : 'pressure';
    if (tier !== G.tier) {
      G.tier = tier;
      meterLblRef.current.textContent = tier;
      meterFillRef.current.classList.toggle('is-max', pct >= 95);
    }
  }, []);

  const stopChargeLoop = useCallback(() => {
    if (G.chargeRaf) { window.cancelAnimationFrame(G.chargeRaf); G.chargeRaf = 0; }
  }, []);

  const fireCrushRef = useRef(null);

  const chargeStep = useCallback((t) => {
    const elapsed = t - G.chargeStart;
    const pct = Math.min(100, (elapsed / CHARGE_MS) * 100);
    G.charge = pct;
    paintCharge(pct);
    G.audio.bendDrone(pct);
    G.audio.bendScrape(pct);
    paintCloseness(pct / 280);
    if (pct >= 100) {
      G.chargeRaf = 0;
      G.audio.stopDrone();
      fireCrushRef.current?.(100);
      return;
    }
    G.chargeRaf = window.requestAnimationFrame(chargeStep);
  }, [paintCharge, paintCloseness]);

  const squashCrushBtn = useCallback(() => {
    retrigger(btnRef.current, 'is-hit');
  }, [retrigger]);

  const applyImpactFeedback = useCallback((power, mat, shardTotal) => {
    const hit = G.hit || bakeHit(mat.crunchType, power, G.isRare);
    fireHitHaptic(hit.energy ?? energyOf(power), G.isRare);
    squashCrushBtn();
    kickStage(hit, G.isRare);
    spawnBurst(power, mat, G.isRare);

    G.audio.stopScrape();
    G.audio.playStrike(power, mat.tone, mat.crunchType);
    if (anvilRef.current) {
      const dip = hit.anvil;
      anvilRef.current.style.transition = 'transform .08s ease-out';
      anvilRef.current.style.transform = `translateY(${dip}px)`;
      later(() => {
        if (!anvilRef.current) return;
        anvilRef.current.style.transition = 'transform .28s cubic-bezier(.22,.9,.36,1)';
        anvilRef.current.style.transform = 'translateY(0)';
      }, 90);
    }

    if (G.isRare) {
      G.audio.playChime();
      spawnFloat('RARE CRUSH', 22, '#fff0d2', 900);
      retrigger(rareOverlayRef.current, 'is-on');
    } else {
      if (power >= 95) spawnFloat('MAX PRESSURE', 22, '#fff0d2', 900);
      else spawnFloat(`+${shardTotal} shards`, power >= 60 ? 18 : 14, power >= 60 ? '#ffdca6' : '#f0d3ab', power >= 60 ? 900 : 800);
    }

    G.crushed++;
    G.shards += shardTotal;
    if (power > G.best) G.best = Math.round(power);
    if (sCrushedRef.current) sCrushedRef.current.textContent = String(G.crushed);
    if (sShardsRef.current) sShardsRef.current.textContent = String(G.shards);
    if (sBestRef.current) sBestRef.current.textContent = `${G.best}%`;

    if (mode === 'infinite') {
      if (G.crushed >= G.nextWhisper) {
        const line = RELEASE_LINES[G.lineIdx % RELEASE_LINES.length];
        spawnFloat(line, 14, '#fdeedb', 700);
        G.lineIdx++;
        G.nextWhisper = G.crushed + WHISPER_MIN + Math.floor(Math.random() * (WHISPER_MAX - WHISPER_MIN));
      }
    } else {
      G.catharsis += 7 + power * 0.14;
      if (G.catharsis >= 100) {
        G.catharsis = 0;
        later(() => {
          G.audio.playChime();
          doBuzz([14, 70, 14, 70, 150]);
          showToast(RELEASE_LINES[G.lineIdx % RELEASE_LINES.length]);
          G.lineIdx++;
        }, 420);
      }
      if (cathFillRef.current) cathFillRef.current.style.transform = `scaleX(${Math.min(1, G.catharsis / 100)})`;
      if (cathPctRef.current) cathPctRef.current.textContent = `${Math.round(G.catharsis)}%`;
      const milestone = COUNT_LINES.find((line) => line.at === G.crushed);
      if (milestone) later(() => { showToast(milestone.text); G.audio.playChime(); }, 640);
    }
  }, [spawnBurst, spawnFloat, retrigger, kickStage, fireHitHaptic, squashCrushBtn, doBuzz, later, mode, showToast]);

  const loadNextMaterial = useCallback(() => {
    setPhase('idle');
    if (mode === 'infinite') {
      G.isRare = Math.random() < RARE_CHANCE;
      G.currentMaterial = randomMaterial();
      applyMaterial(G.currentMaterial, true);
    } else {
      G.matIdx = (G.matIdx + 1) % CORE_MATERIALS.length;
      G.currentMaterial = CORE_MATERIALS[G.matIdx];
      applyMaterial(G.currentMaterial, true);
    }
    doBuzz([5]);
  }, [mode, applyMaterial, setPhase, doBuzz]);

  animStepRef.current = (now) => {
    const g = G.geo;
    const obj = objRef.current;
    const profile = G.profile;
    if (!g || !profile) { G.animRaf = 0; return; }

    if (G.phase === 'slamming') {
      const hit = G.hit || profile;
      const slamMs = hit.slamMs || profile.slamMs;
      const u = Math.min(1, (now - G.slamStart) / slamMs);
      const e = profile.ease === 'quad' ? u * u : u * u * u;
      setPressY(G.slamFromY + (G.slamToY - G.slamFromY) * e, false);
      paintCloseness(0.22 + e * 0.78);
      G.audio.bendScrape(30 + (hit.energy ?? 0.2) * 35 + e * 45);
      if (u >= 1) {
        const mat = G.currentMaterial;
        const power = G.crushPower;
        const shardTotal = Math.round(9 + power * 0.42 + Math.random() * 8);
        applyImpactFeedback(power, mat, shardTotal);
        G.phase = 'squashing';
        G.squashStart = now;
        G.animRaf = window.requestAnimationFrame((t) => animStepRef.current?.(t));
        return;
      }
      G.animRaf = window.requestAnimationFrame((t) => animStepRef.current?.(t));
      return;
    }

    if (G.phase === 'squashing') {
      const hit = G.hit || G.profile;
      const u = Math.min(1, (now - G.squashStart) / hit.squashMs);
      const e = 1 - (1 - u) * (1 - u);
      const scaleY = 1 + (hit.squashTo - 1) * e;
      const scaleX = 1 + (hit.squashX ?? 0.14) * e;
      if (obj) {
        obj.style.animation = 'none';
        obj.style.transformOrigin = 'center bottom';
        obj.style.transform = `scale(${scaleX}, ${scaleY})`;
        obj.style.opacity = '1';
      }
      const visualTop = g.objTop + g.objH * (1 - scaleY);
      setPressY(visualTop - g.headH + hit.overshoot * e, false);
      paintCloseness(1);
      if (u >= 1) {
        G.phase = 'holding';
        G.holdStart = now;
        G.animRaf = window.requestAnimationFrame((t) => animStepRef.current?.(t));
        return;
      }
      G.animRaf = window.requestAnimationFrame((t) => animStepRef.current?.(t));
      return;
    }

    if (G.phase === 'holding') {
      const hit = G.hit || G.profile;
      if (now - G.holdStart >= hit.holdMs) {
        G.animRaf = 0;
        setPhase('reload');
        later(loadNextMaterial, RETRACT_MS + 40);
        return;
      }
      G.animRaf = window.requestAnimationFrame((t) => animStepRef.current?.(t));
      return;
    }

    G.animRaf = 0;
  };

  const fireCrush = useCallback((power) => {
    const g = G.geo;
    if (!g || G.paused) return;
    if (G.phase !== 'idle' && G.phase !== 'charging') return;
    const mat = G.currentMaterial;
    if (!mat) return;

    stopAnim();
    G.profile = IMPACT_PROFILES[mat.crunchType] || IMPACT_PROFILES.brittle;
    G.hit = bakeHit(mat.crunchType, power, G.isRare);
    G.crushPower = power;
    G.charge = 0;
    paintCharge(0);
    G.tier = '';
    if (meterLblRef.current) meterLblRef.current.textContent = 'pressure';
    if (meterFillRef.current) meterFillRef.current.classList.remove('is-max');
    G.nextTick = 20;

    setPhase('slam');
    G.phase = 'slamming';
    G.slamFromY = g.restY;
    G.slamToY = g.objTop - g.headH;
    G.slamStart = performance.now();
    G.slamTick = 0;
    G.hapticFiredAt = 0;
    G.hapticGen = (G.hapticGen || 0) + 1;
    const hapticGen = G.hapticGen;
    const hapticEnergy = G.hit.energy;
    const hapticRare = G.isRare;
    later(() => {
      if (hapticGen !== G.hapticGen) return;
      fireHitHaptic(hapticEnergy, hapticRare);
    }, G.hit.slamMs);
    setPressY(g.restY, false);
    if (!G.audio.scrapeSrc) G.audio.startScrape();
    G.audio.bendScrape(35 + G.hit.energy * 50);
    G.animRaf = window.requestAnimationFrame((t) => animStepRef.current?.(t));
  }, [paintCharge, setPhase, setPressY, stopAnim, later, fireHitHaptic]);

  fireCrushRef.current = fireCrush;

  const completeSession = useCallback(() => {
    G.audio.playChime();
    doBuzz([10, 50, 10, 50, 150]);
    if (completionOverlayRef.current) completionOverlayRef.current.classList.add('is-on');
  }, [doBuzz]);

  const updateTimer = useCallback((t) => {
    if (mode !== 'quick' || G.completed || G.paused) return; /* PATCH: pause guard */
    const elapsed = t - G.startTime;
    const remaining = Math.max(0, QUICK_DURATION - elapsed);
    const pct = remaining / QUICK_DURATION;

    if (timerRingRef.current) {
      timerRingRef.current.style.strokeDashoffset = TIMER_C * (1 - pct);
      timerRingRef.current.style.stroke = pct > 0.66 ? '#f0c088' : pct > 0.33 ? '#d88898' : '#9878b0';
    }
    if (timerLblRef.current) {
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      timerLblRef.current.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
      timerLblRef.current.classList.toggle('is-pulse', remaining < 30000 && remaining > 0);
    }

    if (remaining <= 0 && !G.completed) {
      G.completed = true;
      completeSession();
    } else {
      G.timerRaf = window.requestAnimationFrame(updateTimer);
    }
  }, [mode, completeSession]);

  /* PATCH: pause / resume */
  const togglePause = useCallback(() => {
    if (mode !== 'quick' || G.completed) return;
    if (!G.paused) {
      if (G.phase === 'charging') {
        stopChargeLoop();
        G.audio.stopDrone();
        G.audio.stopScrape();
        paintCloseness(0);
        G.phase = 'idle';
        if (btnRef.current) btnRef.current.classList.remove('is-busy');
        if (crushSubRef.current) crushSubRef.current.textContent = 'tap quick · hold to overload';
        G.charge = 0;
        G.tier = '';
        paintCharge(0);
      }
      G.paused = true;
      G.pauseStart = performance.now();
      if (G.timerRaf) { window.cancelAnimationFrame(G.timerRaf); G.timerRaf = 0; }
      if (pauseBtnRef.current) pauseBtnRef.current.textContent = '▶';
      if (pauseOverlayRef.current) pauseOverlayRef.current.classList.add('is-on');
      doBuzz([12]);
    } else {
      G.paused = false;
      G.startTime += performance.now() - G.pauseStart;
      if (pauseBtnRef.current) pauseBtnRef.current.textContent = '⏸';
      if (pauseOverlayRef.current) pauseOverlayRef.current.classList.remove('is-on');
      G.lastInteraction = performance.now();
      G.timerRaf = window.requestAnimationFrame(updateTimer);
      doBuzz([12]);
    }
  }, [mode, stopChargeLoop, paintCharge, doBuzz, updateTimer]);

  /* PATCH: shared exit for both modes */
  const handleExit = useCallback(() => {
    stopChargeLoop();
    stopLoop();
    stopAnim();
    G.audio.stopDrone();
    G.audio.stopScrape();
    if (G.timerRaf) { window.cancelAnimationFrame(G.timerRaf); G.timerRaf = 0; }
    G.timers.forEach((id) => window.clearTimeout(id));
    G.timers.clear();
    setScreen('select');
  }, [stopChargeLoop, stopLoop, stopAnim, setScreen]);

  const beginCharge = useCallback((e) => {
    if (G.phase !== 'idle' || !G.geo || G.paused) return; /* PATCH: pause guard */
    e.preventDefault();
    G.audio.unlock();
    G.audio.setMuted(!soundOnRef.current);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    G.phase = 'charging';
    if (btnRef.current) btnRef.current.classList.add('is-busy');
    if (crushSubRef.current) crushSubRef.current.textContent = 'building pressure…';
    if (canVibrate && !G.vibeCanaryDone) {
      G.vibeCanaryDone = true;
      try {
        G.vibeCanaryOk = navigator.vibrate(1) !== false;
      } catch (err) {
        G.vibeCanaryOk = false;
      }
    }
    G.audio.startDrone();
    G.audio.startScrape();
    G.chargeStart = performance.now();
    G.nextTick = 20;
    G.nextHaptic = 24;
    stopChargeLoop();
    G.chargeRaf = window.requestAnimationFrame(chargeStep);
    G.lastInteraction = performance.now();
  }, [chargeStep, stopChargeLoop]);

  const releaseCharge = useCallback((e) => {
    if (G.phase !== 'charging') return;
    if (e && e.preventDefault) e.preventDefault();
    stopChargeLoop();
    G.audio.stopDrone();
    const pct = G.charge;
    fireCrush(pct < 12 ? 26 : pct);
    G.lastInteraction = performance.now();
  }, [fireCrush, stopChargeLoop]);

  useEffect(() => {
    if (mode !== 'infinite') return undefined;
    const checkInactivity = () => {
      const btn = btnRef.current;
      if (!btn) return;
      const elapsed = performance.now() - G.lastInteraction;
      btn.style.opacity = elapsed > 10000 ? '0.3' : '1';
      G.inactivityTimer = window.setTimeout(checkInactivity, 500);
    };
    G.inactivityTimer = window.setTimeout(checkInactivity, 500);
    return () => { if (G.inactivityTimer) window.clearTimeout(G.inactivityTimer); };
  }, [mode]);

  useEffect(() => {
    const stage = stageRef.current;
    G.startTime = performance.now();
    G.lastInteraction = performance.now();
    G.paused = false;
    G.completed = false;

    if (mode === 'infinite') { G.isRare = false; G.currentMaterial = randomMaterial(); }
    else { G.matIdx = 0; G.currentMaterial = CORE_MATERIALS[0]; }

    measure();
    applyMaterial(G.currentMaterial, false);

    if (mode === 'quick') G.timerRaf = window.requestAnimationFrame(updateTimer);
    G.audio.setMuted(!soundOnRef.current);
    if (mode === 'infinite') G.audio.startDrone();

    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    let observer = null;
    if (typeof ResizeObserver !== 'undefined' && stage) {
      observer = new ResizeObserver(() => measure());
      observer.observe(stage);
    }

    const warm = window.setTimeout(measure, 90);
    const settle = window.setTimeout(measure, 420);
    /* PATCH: null-guard quick-only catharsis bar */
    if (cathFillRef.current) cathFillRef.current.style.transform = 'scaleX(0)';
    paintCharge(0);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      if (observer) observer.disconnect();
      stopChargeLoop();
      stopLoop();
      stopAnim();
      G.audio.stopDrone();
      G.audio.stopScrape();
      if (G.timerRaf) window.cancelAnimationFrame(G.timerRaf);
      G.timerRaf = 0;
      window.clearTimeout(warm);
      window.clearTimeout(settle);
      window.clearTimeout(toastTimer);
      if (G.inactivityTimer) window.clearTimeout(G.inactivityTimer);
      G.timers.forEach((id) => window.clearTimeout(id));
      G.timers.clear();
    };
  }, [mode, measure, applyMaterial, updateTimer, stopChargeLoop, stopLoop, stopAnim, paintCharge]);

  return (
    <div className="game-root screen-enter" ref={rootRef} onPointerDown={() => { G.audio.unlock(); G.audio.setMuted(!soundOnRef.current); }}>
      <div className="breath-glow" />

      <header className="game-head">
        <div className="game-head__text">
          <h1 className="game-title">Relief Valve</h1>
          <p className="game-sub">
            {mode === 'quick' ? '5 minutes · one thumb · zero consequences' : 'no timer · no score · just you and the crunch'}
          </p>
        </div>
        <div className="game-head__actions">
          {mode === 'quick' && (
            <div className="game-timer" aria-label="session timer">
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r={TIMER_R} fill="none" stroke="rgba(255,225,190,0.12)" strokeWidth="3.5" />
                <circle ref={timerRingRef} cx="26" cy="26" r={TIMER_R} fill="none" stroke="#f0c088" strokeWidth="3.5" strokeDasharray={TIMER_C} strokeDashoffset="0" strokeLinecap="round" transform="rotate(-90 26 26)" style={{ transition: 'stroke 0.5s ease' }} />
              </svg>
              <span className="game-timer__lbl" ref={timerLblRef}>5:00</span>
            </div>
          )}
          {mode === 'quick' && (
            <button type="button" className="game-exit" ref={pauseBtnRef} onClick={togglePause} aria-label="Pause or resume">⏸</button>
          )}
          <button type="button" className="game-exit" onClick={toggleSound} aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}>{soundOn ? '🔊' : '🔇'}</button>
          <button type="button" className="game-exit" onClick={handleExit} aria-label="Exit to menu">✕</button>
        </div>
      </header>

      {mode === 'quick' && (
        <div className="game-stats">
          <div className="game-stat"><span className="game-stat__v" ref={sCrushedRef}>0</span><span className="game-stat__k">crushed</span></div>
          <div className="game-stat"><span className="game-stat__v" ref={sShardsRef}>0</span><span className="game-stat__k">shards</span></div>
          <div className="game-stat"><span className="game-stat__v" ref={sBestRef}>0%</span><span className="game-stat__k">best press</span></div>
        </div>
      )}

      {mode === 'quick' && (
        <div className="game-cath">
          <div className="game-cath__row"><span>catharsis</span><span ref={cathPctRef}>0%</span></div>
          <div className="game-track"><div className="game-bar" ref={cathFillRef} /></div>
        </div>
      )}

      <div className="game-stage" ref={stageRef}>
        <div className="game-glow" />
        <div className="game-press-shadow" ref={shadowRef} />
        <div className="game-dust" ref={dustRef} />
        <div className="game-anvil" ref={anvilRef} />
        <div className="game-press" ref={pressRef}>
          <div className="game-rod" />
          <span className="game-bolt" style={{ left: 12 }} />
          <span className="game-bolt" style={{ right: 12 }} />
        </div>
        <div className="game-obj is-in" ref={objRef}>
          <span className="game-obj__grain" ref={grainRef} />
        </div>
        <canvas className="game-fx" ref={canvasRef} />
        <div className="game-flash" ref={flashRef} />
        <div className="game-rare-overlay" ref={rareOverlayRef} />
        <div className="game-chip">
          <span className="game-chip__n" ref={chipNameRef}>-</span>
          <span className="game-chip__d" ref={chipNoteRef}>-</span>
        </div>
      </div>

      <div className="game-deck">
        <div className="game-meter">
          <div className="game-meter__fill" ref={meterFillRef} />
          <span className="game-meter__lbl" ref={meterLblRef}>pressure</span>
        </div>
        <button
          type="button"
          className="game-crush"
          ref={btnRef}
          onPointerDown={beginCharge}
          onPointerUp={releaseCharge}
          onPointerCancel={releaseCharge}
          onContextMenu={(e) => e.preventDefault()}
        >
          <span className="game-crush__t">CRUSH</span>
          <span className="game-crush__s" ref={crushSubRef}>
            {mode === 'quick' ? 'tap quick · hold to overload' : 'hold to overload'}
          </span>
        </button>
      </div>

      <div className="game-toast" ref={toastRef} />

      {mode === 'quick' && (
        <div className="game-pause-overlay" ref={pauseOverlayRef} onClick={togglePause}>
          <div className="game-pause-overlay__t">⏸ paused</div>
          <div className="game-pause-overlay__s">breathe. the timer is waiting for you.<br />tap anywhere to resume.</div>
        </div>
      )}

      {mode === 'quick' && (
        <div className="completion-overlay" ref={completionOverlayRef}>
          <div className="completion-content">
            <div className="completion-mark">✨</div>
            <h2 className="completion-title">Session complete</h2>
            <p className="completion-body">Shoulders: unclenched. Jaw: released. You did great.</p>
            <div className="completion-stats">
              <div className="completion-stat"><span className="completion-stat__v">{G.crushed}</span><span className="completion-stat__k">objects crushed</span></div>
              <div className="completion-stat"><span className="completion-stat__v">{G.shards}</span><span className="completion-stat__k">shards released</span></div>
            </div>
            <button className="completion-cta" onClick={() => setScreen('select')}>Return to calm</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- APP ---------- */
export default function App() {
  const { screen } = useStore();
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap');

        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; margin: 0; padding: 0; }
        body { font-family: 'Nunito', system-ui, -apple-system, sans-serif; overflow: hidden; touch-action: manipulation; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }

        .screen-enter { animation: screenFadeIn .4s ease both; }
        @keyframes screenFadeIn { from { opacity: 0; } to { opacity: 1; } }

        .mode-select { position: relative; width: 100vw; height: 100vh; height: 100dvh; overflow: hidden; display: flex; flex-direction: column; color: #f6e7d6;
          background: radial-gradient(70% 45% at 50% 22%, rgba(122,74,36,.30) 0%, rgba(122,74,36,0) 70%), radial-gradient(90% 60% at 50% 100%, rgba(64,40,30,.55) 0%, rgba(64,40,30,0) 75%), #1A1614; }
        .breath-glow { position: absolute; inset: 0; pointer-events: none; z-index: 1; background: radial-gradient(60% 50% at 50% 40%, rgba(255,180,100,.08) 0%, transparent 70%); animation: breathe 19s ease-in-out infinite; mix-blend-mode: soft-light; }
        @keyframes breathe { 0%,100% { opacity:.4; transform:scale(1);} 21% { opacity:.7; transform:scale(1.05);} 58% { opacity:.7; transform:scale(1.05);} }

        .ms-head { position: relative; z-index: 10; padding: 60px 24px 40px; text-align: center; }
        .ms-title { font-size: 28px; font-weight: 900; color: #fbeadb; text-shadow: 0 0 10px rgba(255,180,100,.15); margin-bottom: 8px; }
        .ms-sub { font-size: 14px; font-weight: 700; color: rgba(246,231,214,.6); }
        .ms-cards { position: relative; z-index: 10; flex: 1; display: flex; flex-direction: column; gap: 20px; padding: 0 24px 40px; justify-content: center; }
        .ms-card { position: relative; padding: 28px 24px; border-radius: 24px; border: 2px solid; background: rgba(255,255,255,.03); cursor: pointer; text-align: left; transition: background .3s ease, transform .18s ease; font-family: inherit; color: inherit; width: 100%; }
        .ms-card:hover { background: rgba(255,255,255,.06); }
        .ms-card:active { transform: scale(.97); }
        .ms-card--quick { border-color: rgba(240,192,136,.4); animation: pulse-amber 3s ease-in-out infinite; }
        .ms-card--infinite { border-color: rgba(152,120,176,.4); animation: pulse-lavender 4s ease-in-out infinite; }
        @keyframes pulse-amber { 0%,100% { box-shadow: 0 0 0 0 rgba(240,192,136,0);} 50% { box-shadow: 0 0 20px 4px rgba(240,192,136,.2);} }
        @keyframes pulse-lavender { 0%,100% { box-shadow: 0 0 0 0 rgba(152,120,176,0);} 50% { box-shadow: 0 0 20px 4px rgba(152,120,176,.2);} }
        .ms-card__icon { font-size: 36px; display: block; margin-bottom: 12px; }
        .ms-card__title { font-size: 20px; font-weight: 900; color: #fdeedb; margin-bottom: 8px; }
        .ms-card__desc { font-size: 13px; font-weight: 600; line-height: 1.5; color: rgba(246,231,214,.65); }
        .ms-foot { position: relative; z-index: 10; padding: 0 24px 32px; text-align: center; }
        .ms-sound-btn { padding: 10px 20px; border-radius: 999px; border: 1px solid rgba(255,214,170,.2); background: rgba(255,255,255,.05); color: #f6e7d6; font-size: 13px; font-weight: 700; cursor: pointer; transition: background .2s ease; font-family: inherit; }
        .ms-sound-btn:hover { background: rgba(255,255,255,.08); }

        .game-root { position: relative; width: 100vw; height: 100vh; height: 100dvh; overflow: hidden; display: flex; flex-direction: column; isolation: isolate; color: #f6e7d6;
          background: radial-gradient(70% 42% at 50% 32%, rgba(140,84,38,.30) 0%, rgba(140,84,38,0) 72%), radial-gradient(92% 55% at 50% 108%, rgba(70,42,30,.55) 0%, rgba(70,42,30,0) 76%), linear-gradient(180deg,#16110f 0%,#120e0d 100%); }
        .game-head { position: relative; z-index: 6; padding: 12px 14px 8px; display: flex; align-items: flex-start; gap: 10px; }
        .game-head__text { flex: 1; min-width: 0; }
        .game-head__actions { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
        .game-title { font-size: 20px; font-weight: 900; letter-spacing: .2px; color: #fdeedb; text-shadow: 0 0 8px rgba(255,180,100,.1); }
        .game-sub { margin-top: 3px; font-size: 12px; font-weight: 700; line-height: 1.4; color: rgba(246,231,214,.5); }
        .game-exit { width: 37px; height: 37px; flex: 0 0 auto; border-radius: 12px; cursor: pointer; font-size: 16px; padding: 0; display: flex; align-items: center; justify-content: center; color: #f6e7d6; background: linear-gradient(150deg, rgba(255,225,190,.11), rgba(255,225,190,.03)); border: 1px solid rgba(255,214,170,.15); transition: transform .16s ease; font-family: inherit; }
        .game-exit:active { transform: scale(.9); }

        .game-stats { position: relative; z-index: 6; display: flex; gap: 8px; padding: 2px 18px 0; }
        .game-stat { flex: 1; padding: 8px 6px 9px; border-radius: 14px; text-align: center; background: linear-gradient(160deg, rgba(255,225,190,.07), rgba(255,225,190,.02)); border: 1px solid rgba(255,214,170,.1); }
        .game-stat__v { display: block; font-size: 17px; font-weight: 900; line-height: 1.15; color: #f8d7ab; font-variant-numeric: tabular-nums; }
        .game-stat__k { display: block; margin-top: 2px; font-size: 9px; font-weight: 800; letter-spacing: 1.3px; text-transform: uppercase; color: rgba(246,231,214,.42); }

        .game-cath { position: relative; z-index: 6; padding: 10px 18px 6px; }
        .game-cath__row { display: flex; justify-content: space-between; font-size: 9.5px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(246,231,214,.42); }
        .game-track { margin-top: 6px; height: 7px; border-radius: 999px; overflow: hidden; background: rgba(255,225,190,.09); box-shadow: inset 0 1px 3px rgba(0,0,0,.55); }
        .game-bar { height: 100%; width: 100%; border-radius: 999px; transform: scaleX(0); transform-origin: left center; will-change: transform; background: linear-gradient(90deg,#b9743a,#f0c088 60%,#ffe0b0); transition: transform .45s cubic-bezier(.22,1,.36,1); }

        .game-stage { position: relative; z-index: 4; flex: 1 1 auto; min-height: 190px; overflow: hidden; contain: layout paint; will-change: transform; --kick-x: 4px; --kick-y: 3px; --kick-ms: .32s; }
        .game-stage.is-shake { animation: game-shake var(--kick-ms) cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes game-shake { 0%,100% { transform: translate3d(0,0,0);} 12% { transform: translate3d(calc(var(--kick-x) * -1), var(--kick-y), 0);} 28% { transform: translate3d(var(--kick-x), calc(var(--kick-y) * -1), 0);} 46% { transform: translate3d(calc(var(--kick-x) * -0.72), calc(var(--kick-y) * 0.7), 0);} 64% { transform: translate3d(calc(var(--kick-x) * 0.48), calc(var(--kick-y) * -0.42), 0);} 82% { transform: translate3d(calc(var(--kick-x) * -0.22), calc(var(--kick-y) * 0.18), 0);} }
        .game-glow { position: absolute; left: 50%; top: 46%; width: 320px; height: 320px; margin: -160px 0 0 -160px; border-radius: 999px; pointer-events: none; z-index: 0; background: radial-gradient(circle, rgba(226,150,74,.20) 0%, rgba(226,150,74,0) 68%); animation: game-breathe 9s ease-in-out infinite; }
        @keyframes game-breathe { 0%,100% { opacity:.55;} 50% { opacity:1;} }
        .game-flash { position: absolute; inset: 0; z-index: 14; pointer-events: none; opacity: 0; --flash-peak: .55; --flash-ms: .16s; background: radial-gradient(52% 42% at 50% 58%, rgba(255,214,150,.5), rgba(255,190,120,0) 72%); }
        .game-flash.is-flash { animation: game-flash var(--flash-ms) ease-out forwards; }
        @keyframes game-flash { 0% { opacity: var(--flash-peak);} 100% { opacity:0;} }
        .game-rare-overlay { position: absolute; inset: 0; z-index: 13; pointer-events: none; opacity: 0; background: radial-gradient(60% 50% at 50% 50%, rgba(255,215,0,.35), rgba(255,215,0,0) 70%); }
        .game-rare-overlay.is-on { animation: rare-flash .6s ease-out forwards; }
        @keyframes rare-flash { 0% { opacity:1;} 100% { opacity:0;} }

        .game-press { position: absolute; top: 0; left: 0; z-index: 5; border-radius: 12px 12px 8px 8px; overflow: visible; background: linear-gradient(180deg,#8b7a6c 0%,#5d5049 42%,#3a312c 100%); border: 1px solid rgba(255,225,190,.14); will-change: transform; backface-visibility: hidden; box-shadow: 0 16px 28px rgba(0,0,0,.55), inset 0 2px 0 rgba(255,232,204,.22), inset 0 -3px 8px rgba(0,0,0,.5); }
        .game-press::after { content:''; position:absolute; left:0; right:0; bottom:0; height:12px; background: repeating-linear-gradient(135deg,#d9a44e 0 9px,#2b2320 9px 18px); opacity:.82; }
        .game-rod { position:absolute; bottom:100%; left:50%; width:26px; height:70vh; margin-left:-13px; background: linear-gradient(90deg,#2a2320 0%,#6a5c52 32%,#8d7d70 50%,#5b4e45 70%,#241e1b 100%); box-shadow: inset 0 0 0 1px rgba(255,225,190,.08); }
        .game-bolt { position:absolute; top:12px; width:9px; height:9px; border-radius:999px; background: radial-gradient(circle at 32% 28%,#e6d6c4,#6b5c51 70%); }
        .game-press-shadow { position:absolute; z-index:1; height:18px; border-radius:999px; pointer-events:none; transform-origin:center center; opacity:.12; will-change:transform,opacity; background: radial-gradient(60% 100% at 50% 50%, rgba(0,0,0,.55), rgba(0,0,0,0) 74%); }
        .game-dust { position:absolute; z-index:1; height:22px; border-radius:999px; pointer-events:none; transform-origin:center bottom; opacity:.55; will-change:transform; background: radial-gradient(60% 100% at 50% 100%, rgba(214,186,152,.55), rgba(214,186,152,0) 78%); transition: transform .6s ease; }
        .game-anvil { position:absolute; z-index:2; height:20px; border-radius:14px; pointer-events:none; background: linear-gradient(180deg,#6d5c50 0%,#463a33 40%,#2c2420 100%); border:1px solid rgba(255,225,190,.12); box-shadow: 0 16px 30px rgba(0,0,0,.55), inset 0 2px 0 rgba(255,232,204,.18); will-change: transform; }
        .game-obj { position:absolute; z-index:3; overflow:hidden; touch-action:none; cursor:pointer; transform-origin:center bottom; will-change:transform,opacity; box-shadow: 0 14px 24px rgba(0,0,0,.5), inset 0 2px 0 rgba(255,255,255,.24), inset 0 -6px 12px rgba(0,0,0,.28); }
        .game-obj__grain { position:absolute; inset:0; pointer-events:none; opacity:.85; }
        .game-obj.is-in { animation: game-drop .48s cubic-bezier(.22,1.2,.36,1) both; }
        .game-obj.is-squash { animation: game-squash .16s ease-out both; }
        .game-obj.is-gone { opacity:0; pointer-events:none; }
        @keyframes game-drop { from { transform: translate3d(0,-24px,0) scale(.88); opacity:0;} to { transform: translate3d(0,0,0) scale(1); opacity:1;} }
        @keyframes game-squash { to { transform: scale(1.16,.48); opacity:.3;} }
        .game-fx { position:absolute; inset:0; z-index:12; pointer-events:none; display:block; }
        .game-chip { position:absolute; z-index:8; left:50%; bottom:8px; transform:translateX(-50%); padding:7px 14px; border-radius:999px; white-space:nowrap; text-align:center; pointer-events:none; background:rgba(24,18,16,.82); border:1px solid rgba(255,214,170,.14); box-shadow:0 8px 18px rgba(0,0,0,.42); }
        .game-chip__n { display:block; font-size:12px; font-weight:900; color:#f8dcb4; }
        .game-chip__d { display:block; font-size:10px; font-weight:700; color:rgba(246,231,214,.45); }

        .game-deck { position:relative; z-index:7; padding:8px 18px 18px; }
        .game-timer { position:relative; width:52px; height:52px; flex:0 0 auto; }
        .game-timer svg { width:100%; height:100%; display:block; }
        .game-timer__lbl { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:900; color:#f8d7ab; font-variant-numeric:tabular-nums; }
        .game-timer__lbl.is-pulse { animation: timer-pulse 1s ease-in-out infinite; }
        @keyframes timer-pulse { 0%,100% { opacity:1;} 50% { opacity:.6;} }
        .game-meter { position:relative; height:12px; border-radius:999px; overflow:hidden; background:rgba(255,225,190,.09); box-shadow: inset 0 2px 5px rgba(0,0,0,.6); }
        .game-meter__fill { position:absolute; inset:0; transform:scaleX(0); transform-origin:left center; will-change:transform; border-radius:999px; background:linear-gradient(90deg,#a9662f,#e8a94f 55%,#ffd79a); }
        .game-meter__fill.is-max { background:linear-gradient(90deg,#e0663a,#ffab52 50%,#fff0cf); box-shadow:0 0 18px rgba(255,170,90,.7); }
        .game-meter__lbl { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:8.5px; font-weight:900; letter-spacing:2.2px; text-transform:uppercase; color:rgba(255,240,220,.72); }
        .game-crush { position:relative; width:100%; margin-top:12px; padding:16px 18px 18px; border:none; cursor:pointer; border-radius:26px; font-family:inherit; color:#2b1a0b; overflow:hidden; touch-action:none; background:linear-gradient(170deg,#ffd69a 0%,#eda554 44%,#c8762f 100%); box-shadow:0 14px 26px rgba(0,0,0,.5), inset 0 2px 0 rgba(255,255,255,.55), inset 0 -5px 12px rgba(120,60,10,.35); transition:transform .1s ease, filter .2s ease, opacity .3s ease; }
        .game-crush:active { transform:scale(.978); }
        .game-crush.is-busy { filter:saturate(.55) brightness(.82); }
        .game-crush.is-hit { animation: crush-hit 70ms ease-out; }
        @keyframes crush-hit { 0% { transform:scale(1);} 45% { transform:scale(.96);} 100% { transform:scale(1);} }
        .game-crush__t { display:block; font-size:25px; font-weight:900; letter-spacing:3px; line-height:1; }
        .game-crush__s { display:block; margin-top:6px; font-size:10.5px; font-weight:800; letter-spacing:1.2px; text-transform:uppercase; opacity:.68; }

        .game-toast { position:absolute; z-index:70; left:18px; right:18px; bottom:150px; padding:14px 18px; border-radius:20px; text-align:center; font-size:13.5px; font-weight:800; line-height:1.5; color:#fdeedb; background:linear-gradient(160deg,rgba(58,38,26,.96),rgba(28,20,17,.96)); border:1px solid rgba(255,214,170,.22); box-shadow:0 18px 36px rgba(0,0,0,.55); opacity:0; transform:translateY(16px) scale(.96); pointer-events:none; transition:opacity .34s ease, transform .34s cubic-bezier(.2,1.3,.4,1); }
        .game-toast.is-on { opacity:1; transform:translateY(0) scale(1); }

        .game-pause-overlay { position:absolute; inset:0; z-index:90; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:30px; text-align:center; background:rgba(12,9,8,.86); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); opacity:0; pointer-events:none; transition:opacity .35s ease; }
        .game-pause-overlay.is-on { opacity:1; pointer-events:auto; }
        .game-pause-overlay__t { font-size:26px; font-weight:900; color:#fdeedb; text-shadow:0 0 10px rgba(255,180,100,.2); }
        .game-pause-overlay__s { font-size:13.5px; font-weight:700; line-height:1.6; color:rgba(246,231,214,.62); }

        .completion-overlay { position:absolute; inset:0; z-index:100; display:flex; align-items:center; justify-content:center; background:radial-gradient(62% 48% at 50% 44%, rgba(96,60,28,.85), rgba(11,8,7,.96) 78%); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); opacity:0; pointer-events:none; transition:opacity .5s ease; }
        .completion-overlay.is-on { opacity:1; pointer-events:auto; }
        .completion-content { text-align:center; padding:40px; }
        .completion-mark { font-size:56px; margin-bottom:16px; animation:completion-pop .6s cubic-bezier(.2,1.5,.4,1) both; }
        @keyframes completion-pop { from { transform:scale(.4); opacity:0;} to { transform:scale(1); opacity:1;} }
        .completion-title { font-size:28px; font-weight:900; color:#fdeedb; margin-bottom:12px; text-shadow:0 0 10px rgba(255,180,100,.2); }
        .completion-body { font-size:15px; font-weight:600; line-height:1.6; color:rgba(246,231,214,.75); margin-bottom:24px; }
        .completion-stats { display:flex; gap:20px; justify-content:center; margin-bottom:28px; }
        .completion-stat { text-align:center; }
        .completion-stat__v { display:block; font-size:32px; font-weight:900; color:#f8d7ab; line-height:1.2; }
        .completion-stat__k { display:block; font-size:10px; font-weight:800; letter-spacing:1.2px; text-transform:uppercase; color:rgba(246,231,214,.5); margin-top:4px; }
        .completion-cta { padding:14px 32px; border-radius:999px; border:1px solid rgba(255,214,170,.3); background:linear-gradient(150deg,#d99a55,#a86a34); color:#241609; font-family:inherit; font-size:15px; font-weight:900; letter-spacing:.5px; cursor:pointer; box-shadow:0 12px 26px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.35); transition:transform .18s ease; }
        .completion-cta:active { transform:scale(.95); }

        @media (prefers-reduced-motion: reduce) {
          .breath-glow, .game-glow, .game-stage.is-shake, .game-flash.is-flash, .game-rare-overlay.is-on, .ms-card--quick, .ms-card--infinite { animation:none; }
        }
      `}</style>

      {screen === 'select' && <ModeSelect key="select" />}
      {screen === 'quick' && <GameStage key="quick" mode="quick" />}
      {screen === 'infinite' && <GameStage key="infinite" mode="infinite" />}
    </>
  );
}
