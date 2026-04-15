import * as THREE from 'three';

/**
 * Procedural Jupiter texture shader
 * Creates horizontal bands with noise and animated Great Red Spot
 */
export const jupiterVertexShader = `
  out vec2 vUv;
  out vec3 vNormal;
  out vec3 vWorldNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const jupiterFragmentShader = `
  uniform float time;
  uniform float speed;

  in vec2 vUv;
  in vec3 vNormal;
  in vec3 vWorldNormal;

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
    vec3 spotColor = vec3(0, 0, 0); // Vivid red spot

    float latitude = vUv.y;
    float longitude = vUv.x;

    // Distorted band pattern using fbm noise
    float bandNoise = fbm(vec2(latitude * 25.0, time * 0.03 * speed));
    float bandEdge = fbm(vec2(latitude * 12.0 + 3.7, time * 0.02 * speed));

    // 1) Horizontal bands — subtle latitude-based color variation
    float bandPattern = sin(latitude * 18.0 + bandEdge * 1.5);

    vec3 color = mix(color1, color2, smoothstep(-0.3, 0.3, bandPattern));
    color = mix(color, color4, smoothstep(-0.8, -0.5, bandPattern) * 0.4);

    // 2) Domain-warped turbulence — nested fbm creates organic Jupiter swirls
    //    Based on Inigo Quilez's domain warping technique
    vec2 warpP = vec2(longitude * 6.0, latitude * 12.0) + vec2(time * 0.02 * speed, 0.0);

    // First warp level
    vec2 q = vec2(
      fbm(warpP + vec2(0.0, 0.0)),
      fbm(warpP + vec2(5.2, 1.3))
    );

    // Second warp level — feeds back into itself for deep spirals
    vec2 r = vec2(
      fbm(warpP + 4.0 * q + vec2(1.7, 9.2)),
      fbm(warpP + 4.0 * q + vec2(8.3, 2.8))
    );

    float warp = fbm(warpP + 4.0 * r);

    // Use warp intermediate values for multi-toned coloring
    color = mix(color, color2, clamp(length(q) * 0.8, 0.0, 1.0) * 0.4);
    color = mix(color, color3, clamp(warp * warp * 1.5, 0.0, 1.0) * 0.3);
    color = mix(color, color4, clamp(length(r.x) * 0.6, 0.0, 1.0) * 0.25);

    // 3) Small scattered vortices — spiral storms of varying sizes
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      // Each vortex at a different position, slowly drifting
      vec2 vortexCenter = vec2(
        fract(fi * 0.37 + 0.1 + time * 0.008 * speed),
        fract(fi * 0.53 + 0.2) * 0.6 + 0.2
      );

      vec2 toCenter = vec2(longitude, latitude) - vortexCenter;
      // Wrap around longitude
      toCenter.x = toCenter.x - floor(toCenter.x + 0.5);
      float dist = length(toCenter);
      float angle = atan(toCenter.y, toCenter.x);

      // Differential rotation — center spins faster than edges
      float vortexSize = 0.04 + fract(fi * 0.71) * 0.06;
      float twist = angle + 3.0 / (dist * 8.0 + 0.2) + time * 0.15 * speed * (1.0 + fi * 0.3);

      vec2 swirlUV = vortexCenter + vec2(cos(twist), sin(twist)) * dist;
      float vortexDetail = fbm(swirlUV * 25.0 + vec2(fi * 10.0));
      float vortex = smoothstep(vortexSize, vortexSize * 0.2, dist) * (0.5 + 0.5 * vortexDetail);

      // Alternate between lighter and darker vortex tones
      vec3 vortexColor = (mod(fi, 2.0) < 1.0) ? color3 : color4;
      color = mix(color, vortexColor, vortex * 0.2);
    }

    // Great Red Spot — hollow ring, positioned for current viewing angle
    // Camera sees the south pole (UV y≈0), so spot goes at low y
    float spotLat = 0.42;
    float spotLon = mod(-0.12 - time * 0.0159, 1.0);

    vec2 sUV = vec2((vUv.x - spotLon) * 2.0, (vUv.y - spotLat) * 2.8);
    float sDist = length(sUV);
    float outerR = 0.08;
    float innerR = 0.04;

    // Ring shape: 1 inside the ring band, 0 elsewhere
    float ring = smoothstep(outerR, outerR * 0.7, sDist) * (1.0 - smoothstep(innerR, innerR * 0.6, sDist));

    // Spot alpha: 1 = invisible (same as surroundings), 0 = fully transparent hole
    float spotIntensity = 0.52;

    // Lighting — world-space normal so terminator stays fixed as sphere rotates
    vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0));
    float diff = max(dot(vWorldNormal, lightDir), 0.0);
    float ambient = 0.35;

    // Limb darkening
    float limb = pow(max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 0.4);

    color *= (ambient + diff * 0.65) * limb;

    // Alpha: ring area is semi-transparent, rest is solid
    float finalAlpha = mix(spotIntensity, 1.0, 1.0 - ring);
    fragColor = vec4(color, finalAlpha);
  }
`;

export interface JupiterMaterialConfig {
  speed?: number;
}

export function createJupiterMaterial(config: JupiterMaterialConfig = {}): THREE.ShaderMaterial {
  const { speed = 1.0 } = config;

  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    transparent: true,
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
