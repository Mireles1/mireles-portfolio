import * as THREE from 'three'

// Rotating "glass" text cylinders around the hero model.
// Each ring is an open-ended cylinder with the project titles drawn
// onto a CanvasTexture. transparent + DoubleSide gives the see-through
// look where the far wall shows mirrored ghost text. Idle spin + scroll
// and drag velocity, raycast click -> onSelect(project).

const TWO_PI = Math.PI * 2

export class TextRings {
  constructor(modelScene, projects, { onSelect } = {}) {
    this.ms = modelScene
    this.projects = projects
    this.onSelect = onSelect
    this.rings = []
    this.velocity = 0
    this.raycaster = new THREE.Raycaster()
    this.ndc = new THREE.Vector2()
    this.clock = new THREE.Clock()
    this.hovering = false
    this._drag = null
    this._build()
  }

  async _build() {
    // the canvas text must be drawn with Anton actually loaded
    try {
      await document.fonts.load('400 300px Anton')
    } catch {}

    // one ring per project, stacked vertically; scrolling lifts the
    // stack so each ring passes through the readable center zone
    this.clickMeshes = []
    this.scrollP = 0
    this.GAP = 2.3
    this.TOP_Y = 0.5 // first ring fully readable at load

    this.projects.forEach((project, i) => {
      const { sharp, blurred } = this._makeTextures(project, i)
      const geo = new THREE.CylinderGeometry(3.1, 3.1, 1.55, 96, 1, true)

      // near wall: sharp, readable text (outer faces only)
      const frontMat = new THREE.MeshBasicMaterial({
        map: sharp,
        transparent: true,
        side: THREE.FrontSide,
        depthWrite: false,
        color: 0xaebacd, // dim the band so bloom doesn't blow it out
      })
      // far wall seen through the glass: blurred, dimmer ghost
      const backMat = new THREE.MeshBasicMaterial({
        map: blurred,
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        color: 0x768294,
        opacity: 0.55,
      })

      const group = new THREE.Group()
      const back = new THREE.Mesh(geo, backMat)
      back.renderOrder = 2
      const front = new THREE.Mesh(geo, frontMat)
      front.renderOrder = 3
      front.userData.project = project
      group.add(back, front)
      const baseY = this.TOP_Y - i * this.GAP
      group.position.y = baseY
      group.userData.dir = i % 2 === 0 ? 1 : -1
      group.userData.baseY = baseY
      // start with the title centered toward the camera (title centers
      // sit at u = 0.25 / 0.75 → θ = ±π/2), varied slightly per ring
      group.rotation.y = -Math.PI / 2 + (i % 3 - 1) * 0.25
      this.ms.scene.add(group)
      this.rings.push(group)
      this.clickMeshes.push(front)
    })

    this._bind()
    this._tick = this._tick.bind(this)
    requestAnimationFrame(this._tick)
  }

  _makeTextures(project, index) {
    const W = 6144
    const H = 512
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    // frosted band
    ctx.fillStyle = 'rgba(235, 242, 255, 0.035)'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)'
    ctx.fillRect(0, 0, W, 3)
    ctx.fillRect(0, H - 3, W, 3)

    // same title twice around the circumference (Noomo-style), so one
    // is always facing the camera
    const REPEATS = 2
    const segW = W / REPEATS
    const title = project.title.toUpperCase()
    const meta = `[ ${String(index + 1).padStart(2, '0')} ]  ${project.tags.toUpperCase()}  ·  ${project.year.toUpperCase()}`

    for (let r = 0; r < REPEATS; r++) {
      const x0 = r * segW

      let size = 320
      ctx.font = `400 ${size}px Anton, Impact, sans-serif`
      const maxW = segW * 0.86
      const w = ctx.measureText(title).width
      if (w > maxW) {
        size = Math.floor((size * maxW) / w)
        ctx.font = `400 ${size}px Anton, Impact, sans-serif`
      }
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = 'rgba(214, 226, 244, 0.82)'
      ctx.fillText(title, x0 + segW / 2, H * 0.44)

      ctx.font = '500 36px "IBM Plex Mono", monospace'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
      ctx.fillText(meta, x0 + segW / 2, H * 0.86)

      // divider between the two repeats
      ctx.fillStyle = 'rgba(255, 255, 255, 0.16)'
      ctx.fillRect(x0, H * 0.18, 2, H * 0.64)
    }

    const sharp = new THREE.CanvasTexture(canvas)
    sharp.wrapS = THREE.RepeatWrapping
    sharp.colorSpace = THREE.SRGBColorSpace
    sharp.anisotropy = 8

    // blurred copy for the far wall (frosted-glass ghost)
    const bCanvas = document.createElement('canvas')
    bCanvas.width = W
    bCanvas.height = H
    const bCtx = bCanvas.getContext('2d')
    bCtx.filter = 'blur(16px)'
    bCtx.drawImage(canvas, 0, 0)
    const blurred = new THREE.CanvasTexture(bCanvas)
    blurred.wrapS = THREE.RepeatWrapping
    blurred.colorSpace = THREE.SRGBColorSpace
    blurred.anisotropy = 4

    return { sharp, blurred }
  }

  _bind() {
    const ignore = (e) =>
      e.target.closest &&
      e.target.closest('header, .customize, .social-links-global-parent, .home-footer, .mobile-menu, .home-preloader')

    window.addEventListener('pointerdown', (e) => {
      if (ignore(e)) return
      this._drag = { x: e.clientX, moved: 0 }
    })
    window.addEventListener('pointermove', (e) => {
      this.ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
      if (this._drag) {
        const dx = e.clientX - this._drag.x
        this._drag.x = e.clientX
        this._drag.moved += Math.abs(dx)
        this.velocity += dx * 0.00045
      }
    })
    window.addEventListener('pointerup', (e) => {
      const wasClick = this._drag && this._drag.moved < 6
      this._drag = null
      if (!wasClick || ignore(e)) return
      const hit = this._raycast()
      if (hit && this.onSelect) this.onSelect(hit)
    })
  }

  _raycast() {
    if (!this.clickMeshes || !this.clickMeshes.length) return null
    this.raycaster.setFromCamera(this.ndc, this.ms.camera)
    const hits = this.raycaster.intersectObjects(this.clickMeshes, false)
    if (!hits.length) return null
    // whole ring = one project, no segment math needed
    return hits[0].object.userData.project
  }

  // page scroll progress (0..1) — lifts the rings so the lower one
  // rises into reading position as you scroll
  setScroll(p) {
    this.scrollP = p
  }

  // called by the page on scroll to spin the rings
  addVelocity(v) {
    this.velocity += v
  }

  _tick() {
    requestAnimationFrame(this._tick)
    const dt = this.clock.getDelta()
    const idle = 0.055
    this.velocity *= 0.94 // damping
    // lift the whole stack so the last ring reaches the reading zone by
    // ~85% scroll (the rest is the footer). The camera also descends
    // (-1.2 * p, see scene.js) — subtract that so the reading zone stays
    // at the same spot on screen for every ring.
    const p = this.scrollP || 0
    const travel = this.GAP * (this.projects.length - 1)
    const lift = (p / 0.85) * travel - 1.2 * p
    this.rings.forEach((r) => {
      r.rotation.y += (idle * dt + this.velocity * dt * 60 * 0.016) * r.userData.dir
      const targetY = r.userData.baseY + lift
      r.position.y += (targetY - r.position.y) * 0.06
    })
    // hover cursor
    const hit = this._raycast()
    const h = !!hit
    if (h !== this.hovering) {
      this.hovering = h
      document.body.style.cursor = h ? 'pointer' : ''
    }
  }
}
