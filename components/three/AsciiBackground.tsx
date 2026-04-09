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
