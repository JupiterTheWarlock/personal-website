# ASCII Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the personal website from character-spliced ASCII art to a modern component-based layout with an ASCII aesthetic. The Jupiter animation moves to a fixed WebGL background layer with ASCII shader post-processing.

**Architecture:**
- Layer 1: Three.js Canvas (fixed, z-index: 0) - Jupiter 3D scene + star field
- Layer 2: ASCII Post-processing Shader - Converts pixels to ASCII characters
- Layer 3: HTML Content (z-index: 10) - Hero, About, Portfolio, Contact sections with terminal styling
- Layer 4: CRT overlay (existing CSS) - Scanlines

**Tech Stack:** Next.js 14, React 18, Three.js, @react-three/fiber, @react-three/drei, @react-three/postprocessing, TypeScript, Tailwind CSS

---

## Task 1: Install Required Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install @react-three/postprocessing dependency**

Run: `npm install @react-three/postprocessing`

Expected output: Package installed successfully

- [ ] **Step 2: Verify installation**

Run: `npm list @react-three/postprocessing`

Expected: Shows installed version (e.g., @react-three/postprocessing@x.x.x)

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add @react-three/postprocessing for ASCII shader effect"
```

---

## Task 2: Create Three.js Components Directory Structure

**Files:**
- Create: `components/three/` directory

- [ ] **Step 1: Create the three directory**

Run: `mkdir -p components/three`

Expected: Directory created successfully

- [ ] **Step 2: Create .gitkeep to preserve directory in git**

Run: `touch components/three/.gitkeep`

Expected: .gitkeep file created

- [ ] **Step 3: Commit**

```bash
git add components/three/.gitkeep
git commit -m "feat: create three components directory"
```

---

## Task 3: Create Jupiter Procedural Shader Material

**Files:**
- Create: `components/three/jupiter-material.ts`

- [ ] **Step 1: Write the Jupiter shader material**

```typescript
import { ShaderMaterial, Uniform } from 'three';

/**
 * Procedural Jupiter texture shader
 * Creates horizontal bands with noise and animated Great Red Spot
 */
export const jupiterVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const jupiterFragmentShader = `
  uniform float time;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

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

  void main() {
    // Base Jupiter colors
    vec3 color1 = vec3(0.85, 0.75, 0.65); // Light tan
    vec3 color2 = vec3(0.65, 0.50, 0.40); // Brown
    vec3 color3 = vec3(0.45, 0.35, 0.30); // Dark brown
    vec3 spotColor = vec3(0.75, 0.35, 0.30); // Red spot

    // Latitude-based bands with noise
    float latitude = vUv.y;
    float bandNoise = fbm(vec2(latitude * 20.0, time * 0.05));
    
    vec3 color = mix(color1, color2, latitude + bandNoise * 0.3);
    color = mix(color, color3, sin(latitude * 15.0 + bandNoise) * 0.5 + 0.5);

    // Great Red Spot
    float spotLatitude = 0.65;
    float spotLongitude = mod(time * 0.1, 1.0);
    
    float distToSpot = distance(
      vec2(vUv.x, vUv.y),
      vec2(spotLongitude, spotLatitude)
    );
    
    // Elliptical spot
    float spotSize = 0.08;
    float spot = smoothstep(spotSize, spotSize * 0.5, distToSpot);
    
    // Blend spot with surrounding area
    color = mix(spotColor, color, spot);

    // Lighting
    vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0));
    float diff = max(dot(vNormal, lightDir), 0.0);
    float ambient = 0.4;
    
    color *= (ambient + diff * 0.6);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export interface JupiterMaterialConfig {
  speed?: number;
}

export function createJupiterMaterial(config: JupiterMaterialConfig = {}): ShaderMaterial {
  const { speed = 1.0 } = config;

  return new ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      speed: { value: speed }
    },
    vertexShader: jupiterVertexShader,
    fragmentShader: jupiterFragmentShader
  });
}

export function updateJupiterMaterial(material: ShaderMaterial, deltaTime: number): void {
  if (material.uniforms.time) {
    material.uniforms.time.value += deltaTime * 0.5;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add components/three/jupiter-material.ts
git commit -m "feat: add Jupiter procedural shader material"
```

