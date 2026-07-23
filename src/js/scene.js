import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

// Fullscreen model scene: bloom-lit GLB floating on black,
// mouse parallax + slow idle motion, runtime-tweakable
// (color / glow / speed) for the customize panel.

export class ModelScene {
  constructor(canvas, opts = {}) {
    this.canvas = canvas
    this.opts = Object.assign(
      {
        modelUrl: '/models/blue_jellyfish.glb',
        cameraZ: 6,
        modelScale: 1,
        bloomStrength: 0.9,
        rotate: true,
      },
      opts
    )

    this.speed = 0.4 // 0..1
    this.mouse = new THREE.Vector2()
    this.targetRot = new THREE.Vector2()
    this.clock = new THREE.Clock()
    this.mixer = null
    this.model = null
    this.baseMaterials = []
    this.defaults = { color: null, glow: 0.6, speed: 0.4 }

    this._init()
  }

  _init() {
    const { canvas } = this
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.1

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x060608)
    this.scene.fog = new THREE.FogExp2(0x060608, 0.055)

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    )
    this.camera.position.set(0, 0, this.opts.cameraZ)

    // lights
    this.scene.add(new THREE.AmbientLight(0x334, 1.2))
    const key = new THREE.DirectionalLight(0x88aaff, 2.4)
    key.position.set(3, 4, 5)
    this.scene.add(key)
    const rim = new THREE.DirectionalLight(0x4466ff, 1.6)
    rim.position.set(-4, -2, -4)
    this.scene.add(rim)
    this.pointLight = new THREE.PointLight(0x7db8ff, 14, 20)
    this.pointLight.position.set(0, 1.4, 1.6)
    this.scene.add(this.pointLight)

    // floating dust particles
    this._addParticles()

    // post-processing (bloom = the glowing look)
    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.opts.bloomStrength,
      0.85,
      0.15
    )
    this.composer.addPass(this.bloom)

    window.addEventListener('resize', () => this._onResize())
    window.addEventListener('pointermove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
    })

    this._animate = this._animate.bind(this)
    requestAnimationFrame(this._animate)
  }

  _addParticles() {
    const count = 260
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const mat = new THREE.PointsMaterial({
      color: 0x9fc3ff,
      size: 0.02,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    })
    this.particles = new THREE.Points(geo, mat)
    this.scene.add(this.particles)
  }

  load(onProgress) {
    return new Promise((resolve, reject) => {
      const draco = new DRACOLoader()
      draco.setDecoderPath('/draco/')
      const loader = new GLTFLoader()
      loader.setDRACOLoader(draco)
      loader.load(
        this.opts.modelUrl,
        (gltf) => {
          this.model = gltf.scene
          this._fitModel()
          this.scene.add(this.model)

          // collect materials for the customize panel
          this.model.traverse((o) => {
            if (o.isMesh && o.material) {
              const mats = Array.isArray(o.material) ? o.material : [o.material]
              mats.forEach((m) => {
                this.baseMaterials.push({
                  mat: m,
                  color: m.color ? m.color.clone() : null,
                  emissive: m.emissive ? m.emissive.clone() : null,
                  emissiveIntensity: m.emissiveIntensity ?? 1,
                })
                m.transparent = true
              })
            }
          })

          // play baked animation if the GLB has one
          if (gltf.animations && gltf.animations.length) {
            this.mixer = new THREE.AnimationMixer(this.model)
            gltf.animations.forEach((clip) => this.mixer.clipAction(clip).play())
          }
          resolve(gltf)
        },
        (e) => {
          if (onProgress && e.total) onProgress(e.loaded / e.total)
          else if (onProgress) onProgress(Math.min(0.95, e.loaded / 4e6))
        },
        reject
      )
    })
  }

  _fitModel() {
    // normalize any GLB to a consistent size / center
    const box = new THREE.Box3().setFromObject(this.model)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = (3.2 / maxDim) * this.opts.modelScale
    this.model.scale.setScalar(scale)
    box.setFromObject(this.model)
    box.getCenter(center)
    this.model.position.sub(center)
  }

  // ---- customize API -------------------------------------------------
  setColor(hex) {
    if (!this.model) return
    const c = new THREE.Color(hex)
    this.baseMaterials.forEach(({ mat }) => {
      if (mat.emissive) mat.emissive.copy(c)
      if (mat.color) mat.color.lerp(c, 0.35)
    })
    this.pointLight.color.copy(c)
  }

  setGlow(v) {
    // v: 0..1
    this.bloom.strength = 0.2 + v * 2.2
    this.baseMaterials.forEach(({ mat, emissiveIntensity }) => {
      if ('emissiveIntensity' in mat) mat.emissiveIntensity = emissiveIntensity * (0.3 + v * 2)
    })
  }

  setSpeed(v) {
    this.speed = v // 0..1
  }

  setPattern(mode) {
    if (!this.model) return
    this.model.traverse((o) => {
      if (o.isMesh && o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material]
        mats.forEach((m) => (m.wireframe = mode === 'wire'))
      }
    })
  }

  reset() {
    this.baseMaterials.forEach(({ mat, color, emissive, emissiveIntensity }) => {
      if (color && mat.color) mat.color.copy(color)
      if (emissive && mat.emissive) mat.emissive.copy(emissive)
      if ('emissiveIntensity' in mat) mat.emissiveIntensity = emissiveIntensity
      mat.wireframe = false
    })
    this.pointLight.color.set(0x7db8ff)
    this.bloom.strength = this.opts.bloomStrength
    this.speed = this.defaults.speed
  }

  // scroll position 0..1 lets pages drive the camera
  setScroll(p) {
    this.scrollP = p
  }

  _onResize() {
    const w = window.innerWidth
    const h = window.innerHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
    this.composer.setSize(w, h)
  }

  _animate() {
    requestAnimationFrame(this._animate)
    const dt = this.clock.getDelta()
    const t = this.clock.elapsedTime
    const spd = 0.2 + this.speed * 1.6

    if (this.mixer) this.mixer.update(dt * spd)

    if (this.model) {
      // idle float
      this.model.position.y = Math.sin(t * 0.6 * spd) * 0.18
      if (this.opts.rotate) this.model.rotation.y += dt * 0.12 * spd

      // mouse parallax
      this.targetRot.x += (this.mouse.y * 0.18 - this.targetRot.x) * 0.04
      this.targetRot.y += (this.mouse.x * 0.3 - this.targetRot.y) * 0.04
      this.model.rotation.x = -this.targetRot.x
    }

    // camera drift with scroll
    if (this.scrollP != null) {
      const target = this.opts.cameraZ + this.scrollP * 2.4
      this.camera.position.z += (target - this.camera.position.z) * 0.05
      this.camera.position.y += (-this.scrollP * 1.2 - this.camera.position.y) * 0.05
    }
    this.camera.position.x += (this.mouse.x * 0.35 - this.camera.position.x) * 0.03
    this.camera.lookAt(0, 0, 0)

    if (this.particles) {
      this.particles.rotation.y = t * 0.015 * spd
      this.particles.position.y = Math.sin(t * 0.2) * 0.25
    }

    this.composer.render()
  }
}
