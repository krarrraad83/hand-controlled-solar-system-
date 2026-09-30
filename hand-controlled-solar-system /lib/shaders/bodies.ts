import { AdditiveBlending, BackSide, Color, DoubleSide, ShaderMaterial, Vector3, Vector4 } from 'three'
import type { PlanetAtmosphere, PlanetRing, PlanetSpot, SurfaceStyle } from '@/lib/planets'
import { NOISE_GLSL, OUTPUT_GLSL, SURFACE_VERTEX, UV_VERTEX } from './common'

const SURFACE_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uRadius;
uniform float uSeed;
uniform float uBump;
uniform float uBands;
uniform float uStreaks;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform vec3 uColorD;
uniform vec3 uColorE;
uniform vec3 uAtmosphere;
uniform float uAtmosphereStrength;
uniform vec4 uSpot;
uniform vec3 uSpotColor;

varying vec3 vObjPos;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

${NOISE_GLSL}

const float SURFACE_PI = 3.14159265359;

#ifdef HAS_SPOT
vec3 applySpot(vec3 p, vec3 col, float t) {
  float lon = atan(p.z, p.x);
  float lat = asin(clamp(p.y, -1.0, 1.0));
  float dLon = mod(lon - uSpot.x + SURFACE_PI, 2.0 * SURFACE_PI) - SURFACE_PI;
  vec2 local = vec2(dLon * cos(lat) / uSpot.z, (lat - uSpot.y) / uSpot.w);
  float e = length(local);
  float angle = (1.0 - smoothstep(0.0, 1.2, e)) * 3.5 + t;
  float s = sin(angle);
  float c = cos(angle);
  vec2 swirl = mat2(c, -s, s, c) * local;
  float n = fbm(vec3(swirl * 2.2, uSeed), 4) * 0.5 + 0.5;
  float inside = 1.0 - smoothstep(0.7, 1.05, e);
  col = mix(col, uSpotColor * (0.7 + n * 0.6), inside);
  float collar = smoothstep(0.85, 1.05, e) * (1.0 - smoothstep(1.05, 1.4, e));
  return mix(col, uColorD, collar * 0.45);
}
#endif

