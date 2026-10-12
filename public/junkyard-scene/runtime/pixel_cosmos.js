import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/addons/loaders/GLTFLoader.js';
import { HOME_SCENE_ENVELOPE_POLICY } from './world_appearance/home_scene_policy.js';

const models = new Map([
  ['curated-mansion-biothreat-pilot-001', 'ocean'],
  ['curated-eternal-night-blood-tide-012', 'amber'],
  ['curated-city-ghosts-012', 'ice'],
]);
const asset = name => new URL(`../assets/pixel-cosmos/${name}`, import.meta.url).href;
const vertexShader = `
varying vec3 localPosition;
varying vec3 localNormal;
varying vec3 viewNormal;
void main() {
  localPosition = position;
  localNormal = normal;
  viewNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

function adaptCore(source) {
  const defaults = new Map();
  const glsl = source.replace(/uniform\s+(\w+)\s+(\w+)\s*(?:=([^;]+)|:[^;]+)?;/g, (_, type, name, initial) => {
    let value = 0;
    if (type === 'bool') value = initial?.trim() === 'true';
    else if (type === 'vec4') {
      const parts = initial.match(/vec4\(([^)]+)\)/)[1].split(',').map(Number);
      value = new THREE.Vector4(...(parts.length === 1 ? Array(4).fill(parts[0]) : parts));
    } else if (type === 'sampler2D') value = null;
    else value = Number(initial);
    defaults.set(name, { type, value });
    return `uniform ${type} ${name};`;
  });
  // All original planet channels retain the source algorithm. The tool's lava
  // is static; this explicit extension uses its periodic warp for flowing lava.
  const lava = glsl.replace(
    'vec3 p=d*noise_scale+vec3(2.0+surface_seed*.13);float n=fbm(p,octaves)+stipple;',
    'vec3 p=d*noise_scale+vec3(2.0+surface_seed*.13); if(planet_type==7) p+=motion_warp(p,0.65,1); float n=fbm(p,octaves)+stipple;',
  );
  if (lava === glsl) throw new Error('Pixel Cosmos shader changed: inspect lava adaptation.');
  return { defaults, glsl: lava };
}

function shaderFor(core, parameters, { cloud, voxel, star }, clock) {
  const uniforms = {};
  for (const [name, { type, value }] of core.defaults) {
    let binding = parameters[name] ?? value;
    if (type === 'vec4') {
      if (typeof binding === 'string') {
        const hex = binding.replace('#', '');
        binding = new THREE.Vector4(...[0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255), 1);
      } else binding = binding.clone();
    }
    uniforms[name] = { value: binding };
  }
  uniforms.seed.value = parameters.seed * 0.001 + 1;
  uniforms.kind.value = 0;
  uniforms.planet_type.value = parameters.type;
  uniforms.clouds_only.value = cloud;
  uniforms.noise_time = clock;
  uniforms.voxelSurface = { value: voxel };
  uniforms.voxelDensity = { value: parameters.pixels };
  uniforms.isStar = { value: star };
  return new THREE.ShaderMaterial({
    uniforms, vertexShader, side: THREE.DoubleSide,
    fragmentShader: `
      #define PI 3.141592653589793
      #define TAU 6.283185307179586
      varying vec3 localPosition;
      varying vec3 localNormal;
      varying vec3 viewNormal;
      uniform bool voxelSurface;
      uniform float voxelDensity;
      uniform bool isStar;
      ${core.glsl}
      void main() {
        vec3 samplePosition = localPosition;
        if (voxelSurface) {
          float cellSize = 2.0 / voxelDensity;
          vec3 cell = floor((localPosition - localNormal * cellSize * 0.001 + vec3(1.0)) / cellSize);
          samplePosition = (cell + vec3(0.5)) * cellSize - vec3(1.0);
        }
        vec4 c = evaluate_direction(normalize(samplePosition));
        if (c.a < 0.5) discard;
        float diffuse = max(0.0, dot(normalize(viewNormal), normalize(vec3(-0.45, 0.75, 1.0))));
        float shade = isStar ? 0.78 + 0.22 * diffuse : 0.38 + 0.62 * floor(diffuse * 4.0) / 4.0;
        vec3 srgb = c.rgb * shade;
        vec3 linearColor = mix(srgb / 12.92, pow((srgb + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), srgb));
        gl_FragColor = vec4(linearColor * (isStar ? 1.35 : 1.0), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

function clearMeshes(group) {
  const meshes = [];
  group.traverse(object => { if (object.isMesh) meshes.push(object); });
  for (const mesh of meshes) { mesh.removeFromParent(); mesh.geometry.dispose(); }
  group.userData.cardRenderBatches = [];
}

export async function loadPixelCosmosModels(mode = 'voxel', captureTime = null, useSkybox = true) {
  if (!['voxel', 'pixel'].includes(mode)) throw new Error('Unknown Pixel Cosmos preview mode.');
  const loader = new GLTFLoader();
  const templates = new Map();
  const materials = new Set();
  const sharedTextures = new Set();
  const clock = { value: 0 };
  let forcedTime = captureTime;
  const releaseTemplates = () => {
    const geometries = new Set();
    const textures = new Set(sharedTextures);
    for (const root of templates.values()) root.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      for (const material of object.material ? [].concat(object.material) : []) {
        materials.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      }
    });
    geometries.forEach(value => value.dispose());
    materials.forEach(value => value.dispose());
    textures.forEach(value => { value.source.data?.close?.(); value.dispose(); });
    templates.clear();
    materials.clear();
    sharedTextures.clear();
  };
  const source = await fetch(asset('noise-core.glsl')).then(response => {
    if (!response.ok) throw new Error(`Noise shader: HTTP ${response.status}`);
    return response.text();
  });
  const core = adaptCore(source);
  let skyTexture = null;
  if (useSkybox) {
    skyTexture = await new THREE.TextureLoader().loadAsync(asset('sky.png'));
    skyTexture.colorSpace = THREE.SRGBColorSpace;
    skyTexture.magFilter = THREE.NearestFilter;
    skyTexture.minFilter = THREE.LinearMipmapLinearFilter;
    skyTexture.wrapS = THREE.RepeatWrapping;
    sharedTextures.add(skyTexture);
  }
  const results = await Promise.allSettled([...models.values(), 'lava'].map(async id => {
    const [gltf, preset] = await Promise.all([
      loader.loadAsync(asset(`${mode}/${id}.glb`)),
      fetch(asset(`${mode}/${id}.preset.json`)).then(r => {
        if (!r.ok) throw new Error(`Planet preset: HTTP ${r.status}`);
        return r.json();
      }),
    ]);
    const planet = gltf.scene;
    templates.set(id, planet);
    const originals = new Set();
    planet.traverse(object => {
      if (!object.isMesh) return;
      const previous = [].concat(object.material);
      previous.forEach(material => originals.add(material));
      if (object.name === 'Rings') {
        object.material = new THREE.MeshBasicMaterial({ color: previous[0].color, vertexColors: true, map: previous[0].map, side: THREE.DoubleSide });
      } else {
        object.material = shaderFor(core, preset.parameters, {
          cloud: object.name === 'CloudShell', voxel: mode === 'voxel', star: id === 'lava',
        }, clock);
      }
      materials.add(object.material);
    });
    originals.forEach(material => {
      // Pixel exports embed static maps; only rings still use their map.
      const used = [...materials].some(next => next.map && next.map === material.map);
      if (material.map && !used) { material.map.source.data?.close?.(); material.map.dispose(); }
      material.dispose();
    });
  }));
  const failure = results.find(result => result.status === 'rejected');
  if (failure) { releaseTemplates(); throw failure.reason; }
  const instance = id => {
    const planet = templates.get(id).clone(true);
    planet.traverse(object => { if (object.isMesh) object.geometry = object.geometry.clone(); });
    return planet;
  };
  return {
    id: `pixel-cosmos-${mode}-noise-v1-${useSkybox ? 'cyan-violet-sky' : 'legacy-sky'}`,
    replaceSky(sky) {
      if (!skyTexture) return;
      const material = new THREE.MeshBasicMaterial({
        map: skyTexture, side: THREE.BackSide, depthWrite: false, toneMapped: false,
      });
      materials.add(material);
      if (sky.isMesh) {
        [].concat(sky.material).forEach(value => value.dispose());
        sky.material = material;
      } else {
        // Keep the original sky root and its transform. The mascot is attached
        // to this same root later; only the old gradient/stars are replaced.
        for (const child of [...sky.children]) {
          child.traverse(object => {
            object.geometry?.dispose();
            if (object.material) [].concat(object.material).forEach(value => value.dispose());
          });
          child.removeFromParent();
        }
        const shell = new THREE.Mesh(new THREE.SphereGeometry(HOME_SCENE_ENVELOPE_POLICY.skyRadius, 48, 32), material);
        shell.renderOrder = -10;
        sky.add(shell);
      }
      sky.userData.skyStyle = 'pixel-cosmos-cyan-violet';
      sky.userData.skyRenderTarget = null;
    },
    replace(group, node) {
      const id = models.get(node.ref?.id);
      if (!id) return;
      const oldSize = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());
      clearMeshes(group);
      const planet = instance(id);
      group.userData.heroAssembly.add(planet);
      const newSize = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());
      planet.scale.multiplyScalar(Math.max(...oldSize.toArray()) / Math.max(...newSize.toArray()));
      group.userData.planetModel = id;
    },
    replaceJunkyard(group) {
      clearMeshes(group);
      const star = instance('lava');
      star.scale.setScalar(1.5);
      group.add(star);
      group.userData.planetModel = 'lava';
    },
    update(elapsed) { clock.value = forcedTime ?? elapsed; },
    setTime(seconds) { forcedTime = seconds; },
    snapshot: () => ({ mode, sky: useSkybox ? 'pixel-cosmos-cyan-violet' : 'legacy', noiseTime: clock.value, period: 18, models: [...templates.keys()], starRadius: 1.5 }),
    dispose: releaseTemplates,
  };
}
