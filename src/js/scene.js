import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

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

    this._baseFov = 45
    this.camera = new THREE.PerspectiveCamera(
      this._baseFov,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    )
    this._zBoost = 0
    this._applyResponsiveFov()
    this.camera.position.set(0, 0, this.opts.cameraZ + this._zBoost)

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

    // cinematic grade: chromatic aberration (driven by scroll velocity),
    // animated film grain, and a soft vignette — the "directed" finish
    this._reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    this._scrollVel = 0
    this._prevScrollP = 0
    this._gradePass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uAberration: { value: 0 },
        uGrain: { value: 0.05 },
        uVignette: { value: 1.1 },
        uAspect: { value: window.innerWidth / window.innerHeight },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse;
        uniform float uTime;
        uniform float uAberration;
        uniform float uGrain;
        uniform float uVignette;
        uniform float uAspect;
        varying vec2 vUv;
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        void main() {
          vec2 uv = vUv;
          vec2 dir = uv - 0.5;
          // radial chromatic aberration, stronger toward the edges
          float amt = uAberration * (0.4 + dot(dir, dir) * 2.5);
          float r = texture2D(tDiffuse, uv - dir * amt).r;
          float g = texture2D(tDiffuse, uv).g;
          float b = texture2D(tDiffuse, uv + dir * amt).b;
          vec3 col = vec3(r, g, b);
          // vignette (aspect-corrected so it stays circular)
          vec2 vd = dir * vec2(uAspect, 1.0) * uVignette;
          float vig = smoothstep(1.1, 0.3, length(vd));
          col *= mix(0.7, 1.0, vig);
          // animated film grain
          float grain = hash(uv * vec2(1920.0, 1080.0) + fract(uTime)) - 0.5;
          col += grain * uGrain;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    })
    this.composer.addPass(this._gradePass)

    window.addEventListener('resize', () => this._onResize())
    window.addEventListener('pointermove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
      this._pointerActive = true
    })

    this._animate = this._animate.bind(this)
    requestAnimationFrame(this._animate)
  }

  _addParticles() {
    const count = 320
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count) // random phase per point
    const scale = new Float32Array(count) // random size multiplier
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1
      seed[i] = Math.random() * 6.2831
      scale[i] = 0.5 + Math.random() * 1.4
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    geo.setAttribute('aScale', new THREE.BufferAttribute(scale, 1))

    // shader-driven dust: gentle drift, perspective depth fade, soft round
    // sprites, and a repulsion push away from the cursor in world space.
    this._particleMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector3(999, 999, 0) },
        uMouseRadius: { value: 2.2 },
        uMouseStrength: { value: 1.1 },
        uSize: { value: 14 * Math.min(window.devicePixelRatio, 2) },
        uColor: { value: new THREE.Color(0x9fc3ff) },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uMouse;
        uniform float uMouseRadius;
        uniform float uMouseStrength;
        uniform float uSize;
        attribute float aSeed;
        attribute float aScale;
        varying float vFade;
        void main() {
          vec3 p = position;
          // slow floating drift, phase-offset per point
          p.x += sin(uTime * 0.35 + aSeed) * 0.18;
          p.y += cos(uTime * 0.28 + aSeed * 1.7) * 0.16;
          p.z += sin(uTime * 0.22 + aSeed * 0.6) * 0.12;
          // cursor repulsion in the xy plane
          vec2 diff = p.xy - uMouse.xy;
          float d = length(diff);
          if (d < uMouseRadius) {
            float f = (1.0 - d / uMouseRadius);
            p.xy += normalize(diff + 1e-4) * f * f * uMouseStrength;
          }
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          // perspective size + depth-based fade (nearer = bigger, brighter)
          gl_PointSize = uSize * aScale * (1.0 / -mv.z);
          vFade = clamp(1.0 - (-mv.z - 3.0) / 12.0, 0.15, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vFade;
        void main() {
          // soft round sprite
          float dd = length(gl_PointCoord - 0.5);
          if (dd > 0.5) discard;
          float a = smoothstep(0.5, 0.05, dd) * vFade * 0.6;
          gl_FragColor = vec4(uColor, a);
        }
      `,
    })

    this.particles = new THREE.Points(geo, this._particleMat)
    this.particles.frustumCulled = false
    this._worldMouse = new THREE.Vector3()
    this.scene.add(this.particles)
  }

  // project the cursor (NDC) onto the particle plane (~z = -1) so the
  // repulsion uniform lives in the same world space as the points
  _updateWorldMouse() {
    const v = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5)
    v.unproject(this.camera)
    const dir = v.sub(this.camera.position).normalize()
    const targetZ = -1
    const dist = (targetZ - this.camera.position.z) / dir.z
    this._worldMouse.copy(this.camera.position).add(dir.multiplyScalar(dist))
    return this._worldMouse
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
                this._applyFresnel(m)
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

  // Inject a fresnel rim glow into a model material without replacing it:
  // grazing-angle faces gain an emissive halo that the bloom pass lifts,
  // giving the jellyfish an ethereal backlit edge. Only touches materials
  // built on the standard/physical shader (where `normal` + `vViewPosition`
  // exist); skips anything else safely.
  _applyFresnel(mat) {
    if (!mat || !('emissive' in mat)) return
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uFresnelColor = { value: new THREE.Color(0x9fd0ff) }
      shader.uniforms.uFresnelPower = { value: 2.6 }
      shader.uniforms.uFresnelIntensity = { value: 1.5 }
      shader.fragmentShader =
        'uniform vec3 uFresnelColor;\nuniform float uFresnelPower;\nuniform float uFresnelIntensity;\n' +
        shader.fragmentShader.replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
           float _fres = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), uFresnelPower);
           totalEmissiveRadiance += uFresnelColor * _fres * uFresnelIntensity;`
        )
      mat.userData.fresnel = shader.uniforms
    }
    mat.needsUpdate = true
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
    this._applyResponsiveFov()
    this.renderer.setSize(w, h)
    this.composer.setSize(w, h)
    if (this._gradePass) {
      this._gradePass.uniforms.uAspect.value = w / h
      // lighter grain on small screens (and for reduced-motion users)
      this._gradePass.uniforms.uGrain.value = this._reducedMotion
        ? 0.02
        : w < 640
        ? 0.035
        : 0.05
    }
  }

  // On narrow / portrait screens a fixed vertical FOV magnifies the scene
  // horizontally, which blows the rotating title rings up past the screen
  // edges so they can't be read. Widen the vertical FOV as the viewport
  // gets narrower to keep the *horizontal* field of view roughly constant.
  _applyResponsiveFov() {
    const aspect = this.camera.aspect
    const ref = 1.6 // aspect at/above which the base FOV is used
    if (aspect >= ref) {
      this.camera.fov = this._baseFov
      this._zBoost = 0
    } else {
      const hFov = 2 * Math.atan(Math.tan((this._baseFov * Math.PI) / 360) * ref)
      const v = (2 * Math.atan(Math.tan(hFov / 2) / aspect) * 180) / Math.PI
      this.camera.fov = Math.min(v, 74)
      // FOV widening alone can't fully fit the large ring titles on very
      // narrow screens, so also ease the camera back the narrower it gets.
      this._zBoost = Math.min((ref / aspect - 1) * 1.6, 5)
    }
    this.camera.updateProjectionMatrix()
  }

  _animate() {
    requestAnimationFrame(this._animate)
    const dt = this.clock.getDelta()
    const t = this.clock.elapsedTime
    const spd = 0.2 + this.speed * 1.6

    if (this.mixer) this.mixer.update(dt * spd)

    // living dust: advance time + follow the cursor
    if (this._particleMat) {
      this._particleMat.uniforms.uTime.value = t
      // only repel once the pointer has actually moved, otherwise the
      // default (0,0) cursor would carve a hole in the scene centre
      if (this._pointerActive) {
        this._particleMat.uniforms.uMouse.value.copy(this._updateWorldMouse())
      }
    }

    // cinematic grade: aberration eases toward a scroll-velocity target
    if (this._gradePass) {
      const g = this._gradePass.uniforms
      g.uTime.value = t
      const p = this.scrollP || 0
      this._scrollVel += (Math.abs(p - this._prevScrollP) - this._scrollVel) * 0.15
      this._prevScrollP = p
      if (this._reducedMotion) {
        g.uAberration.value = 0
      } else {
        const gain = window.innerWidth < 640 ? 0.5 : 1
        const target = Math.min(0.001 + this._scrollVel * 0.4, 0.02) * gain
        g.uAberration.value += (target - g.uAberration.value) * 0.2
      }
    }

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
      const target = this.opts.cameraZ + (this._zBoost || 0) + this.scrollP * 1.0
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