void main() {
  vec3 p = normalize(vObjPos);
  vec3 geoN = normalize(vWorldNormal);
  vec3 L = normalize(-vWorldPos);
  vec3 V = normalize(cameraPosition - vWorldPos);
  float t = uTime;
  float height = 0.0;
  float specMask = 0.0;
  vec3 emission = vec3(0.0);
  vec3 col = uColorA;

#if defined(STYLE_ROCKY)
  float n = fbm(p * 3.0 + uSeed, 5) * 0.5 + 0.5;
  float cr = craters(p * 5.0 + uSeed, 0.5) + craters(p * 12.0 + uSeed * 1.7, 0.4) * 0.5 + craters(p * 28.0 + 3.0, 0.3) * 0.25;
  height = n * 0.6 + cr;
  col = mix(uColorC, uColorB, smoothstep(0.2, 0.8, n));
  col = mix(col, uColorA, smoothstep(0.5, 0.9, fbm(p * 7.0 + uSeed, 3) * 0.5 + 0.5) * 0.45);
  col *= 0.85 + clamp(cr, -0.5, 0.5) * 0.3;
#elif defined(STYLE_MARS)
  float n = fbm(p * 2.2 + uSeed, 6) * 0.5 + 0.5;
  float maria = smoothstep(0.48, 0.64, fbm(p * 1.4 + uSeed + 4.0, 5) * 0.5 + 0.5);
  float cr = craters(p * 7.0 + uSeed, 0.35);
  height = n * 0.8 + cr * 0.5;
  col = mix(uColorB, uColorA, smoothstep(0.3, 0.7, n));
  col = mix(col, uColorC, maria * 0.65);
  col *= 0.9 + clamp(cr, -0.5, 0.5) * 0.2;
  float cap = smoothstep(0.84, 0.9, abs(p.y) + fbm(p * 8.0, 3) * 0.04);
  col = mix(col, vec3(0.92, 0.9, 0.88), cap);
#elif defined(STYLE_VENUS)
  float w = fbm(p * 1.8 + vec3(t * 0.01, 0.0, -t * 0.01) + uSeed, 4);
  float c = fbm(vec3(p.x * 1.4, p.y * 5.0, p.z * 1.4) + w * 1.6, 5) * 0.5 + 0.5;
  float chevrons = sin(p.y * 6.0 + w * 3.0) * 0.5 + 0.5;
  col = mix(uColorC, uColorB, smoothstep(0.2, 0.8, c));
  col = mix(col, uColorA, chevrons * 0.3);
#elif defined(STYLE_EARTH)
  float cont = fbm(p * 1.6 + uSeed, 6) + 0.08 * fbm(p * 9.0, 3);
  float land = smoothstep(0.0, 0.03, cont - 0.02);
  float elev = fbm(p * 5.0 + uSeed + 11.0, 5) * 0.5 + 0.5;
  float latAbs = abs(p.y);
  vec3 ocean = mix(uColorA, uColorB, smoothstep(-0.25, 0.02, cont));
  float dry = smoothstep(0.45, 0.7, fbm(p * 2.5 + uSeed + 23.0, 4) * 0.5 + 0.5 + (0.35 - abs(latAbs - 0.28)) * 0.6);
  vec3 landCol = mix(uColorC, uColorC * 1.5, elev);
  landCol = mix(landCol, uColorD, dry);
  landCol = mix(landCol, vec3(0.42, 0.39, 0.35), smoothstep(0.66, 0.8, elev) * 0.6);
  col = mix(ocean, landCol, land);
  float ice = smoothstep(0.8, 0.86, latAbs + fbm(p * 6.0, 3) * 0.05);
  col = mix(col, vec3(0.9, 0.93, 0.97), ice);
  height = land * elev * 0.6;
  specMask = (1.0 - land) * (1.0 - ice);
  float cl = fbm(p * 2.6 + vec3(t * 0.004, 0.0, t * 0.002) + uSeed + 40.0, 6) * 0.5 + 0.5;
  float clouds = smoothstep(0.5, 0.72, cl);
  col = mix(col, vec3(1.0), clouds * 0.9);
  specMask *= 1.0 - clouds;
  float city = smoothstep(0.7, 0.85, fbm(p * 22.0 + uSeed, 3) * 0.5 + 0.5) * land * (1.0 - ice) * (1.0 - dry * 0.6);
  emission = vec3(1.0, 0.62, 0.28) * city * 1.4 * (1.0 - clouds * 0.85);
#elif defined(STYLE_GAS)
  float warp = fbm(vec3(p.x * 1.2, p.y * 5.0, p.z * 1.2) + vec3(0.0, 0.0, t * 0.015) + uSeed, 5);
  float lat = p.y + warp * 0.07;
  float b1 = sin(lat * uBands) * 0.5 + 0.5;
  float b2 = sin(lat * uBands * 2.3 + 1.7) * 0.5 + 0.5;
  float fine = fbm(vec3(p.x * 3.0, p.y * 30.0, p.z * 3.0) + warp + uSeed, 4) * 0.5 + 0.5;
  col = mix(uColorA, uColorB, smoothstep(0.25, 0.75, b1));
  col = mix(col, uColorC, smoothstep(0.55, 0.95, b2) * 0.65);
  col = mix(col, uColorD, smoothstep(0.45, 0.8, fine) * 0.35);
  col *= 0.88 + fine * 0.24;
  col = mix(col, uColorE, smoothstep(0.7, 0.98, abs(p.y)) * 0.6);
#elif defined(STYLE_ICE)
  float warp = fbm(vec3(p.x * 1.5, p.y * 4.0, p.z * 1.5) + t * 0.01 + uSeed, 4);
  float lat = p.y + warp * 0.05;
  float b = sin(lat * uBands) * 0.5 + 0.5;
  col = mix(uColorA, uColorB, b * 0.6);
  col = mix(col, uColorC, smoothstep(0.55, 0.95, abs(p.y)) * 0.5);
  float streak = smoothstep(0.62, 0.85, fbm(vec3(p.x * 2.5, p.y * 22.0, p.z * 2.5) + t * 0.03 + uSeed, 4) * 0.5 + 0.5);
  col = mix(col, vec3(0.95), streak * uStreaks);
#endif

#ifdef HAS_SPOT
  col = applySpot(p, col, t * 0.02);
#endif

  vec3 N = geoN;
#ifdef USE_BUMP
  N = perturbNormal(vWorldPos, geoN, height, uBump * uRadius);
#endif

  float geoNdl = dot(geoN, L);
  float light = clamp(dot(N, L) * 1.1, 0.0, 1.0) * smoothstep(-0.15, 0.15, geoNdl);
  float mu = max(dot(geoN, V), 0.0);

  vec3 color = col * (light * 1.35 + 0.02);
  color *= mix(0.72, 1.0, pow(mu, 0.4));
  vec3 H = normalize(L + V);
  color += vec3(1.0, 0.92, 0.8) * pow(max(dot(N, H), 0.0), 60.0) * specMask * light * 1.2;
  color += uAtmosphere * pow(1.0 - mu, 3.0) * smoothstep(-0.3, 0.6, geoNdl) * uAtmosphereStrength;
  color += emission * (1.0 - smoothstep(-0.25, 0.05, geoNdl));

  gl_FragColor = vec4(color, 1.0);
  ${OUTPUT_GLSL}
}
`

export type SurfaceOptions = {
  style: SurfaceStyle
  palette: string[]
  radius: number
  seed: number
  bands?: number
  bump?: number
  streaks?: number
  spot?: PlanetSpot
  atmosphere?: PlanetAtmosphere
}

export function createSurfaceMaterial(options: SurfaceOptions) {
  const colors = [...options.palette]
  while (colors.length < 5) colors.push(colors[colors.length - 1])
  const defines: Record<string, string> = { [`STYLE_${options.style.toUpperCase()}`]: '' }
  if (options.bump) defines.USE_BUMP = ''
  if (options.spot) defines.HAS_SPOT = ''

  return new ShaderMaterial({
    defines,
    uniforms: {
      uTime: { value: 0 },
      uRadius: { value: options.radius },
      uSeed: { value: options.seed },
      uBump: { value: options.bump ?? 0 },
      uBands: { value: options.bands ?? 20 },
      uStreaks: { value: options.streaks ?? 0 },
      uColorA: { value: new Color(colors[0]) },
      uColorB: { value: new Color(colors[1]) },
      uColorC: { value: new Color(colors[2]) },
      uColorD: { value: new Color(colors[3]) },
      uColorE: { value: new Color(colors[4]) },
      uAtmosphere: { value: new Color(options.atmosphere?.color ?? '#000000') },
      uAtmosphereStrength: { value: options.atmosphere ? options.atmosphere.strength * 0.6 : 0 },
      uSpot: {
        value: options.spot
          ? new Vector4(options.spot.lon, options.spot.lat, options.spot.width, options.spot.height)
          : new Vector4(),
      },
      uSpotColor: { value: new Color(options.spot?.color ?? '#000000') },
    },
    vertexShader: SURFACE_VERTEX,
    fragmentShader: SURFACE_FRAGMENT,
  })
}

const ATMOSPHERE_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uStrength;
uniform vec3 uCenter;
uniform float uEdge;

varying vec3 vObjPos;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 V = normalize(cameraPosition - vWorldPos);
  float x = clamp(-dot(N, V) / uEdge, 0.0, 1.0);
  float glow = pow(x, 3.0);
  vec3 toSun = normalize(-uCenter);
  float sunSide = smoothstep(-0.5, 0.5, dot(normalize(vWorldPos - uCenter), toSun));
  gl_FragColor = vec4(uColor * glow * uStrength * (0.08 + 0.92 * sunSide), 1.0);
  ${OUTPUT_GLSL}
}
`

