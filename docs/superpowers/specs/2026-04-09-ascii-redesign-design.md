# Personal Website Redesign: ASCII Shader + Component Layout

**Date:** 2026-04-09
**Status:** Approved

## Overview

Refactor the personal website from character-spliced ASCII art to a modern component-based layout with an ASCII aesthetic. The Jupiter animation moves to a fixed WebGL background layer with ASCII shader post-processing. HTML content uses terminal styling for visual consistency.

## Key Decisions

- **ASCII shader approach:** WebGL post-processing via Three.js / react-three-fiber (Approach A)
- **Layer strategy:** Layered rendering (Approach C) — Canvas renders Jupiter + ASCII shader as background; HTML content styled with terminal aesthetics above it
- **Page structure:** Single-page scroll with Hero, About/Skills, Portfolio, Contact sections
- **Jupiter background:** Fixed position, always visible, does not scroll with content
- **Shader coverage:** `global-with-backdrop` mode by default, configurable to `background-only` or `global`
- **Content readability:** Semi-transparent dark backdrops with `backdrop-blur` on each content section

## Architecture

### Layer Stack (bottom to top)

```
Layer 1: Three.js Canvas (position: fixed, z-index: 0)
  └─ Jupiter 3D scene + star field

Layer 2: ASCII Post-processing Shader (same Canvas, EffectComposer)
  └─ Converts Jupiter/star pixels → ASCII characters

Layer 3: HTML Content (position: relative, z-index: 10)
  ├─ Header (fixed, semi-transparent)
  ├─ Hero section
  ├─ About/Skills section
  ├─ Portfolio section
  ├─ Contact section
  └─ Footer

Layer 4: CRT overlay (CSS, existing)
  └─ Scanlines
```

### Rendering Pipeline

```
Jupiter 3D Scene (Three.js)
    ↓ rendered to framebuffer
ASCII Post-processing Shader
    ↓ grid sampling → brightness → character mapping → texture atlas lookup
Screen Output (fixed background)
```

## ASCII Shader

### Implementation

- Custom post-processing effect using `@react-three/postprocessing` EffectComposer
- Character rendering via pre-baked texture atlas (all ASCII chars in one texture)
- Per-frame: divide screen into grid cells, sample average brightness per cell, map to character index, render character from atlas with sampled color

### Configuration (designed for future flexibility)

```typescript
interface AsciiShaderConfig {
  mode: 'background-only' | 'global' | 'global-with-backdrop';
  charSize: number;        // pixel size per character cell
  charset: string;         // brightness-ordered character set
  invert: boolean;         // light/dark inversion
  color: string;           // tint color for ASCII output
}
```

- Default mode: `global-with-backdrop` — entire Canvas gets ASCII treatment, HTML content uses semi-transparent backdrops
- `background-only` would skip shader entirely on some areas
- `global` would remove backdrops entirely

### Performance

- Texture atlas avoids per-frame character generation
- Configurable `charSize` allows lower ASCII density on weaker devices
- Fixed background means no re-render during scroll
- Three.js handles GPU-accelerated rendering

## Jupiter Animation (Three.js Rebuild)

Replace p5.js Jupiter with Three.js native 3D scene.

### Scene Elements

| Element | Implementation | Details |
|---------|---------------|---------|
| Star field | `THREE.Points` | Hundreds of random-positioned small dots with subtle flicker |
| Jupiter body | `THREE.SphereGeometry` + custom `ShaderMaterial` | Procedural horizontal bands with color variation |
| Great Red Spot | Fragment shader overlay on sphere | Animated ellipse, rotates with planet |
| Ring system | `THREE.RingGeometry` (two halves) | Tilted plane, front half renders after planet for depth |
| Rotation | mesh.rotation.y incrementing per frame | Slow self-rotation, Red Spot orbits with it |

### Procedural Texture (ShaderMaterial)

- Input: UV coordinates + time uniform
- Horizontal bands: color varies by latitude (y coordinate), with noise for organic edges
- Great Red Spot: elliptical region at fixed latitude, position rotates with time
- No external image textures required

### Camera & Composition

- Jupiter positioned in upper-right quadrant of viewport (not centered)
- Content text occupies left/center area
- Camera fixed, orthographic or perspective with minimal FOV
- Jupiter large enough to be visually impactful but not overwhelming

## Page Layout

### Single-page scroll sections

**Hero (first viewport):**
- Large monospace name/title
- One-line tagline
- Social link icons
- Semi-transparent backdrop behind text
- Scroll indicator: blinking `▼` character
- Jupiter ASCII visible behind/around text

