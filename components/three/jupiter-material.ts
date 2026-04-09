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

  // Simple noise function
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
    for(int i = 0; i < 4; i++) {
      sum += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return sum;
  }

  layout(location = 0) out vec4 fragColor;

  void main() {
    // Base Jupiter colors
    vec3 color1 = vec3(0.85, 0.75, 0.65); // Light tan
    vec3 color2 = vec3(0.65, 0.50, 0.40); // Brown
    vec3 color3 = vec3(0.45, 0.35, 0.30); // Dark brown
    vec3 spotColor = vec3(0.75, 0.35, 0.30); // Red spot

    // Latitude-based bands with noise
    float latitude = vUv.y;
    float bandNoise = fbm(vec2(latitude * 20.0, time * 0.05 * speed));

    vec3 color = mix(color1, color2, latitude + bandNoise * 0.3);
    color = mix(color, color3, sin(latitude * 15.0 + bandNoise) * 0.5 + 0.5);

    // Great Red Spot
    float spotLatitude = 0.65;
    float spotLongitude = mod(time * 0.1 * speed, 1.0);

    float distToSpot = distance(
      vec2(vUv.x, vUv.y),
      vec2(spotLongitude, spotLatitude)
    );

    // Elliptical spot
    float spotSize = 0.08;
    float spot = smoothstep(spotSize, spotSize * 0.5, distToSpot);

    // Blend spot with surrounding area
    color = mix(color, spotColor, spot);

    // Lighting
    vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0));
    float diff = max(dot(vNormal, lightDir), 0.0);
    float ambient = 0.4;

    color *= (ambient + diff * 0.6);

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