/** Back-face shell that produces a soft atmospheric halo around the planet limb. */
export function createAtmosphereMaterial(atmosphere: PlanetAtmosphere) {
  return new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(atmosphere.color) },
      uStrength: { value: atmosphere.strength },
      uCenter: { value: new Vector3() },
      uEdge: { value: Math.sqrt(1 - 1 / (atmosphere.scale * atmosphere.scale)) },
    },
    vertexShader: SURFACE_VERTEX,
    fragmentShader: ATMOSPHERE_FRAGMENT,
    side: BackSide,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  })
}

const RING_FRAGMENT = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uOpacity;
uniform vec3 uCenter;
uniform float uPlanetRadius;
uniform float uSeed;
uniform float uGap;
uniform float uDetail;

varying vec2 vUv;
varying vec3 vWorldPos;

${NOISE_GLSL}

void main() {
  float r = vUv.x;
  float n1 = snoise(vec3(r * 18.0 * uDetail, uSeed, 0.0));
  float n2 = snoise(vec3(r * 70.0 * uDetail, uSeed + 3.0, 0.0));
  float n3 = snoise(vec3(r * 220.0 * uDetail, uSeed + 7.0, 0.0));
  float density = clamp(0.55 + n1 * 0.3 + n2 * 0.2 + n3 * 0.12, 0.0, 1.0);
  density *= smoothstep(0.0, 0.05, r) * (1.0 - smoothstep(0.93, 1.0, r));
  density *= mix(1.0, 0.06, 1.0 - smoothstep(0.0, 0.025, abs(r - uGap)));
  density *= mix(0.35, 1.0, smoothstep(0.1, 0.22, r));

  vec3 col = mix(uColorA, uColorB, n1 * 0.5 + 0.5);
  col = mix(col, uColorC, (n2 * 0.5 + 0.5) * 0.5);

  vec3 toSun = normalize(-vWorldPos);
  vec3 oc = vWorldPos - uCenter;
  float b = dot(oc, toSun);
  float r2 = uPlanetRadius * uPlanetRadius;
  float h = b * b - (dot(oc, oc) - r2);
  float shadow = b < 0.0 ? smoothstep(-0.06 * r2, 0.06 * r2, h) : 0.0;
  float lit = 0.12 + 0.88 * (1.0 - shadow);

  gl_FragColor = vec4(col * lit * 1.15, density * uOpacity);
  ${OUTPUT_GLSL}
}
`

export function createRingMaterial(ring: PlanetRing, planetRadius: number, seed: number) {
  return new ShaderMaterial({
    uniforms: {
      uColorA: { value: new Color(ring.palette[0]) },
      uColorB: { value: new Color(ring.palette[1]) },
      uColorC: { value: new Color(ring.palette[2] ?? ring.palette[0]) },
      uOpacity: { value: ring.opacity },
      uCenter: { value: new Vector3() },
      uPlanetRadius: { value: planetRadius },
      uSeed: { value: seed },
      uGap: { value: ring.gap },
      uDetail: { value: ring.detail },
    },
    vertexShader: UV_VERTEX,
    fragmentShader: RING_FRAGMENT,
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
  })
}

const ORBIT_VERTEX = /* glsl */ `
attribute float aAngle;
varying float vAngle;

