'use client';

import { useEffect, useState, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import html2canvas from 'html2canvas';
import AsciiEffect from './AsciiEffect';

function Scene({ texture }: { texture: THREE.Texture | null }) {
  const { scene, camera } = useThree();

  useEffect(() => {
    if (!texture) return;

    const orthoCamera = camera as THREE.OrthographicCamera;
    orthoCamera.left = -1;
    orthoCamera.right = 1;
    orthoCamera.top = 1;
    orthoCamera.bottom = -1;
    orthoCamera.updateProjectionMatrix();

    const material = new THREE.ShaderMaterial({
      vertexShader: `
        in vec3 position;
        in vec2 uv;
        out vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        in vec2 vUv;
        out vec4 fragColor;
        void main() {
          vec2 uv = vUv;
          uv.y = 1.0 - uv.y;
          fragColor = texture(tDiffuse, uv);
        }
      `,
      uniforms: {
        tDiffuse: { value: texture },
      },
      depthWrite: false,
      depthTest: false,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    return () => {
      scene.remove(quad);
      material.dispose();
      quad.geometry.dispose();
    };
  }, [texture, scene, camera]);

  if (texture) {
    return <AsciiEffect pixelSize={10.0} />;
  }

  return null;
}

export default function AsciiOverlay() {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [isReady, setIsReady] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCapturingRef = useRef(false);

  useEffect(() => {
    const CAPTURE_INTERVAL = 500; // 降低到 500ms

    const capturePage = async () => {
      if (isCapturingRef.current) return;
      isCapturingRef.current = true;

      try {
        const capturedCanvas = await html2canvas(document.body, {
          backgroundColor: '#1A1A1A',
          scale: 0.5, // 降低分辨率
          logging: false,
          useCORS: true,
          allowTaint: true,
          removeContainer: true, // 移除临时容器
        } as any);

        const newTexture = new THREE.CanvasTexture(capturedCanvas);
        newTexture.colorSpace = THREE.SRGBColorSpace;
        newTexture.minFilter = THREE.LinearFilter;
        newTexture.magFilter = THREE.LinearFilter;
        newTexture.needsUpdate = true;

        if (texture) {
          texture.dispose();
        }

        setTexture(newTexture);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to capture page:', error);
      } finally {
        isCapturingRef.current = false;
      }
    };

    // 首次捕获
    capturePage();

    // 设置定时器而不是 requestAnimationFrame
    intervalRef.current = setInterval(() => {
      capturePage();
    }, CAPTURE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (texture) {
        texture.dispose();
      }
    };
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: 0.85,
      }}
    >
      <Canvas
        gl={{
          antialias: false,
          alpha: true,
          preserveDrawingBuffer: false, // 改为 false
          powerPreference: 'low-power', // 优先使用低功耗
        }}
        orthographic
        dpr={[1, 2]} // 限制 DPR
        style={{ width: '100%', height: '100%' }}
      >
        <Scene texture={texture} />
      </Canvas>
    </div>
  );
}
