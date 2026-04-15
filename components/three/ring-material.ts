import * as THREE from 'three';

/**
 * Procedural Jupiter ring shader with noise bands and rotation
 */
export const ringVertexShader = `
  out vec2 vUv;
  out vec3 vPosition;

  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const ringFragmentShader = `
  uniform float time;
  uniform float speed;

  in vec2 vUv;
  in vec3 vPosition;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float sum = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      sum += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return sum;
  }

  layout(location = 0) out vec4 fragColor;

  void main() {
    // Convert to polar coordinates from vertex position (ring lies in XY plane)
    float radius = length(vPosition.xy);
    float angle = atan(vPosition.y, vPosition.x);

    // Normalize radial: inner=4.5, outer=6.0
    float innerR = 4.5;
    float outerR = 6.0;
    float radial = clamp((radius - innerR) / (outerR - innerR), 0.0, 1.0);

    // Ring color palette
    vec3 color1 = vec3(0.78, 0.68, 0.52); // Light tan
    vec3 color2 = vec3(0.65, 0.52, 0.38); // Medium brown
    vec3 color3 = vec3(0.55, 0.42, 0.30); // Darker brown

    // Radial band structure — concentric rings with noise distortion
    float bandFreq = 30.0;
    float bandNoise = fbm(vec2(radial * bandFreq, time * 0.02 * speed));
    float bands = sin(radial * bandFreq + bandNoise * 2.5);

    // Azimuthal noise — swirl detail around the ring (uses polar angle)
    float swirl = fbm(vec2(angle * 6.0 + radial * 8.0, time * 0.05 * speed));
    float swirlDetail = fbm(vec2(angle * 12.0 - radial * 4.0, time * 0.03 * speed + 3.0));

    // Combine: bands distorted by azimuthal swirl
    float ringPattern = smoothstep(-0.15, 0.15, bands);
    ringPattern *= (0.7 + 0.3 * swirl);

    vec3 color = mix(color2, color1, ringPattern * 0.7);
    color = mix(color, color3, smoothstep(0.5, 0.8, swirlDetail) * 0.25);
    color = mix(color, color1, smoothstep(0.4, 0.7, swirl) * 0.15);

    // Edge fade — rings thin out at inner and outer edges
    float edgeFade = smoothstep(0.0, 0.1, radial) * smoothstep(1.0, 0.9, radial);

    // Azimuthal brightness variation
    float azBrightness = 0.85 + 0.15 * fbm(vec2(angle * 8.0 + time * 0.04 * speed, radial * 12.0));
    color *= azBrightness;

    float alpha = edgeFade * (0.4 + 0.3 * ringPattern + 0.1 * swirlDetail);

    fragColor = vec4(color, alpha);
  }
`;

export interface RingMaterialConfig {
  speed?: number;
}

export function createRingMaterial(config: RingMaterialConfig = {}): THREE.ShaderMaterial {
  const { speed = 1.0 } = config;

  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    uniforms: {
      time: { value: 0 },
      speed: { value: speed }
    },
    vertexShader: ringVertexShader,
    fragmentShader: ringFragmentShader
  });
}

export function updateRingMaterial(material: THREE.ShaderMaterial, deltaTime: number): void {
  if (material.uniforms.time) {
    material.uniforms.time.value += deltaTime * 0.5;
  }
}
