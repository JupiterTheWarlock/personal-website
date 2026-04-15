'use client';

import React, { useRef, useMemo, useEffect } from 'react';
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

  // Create star field positions — denser for richer background
  const { starPositions, originalStarX } = useMemo(() => {
    const count = 1500;
    const positions = new Float32Array(count * 3);
    const origX = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 80;
      positions[i * 3] = x;
      origX[i] = x;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60 - 10;
    }
    return { starPositions: positions, originalStarX: origX };
  }, []);

  // Dispose material on unmount
  useEffect(() => {
    return () => {
      jupiterMaterial.dispose();
    };
  }, [jupiterMaterial]);

  useFrame((state, delta) => {
    const clampedDelta = Math.min(delta, 0.1);

    // Rotate Jupiter slowly
    if (jupiterRef.current) {
      jupiterRef.current.rotation.y += clampedDelta * 0.05;
      // Update shader time
      if (jupiterRef.current.material instanceof THREE.ShaderMaterial) {
        updateJupiterMaterial(jupiterRef.current.material, clampedDelta);
      }
    }

    // Subtle ring rotation
    if (frontRingRef.current) {
      frontRingRef.current.rotation.z += clampedDelta * 0.01;
    }
    if (backRingRef.current) {
      backRingRef.current.rotation.z += clampedDelta * 0.01;
    }

    // Twinkle stars
    if (starsRef.current) {
      const positions = starsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < 1500; i++) {
        const i3 = i * 3;
        positions[i3] = originalStarX[i] + Math.sin(state.clock.elapsedTime + i) * 0.02;
      }
      starsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group position={[5, 0, -1]}>
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
          size={0.06}
          color="#FFEEDD"
          transparent
          opacity={0.7}
          sizeAttenuation
        />
      </Points>

      {/* Ring group — tilted 35° to show traditional Jupiter angle */}
      <group rotation={[-Math.PI * 0.65, -Math.PI * 0.15, 0]}>
        {/* Back half of ring (renders before Jupiter, occluded by planet body) */}
        <Ring ref={backRingRef} args={[4.5, 6.0, 64]} position={[0, 0, -0.01]}>
          <meshBasicMaterial
            color="#C4A882"
            side={THREE.BackSide}
            transparent
            opacity={0.5}
            depthWrite={false}
          />
        </Ring>

        {/* Jupiter sphere — tilted to match ring plane */}
        <Sphere ref={jupiterRef} args={[3.5, 64, 64]} rotation={[-Math.PI * 0.19, 0, 0]}>
          <primitive object={jupiterMaterial} attach="material" />
        </Sphere>

        {/* Front half of ring (renders after Jupiter, visible in front of planet) */}
        <Ring ref={frontRingRef} args={[4.5, 6.0, 64]} position={[0, 0, 0.01]}>
          <meshBasicMaterial
            color="#D4B896"
            side={THREE.FrontSide}
            transparent
            opacity={0.6}
            depthWrite={false}
          />
        </Ring>
      </group>
    </group>
  );
}
