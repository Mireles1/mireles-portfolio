// Global audio manager: ambient loop + UI sounds, with on/off toggle
// persisted across pages via sessionStorage.

class AudioManager {
  constructor() {
    // prefer real mp3s (drop them in public/audio/), fall back to the
    // generated wav placeholders if they don't exist yet
    this.ambient = new Audio('/audio/ambient.mp3')
    this.ambient.addEventListener('error', () => (this.ambient.src = '/audio/ambient.wav'), { once: true })
    this.ambient.loop = true
    this.ambient.volume = 0

    this.clickSound = new Audio('/audio/click.mp3')
    this.clickSound.addEventListener('error', () => (this.clickSound.src = '/audio/click.wav'), { once: true })
    this.clickSound.volume = 0.5

    this.enabled = sessionStorage.getItem('om-sound') !== 'off'
    this.started = false
    this._fadeRaf = null
  }

  // must be called from a user gesture (autoplay policy)
  start() {
    if (this.started) return
    this.started = true
    this.ambient.play().catch(() => {})
    if (this.enabled) this._fadeTo(0.55, 1600)
  }

  toggle() {
    this.enabled = !this.enabled
    sessionStorage.setItem('om-sound', this.enabled ? 'on' : 'off')
    if (this.started) this._fadeTo(this.enabled ? 0.55 : 0, 700)
    return this.enabled
  }

  click() {
    if (!this.enabled) return
    try {
      this.clickSound.currentTime = 0
      this.clickSound.play().catch(() => {})
    } catch {}
  }

  _fadeTo(target, ms) {
    cancelAnimationFrame(this._fadeRaf)
    const from = this.ambient.volume
    const t0 = performance.now()
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms)
      this.ambient.volume = Math.min(1, Math.max(0, from + (target - from) * k))
      if (k < 1) this._fadeRaf = requestAnimationFrame(step)
    }
    this._fadeRaf = requestAnimationFrame(step)
  }
}

export const audio = new AudioManager()