void main() {
  vAngle = aAngle;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const ORBIT_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uPlanetAngle;
uniform float uBase;
uniform float uTrail;

varying float vAngle;

void main() {
  float behind = fract((vAngle + uPlanetAngle) / 6.28318530718);
  float trail = pow(1.0 - behind, 5.0);
  gl_FragColor = vec4(uColor, uBase + trail * uTrail);
  ${OUTPUT_GLSL}
}
`

/** Orbit line that glows brightest just behind the planet, fading into a comet-like trail. */
export function createOrbitMaterial(color: string) {
  return new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(color) },
      uPlanetAngle: { value: 0 },
      uBase: { value: 0.05 },
      uTrail: { value: 0.45 },
    },
    vertexShader: ORBIT_VERTEX,
    fragmentShader: ORBIT_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
}

const SUN_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uIntensity;

varying vec3 vObjPos;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

${NOISE_GLSL}

void main() {
  vec3 p = normalize(vObjPos);
  vec3 N = normalize(vWorldNormal);
  vec3 V = normalize(cameraPosition - vWorldPos);
  float t = uTime * 0.04;
  float large = fbm(p * 2.5 + vec3(t, -t, t * 0.5), 5) * 0.5 + 0.5;
  float cells = fbm(p * 9.0 + vec3(-t * 2.0, t * 1.5, 0.0) + large, 4) * 0.5 + 0.5;
  float granules = snoise(p * 45.0 + vec3(t * 4.0)) * 0.5 + 0.5;
  float heat = large * 0.55 + cells * 0.35 + granules * 0.15;

  vec3 col = mix(vec3(0.85, 0.18, 0.02), vec3(1.0, 0.55, 0.08), smoothstep(0.25, 0.55, heat));
  col = mix(col, vec3(1.0, 0.9, 0.55), smoothstep(0.55, 0.85, heat));
  float spots = smoothstep(0.68, 0.74, fbm(p * 3.2 + 17.0 + vec3(t * 0.3), 4) * 0.5 + 0.5);
  col = mix(col, col * 0.25, spots);

  float mu = clamp(dot(N, V), 0.0, 1.0);
  col *= 0.45 + 0.55 * pow(mu, 0.45);
  col += vec3(1.0, 0.45, 0.1) * pow(1.0 - mu, 2.5) * 0.8;

  gl_FragColor = vec4(col * uIntensity, 1.0);
  ${OUTPUT_GLSL}
}
`

export function createSunMaterial() {
  return new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uIntensity: { value: 2.6 } },
    vertexShader: SURFACE_VERTEX,
    fragmentShader: SUN_FRAGMENT,
  })
}

