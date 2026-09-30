'use client'

import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

/** Bloom makes the Sun, city lights and bright stars glow; ACES keeps HDR colors filmic. */
export function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.8} luminanceSmoothing={0.25} radius={0.75} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.3} darkness={0.55} />
    </EffectComposer>
  )
}
