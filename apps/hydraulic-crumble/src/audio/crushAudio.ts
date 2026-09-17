type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext
}

let ctx: AudioContext | null = null
let noiseBuffer: AudioBuffer | null = null
let warmed = false

function getContext(): AudioContext | null {
  if (ctx) return ctx
  const AC = window.AudioContext || (window as AudioWindow).webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  return ctx
}

function buildNoiseBuffer(audio: AudioContext): AudioBuffer {
  const seconds = 1
  const buffer = audio.createBuffer(1, audio.sampleRate * seconds, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1
  }
  return buffer
}

function warmGraph(audio: AudioContext) {
  if (!noiseBuffer) {
    noiseBuffer = buildNoiseBuffer(audio)
  }

  const src = audio.createBufferSource()
  src.buffer = noiseBuffer
  const gain = audio.createGain()
  gain.gain.value = 0.0001
  src.connect(gain)
  gain.connect(audio.destination)
  src.start()
  src.stop(audio.currentTime + 0.04)

  const osc = audio.createOscillator()
  osc.frequency.value = 60
  const oscGain = audio.createGain()
  oscGain.gain.value = 0.0001
  osc.connect(oscGain)
  oscGain.connect(audio.destination)
  osc.start()
  osc.stop(audio.currentTime + 0.04)

  warmed = true
}

export async function unlockCrushAudio(): Promise<boolean> {
  const audio = getContext()
  if (!audio) return false
  if (audio.state === 'suspended') {
    await audio.resume()
  }
  if (!warmed) {
    warmGraph(audio)
  }
  return audio.state === 'running'
}

function envelope(
  gain: GainNode,
  start: number,
  peak: number,
  attack: number,
  decay: number,
) {
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay)
}

function playNoiseBurst(
  audio: AudioContext,
  opts: {
    duration: number
    peak: number
    highpass?: number
    lowpass?: number
    band?: { freq: number; q: number }
  },
) {
  if (!noiseBuffer) noiseBuffer = buildNoiseBuffer(audio)
  const src = audio.createBufferSource()
  src.buffer = noiseBuffer
  const gain = audio.createGain()
  let node: AudioNode = src

  if (opts.highpass) {
    const hp = audio.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = opts.highpass
    node.connect(hp)
    node = hp
  }
  if (opts.lowpass) {
    const lp = audio.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = opts.lowpass
    node.connect(lp)
    node = lp
  }
  if (opts.band) {
    const bp = audio.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = opts.band.freq
    bp.Q.value = opts.band.q
    node.connect(bp)
    node = bp
  }

  node.connect(gain)
  gain.connect(audio.destination)

  const now = audio.currentTime
  envelope(gain, now, opts.peak, 0.008, opts.duration)
  src.start(now)
  src.stop(now + opts.duration + 0.05)
}

function playThud(
  audio: AudioContext,
  opts: { freq: number; peak: number; decay: number; type?: OscillatorType },
) {
  const osc = audio.createOscillator()
  osc.type = opts.type ?? 'sine'
  osc.frequency.setValueAtTime(opts.freq, audio.currentTime)
  osc.frequency.exponentialRampToValueAtTime(opts.freq * 0.45, audio.currentTime + opts.decay)

  const gain = audio.createGain()
  osc.connect(gain)
  gain.connect(audio.destination)

  const now = audio.currentTime
  envelope(gain, now, opts.peak, 0.01, opts.decay)
  osc.start(now)
  osc.stop(now + opts.decay + 0.05)
}

function playBrittle(audio: AudioContext) {
  playNoiseBurst(audio, { duration: 0.12, peak: 0.28, highpass: 1800, lowpass: 8000 })
  playThud(audio, { freq: 190, peak: 0.22, decay: 0.14, type: 'square' })
}

function playFizzy(audio: AudioContext) {
  playNoiseBurst(audio, { duration: 0.28, peak: 0.22, band: { freq: 1400, q: 0.8 } })
  playNoiseBurst(audio, { duration: 0.18, peak: 0.12, highpass: 3200 })
  playThud(audio, { freq: 96, peak: 0.2, decay: 0.22 })
}

function playDense(audio: AudioContext) {
  playNoiseBurst(audio, { duration: 0.2, peak: 0.24, lowpass: 900 })
  playThud(audio, { freq: 62, peak: 0.34, decay: 0.28 })
  playThud(audio, { freq: 38, peak: 0.18, decay: 0.34, type: 'triangle' })
}

const CRUNCHES = [playBrittle, playFizzy, playDense] as const

export function playRandomCrunch(): void {
  const audio = getContext()
  if (!audio) return
  if (audio.state === 'suspended') {
    void audio.resume()
  }
  if (!warmed) {
    warmGraph(audio)
  }
  const pick = CRUNCHES[Math.floor(Math.random() * CRUNCHES.length)]
  pick(audio)
}

export function hapticAnticipate(): void {
  try {
    navigator.vibrate?.([10])
  } catch {
    // Some browsers throw if vibration is blocked.
  }
}

export function hapticImpact(): void {
  try {
    navigator.vibrate?.([50, 30, 100])
  } catch {
    // Some browsers throw if vibration is blocked.
  }
}
