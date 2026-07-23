import '../css/main.css'
import gsap from 'gsap'
import { initHeader, bindNavLinks } from './header.js'
import { ModelScene } from './scene.js'
import { PROJECTS } from './projects-data.js'
import { initSmoothScroll } from './smooth-scroll.js'

initHeader()
initSmoothScroll()

// background scene: evanescent plasma drifting behind the grid
const scene = new ModelScene(document.getElementById('scene'), {
  modelUrl: '/models/evanescent_plasma.glb',
  cameraZ: 8,
  bloomStrength: 0.55,
  modelScale: 1.15,
})
scene.load().catch((e) => console.error('model load failed', e))

// dim the canvas so content stays readable
gsap.set('#scene', { opacity: 0.55 })

// ---------------------------------------------------------------
// Project grid (data shared with home rings + detail pages)
// ---------------------------------------------------------------
const grid = document.getElementById('works-grid')
PROJECTS.forEach((p, i) => {
  const a = document.createElement('a')
  a.className = 'work-card reveal'
  a.href = `/project.html?id=${p.slug}`
  a.setAttribute('data-nav', '')
  a.innerHTML = `
    <span class="num">[ ${String(i + 1).padStart(2, '0')} ]&nbsp;&nbsp;${p.year}</span>
    <div class="media"><img src="${p.img}" alt="${p.title}" loading="lazy" /></div>
    <div class="meta">
      <h3>${p.title}</h3>
      <span class="tags">${p.tags}</span>
    </div>
    <p class="desc">${p.desc}</p>
  `
  grid.appendChild(a)
})
bindNavLinks(grid)

// ---------------------------------------------------------------
// Reveal-on-scroll
// ---------------------------------------------------------------
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        gsap.to(e.target, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' })
        io.unobserve(e.target)
      }
    })
  },
  { threshold: 0.15 }
)
document.querySelectorAll('.reveal').forEach((el) => io.observe(el))

// scroll drives the background camera
window.addEventListener(
  'scroll',
  () => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    scene.setScroll(max > 0 ? window.scrollY / max : 0)
  },
  { passive: true }
)
