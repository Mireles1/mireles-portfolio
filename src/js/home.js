import '../css/main.css'
import gsap from 'gsap'
import { initHeader, navigateTo } from './header.js'
import { audio } from './audio.js'
import { ModelScene } from './scene.js'
import { TextRings } from './rings.js'
import { PROJECTS } from './projects-data.js'

initHeader()
document.body.classList.add('locked')

// ---------------------------------------------------------------
// Left decorative bar: crosses + SEO / AI / ECON / WEB3
// ---------------------------------------------------------------
const LB_VALUES = ['SEO', 'AI', 'ECON', 'WEB3']
const lbParent = document.getElementById('left-bar-parent')
LB_VALUES.forEach((v) => {
  for (let i = 0; i < 4; i++) {
    const c = document.createElement('div')
    c.className = 'cross'
    c.textContent = '+'
    lbParent.appendChild(c)
  }
  const val = document.createElement('div')
  val.className = 'value'
  val.textContent = v
  lbParent.appendChild(val)
})
for (let i = 0; i < 4; i++) {
  const c = document.createElement('div')
  c.className = 'cross'
  c.textContent = '+'
  lbParent.appendChild(c)
}
// cycle the highlighted value
let lbIndex = 0
setInterval(() => {
  const values = lbParent.querySelectorAll('.value')
  values.forEach((v) => v.classList.remove('active'))
  values[lbIndex % values.length].classList.add('active')
  lbIndex++
}, 1600)

// ---------------------------------------------------------------
// 3D scene + preloader
// ---------------------------------------------------------------
const scene = new ModelScene(document.getElementById('scene'), {
  modelUrl: '/models/blue_jellyfish.glb',
  cameraZ: 6.4,
  bloomStrength: 0.9,
})

const preloader = document.getElementById('preloader')
const loadFill = document.getElementById('load-fill')
const loadValue = document.getElementById('load-value')

let displayed = 0
let real = 0
// smooth the progress number so it never jumps
const progressTick = setInterval(() => {
  displayed += (real - displayed) * 0.12 + 0.15
  displayed = Math.min(displayed, real)
  loadValue.textContent = Math.round(displayed)
  gsap.set(loadFill, { scaleX: displayed / 100 })
  if (displayed >= 100) clearInterval(progressTick)
}, 40)

// rotating project-title rings around the jellyfish; clicking a
// segment opens that project's detail page
const rings = new TextRings(scene, PROJECTS, {
  onSelect: (p) => navigateTo(`/project.html?id=${p.slug}`),
})

scene
  .load((p) => (real = Math.max(real, Math.round(p * 100))))
  .then(() => {
    real = 100
    setTimeout(() => preloader.classList.add('ready'), 700)
  })
  .catch((err) => {
    console.error('model load failed', err)
    real = 100
    setTimeout(() => preloader.classList.add('ready'), 700)
  })

document.getElementById('start-btn').addEventListener('click', () => {
  audio.start()
  audio.click()
  document.body.classList.remove('locked')
  gsap.to(preloader, {
    yPercent: -100,
    duration: 1.1,
    ease: 'power4.inOut',
    onComplete: () => preloader.remove(),
  })
  introduceScene()
})

// ---------------------------------------------------------------
// Scene text choreography (scroll-driven)
// ---------------------------------------------------------------
const bottomTexts = [...document.querySelectorAll('.bottom-text')]
const leftText = document.querySelector('.left-text')
const rightText = document.querySelector('.right-text')
let currentText = -1

function showText(i) {
  if (i === currentText) return
  bottomTexts.forEach((el, k) => {
    gsap.to(el, {
      opacity: k === i ? 1 : 0,
      y: k === i ? 0 : 18,
      duration: 0.8,
      ease: 'power3.out',
    })
  })
  currentText = i
}

function introduceScene() {
  showText(0)
  gsap.to([leftText, rightText], {
    opacity: 1,
    duration: 1.2,
    delay: 0.6,
    ease: 'power2.out',
  })
  gsap.fromTo(
    '.customize, .social-links-global-parent, .left-bar, .right-bar',
    { opacity: 0 },
    { opacity: 1, duration: 1, delay: 0.4 }
  )
}

