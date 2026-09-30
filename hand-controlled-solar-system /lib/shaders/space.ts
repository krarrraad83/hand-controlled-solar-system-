import { AdditiveBlending, BackSide, DoubleSide, ShaderMaterial, Vector3 } from 'three'
import { NOISE_GLSL, OUTPUT_GLSL, UV_VERTEX } from './common'

/** Normal of the Milky Way plane, tilted so the band crosses the default view diagonally. */
export const GALACTIC_NORMAL = new Vector3(0.8, 0.54, -0.26).normalize()

const DEFAULT_VIEW = new Vector3(0, -0.43, -0.9).normalize()
const CENTER_OFFSET = (35 * Math.PI) / 180

/** Galactic core direction: in the band, rotated away from the Sun so it isn't lost in the glare. */
export const GALACTIC_CENTER = DEFAULT_VIEW.clone()
  .multiplyScalar(Math.cos(CENTER_OFFSET))
  .add(new Vector3().crossVectors(GALACTIC_NORMAL, DEFAULT_VIEW).multiplyScalar(Math.sin(CENTER_OFFSET)))
  .normalize()

const SKY_VERTEX = /* glsl */ `
varying vec3 vWorldPos;

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldPos = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const SKY_FRAGMENT = /* glsl */ `
uniform vec3 uGalacticNormal;
uniform vec3 uGalacticCenter;

varying vec3 vWorldPos;

${NOISE_GLSL}

void main() {
  vec3 dir = normalize(vWorldPos);
  float b = dot(dir, uGalacticNormal);
  float band = exp(-b * b / 0.018);
  float wide = exp(-b * b / 0.12);
  float core = pow(max(dot(dir, uGalacticCenter), 0.0), 5.0);
  float n = fbm(dir * 3.0, 6) * 0.5 + 0.5;
  float n2 = fbm(dir * 9.0 + 5.0, 5) * 0.5 + 0.5;
  float lanes = exp(-b * b / 0.0035) * smoothstep(0.42, 0.7, fbm(dir * 6.0 + 11.0, 5) * 0.5 + 0.5);

  vec3 bandColor = mix(vec3(0.32, 0.36, 0.55), vec3(1.0, 0.78, 0.55), core);
  vec3 col = vec3(0.003, 0.004, 0.01);
  col += bandColor * band * (0.2 + 0.8 * n * n2) * (0.18 + core * 0.9);
  col += vec3(0.05, 0.06, 0.12) * wide * n * 0.6;
  col *= 1.0 - lanes * 0.8;

  float nebulaA = smoothstep(0.58, 0.9, fbm(dir * 2.0 + 31.0, 6) * 0.5 + 0.5);
  float nebulaB = smoothstep(0.6, 0.92, fbm(dir * 2.6 + 57.0, 6) * 0.5 + 0.5);
  col += vec3(0.5, 0.1, 0.32) * nebulaA * (0.25 + wide) * 0.22;
  col += vec3(0.06, 0.28, 0.42) * nebulaB * (0.25 + wide) * 0.2;

  float h = hash13(floor(dir * 700.0));
  float star = smoothstep(0.9965 - band * 0.012, 1.0, h);
  col += vec3(0.9, 0.92, 1.0) * star * 0.9;

  gl_FragColor = vec4(col, 1.0);
}
`

/** Procedural Milky Way, nebulae and faint star dust; rendered once into a cube map. */
export function createSkyMaterial() {
  return new ShaderMaterial({
    uniforms: {
      uGalacticNormal: { value: GALACTIC_NORMAL },
      uGalacticCenter: { value: GALACTIC_CENTER },
    },
    vertexShader: SKY_VERTEX,
    fragmentShader: SKY_FRAGMENT,
    side: BackSide,
    depthWrite: false,
  })
}

const POINTS_VERTEX = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;
attribute float aPhase;

uniform float uTime;
uniform float uPixelRatio;
uniform float uTwinkle;

varying vec3 vColor;
varying float vBright;
varying float vSpike;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float speed = 1.2 + fract(aPhase * 7.13) * 2.5;
  float twinkle = 1.0 - uTwinkle + uTwinkle * (0.55 + 0.45 * sin(uTime * speed + aPhase * 6.2831));
  vBright = twinkle;
  vColor = aColor;
  vSpike = step(6.5, aSize);
  gl_PointSize = aSize * uPixelRatio * (0.85 + 0.15 * twinkle);
}
`

const POINTS_FRAGMENT = /* glsl */ `
uniform float uIntensity;

varying vec3 vColor;
varying float vBright;
varying float vSpike;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float core = exp(-d * d * 60.0);
  float halo = exp(-d * d * 10.0) * 0.35;
  float spikes = (max(0.0, 1.0 - abs(uv.x) * 24.0) + max(0.0, 1.0 - abs(uv.y) * 24.0))
    * (1.0 - smoothstep(0.0, 0.5, d)) * 0.5 * vSpike;
  float alpha = (core + halo + spikes) * vBright * uIntensity;
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(vColor, alpha);
  ${OUTPUT_GLSL}
}
`

/** Soft round points with optional twinkle and diffraction spikes on the brightest stars. */
export function createPointsMaterial({ twinkle, intensity }: { twinkle: number; intensity: number }) {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uTwinkle: { value: twinkle },
      uIntensity: { value: intensity },
    },
    vertexShader: POINTS_VERTEX,
    fragmentShader: POINTS_FRAGMENT,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  })
}

const GALAXY_DISK_FRAGMENT = /* glsl */ `
uniform float uIntensity;

varying vec2 vUv;
varying vec3 vWorldPos;

${NOISE_GLSL}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float a = atan(p.y, p.x);
  float arms = pow(0.5 + 0.5 * cos(2.0 * a - log(r + 0.02) * 5.0), 3.0);
  float n = snoise(vec3(p * 5.0, 3.0)) * 0.5 + 0.5;
  float falloff = exp(-r * 3.2) * (1.0 - smoothstep(0.75, 1.0, r));
  float core = exp(-r * r * 70.0);
  vec3 armColor = mix(vec3(1.0, 0.82, 0.6), vec3(0.45, 0.6, 1.0), smoothstep(0.05, 0.5, r));
  vec3 col = armColor * arms * falloff * (0.4 + n * 0.6) * 0.55
    + vec3(1.0, 0.88, 0.7) * core * 1.4
    + armColor * falloff * 0.08;
  gl_FragColor = vec4(col * uIntensity, 1.0);
  ${OUTPUT_GLSL}
}
`

/** Diffuse glow under a distant spiral galaxy's star particles. */
export function createGalaxyDiskMaterial(intensity: number) {
  return new ShaderMaterial({
    uniforms: { uIntensity: { value: intensity } },
    vertexShader: UV_VERTEX,
    fragmentShader: GALAXY_DISK_FRAGMENT,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  })
}
