import gsap from 'gsap'
import { audio } from './audio.js'

// Shared header behavior: mobile menu, volume toggle,
// page-transition overlay on internal navigation.

// Navigate with the slide-up overlay transition (usable from anywhere).
export function navigateTo(href) {
  const transition = document.getElementById('transition')
  audio.click()
  sessionStorage.setItem('om-transition', '1')
  transition.classList.add('visible')
  gsap.fromTo(
    transition,
    { yPercent: 100 },
    {
      yPercent: 0,
      duration: 0.75,
      ease: 'power4.inOut',
      onComplete: () => {
        location.href = href
      },
    }
  )
}

// Attach the overlay transition to internal links. Call again for
// links added to the DOM after initHeader (e.g. the work grid).
export function bindNavLinks(scope) {
  scope.querySelectorAll('a[data-nav]').forEach((link) => {
    if (link._navBound) return
    link._navBound = true
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href')
      const current = location.pathname.replace(/\/$/, '') || '/'
      const target = href.split('?')[0].replace(/\/$/, '') || '/'
      const samePage = current === target || (current === '/index.html' && target === '/')
      if (samePage && !href.includes('?')) {
        e.preventDefault()
        return
      }
      e.preventDefault()
      navigateTo(href)
    })
  })
}

export function initHeader() {
  const transition = document.getElementById('transition')
  const menuSwitch = document.getElementById('menu-switch')
  const mobileMenu = document.getElementById('mobile-menu')
  const volumeToggle = document.getElementById('volume-toggle')
  const volumeStatus = document.getElementById('volume-status')

  // --- transition overlay: play "out" if we arrived via an internal link
  if (sessionStorage.getItem('om-transition') === '1') {
    sessionStorage.removeItem('om-transition')
    transition.classList.add('visible')
    gsap.to(transition, {
      yPercent: -100,
      duration: 0.9,
      ease: 'power4.inOut',
      delay: 0.35,
      onComplete: () => {
        transition.classList.remove('visible')
        gsap.set(transition, { yPercent: 100 })
      },
    })
  } else {
    gsap.set(transition, { yPercent: 100 })
  }

  // --- intercept internal nav links
  bindNavLinks(document)

  // --- mobile menu
  if (menuSwitch && mobileMenu) {
    menuSwitch.addEventListener('click', () => {
      audio.click()
      menuSwitch.classList.toggle('open')
      mobileMenu.classList.toggle('open')
    })
  }

  // --- volume toggle
  const syncVolumeUI = () => {
    if (!volumeStatus) return
    volumeStatus.textContent = audio.enabled ? 'on' : 'off'
    document.body.classList.toggle('muted', !audio.enabled)
  }
  syncVolumeUI()
  if (volumeToggle) {
    volumeToggle.addEventListener('click', () => {
      audio.toggle()
      syncVolumeUI()
    })
  }

  // resume ambient on first gesture for non-home pages
  const resume = () => {
    audio.start()
    window.removeEventListener('pointerdown', resume)
  }
  window.addEventListener('pointerdown', resume)

  // click sound on bracket links
  document.querySelectorAll('.bracket-link, .send').forEach((el) => {
    el.addEventListener('mouseenter', () => audio.click())
  })
}