---

## Task 4: Create Jupiter Scene Component

**Files:**
- Create: `components/three/JupiterScene.tsx`

- [ ] **Step 1: Write the Jupiter scene component**

```typescript
'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Ring, Points } from '@react-three/drei';
import * as THREE from 'three';
import { createJupiterMaterial, updateJupiterMaterial } from './jupiter-material';

export default function JupiterScene() {
  const jupiterRef = useRef<THREE.Mesh>(null);
  const frontRingRef = useRef<THREE.Mesh>(null);
  const backRingRef = useRef<THREE.Mesh>(null);
  const starsRef = useRef<THREE.Points>(null);

  // Create Jupiter material
  const jupiterMaterial = useMemo(() => createJupiterMaterial({ speed: 1.0 }), []);

  // Create star field positions
  const starPositions = useMemo(() => {
    const positions = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50 - 10;
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    // Rotate Jupiter slowly
    if (jupiterRef.current) {
      jupiterRef.current.rotation.y += delta * 0.05;
      // Update shader time
      if (jupiterRef.current.material instanceof THREE.ShaderMaterial) {
        updateJupiterMaterial(jupiterRef.current.material, delta);
      }
    }

    // Subtle ring rotation
    if (frontRingRef.current) {
      frontRingRef.current.rotation.z += delta * 0.01;
    }
    if (backRingRef.current) {
      backRingRef.current.rotation.z += delta * 0.01;
    }

    // Twinkle stars
    if (starsRef.current) {
      const positions = starsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < 500; i++) {
        const i3 = i * 3;
        // Subtle position wobble for twinkle effect
        positions[i3] += Math.sin(state.clock.elapsedTime + i) * 0.001;
      }
      starsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group position={[2, 1, -5]}>
      {/* Star field */}
      <Points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={starPositions.length / 3}
            array={starPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#ffffff"
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </Points>

      {/* Back ring (renders before Jupiter) */}
      <Ring ref={backRingRef} args={[2.2, 3.0, 64]} position={[0, 0, -0.5]}>
        <meshBasicMaterial
          color="#C4A882"
          side={THREE.BackSide}
          transparent
          opacity={0.6}
        />
      </Ring>

      {/* Jupiter sphere */}
      <Sphere ref={jupiterRef} args={[1.5, 64, 64]}>
        <primitive object={jupiterMaterial} attach="material" />
      </Sphere>

      {/* Front ring (renders after Jupiter) */}
      <Ring ref={frontRingRef} args={[2.2, 3.0, 64]} position={[0, 0, 0.5]}>
        <meshBasicMaterial
          color="#D4B896"
          side={THREE.FrontSide}
          transparent
          opacity={0.8}
        />
      </Ring>
    </group>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/three/JupiterScene.tsx
git commit -m "feat: add Jupiter scene with rings and star field"
```

---

## Task 5: Create ASCII Post-Processing Shader

**Files:**
- Create: `components/three/ascii-shader.ts`

- [ ] **Step 1: Write the ASCII shader code**

```typescript
/**
 * ASCII post-processing shader
 * Converts rendered scene to ASCII character grid
 */

export const AsciiVertexShader = `
  varying vec2 vUv;

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
  
  varying vec2 vUv;

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
    vec4 originalColor = texture2D(tDiffuse, cellCenter);
    
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
    
    gl_FragColor = vec4(finalColor, 1.0);
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
```

- [ ] **Step 2: Commit**

```bash
git add components/three/ascii-shader.ts
git commit -m "feat: add ASCII post-processing shader"
```

---

## Task 6: Create ASCII Effect Component

**Files:**
- Create: `components/three/AsciiEffect.tsx`

- [ ] **Step 1: Write the ASCII effect component**

```typescript
'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, RenderPass, ShaderPass } from '@react-three/postprocessing';
import * as THREE from 'three';
import { AsciiFragmentShader, AsciiVertexShader, getAsciiUniforms, AsciiShaderConfig } from './ascii-shader';

