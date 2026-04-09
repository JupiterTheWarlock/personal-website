import * as THREE from 'three';

/**
 * ASCII post-processing shader
 * Converts rendered scene to ASCII character grid
 *
 * IMPORTANT: The shader source uses GLSL 300 es syntax (in/out, layout qualifiers).
 * Consumers MUST set `glslVersion: THREE.GLSL3` on the ShaderMaterial constructor
 * options when using these shaders. Omitting this will cause WebGL compilation errors.
 */

export const AsciiVertexShader = `
  out vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const AsciiFragmentShader = `
  uniform sampler2D tDiffuse;
  uniform vec2 resolution;
  uniform float charSize;
  uniform float invert;
  uniform vec3 color;

  in vec2 vUv;
  layout(location = 0) out vec4 fragColor;

  // ASCII character set ordered by brightness (dark to light)
  // .:-=+*#%@
  const float NUM_CHARS = 8.0;

  float getCharIndex(float brightness) {
    // Map brightness (0-1) to character index (0-7)
    if (invert > 0.5) {
      brightness = 1.0 - brightness;
    }
    return floor(brightness * (NUM_CHARS - 1.0));
  }

  void main() {
    // Calculate grid cell
    vec2 cellUV = floor(vUv * resolution / charSize) * charSize / resolution;
    vec2 cellCenter = cellUV + charSize * 0.5 / resolution;

    // Sample the original texture at cell center
    vec4 originalColor = texture(tDiffuse, cellCenter);

    // Calculate brightness
    float brightness = dot(originalColor.rgb, vec3(0.299, 0.587, 0.114));

    // Get character index based on brightness
    float charIndex = getCharIndex(brightness);

    // Create ASCII pattern based on character
    vec2 charUV = fract(vUv * resolution / charSize);
    float charPattern = 0.0;

    // Simple character representations
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

    fragColor = vec4(finalColor, 1.0);
  }
`;

export interface AsciiShaderConfig {
  charSize?: number;
  invert?: boolean;
  color?: [number, number, number];
}

export function getAsciiUniforms(config: AsciiShaderConfig, resolution: { width: number; height: number }) {
  return {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2(resolution.width, resolution.height) },
    charSize: { value: config.charSize || 8.0 },
    invert: { value: config.invert ? 1.0 : 0.0 },
    color: { value: new THREE.Vector3(...(config.color || [1, 1, 1])) }
  };
}
