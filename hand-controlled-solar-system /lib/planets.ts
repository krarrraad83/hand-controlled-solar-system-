export type SurfaceStyle = 'rocky' | 'mars' | 'venus' | 'earth' | 'gas' | 'ice'

export type BodyFacts = {
  kind: string
  diameter: string
  day: string
  year: string
  moons: string
  summary: string
}

export type PlanetAtmosphere = {
  color: string
  /** Brightness of the halo and rim glow. */
  strength: number
  /** Halo shell radius relative to the planet radius. */
  scale: number
}

export type PlanetSpot = {
  /** Longitude and latitude in radians. */
  lon: number
  lat: number
  /** Half-extent in radians. */
  width: number
  height: number
  color: string
}

export type PlanetRing = {
  inner: number
  outer: number
  palette: string[]
  /** Radial position (0..1) of a dark division, or -1 for none. */
  gap: number
  opacity: number
  /** Multiplier for how many fine ringlets appear. */
  detail: number
}

export type PlanetData = {
  name: string
  radius: number
  distance: number
  /** Seconds of simulation time per orbit at 1x speed. */
  period: number
  phase: number
  spin: number
  tilt: number
  /** UI color for this body (dock dot, info card accent, orbit trail). */
  accent: string
  /** Surface colors A..E; their meaning depends on the surface style. */
  palette: string[]
  surface: SurfaceStyle
  bands?: number
  bump?: number
  streaks?: number
  spot?: PlanetSpot
  atmosphere?: PlanetAtmosphere
  ring?: PlanetRing
  hasMoon?: boolean
  facts: BodyFacts
}

export const SUN = {
  name: 'Sun',
  radius: 5,
  accent: '#ffb347',
  facts: {
    kind: 'G-type star',
    diameter: '1,392,700 km',
    day: '~27 Earth days',
    year: '230 My (galactic)',
    moons: '8 planets',
    summary: 'The star at the center of our system, holding 99.8% of its mass.',
  } satisfies BodyFacts,
}

export const MOON_PALETTE = ['#d6d1c8', '#9a958d', '#5f5b55']

const EARTH_PERIOD = 20

function period(earthYears: number) {
  return EARTH_PERIOD * Math.sqrt(earthYears)
}