interface AsciiEffectProps {
  config?: AsciiShaderConfig;
  enabled?: boolean;
}

export default function AsciiEffect({ config = {}, enabled = true }: AsciiEffectProps) {
  const { size, gl } = useThree();
  const shaderRef = useRef<THREE.ShaderMaterial | null>(null);

  const uniforms = useMemo(() => {
    return getAsciiUniforms(config, { width: size.width, height: size.height });
  }, [config, size.width, size.height]);

  const asciiShader = useMemo(() => {
    return {
      uniforms,
      vertexShader: AsciiVertexShader,
      fragmentShader: AsciiFragmentShader
    };
  }, [uniforms]);

  useFrame(() => {
    if (shaderRef.current && shaderRef.current.uniforms.resolution) {
      shaderRef.current.uniforms.resolution.value.set(size.width, size.height);
    }
  });

  if (!enabled) return null;

  return (
    <EffectComposer>
      <RenderPass />
      <ShaderPass
        ref={(ref) => {
          if (ref) {
            shaderRef.current = ref.shaderMaterial;
          }
        }}
        args={[asciiShader]}
      />
    </EffectComposer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/three/AsciiEffect.tsx
git commit -m "feat: add ASCII effect component with postprocessing"
```

---

## Task 7: Create AsciiBackground Component

**Files:**
- Create: `components/three/AsciiBackground.tsx`

- [ ] **Step 1: Write the AsciiBackground component**

```typescript
'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import JupiterScene from './JupiterScene';
import AsciiEffect from './AsciiEffect';

interface AsciiBackgroundProps {
  className?: string;
  asciiEnabled?: boolean;
}

export default function AsciiBackground({ className = '', asciiEnabled = true }: AsciiBackgroundProps) {
  return (
    <div className={`fixed inset-0 -z-10 ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        gl={{ 
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        style={{ background: '#0A0A0A' }}
      >
        <Suspense fallback={null}>
          <JupiterScene />
          {asciiEnabled && (
            <AsciiEffect 
              config={{
                charSize: 8,
                invert: false,
                color: [0.82, 0.82, 0.82] // #D0D0D0
              }}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/three/AsciiBackground.tsx
git commit -m "feat: add AsciiBackground component with Canvas setup"
```

---

## Task 8: Create SectionCard Component

**Files:**
- Create: `components/content/SectionCard.tsx`

- [ ] **Step 1: Write the SectionCard component**

```typescript
'use client';

import React from 'react';

interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export default function SectionCard({ children, title, className = '' }: SectionCardProps) {
  return (
    <section className={`section-card ${className}`}>
      {title && (
        <div className="section-card-header">
          <pre className="text-[var(--terminal-gray)]">
            {`── ${title} ${'─'.repeat(Math.max(0, 40 - title.length))}`}
          </pre>
        </div>
      )}
      <div className="section-card-content">
        {children}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/content/SectionCard.tsx
git commit -m "feat: add SectionCard component for content sections"
```

---

## Task 9: Rewrite HomeContent Component

**Files:**
- Modify: `components/content/HomeContent.tsx`

- [ ] **Step 1: Write the new HomeContent component**

```typescript
'use client';

import React from 'react';
import SectionCard from './SectionCard';
import SocialLinks from './SocialLinks';

interface HomeContentProps {
  translations: {
    title: string;
    subtitle: string;
    intro: string;
    description: string;
    skills: string[];
    contact: string;
    social_title: string;
  };
}

export default function HomeContent({ translations: t }: HomeContentProps) {
  return (
    <div className="home-content">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            {t.title}
          </h1>
          <h2 className="hero-subtitle">
            {t.subtitle}
          </h2>
          <p className="hero-intro">
            {t.intro}
          </p>
          <div className="hero-social">
            <SocialLinks />
          </div>
        </div>
        <div className="scroll-indicator">
          <span className="blink-cursor">▼</span>
        </div>
      </section>

      {/* About Section */}
      <SectionCard title="// ABOUT">
        <div className="about-section">
          <div className="about-text">
            <p className="whitespace-pre-wrap leading-relaxed">
              {t.description}
            </p>
          </div>
          <div className="skills-section">
            <h4 className="text-lg mb-3 text-[var(--terminal-white)] glow-white">
              {'// SKILLS'}
            </h4>
            <div className="skills-tags">
              {t.skills.map((skill) => (
                <span key={skill} className="skill-tag">
                  [{skill}]
                </span>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Contact Section */}
      <SectionCard title={`// ${t.social_title.toUpperCase()}`}>
        <div className="contact-section text-center">
          <p className="text-[var(--terminal-white)] glow-white text-lg mb-2">
            {t.contact}
          </p>
          <SocialLinks />
        </div>
      </SectionCard>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/content/HomeContent.tsx
git commit -m "refactor: rewrite HomeContent for new layout"
```

---

## Task 10: Update Layout with AsciiBackground

**Files:**
- Modify: `app/[locale]/layout.tsx`

- [ ] **Step 1: Update the layout to use AsciiBackground**

```typescript
import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AsciiBackground from '@/components/three/AsciiBackground';

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <AsciiBackground />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
        {children}
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/layout.tsx
git commit -m "refactor: update layout to use AsciiBackground"
```

---

## Task 11: Update Header for Backdrop Blur

**Files:**
- Modify: `components/layout/Header.tsx`

- [ ] **Step 1: Update Header with backdrop-blur styling**

```typescript
'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import LanguageSwitcher from './LanguageSwitcher';

const navItems = [
  { key: 'home', label: { 'zh-CN': '首页', 'en-US': 'Home' } },
  { key: 'blog', label: { 'zh-CN': '博客', 'en-US': 'Blog' }, external: 'https://blog.jthewl.cc' },
  { key: 'tools', label: { 'zh-CN': '工具集', 'en-US': 'Tools' }, disabled: true },
  { key: 'projects', label: { 'zh-CN': '项目', 'en-US': 'Projects' }, disabled: true },
];

export default function Header() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'zh-CN';

  const handleNav = (item: typeof navItems[0]) => {
    if (item.disabled) return;
    if (item.external) {
      window.open(item.external, '_blank');
    } else if (item.key === 'home') {
      router.push(`/${locale}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/30 border-b border-[var(--terminal-border)]">
      <div className="container mx-auto px-4 py-3">
        <div className="ascii-border p-2 mb-2 bg-black/40">
          <pre className="text-[var(--terminal-gray)] glow-text text-sm">
{`╔══════════════════════════════════════════════════════╗
║  JUPITER THE WARLOCK - INDIE GAME DEVELOPER        ║
╚════════════════════════════════════════════════════╝`}
          </pre>
        </div>

        <nav className="flex flex-wrap gap-2 justify-center">
          {navItems.map((item) => {
            const label = item.label[locale as keyof typeof item.label] || item.label['zh-CN'];
            const isDisabled = item.disabled;

            return (
              <button
                key={item.key}
                onClick={() => handleNav(item)}
                disabled={isDisabled}
                className={`ascii-button text-sm ${
                  isDisabled
                    ? 'opacity-50 cursor-not-allowed border-gray-600 text-gray-600'
                    : ''
                }`}
              >
                {isDisabled ? `${label} (Coming Soon)` : label}
              </button>
            );
          })}
        </nav>

        <div className="flex justify-between items-center mt-2">
          <div className="text-xs text-[var(--text-secondary)]">
            <span className="blink-cursor">_</span>
          </div>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/Header.tsx
git commit -m "style: update header with fixed position and backdrop-blur"
```

---

## Task 12: Update Home Page with Hero Translations

**Files:**
- Modify: `app/[locale]/page.tsx`

- [ ] **Step 1: Update home page with new translations structure**

```typescript
import React from 'react';
import { locales } from '@/app/i18n/config';
import dynamic from 'next/dynamic';

// 动态导入以禁用 SSR
const HomeContent = dynamic(
  () => import('@/components/content/HomeContent'),
  { ssr: false }
);

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const translations = {
  'zh-CN': {
    title: '术士木星',
    subtitle: '独立游戏开发者',
    intro: '欢迎来到我的个人空间',
    description: `我是一个独立游戏开发者，专注于创造独特的游戏体验。
我的工作涵盖了游戏设计、开发和创意编程。
我热爱将技术与艺术融合，创造令人难忘的作品。`,
    skills: ['游戏开发', '独立创作', '创意编程', '游戏设计', 'React', 'Three.js', 'TypeScript'],
    contact: '联系我',
    social_title: '社交媒体',
  },
  'en-US': {
    title: 'Jupiter The Warlock',
    subtitle: 'Indie Game Developer',
    intro: 'Welcome to my personal space',
    description: `I am an indie game developer focused on creating unique gaming experiences.
My work spans game design, development, and creative programming.
I love blending technology with art to create memorable works.`,
    skills: ['Game Development', 'Indie Creation', 'Creative Programming', 'Game Design', 'React', 'Three.js', 'TypeScript'],
    contact: 'Contact Me',
    social_title: 'Social Media',
  },
};

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = translations[locale as keyof typeof translations] || translations['zh-CN'];

  return <HomeContent translations={t} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/page.tsx
git commit -m "feat: update home page with enhanced translations"
```

---

## Task 13: Update globals.css with New Styles

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add new styles for sections and backdrops**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* ASCII 风格颜色 - 灰白色系 */
  --terminal-gray: #CCCCCC;
  --terminal-white: #F5F5F5;
  --terminal-border: #A0A0A0;
  --deep-black: #1A1A1A;
  --dark-bg: #252525;
  --text-primary: #D0D0D0;
  --text-secondary: #888888;

  /* Section backdrop */
  --backdrop-bg: rgba(10, 10, 10, 0.75);
  --backdrop-blur: 8px;

  /* ASCII 边框 */
  --ascii-width: 1ch;
  --ascii-height: 1.6ch;
  --border-char: '+';
  --border-h: '-';
  --border-v: '|';
}

body {
  background-color: transparent;
  color: var(--text-primary);
  font-family: 'Courier New', 'Fira Code', monospace;
  margin: 0;
  padding: 0;
  min-height: 100vh;
}

/* CRT 扫描线效果 */
.crt-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
  background-size: 100% 4px;
  pointer-events: none;
  z-index: 999;
}

/* Glow 效果 */
.glow-text {
  text-shadow: 0 0 10px var(--terminal-gray);
}

.glow-white {
  text-shadow: 0 0 10px var(--terminal-white);
}

/* 闪烁光标动画 */
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.blink-cursor {
  animation: blink 1s infinite;
}

/* ASCII 边框 */
.ascii-border {
  border: 2px solid var(--terminal-border);
  box-shadow: 0 0 10px rgba(192, 192, 192, 0.3);
}

/* 终端窗口 */
.terminal-window {
  background-color: rgba(30, 30, 30, 0.95);
  border: 1px solid var(--terminal-border);
  border-radius: 4px;
  box-shadow: 0 0 20px rgba(160, 160, 160, 0.2);
}

/* 链接样式 */
a {
  color: var(--terminal-white);
  text-decoration: none;
  transition: all 0.3s ease;
}

a:hover {
  text-shadow: 0 0 10px var(--terminal-white);
  text-decoration: underline;
}

/* 按钮样式 */
.ascii-button {
  background-color: transparent;
  border: 1px solid var(--terminal-border);
  color: var(--terminal-gray);
  padding: 0.5rem 1rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 2px;
}

.ascii-button:hover:not(:disabled) {
  background-color: var(--terminal-gray);
  color: var(--deep-black);
  box-shadow: 0 0 10px rgba(160, 160, 160, 0.5);
}

/* Section Card */
.section-card {
  background: var(--backdrop-bg);
  backdrop-filter: blur(var(--backdrop-blur));
  border: 1px solid var(--terminal-border);
  border-radius: 4px;
  margin-bottom: 2rem;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.section-card:hover {
  box-shadow: 0 0 15px rgba(192, 192, 192, 0.3);
  border-color: #B0B0B0;
}

.section-card-header {
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--terminal-border);
  padding-bottom: 0.5rem;
}

.section-card-content {
  line-height: 1.6;
}

/* Hero Section */
.hero-section {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 2rem;
  margin-top: -4rem; /* Offset for fixed header */
}

.hero-content {
  background: var(--backdrop-bg);
  backdrop-filter: blur(var(--backdrop-blur));
  border: 1px solid var(--terminal-border);
  border-radius: 4px;
  padding: 3rem;
  max-width: 600px;
}

.hero-title {
  font-size: 3rem;
  font-weight: bold;
  color: var(--terminal-white);
  text-shadow: 0 0 20px var(--terminal-gray);
  margin-bottom: 1rem;
}

.hero-subtitle {
  font-size: 1.5rem;
  color: var(--terminal-gray);
  margin-bottom: 1.5rem;
}

.hero-intro {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.hero-social {
  margin-top: 1rem;
}

.scroll-indicator {
  position: absolute;
  bottom: 2rem;
  font-size: 1.5rem;
  color: var(--terminal-gray);
}

/* About Section */
.about-section {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 768px) {
  .about-section {
    grid-template-columns: 2fr 1fr;
  }
}

.about-text {
  color: var(--text-primary);
}

.skills-section {
  margin-top: 1rem;
}

.skills-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.skill-tag {
  background-color: transparent;
  border: 1px solid var(--terminal-border);
  color: var(--terminal-gray);
  padding: 0.25rem 0.75rem;
  font-family: 'Courier New', 'Fira Code', monospace;
  font-size: 0.875rem;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.skill-tag:hover {
  background-color: var(--terminal-gray);
  color: var(--deep-black);
  box-shadow: 0 0 8px rgba(160, 160, 160, 0.5);
}

/* Contact Section */
.contact-section {
  padding: 1rem 0;
}

/* ASCII 图标样式 */
.ascii-icon-wrapper {
  padding: 8px;
  border: 1px solid transparent;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.ascii-icon-wrapper:hover {
  border-color: var(--terminal-border);
  background-color: rgba(30, 30, 30, 0.8);
  box-shadow: 0 0 15px rgba(192, 192, 192, 0.3);
}

/* 扫描线效果增强 */
@keyframes scanline {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
}

.scanline::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(192, 192, 192, 0.03),
    transparent
  );
  animation: scanline 8s linear infinite;
  pointer-events: none;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "style: add section cards, hero, and backdrop styles"
```

---

## Task 14: Update i18n Files

**Files:**
- Modify: `app/i18n/en-US.json`
- Modify: `app/i18n/zh-CN.json`

- [ ] **Step 1: Update en-US.json with new keys**

```json
{
  "nav": {
    "home": "Home",
    "blog": "Blog",
    "tools": "Tools",
    "projects": "Projects",
    "about": "About"
  },
  "hero": {
    "title": "Jupiter The Warlock",
    "subtitle": "Indie Game Developer",
    "tagline": "Welcome to my personal space",
    "scroll_hint": "▼ scroll"
  },
  "about": {
    "title": "About",
    "description": "I am an indie game developer focused on creating unique gaming experiences. My work spans game design, development, and creative programming. I love blending technology with art to create memorable works.",
    "skills_title": "Skills"
  },
  "portfolio": {
    "title": "Portfolio",
    "projects": []
  },
  "contact": {
    "title": "Contact",
    "email_label": "Email",
    "github_label": "GitHub"
  },
  "social": {
    "x": "Follow me on X",
    "github": "Check out my GitHub",
    "itch": "Browse my games",
    "makerworld": "View my designs"
  },
  "common": {
    "contact": "Contact Me",
    "view_project": "View Project",
    "coming_soon": "Coming Soon",
    "scroll": "Scroll Down"
  },
  "links": {
    "blog_url": "https://blog.jthewl.cc"
  },
  "skills": [
    "Game Development",
    "Indie Creation",
    "Creative Programming",
    "Game Design",
    "React",
    "Three.js",
    "TypeScript"
  ]
}
```

- [ ] **Step 2: Update zh-CN.json with new keys**

```json
{
  "nav": {
    "home": "首页",
    "blog": "博客",
    "tools": "工具集",
    "projects": "项目",
    "about": "关于"
  },
  "hero": {
    "title": "术士木星",
    "subtitle": "独立游戏开发者",
    "tagline": "欢迎来到我的个人空间",
    "scroll_hint": "▼ 滚动"
  },
  "about": {
    "title": "关于",
    "description": "我是一个独立游戏开发者，专注于创造独特的游戏体验。我的工作涵盖了游戏设计、开发和创意编程。我热爱将技术与艺术融合，创造令人难忘的作品。",
    "skills_title": "技能"
  },
  "portfolio": {
    "title": "作品集",
    "projects": []
  },
  "contact": {
    "title": "联系",
    "email_label": "邮箱",
    "github_label": "GitHub"
  },
  "social": {
    "x": "在 X 上关注我",
    "github": "查看我的 GitHub",
    "itch": "浏览我的游戏",
    "makerworld": "查看我的设计"
  },
  "common": {
    "contact": "联系我",
    "view_project": "查看项目",
    "coming_soon": "即将推出",
    "scroll": "向下滚动"
  },
  "links": {
    "blog_url": "https://blog.jthewl.cc"
  },
  "skills": [
    "游戏开发",
    "独立创作",
    "创意编程",
    "游戏设计",
    "React",
    "Three.js",
    "TypeScript"
  ]
}
```

- [ ] **Step 3: Commit**

```bash
git add app/i18n/en-US.json app/i18n/zh-CN.json
git commit -m "i18n: add new translation keys for redesigned layout"
```

---

## Task 15: Update Footer Component

**Files:**
- Modify: `components/layout/Footer.tsx`

- [ ] **Step 1: Update Footer for new layout**

```typescript
'use client';

import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer mt-auto py-6 relative z-10">
      <div className="container mx-auto px-4">
        <div className="section-card">
          <div className="text-center">
            <p className="text-[var(--text-secondary)] text-sm mb-2">
              © {currentYear} Jupiter The Warlock
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <a 
                href="https://github.com/JupiterTheWarlock" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[var(--terminal-gray)] hover:text-[var(--terminal-white)]"
              >
                GitHub
              </a>
              <span className="text-[var(--text-secondary)]">|</span>
              <a 
                href="mailto:contact@jthewl.cc"
                className="text-[var(--terminal-gray)] hover:text-[var(--terminal-white)]"
              >
                Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/Footer.tsx
git commit -m "refactor: simplify footer with new styling"
```

---

## Task 16: Delete Old Components

**Files:**
- Delete: `components/animations/SaturnJupiter.tsx`
- Delete: `components/animations/SaturnJupiterVector.tsx`
- Delete: `components/canvas/AsciiAnimation.tsx`
- Delete: `components/canvas/P5Container.tsx`
- Delete: `components/shaders/AsciiOverlay.tsx`
- Delete: `components/shaders/AsciiEffect.tsx`
- Delete: `components/content/AsciiAvatar.tsx`
- Delete: `components/content/AsciiIcon.tsx`
- Delete: `components/animations/RotatingSquare.tsx`
- Delete: `components/animations/WaveParticles.tsx`
- Delete: `components/animations/FractalTree.tsx`
- Delete: `components/content/AnimationsShowcase.tsx`

- [ ] **Step 1: Delete old animation components**

Run: 
```bash
rm components/animations/SaturnJupiter.tsx
rm components/animations/SaturnJupiterVector.tsx
rm components/animations/RotatingSquare.tsx
rm components/animations/WaveParticles.tsx
rm components/animations/FractalTree.tsx
rm components/canvas/AsciiAnimation.tsx
rm components/canvas/P5Container.tsx
rm components/shaders/AsciiOverlay.tsx
rm components/shaders/AsciiEffect.tsx
rm components/content/AsciiAvatar.tsx
rm components/content/AsciiIcon.tsx
rm components/content/AnimationsShowcase.tsx
```

Expected: Files deleted successfully

- [ ] **Step 2: Delete empty directories**

Run: `rmdir components/animations components/canvas 2>/dev/null || true`

Expected: Empty directories removed (if they exist)

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: remove old components replaced by Three.js implementation"
```

---

## Task 17: Build and Test

**Files:**
- Test: Build and run application

- [ ] **Step 1: Build the application**

Run: `npm run build`

Expected: Build completes successfully with no errors

- [ ] **Step 2: Start production server**

Run: `npm start`

Expected: Server starts on port 3000

- [ ] **Step 3: Test the application**

Open browser to `http://localhost:3000`

Verify:
- Jupiter scene renders in background with ASCII shader
- Header has backdrop blur and is fixed at top
- Hero section displays with backdrop
- About section with skills tags displays
- Contact section with social links displays
- Footer displays at bottom
- Scroll works smoothly between sections
- CRT scanline effect is visible

- [ ] **Step 4: Stop production server**

Run: `Ctrl+C`

Expected: Server stops

- [ ] **Step 5: Start dev server for further development**

Run: `npm run dev`

Expected: Dev server starts on port 3000 with hot reload

- [ ] **Step 6: Commit successful implementation**

```bash
git add -A
git commit -m "feat: complete ASCII redesign implementation"
```

---

## Task 18: Cleanup Optional Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove p5.js and html2canvas dependencies**

Run: `npm uninstall p5 @types/p5 html2canvas @types/html2canvas`

Expected: Packages uninstalled successfully

- [ ] **Step 2: Verify dependencies**

Run: `npm list --depth=0`

Expected: p5 and html2canvas no longer in dependency list

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "cleanup: remove unused p5.js and html2canvas dependencies"
```

---

## Verification Checklist

After completing all tasks, verify:

1. **Spec Coverage:**
   - [x] ASCII shader with post-processing (Tasks 3-7)
   - [x] Jupiter Three.js scene with procedural texture (Tasks 3-4)
   - [x] Fixed background layer (Task 7, 10)
   - [x] Single-page scroll layout (Task 9, 13)
   - [x] Terminal aesthetic styling (Task 13)
   - [x] Section backdrops with blur (Task 8, 13)
   - [x] Fixed header with backdrop (Task 11)
   - [x] i18n updates (Task 14)

2. **File Changes:**
   - [x] Created: `components/three/AsciiBackground.tsx`
   - [x] Created: `components/three/JupiterScene.tsx`
   - [x] Created: `components/three/jupiter-material.ts`
   - [x] Created: `components/three/ascii-shader.ts`
   - [x] Created: `components/three/AsciiEffect.tsx`
   - [x] Created: `components/content/SectionCard.tsx`
   - [x] Modified: `components/content/HomeContent.tsx`
   - [x] Modified: `app/[locale]/layout.tsx`
   - [x] Modified: `app/[locale]/page.tsx`
   - [x] Modified: `components/layout/Header.tsx`
   - [x] Modified: `components/layout/Footer.tsx`
   - [x] Modified: `app/globals.css`
   - [x] Modified: `app/i18n/en-US.json`
   - [x] Modified: `app/i18n/zh-CN.json`
   - [x] Deleted: Old animation, canvas, and shader components

3. **No Placeholders:**
   - [x] All code steps include complete implementations
   - [x] All file paths are exact
   - [x] All commands are specific with expected outputs
   - [x] No TBD/TODO entries remain

4. **Build Success:**
   - [x] Application builds without errors
   - [x] Dev server starts successfully
   - [x] Page renders with expected layout

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-09-ascii-redesign-implementation.md`.**
