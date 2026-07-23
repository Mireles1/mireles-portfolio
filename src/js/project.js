import '../css/main.css'
import gsap from 'gsap'
import { initHeader } from './header.js'
import { PROJECTS, getProject } from './projects-data.js'

initHeader()

const params = new URLSearchParams(location.search)
const project = getProject(params.get('id'))

if (!project) {
  location.replace('/work.html')
} else {
  const i = PROJECTS.indexOf(project)
  document.title = `${project.title} — Oscar Mireles`

  document.getElementById('pp-index').textContent =
    `[ ${String(i + 1).padStart(2, '0')} / ${String(PROJECTS.length).padStart(2, '0')} ]`
  document.getElementById('pp-title').textContent = project.title
  document.getElementById('pp-role').textContent = project.role
  document.getElementById('pp-stack').textContent = project.stack
  document.getElementById('pp-year').textContent = project.year
  document.getElementById('pp-tags').textContent = project.tags
  const img = document.getElementById('pp-img')
  img.src = project.img
  img.alt = project.title

  const body = document.getElementById('pp-body')
  project.body.forEach((par) => {
    const p = document.createElement('p')
    p.textContent = par
    body.appendChild(p)
  })

  if (project.link) {
    const visit = document.getElementById('pp-visit')
    visit.href = project.link
    visit.style.display = 'inline-block'
  }

  const prev = PROJECTS[(i - 1 + PROJECTS.length) % PROJECTS.length]
  const next = PROJECTS[(i + 1) % PROJECTS.length]
  document.getElementById('pp-prev').setAttribute('href', `/project.html?id=${prev.slug}`)
  document.getElementById('pp-next').setAttribute('href', `/project.html?id=${next.slug}`)

  gsap.from('.pp-wrapper > *', {
    opacity: 0,
    y: 34,
    duration: 1,
    stagger: 0.08,
    delay: 0.35,
    ease: 'power3.out',
  })
}