// ---------------------------------------------------------------
// Scroll: progress %, text swapping, camera drift
// ---------------------------------------------------------------
const scrollProgress = document.getElementById('scroll-progress')
let lastScrollY = window.scrollY
function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight
  const p = max > 0 ? window.scrollY / max : 0
  scrollProgress.textContent = `${Math.round(p * 100)}%`
  scene.setScroll(p)
  rings.addVelocity((window.scrollY - lastScrollY) * 0.00035)
  rings.setScroll(p)
  lastScrollY = window.scrollY

  if (!document.body.classList.contains('locked')) {
    const idx = Math.min(bottomTexts.length - 1, Math.floor(p * 3.4))
    showText(idx)
    // fade HUD near footer
    const fade = p > 0.8 ? 1 - (p - 0.8) / 0.2 : 1
    gsap.set('.scene-texts, .left-bar, .right-bar', { opacity: fade })
  }
}
window.addEventListener('scroll', onScroll, { passive: true })
onScroll()

// ---------------------------------------------------------------
// Customize panel
// ---------------------------------------------------------------
const customize = document.getElementById('customize')
const toggle = document.getElementById('customize-toggle')
toggle.addEventListener('click', () => {
  audio.click()
  customize.classList.toggle('open')
  toggle.textContent = customize.classList.contains('open') ? 'close' : 'customize me'
})

// color swatches
const SWATCHES = [
  '#7db8ff', '#4f7dff', '#2fd4e0', '#31e3a5', '#8f7bff', '#c06bff',
  '#ff6bd8', '#ff5c7a', '#ff7a45', '#ffb02e', '#ffe14d', '#b8ff5c',
  '#69ff8e', '#3affd4', '#7adfff', '#5c9dff', '#9db1ff', '#d7a2ff',
  '#ff9ecb', '#ffb199', '#fff3b0', '#d0ffa2', '#a2ffd9', '#a2e9ff',
  '#ffffff', '#c9c9c9', '#8a8a8a', '#ff2e2e', '#2e64ff', '#00ffc3',
  '#ff00e5', '#00a2ff', '#ffd000', '#7cff00', '#ff6a00', '#0026ff',
]
const swatchesEl = document.getElementById('color-swatches')
SWATCHES.forEach((hex) => {
  const d = document.createElement('div')
  d.className = 'color'
  d.style.background = hex
  d.addEventListener('click', () => {
    audio.click()
    swatchesEl.querySelectorAll('.color').forEach((c) => c.classList.remove('active'))
    d.classList.add('active')
    scene.setColor(hex)
  })
  swatchesEl.appendChild(d)
})

// quick options row (2 colors + 2 patterns), like the reference's selected-menu
const quick = document.getElementById('quick-options')
const quickDefs = [
  { type: 'color', value: '#7db8ff' },
  { type: 'color', value: '#c06bff' },
  { type: 'pattern', value: 'solid', label: '●' },
  { type: 'pattern', value: 'wire', label: '◌' },
]
quickDefs.forEach((q) => {
  const d = document.createElement('div')
  d.className = 'item'
  if (q.type === 'color') {
    d.style.background = q.value
    d.addEventListener('click', () => {
      audio.click()
      scene.setColor(q.value)
    })
  } else {
    d.style.display = 'flex'
    d.style.alignItems = 'center'
    d.style.justifyContent = 'center'
    d.style.fontSize = '10px'
    d.style.color = 'rgba(255,255,255,.7)'
    d.textContent = q.label
    d.addEventListener('click', () => {
      audio.click()
      scene.setPattern(q.value)
    })
  }
  quick.appendChild(d)
})

// sliders
const glowSlider = document.getElementById('glow-slider')
const glowValue = document.getElementById('glow-value')
glowSlider.addEventListener('input', () => {
  glowValue.textContent = glowSlider.value
  scene.setGlow(glowSlider.value / 100)
})

const speedSlider = document.getElementById('speed-slider')
const speedValue = document.getElementById('speed-value')
speedSlider.addEventListener('input', () => {
  const v = speedSlider.value / 100
  speedValue.textContent = (v * 0.1).toFixed(2)
  scene.setSpeed(v)
})

document.getElementById('restart-btn').addEventListener('click', () => {
  audio.click()
  scene.reset()
  glowSlider.value = 60
  glowValue.textContent = '60'
  speedSlider.value = 40
  speedValue.textContent = '0.04'
  swatchesEl.querySelectorAll('.color').forEach((c) => c.classList.remove('active'))
})

// hide HUD extras until intro
gsap.set('.customize, .social-links-global-parent, .left-bar, .right-bar', { opacity: 0 })
