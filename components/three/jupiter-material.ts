import * as THREE from 'three';

/**
 * Procedural Jupiter texture shader
 * Creates horizontal bands with noise and animated Great Red Spot
 */
export const jupiterVertexShader = `
  out vec2 vUv;
  out vec3 vNormal;
  out vec3 vPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const jupiterFragmentShader = `
  uniform float time;
  uniform float speed;

  in vec2 vUv;
  in vec3 vNormal;
  in vec3 vPosition;

  // Noise functions
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
    for(int i = 0; i < 5; i++) {
      sum += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return sum;
  }

  layout(location = 0) out vec4 fragColor;

  void main() {
    // Enhanced Jupiter palette — warm oranges and browns
    vec3 color1 = vec3(0.90, 0.72, 0.50); // Light orange-tan
    vec3 color2 = vec3(0.78, 0.55, 0.35); // Medium brown-orange
    vec3 color3 = vec3(0.50, 0.32, 0.22); // Dark chocolate
    vec3 color4 = vec3(0.95, 0.82, 0.60); // Cream highlight
    vec3 spotColor = vec3(0.85, 0.35, 0.25); // Vivid red spot

    float latitude = vUv.y;
    float longitude = vUv.x;

    // Distorted band pattern using fbm noise
    float bandNoise = fbm(vec2(latitude * 25.0, time * 0.03 * speed));
    float bandEdge = fbm(vec2(latitude * 12.0 + 3.7, time * 0.02 * speed));

    // Create 6-7 visible bands (Jupiter has distinct horizontal bands)
    float bandPattern = sin(latitude * 18.0 + bandEdge * 1.5);
    float bandDetail = sin(latitude * 40.0 + bandNoise * 2.0) * 0.15;

    // Mix band colors
    vec3 color = mix(color1, color2, smoothstep(-0.3, 0.3, bandPattern));
    color = mix(color, color3, smoothstep(0.1, 0.6, bandPattern + bandDetail));
    color = mix(color, color4, smoothstep(-0.8, -0.5, bandPattern) * 0.4);

    // Swirling horizontal detail (jet streams)
    float swirl = fbm(vec2(longitude * 15.0 + latitude * 5.0, time * 0.05 * speed));
    color = mix(color, color3, smoothstep(0.4, 0.7, swirl) * 0.3);

    // Great Red Spot — larger and more visible
    float spotLatitude = 0.62;
    float spotLongitude = mod(time * 0.08 * speed, 1.4) - 0.2;

    vec2 spotUV = vec2((vUv.x - spotLongitude) * 1.5, (vUv.y - spotLatitude) * 2.2);
    float distToSpot = length(spotUV);
    float spotSize = 0.12;

    // Spot with swirling edge
    float spot = smoothstep(spotSize, spotSize * 0.3, distToSpot);
    float spotSwirl = fbm(vec2(spotUV * 8.0 + time * 0.1 * speed));
    spot *= smoothstep(0.3, 0.6, spotSwirl) * 0.4 + 0.6;

    vec3 spotFinal = mix(spotColor, vec3(0.70, 0.28, 0.20), spotSwirl * 0.5);
    color = mix(color, spotFinal, spot);

    // Lighting — stronger contrast
    vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0));
    float diff = max(dot(vNormal, lightDir), 0.0);
    float ambient = 0.35;

    // Limb darkening
    float limb = pow(max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 0.4);

    color *= (ambient + diff * 0.65) * limb;

    fragColor = vec4(color, 1.0);
  }
`;

export interface JupiterMaterialConfig {
  speed?: number;
}

export function createJupiterMaterial(config: JupiterMaterialConfig = {}): THREE.ShaderMaterial {
  const { speed = 1.0 } = config;

  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: {
      time: { value: 0 },
      speed: { value: speed }
    },
    vertexShader: jupiterVertexShader,
    fragmentShader: jupiterFragmentShader
  });
}

export function updateJupiterMaterial(material: THREE.ShaderMaterial, deltaTime: number): void {
  if (material.uniforms.time) {
    material.uniforms.time.value += deltaTime * 0.5;
  }
}