**About/Skills:**
- Two-column: "About Me" text (left) + skill tags (right)
- Skill tags styled as terminal tokens: `[TypeScript]` `[React]` `[Three.js]`
- Semi-transparent backdrop

**Portfolio:**
- Card grid (2-3 columns)
- Each card: project name + description + link
- Terminal window styling: `── title ──` decorative header
- Hover: border glow effect
- Semi-transparent backdrop

**Contact / Footer:**
- Email, GitHub, and other links in compact layout
- Copyright notice
- Can merge with existing Footer component

### Navigation

- Fixed Header with semi-transparent background + `backdrop-blur`
- Navigation items: smooth scroll to section anchors
- Language switcher preserved (zh-CN / en-US)

## Terminal Aesthetic (HTML Layer)

### Typography

- Font: `'Fira Code', 'Courier New', monospace`
- Titles: bold, large size
- Body: normal weight, `line-height: 1.6`
- Terminal output feel

### Color Palette

| Role | Value |
|------|-------|
| Background | transparent |
| Text primary | `#D0D0D0` |
| Text secondary | `#888888` |
| Text highlight | `#F5F5F5` |
| Backdrop | `rgba(10, 10, 10, 0.75)` + `backdrop-blur(8px)` |
| Border | `#A0A0A0` |
| Glow | terminal-gray with shadow |

### CRT Effects (preserved from existing)

- Scanline overlay (`crt-overlay` class)
- Text glow (`text-shadow`)
- Cursor blink animation

### Section Backdrop Strategy

- Each content section wrapped in semi-transparent card
- `border-radius: 4px`, `border: 1px solid #A0A0A0`
- Hover: border glow via `box-shadow`
- Sections spaced with enough gap for ASCII Jupiter to show through

### Interactions

- Link hover: brighter color + underline
- Button/card hover: border glow
- Transitions: unified `0.3s ease`

## File Changes

### Delete

- `components/animations/SaturnJupiter.tsx` — pure ASCII version, replaced by Three.js
- `components/animations/SaturnJupiterVector.tsx` — p5.js version, replaced by Three.js
- `components/canvas/AsciiAnimation.tsx` — old canvas sampling engine
- `components/canvas/P5Container.tsx` — p5.js wrapper, no longer needed
- `components/shaders/AsciiOverlay.tsx` — old disabled overlay
- `components/shaders/AsciiEffect.tsx` — old shader effect
- `components/content/AsciiAvatar.tsx` — old avatar-to-ASCII
- `components/content/AsciiIcon.tsx` — old ASCII icon component
- `components/animations/RotatingSquare.tsx` — animations page can be rebuilt later
- `components/animations/WaveParticles.tsx` — same
- `components/animations/FractalTree.tsx` — same
- `components/content/AnimationsShowcase.tsx` — same

### Modify

- `app/[locale]/layout.tsx` — remove AsciiOverlay, add AsciiBackground component
- `app/[locale]/page.tsx` — update HomeContent props/structure
- `app/globals.css` — update theme variables, add backdrop styles
- `components/layout/Header.tsx` — semi-transparent + backdrop-blur
- `components/layout/Footer.tsx` — simplify, merge contact info
- `app/i18n/en-US.json` — add new section translations
- `app/i18n/zh-CN.json` — add new section translations
- `tailwind.config.ts` — update if needed for new styles

### Create

| File | Responsibility |
|------|---------------|
| `components/three/AsciiBackground.tsx` | R3F Canvas container, fixed background layer |
| `components/three/JupiterScene.tsx` | Jupiter sphere + rings + star field |
| `components/three/jupiter-material.ts` | Procedural texture ShaderMaterial |
| `components/three/ascii-shader.ts` | ASCII post-processing shader code |
| `components/three/AsciiEffect.tsx` | EffectComposer wrapper with configurable mode |
| `components/content/HomeContent.tsx` | Rewrite: Hero + About + Portfolio + Contact |
| `components/content/SectionCard.tsx` | Reusable semi-transparent backdrop component |

### Dependencies

- **Add:** `@react-three/postprocessing`
- **Remove (optional):** `p5.js`, `html2canvas`

## i18n

New translation keys needed:

```json
{
  "hero": {
    "tagline": "...",
    "scroll_hint": "▼ scroll"
  },
  "about": {
    "title": "About",
    "description": "...",
    "skills_title": "Skills"
  },
  "portfolio": {
    "title": "Portfolio",
    "projects": [...]
  },
  "contact": {
    "title": "Contact",
    "email": "...",
    ...
  }
}
```

Both `en-US.json` and `zh-CN.json` will be updated.