export const PLANETS: PlanetData[] = [
  {
    name: 'Mercury',
    radius: 0.45,
    distance: 9,
    period: period(0.24),
    phase: 0.4,
    spin: 0.2,
    tilt: 0.01,
    accent: '#b5aea6',
    palette: ['#e0d8cc', '#9c948a', '#5e5852'],
    surface: 'rocky',
    bump: 0.035,
    facts: {
      kind: 'Terrestrial planet',
      diameter: '4,879 km',
      day: '59 Earth days',
      year: '88 Earth days',
      moons: '0',
      summary: 'The smallest planet and the closest to the Sun.',
    },
  },
  {
    name: 'Venus',
    radius: 0.9,
    distance: 13,
    period: period(0.62),
    phase: 2.1,
    spin: -0.1,
    tilt: 3.1,
    accent: '#e8c890',
    palette: ['#f7e6ba', '#e2bd7c', '#b8884b'],
    surface: 'venus',
    atmosphere: { color: '#ffd9a0', strength: 0.8, scale: 1.1 },
    facts: {
      kind: 'Terrestrial planet',
      diameter: '12,104 km',
      day: '243 Earth days',
      year: '225 Earth days',
      moons: '0',
      summary: 'The hottest planet, wrapped in thick clouds of carbon dioxide.',
    },
  },
  {
    name: 'Earth',
    radius: 1,
    distance: 17.5,
    period: period(1),
    phase: 4.2,
    spin: 1,
    tilt: 0.41,
    accent: '#4f8fe0',
    palette: ['#071d45', '#17609a', '#2f6a2c', '#b99c62'],
    surface: 'earth',
    bump: 0.012,
    atmosphere: { color: '#5aa9ff', strength: 1.2, scale: 1.12 },
    hasMoon: true,
    facts: {
      kind: 'Terrestrial planet',
      diameter: '12,742 km',
      day: '24 hours',
      year: '365.25 days',
      moons: '1',
      summary: 'Our home, and the only known world with liquid surface water and life.',
    },
  },
  {
    name: 'Mars',
    radius: 0.62,
    distance: 22.5,
    period: period(1.88),
    phase: 1.2,
    spin: 0.95,
    tilt: 0.44,
    accent: '#d9774a',
    palette: ['#b8420f', '#e08a52', '#652611'],
    surface: 'mars',
    bump: 0.025,
    atmosphere: { color: '#ff9a6a', strength: 0.4, scale: 1.06 },
    facts: {
      kind: 'Terrestrial planet',
      diameter: '6,779 km',
      day: '24.6 hours',
      year: '687 Earth days',
      moons: '2',
      summary: 'The red planet, home to Olympus Mons, the tallest volcano known.',
    },
  },
  {
    name: 'Jupiter',
    radius: 2.7,
    distance: 32,
    period: period(11.86),
    phase: 3.3,
    spin: 2.2,
    tilt: 0.05,
    accent: '#d8b48a',
    palette: ['#ecdcc2', '#b27a4b', '#86492a', '#f7f0e4', '#8f7a68'],
    surface: 'gas',
    bands: 22,
    spot: { lon: 0.6, lat: -0.38, width: 0.32, height: 0.14, color: '#c24f2a' },
    atmosphere: { color: '#f2d6ae', strength: 0.35, scale: 1.05 },
    facts: {
      kind: 'Gas giant',
      diameter: '139,820 km',
      day: '9.9 hours',
      year: '11.9 Earth years',
      moons: '95',
      summary: 'The largest planet, with a storm bigger than Earth: the Great Red Spot.',
    },
  },
  {
    name: 'Saturn',
    radius: 2.25,
    distance: 43,
    period: period(29.46),
    phase: 5.4,
    spin: 2,
    tilt: 0.47,
    accent: '#e3cf9e',
    palette: ['#f2e3ba', '#d4b47a', '#ad8a52', '#fbf4de', '#a79472'],
    surface: 'gas',
    bands: 18,
    atmosphere: { color: '#f5dfae', strength: 0.3, scale: 1.05 },
    ring: {
      inner: 1.25,
      outer: 2.35,
      palette: ['#e8d6a8', '#b59a6a', '#fff2cf'],
      gap: 0.62,
      opacity: 0.95,
      detail: 1,
    },
    facts: {
      kind: 'Gas giant',
      diameter: '116,460 km',
      day: '10.7 hours',
      year: '29.4 Earth years',
      moons: '146',
      summary: 'Famous for its spectacular rings made of ice and rock.',
    },
  },
  {
    name: 'Uranus',
    radius: 1.55,
    distance: 53,
    period: period(84),
    phase: 0.9,
    spin: -1.4,
    tilt: 1.71,
    accent: '#9fd8e0',
    palette: ['#abe6ec', '#8cd0dc', '#d6f4f6'],
    surface: 'ice',
    bands: 10,
    atmosphere: { color: '#9ff0ff', strength: 0.85, scale: 1.1 },
    ring: {
      inner: 1.6,
      outer: 1.95,
      palette: ['#6e8e94', '#4d6a70', '#8fb0b5'],
      gap: -1,
      opacity: 0.5,
      detail: 2.5,
    },
    facts: {
      kind: 'Ice giant',
      diameter: '50,724 km',
      day: '17.2 hours',
      year: '84 Earth years',
      moons: '28',
      summary: 'An ice giant that rolls around the Sun on its side.',
    },
  },
  {
    name: 'Neptune',
    radius: 1.5,
    distance: 62,
    period: period(164.8),
    phase: 2.7,
    spin: 1.5,
    tilt: 0.49,
    accent: '#5b82ea',
    palette: ['#3a5fd6', '#2743ab', '#7197f2', '#8fb0ff'],
    surface: 'ice',
    bands: 12,
    streaks: 0.6,
    spot: { lon: 2.0, lat: -0.35, width: 0.22, height: 0.12, color: '#15225f' },
    atmosphere: { color: '#5b8cff', strength: 0.95, scale: 1.1 },
    facts: {
      kind: 'Ice giant',
      diameter: '49,244 km',
      day: '16.1 hours',
      year: '164.8 Earth years',
      moons: '16',
      summary: 'The windiest planet, with supersonic storms of frozen methane.',
    },
  },
]

export const BODY_FACTS: Record<string, BodyFacts> = {
  [SUN.name]: SUN.facts,
  ...Object.fromEntries(PLANETS.map((p) => [p.name, p.facts])),
}

export const BODY_COLORS: Record<string, string> = {
  [SUN.name]: SUN.accent,
  ...Object.fromEntries(PLANETS.map((p) => [p.name, p.accent])),
}
