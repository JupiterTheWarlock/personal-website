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
            // IMPORTANT: Set GLSL version to match ascii-shader.ts GLSL 300 es syntax
            ref.shaderMaterial.glslVersion = THREE.GLSL3;
          }
        }}
        args={[asciiShader]}
      />
    </EffectComposer>
  );
}
