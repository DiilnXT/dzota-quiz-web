// Web Audio API synthesized sounds - no external audio files needed
class SoundService {
  private ctx: AudioContext | null = null
  public muted: boolean = false

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  playTick() {
    if (this.muted) return
    try {
      this.init()
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, this.ctx.currentTime)
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.05)
    } catch (e) {
      // ignore sound error
    }
  }

  playStationChime() {
    if (this.muted) return
    try {
      this.init()
      if (!this.ctx) return
      const now = this.ctx.currentTime
      ;[880, 1174, 1760].forEach((freq, i) => {
        if (!this.ctx) return
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, now + i * 0.08)
        gain.gain.setValueAtTime(0.12, now + i * 0.08)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now + i * 0.08)
        osc.stop(now + i * 0.08 + 0.45)
      })
    } catch (e) {
      // ignore
    }
  }

  playWarning() {
    if (this.muted) return
    try {
      this.init()
      if (!this.ctx) return
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(440, now)
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now)
      osc.stop(now + 0.12)
    } catch (e) {
      // ignore
    }
  }

  playSuccess() {
    if (this.muted) return
    try {
      this.init()
      if (!this.ctx) return
      const now = this.ctx.currentTime
      const notes = [523.25, 659.25, 783.99, 1046.5] // C, E, G, C
      notes.forEach((freq, idx) => {
        if (!this.ctx) return
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + idx * 0.12)
        gain.gain.setValueAtTime(0.15, now + idx * 0.12)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.5)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now + idx * 0.12)
        osc.stop(now + idx * 0.12 + 0.55)
      })
    } catch (e) {
      // ignore
    }
  }
}

export const soundService = new SoundService()
