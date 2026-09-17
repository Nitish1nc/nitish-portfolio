import { create } from 'zustand'
import {
  hapticAnticipate,
  hapticImpact,
  playRandomCrunch,
  unlockCrushAudio,
} from '../audio/crushAudio'

export type CrushObjectType = 'chalk' | 'bathbomb' | 'sand'

export interface CrushObject {
  id: string
  type: CrushObjectType
  color: string
  shadowColor: string
}

export interface CrushParticle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
}

export interface CrushState {
  currentObject: CrushObject
  isSmashing: boolean
  particles: CrushParticle[]
  audioUnlocked: boolean
  unlockAudio: () => void
  spawnNewObject: () => void
  triggerSmash: () => void
  clearParticles: () => void
  impact: () => void
}

const PALETTES: Record<CrushObjectType, { color: string; shadowColor: string }> = {
  chalk: { color: '#E6D7C3', shadowColor: '#8A7760' },
  bathbomb: { color: '#C57A68', shadowColor: '#7A4036' },
  sand: { color: '#C4A06A', shadowColor: '#6E5232' },
}

const TYPES: CrushObjectType[] = ['chalk', 'bathbomb', 'sand']

let objectSeq = 1
let particleSeq = 1
let resetTimer: number | undefined

function mixHex(hex: string, toward: string, amount: number): string {
  const parse = (value: string): [number, number, number] => [
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16),
  ]
  const a = parse(hex)
  const b = parse(toward)
  const mix = (left: number, right: number) => Math.round(left + (right - left) * amount)
  return `#${[mix(a[0], b[0]), mix(a[1], b[1]), mix(a[2], b[2])]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')}`
}

function makeObject(exclude?: CrushObjectType): CrushObject {
  const pool = exclude ? TYPES.filter((type) => type !== exclude) : TYPES
  const type = pool[Math.floor(Math.random() * pool.length)] ?? 'chalk'
  return {
    id: `obj-${objectSeq++}`,
    type,
    ...PALETTES[type],
  }
}

function makeParticles(object: CrushObject): CrushParticle[] {
  const count = 20 + Math.floor(Math.random() * 11)
  const chips = [
    object.color,
    mixHex(object.color, '#fff6e8', 0.28),
    mixHex(object.color, object.shadowColor, 0.35),
    mixHex(object.color, '#2a1b12', 0.2),
  ]
  return Array.from({ length: count }, () => ({
    id: particleSeq++,
    x: (Math.random() - 0.5) * 24,
    y: (Math.random() - 0.5) * 12,
    vx: (Math.random() - 0.5) * 280,
    vy: -40 - Math.random() * 180,
    color: chips[Math.floor(Math.random() * chips.length)] ?? object.color,
    size: 8 + Math.random() * 16,
  }))
}

export const useCrushStore = create<CrushState>((set, get) => ({
  currentObject: makeObject(),
  isSmashing: false,
  particles: [],
  audioUnlocked: false,

  unlockAudio: () => {
    void unlockCrushAudio().then((ok) => {
      if (ok) set({ audioUnlocked: true })
    })
  },

  spawnNewObject: () => {
    set({ currentObject: makeObject(get().currentObject.type) })
  },

  triggerSmash: () => {
    if (get().isSmashing) return
    hapticAnticipate()
    set({ isSmashing: true })
    window.setTimeout(() => {
      if (get().isSmashing && get().particles.length === 0) {
        get().impact()
      }
    }, 220)
  },

  clearParticles: () => set({ particles: [] }),

  impact: () => {
    const state = get()
    if (!state.isSmashing || state.particles.length > 0) return
    hapticImpact()
    playRandomCrunch()
    set({ particles: makeParticles(state.currentObject) })
    if (resetTimer !== undefined) window.clearTimeout(resetTimer)
    resetTimer = window.setTimeout(() => {
      set({ particles: [], isSmashing: false })
      get().spawnNewObject()
    }, 1500)
  },
}))
