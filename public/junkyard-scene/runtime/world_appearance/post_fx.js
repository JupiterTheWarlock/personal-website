import * as THREE from "../vendor/three.module.min.js";

const POST_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const POST_FRAGMENT_SHADER = `
  precision highp float;
  uniform sampler2D sourceTexture;
  uniform vec2 resolution;
  uniform float time;
  uniform float scanline;
  uniform float glow;
  uniform float phosphor;
  uniform float vignette;
  uniform float grain;
  uniform float pixelate;
  uniform float pixelSize;
  uniform float curvature;
  uniform float chromaticAberration;
  uniform float jitter;
  uniform float glitch;
  uniform float danger;
  uniform float preserveAlpha;
  varying vec2 vUv;

  float random(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233)) + time * 19.17) * 43758.5453);
  }
  void main() {
    vec2 uv = vUv;
    vec2 centered = uv * 2.0 - 1.0;
    float curve = dot(centered, centered) * curvature * 0.075;
    uv += centered * curve;
    if (jitter > 0.0001) {
      uv.x += (random(vec2(floor(uv.y * 120.0), floor(time * 10.0))) - 0.5) * 0.0028 * jitter;
    }
    if (glitch > 0.0001) {
      float tear = step(mix(0.999, 0.986, glitch), random(vec2(floor(uv.y * 72.0), floor(time * 7.0))));
      uv.x += tear * (random(vec2(uv.y, floor(time * 7.0))) - 0.5) * 0.022 * glitch;
    }
    if (pixelate > 0.5) {
      uv = (floor(uv * resolution / pixelSize) + 0.5) * pixelSize / resolution;
    }
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      gl_FragColor = vec4(0.005, 0.008, 0.01, 1.0 - preserveAlpha);
      return;
    }
    vec2 aberration = vec2(chromaticAberration * 0.0045, 0.0);
    vec4 base = texture2D(sourceTexture, uv);
    vec3 color = vec3(
      texture2D(sourceTexture, uv + aberration).r,
      base.g,
      texture2D(sourceTexture, uv - aberration).b
    );
    vec2 texel = 1.0 / resolution;
    vec3 bloom = (
      texture2D(sourceTexture, uv + vec2(texel.x * 2.0, 0.0)).rgb +
      texture2D(sourceTexture, uv - vec2(texel.x * 2.0, 0.0)).rgb +
      texture2D(sourceTexture, uv + vec2(0.0, texel.y * 2.0)).rgb +
      texture2D(sourceTexture, uv - vec2(0.0, texel.y * 2.0)).rgb
    ) * 0.25;
    color = mix(color, max(color, bloom * 1.08), glow);

    // Six-physical-pixel bands survive device-pixel-ratio downsampling and
    // remain visible without borrowing contrast from grain.
    float scanBand = 0.5 + 0.5 * cos(gl_FragCoord.y * 3.14159265 / 3.0);
    float scanDepth = scanline * mix(0.12, 0.42, scanline);
    color *= 1.0 - scanBand * scanDepth;

    float triad = mod(gl_FragCoord.x, 3.0);
    vec3 mask = triad < 1.0 ? vec3(1.0, 0.94, 0.94) : triad < 2.0 ? vec3(0.94, 1.0, 0.94) : vec3(0.94, 0.94, 1.0);
    color = mix(color, color * mask, phosphor);
    float edge = 1.0 - smoothstep(0.34, 1.22, dot(centered, centered));
    color *= mix(1.0, edge, vignette * 0.56);
    float noise = random(gl_FragCoord.xy) - 0.5;
    color += noise * (grain + danger * 0.018);
    color = mix(color, color * vec3(1.035, 0.985, 1.025), danger * 0.13);
    gl_FragColor = vec4(max(color, 0.0), mix(1.0, base.a, preserveAlpha));
  }
`;

export function createScreenPostScene() {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uniforms = {
    sourceTexture: { value: null },
    resolution: { value: new THREE.Vector2(1, 1) },
    time: { value: 0 },
    scanline: { value: 0 },
    glow: { value: 0 },
    phosphor: { value: 0 },
    vignette: { value: 0 },
    grain: { value: 0 },
    pixelate: { value: 0 },
    pixelSize: { value: 4 },
    curvature: { value: 0 },
    chromaticAberration: { value: 0 },
    jitter: { value: 0 },
    glitch: { value: 0 },
    danger: { value: 0 },
    preserveAlpha: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: POST_VERTEX_SHADER,
    fragmentShader: POST_FRAGMENT_SHADER,
    depthTest: false,
    depthWrite: false,
    transparent: true,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  return { scene, camera, material, uniforms };
}

function effectIntensity(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : fallback;
}

export function applyScreenPostFx(uniforms, settings, elapsed, danger, width, height, texture, options = {}) {
  uniforms.sourceTexture.value = texture;
  uniforms.resolution.value.set(width, height);
  uniforms.time.value = elapsed;
  uniforms.scanline.value = settings.enabled ? settings.scanline : 0;
  uniforms.glow.value = settings.enabled ? settings.glow : 0;
  uniforms.phosphor.value = settings.enabled ? settings.phosphor : 0;
  uniforms.vignette.value = settings.enabled ? settings.vignette : 0;
  uniforms.grain.value = settings.enabled ? settings.grain : 0;
  uniforms.pixelate.value = settings.enabled && settings.pixelate ? 1 : 0;
  uniforms.pixelSize.value = settings.pixelSize;
  uniforms.curvature.value = settings.enabled ? settings.curvature : 0;
  uniforms.chromaticAberration.value = settings.enabled ? settings.chromaticAberration : 0;
  uniforms.jitter.value = settings.enabled && settings.jitter
    ? effectIntensity(settings.jitterIntensity, 0.18)
    : 0;
  uniforms.glitch.value = settings.enabled && settings.glitch
    ? effectIntensity(settings.glitchIntensity, 0.14)
    : 0;
  uniforms.danger.value = danger;
  uniforms.preserveAlpha.value = options.preserveAlpha === true || settings.processSky === false ? 1 : 0;
}

export function disposeScreenPostScene(post) {
  post.scene.traverse((object) => object.geometry?.dispose?.());
  post.material.dispose();
}
