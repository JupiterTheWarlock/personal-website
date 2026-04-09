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
