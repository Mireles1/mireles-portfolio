import '../css/main.css'
import gsap from 'gsap'
import { initHeader } from './header.js'
import { ModelScene } from './scene.js'
import { initSmoothScroll } from './smooth-scroll.js'

initHeader()
initSmoothScroll()

// crystal shard slowly rotating behind the contact info
const scene = new ModelScene(document.getElementById('scene'), {
  modelUrl: '/models/crystal_shard.glb',
  cameraZ: 7,
  bloomStrength: 0.7,
  modelScale: 0.9,
})
scene
  .load()
  .then(() => {
    scene.setColor('#4f7dff')
    scene.setGlow(0.35)
  })
  .catch((e) => console.error('model load failed', e))
gsap.set('#scene', { opacity: 0.38 })

gsap.to('.reveal', {
  opacity: 1,
  y: 0,
  duration: 1.1,
  stagger: 0.12,
  delay: 0.4,
  ease: 'power3.out',
})
