// Single source of truth for projects — used by the home rings,
// the work grid, and the project detail pages.

export const PROJECTS = [
  {
    slug: 'mintcoin',
    title: 'Mintcoin.fun',
    tags: 'Web3 / Solana / Product',
    year: '2024 — now',
    desc: 'A Solana token generator integrated with Raydium DEX — smart contract deployment, UI/UX and go-to-market.',
    img: '/images/work/mintcoin.svg',
    link: 'https://mintcoin.fun',
    role: 'Co-founder / Product & Growth',
    stack: 'Solana, Raydium, Web UI',
    body: [
      'Case study coming soon — this is placeholder copy for Oscar to replace with the full story: the problem, the build, and the launch.',
      'Cover: why a token generator, how the Raydium integration works, what the UX had to solve, and what user acquisition looked like.',
    ],
  },
  {
    slug: 'gpu-analyzer',
    title: 'GPU Marketplace Analyzer',
    tags: 'Python / Data Engineering',
    year: '2025',
    desc: 'Pipeline pulling 500+ live compute rental offers from the Vast.ai API into regression-ready DataFrames.',
    img: '/images/work/vastai.svg',
    link: null,
    role: 'Builder / Analyst',
    stack: 'Python, pandas, Vast.ai API',
    body: [
      'Case study coming soon — placeholder for the pipeline architecture, feature engineering (price, RAM, bandwidth, reliability), and findings.',
    ],
  },
  {
    slug: 'compute-cluster',
    title: 'AI Compute Cluster',
    tags: 'Hardware / Linux / Ops',
    year: '2020 — now',
    desc: 'GPU mining rigs and AI compute nodes — drivers, monitoring, power, cooling, overclocking, 24/7 uptime.',
    img: '/images/work/cluster.svg',
    link: null,
    role: 'Designer / Operator',
    stack: 'NVIDIA GPUs, Linux, monitoring',
    body: [
      'Case study coming soon — placeholder for the hardware layout, thermals and power design, and the ROI model based on energy and token yields.',
    ],
  },
  {
    slug: 'trajektory',
    title: 'Trajektory SEO & AEO',
    tags: 'SEO / Analytics',
    year: '2026',
    desc: '+363% non-branded organic impressions in the first month of focused SEO work. GSC, GA4, technical audits.',
    img: '/images/work/trajektory.svg',
    link: null,
    role: 'SEO & AEO Intern',
    stack: 'GSC, GA4, technical SEO',
    body: [
      'Case study coming soon — placeholder for the audit process, the keyword/AEO strategy, and the impressions growth story.',
    ],
  },
  {
    slug: 'avvenire',
    title: 'AvvenireNFT',
    tags: 'Web3 / Community',
    year: '2021 — 24',
    desc: 'Scaled a Web3 brand to 15,000+ members and shipped NFT launches with a distributed dev team.',
    img: '/images/work/avvenire.svg',
    link: null,
    role: 'Owner / Operator',
    stack: 'Community ops, NFT launches',
    body: [
      'Case study coming soon — placeholder for how the community was grown to 15,000+ members and what shipping the launches took.',
    ],
  },
  {
    slug: 'econometrics',
    title: 'Econometrics of AI Compute',
    tags: 'Research / Stata',
    year: '2025',
    desc: 'OLS and multivariate regressions over large AI compute datasets, with significance and diagnostic checks.',
    img: '/images/work/econ.svg',
    link: null,
    role: 'Researcher',
    stack: 'Stata, OLS, diagnostics',
    body: [
      'Case study coming soon — placeholder for the dataset, the regression design, and the stakeholder-ready findings.',
    ],
  },
]

export function getProject(slug) {
  return PROJECTS.find((p) => p.slug === slug) || null
}