const CORONA_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uDisc;

varying vec2 vUv;
varying vec3 vWorldPos;

${NOISE_GLSL}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float a = atan(p.y, p.x);
  float rn = max(r - uDisc, 0.0) / (1.0 - uDisc);
  float t = uTime * 0.05;
  float rays = fbm(vec3(cos(a) * 2.5, sin(a) * 2.5, t), 4) * 0.5 + 0.5;
  float fineRays = snoise(vec3(cos(a) * 9.0, sin(a) * 9.0, t * 1.6)) * 0.5 + 0.5;
  float glow = exp(-rn * 5.0) * 0.65 + exp(-rn * 14.0) * 0.9;
  float streaks = pow(rays, 2.0) * exp(-rn * 3.0) * 0.9 + pow(fineRays, 4.0) * exp(-rn * 6.0) * 0.5;
  float intensity = (glow + streaks) * (1.0 - smoothstep(0.8, 1.0, r));
  vec3 col = mix(vec3(1.0, 0.42, 0.1), vec3(1.0, 0.85, 0.55), exp(-rn * 6.0));
  gl_FragColor = vec4(col * intensity, 1.0);
  ${OUTPUT_GLSL}
}
`

/** Camera-facing plane with animated coronal streamers around the Sun. */
export function createCoronaMaterial(discFraction: number) {
  return new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uDisc: { value: discFraction } },
    vertexShader: UV_VERTEX,
    fragmentShader: CORONA_FRAGMENT,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  })
}
