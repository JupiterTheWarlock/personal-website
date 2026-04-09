'use client';

import { forwardRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer } from '@react-three/postprocessing';
import { Effect, BlendFunction } from 'postprocessing';
import { Uniform, Vector2, Vector3 } from 'three';
import type { AsciiShaderConfig } from './ascii-shader';

interface AsciiEffectProps {
  config?: AsciiShaderConfig;
  enabled?: boolean;
}

/**
 * Fragment shader adapted for the postprocessing library's Effect conventions.
 *
 * Uses the required `mainImage` function signature instead of GLSL3 `main()`.
 * - `inputBuffer` replaces `tDiffuse` (provided by the Effect infrastructure)
 * - `uv` replaces `vUv` (provided as a built-in varying)
 * - `inputColor` provides the pre-sampled color at this UV
 * - `outputColor` is the output to write to
 *
 * The character patterns and brightness-to-character mapping remain the same
 * as defined in ascii-shader.ts.
 */
const asciiFragmentShader = /* glsl */ `
uniform vec2 resolution;
uniform float charSize;
uniform float invert;
uniform vec3 color;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // Calculate grid cell
  vec2 cellUV = floor(uv * resolution / charSize) * charSize / resolution;
  vec2 cellCenter = cellUV + charSize * 0.5 / resolution;

  // Sample the input buffer at cell center
  vec4 originalColor = texture(inputBuffer, cellCenter);

  // Calculate brightness
  float brightness = dot(originalColor.rgb, vec3(0.299, 0.587, 0.114));

  // Invert if needed
  if (invert > 0.5) {
    brightness = 1.0 - brightness;
  }

  // Get character index based on brightness (0-7)
  float NUM_CHARS = 8.0;
  float charIndex = floor(brightness * (NUM_CHARS - 1.0));

  // Create ASCII pattern based on character
  vec2 charUV = fract(uv * resolution / charSize);
  float charPattern = 0.0;

  if (charIndex < 1.0) {
    // . - dot
    charPattern = distance(charUV, vec2(0.5)) < 0.2 ? 1.0 : 0.0;
  } else if (charIndex < 2.0) {
    // : - colon
    charPattern = (distance(charUV, vec2(0.5, 0.3)) < 0.15 ||
                   distance(charUV, vec2(0.5, 0.7)) < 0.15) ? 1.0 : 0.0;
  } else if (charIndex < 3.0) {
    // - - dash
    charPattern = abs(charUV.y - 0.5) < 0.15 ? 1.0 : 0.0;
  } else if (charIndex < 4.0) {
    // = - equals
    charPattern = (abs(charUV.y - 0.35) < 0.1 ||
                   abs(charUV.y - 0.65) < 0.1) ? 1.0 : 0.0;
  } else if (charIndex < 5.0) {
    // + - plus
    charPattern = (abs(charUV.x - 0.5) < 0.1 ||
                   abs(charUV.y - 0.5) < 0.1) ? 1.0 : 0.0;
  } else if (charIndex < 6.0) {
    // * - asterisk
    float d1 = abs(charUV.x - charUV.y);
    float d2 = abs(charUV.x - (1.0 - charUV.y));
    charPattern = (d1 < 0.15 || d2 < 0.15 ||
                   abs(charUV.x - 0.5) < 0.1 ||
                   abs(charUV.y - 0.5) < 0.1) ? 1.0 : 0.0;
  } else if (charIndex < 7.0) {
    // # - hash
    float grid = step(0.4, fract(charUV.x * 4.0)) + step(0.4, fract(charUV.y * 4.0));
    charPattern = grid > 0.0 ? 1.0 : 0.0;
  } else {
    // @ - at (full block approximation)
    charPattern = 1.0;
  }

  // Apply color tint
  vec3 finalColor = color * charPattern * brightness;

  outputColor = vec4(finalColor, 1.0);
}
`;

/**
 * Custom postprocessing Effect that wraps our ASCII shader.
 * Uses the postprocessing library's Effect base class so it integrates
 * with @react-three/postprocessing's EffectComposer.
 */
class AsciiEffectImpl extends Effect {
  constructor({
    resolution = new Vector2(800, 600),
    charSize = 8.0,
    invert = false,
    color = new Vector3(1, 1, 1),
  }: {
    resolution?: Vector2;
    charSize?: number;
    invert?: boolean;
    color?: Vector3;
  } = {}) {
    super('AsciiEffect', asciiFragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ['resolution', new Uniform(resolution)],
        ['charSize', new Uniform(charSize)],
        ['invert', new Uniform(invert ? 1.0 : 0.0)],
        ['color', new Uniform(color)],
      ]),
    });
  }
}

/**
 * React wrapper for the custom ASCII Effect.
 * Follows the @react-three/postprocessing custom effect pattern:
 * - Wraps the Effect in a <primitive> element
 * - Uses destructured primitive values as useMemo dependencies
 *   to avoid infinite re-creation from object references
 */
const AsciiEffectPass = forwardRef<
  AsciiEffectImpl,
  {
    resolution: Vector2;
    charSize: number;
    invert: boolean;
    color: Vector3;
  }
>(function AsciiEffectPass({ resolution, charSize, invert, color }, ref) {
  const effect = useMemo(
    () => new AsciiEffectImpl({ resolution, charSize, invert, color }),
    // Destructure to primitives to avoid infinite re-creation from object references.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resolution.x, resolution.y, charSize, invert, color.x, color.y, color.z],
  );

  useFrame(() => {
    if (effect.uniforms) {
      const resUniform = effect.uniforms.get('resolution');
      if (resUniform) {
        resUniform.value.set(resolution.x, resolution.y);
      }
    }
  });

  return <primitive ref={ref} object={effect} dispose={null} />;
});

export default function AsciiEffect({
  config = {},
  enabled = true,
}: AsciiEffectProps) {
  const { size } = useThree();

  // Destructure config to primitive values for stable useMemo dependencies
  const charSize = config.charSize ?? 8.0;
  const invert = config.invert ?? false;
  const colorArr = config.color ?? [1, 1, 1];

  const resolution = useMemo(
    () => new Vector2(size.width, size.height),
    [size.width, size.height],
  );

  const color = useMemo(
    () => new Vector3(colorArr[0], colorArr[1], colorArr[2]),
    [colorArr[0], colorArr[1], colorArr[2]],
  );

  return (
    <EffectComposer enabled={enabled}>
      <AsciiEffectPass
        resolution={resolution}
        charSize={charSize}
        invert={invert}
        color={color}
      />
    </EffectComposer>
  );
}
