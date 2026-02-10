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
  // 当前环境 WebGL 支持不稳定，会导致 three.js 创建 WebGLRenderer 时报错：
  // Error: Error creating WebGL context.
  // 这个组件只是一个全屏装饰性特效，这里直接禁用，避免影响页面主功能。
  return null;
}
