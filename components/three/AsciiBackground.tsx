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
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      className={className}
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        style={{ background: '#0A0908' }}
      >
        <Suspense fallback={null}>
          <JupiterScene />
          {asciiEnabled && (
            <AsciiEffect
              config={{
                charSize: 6,
                invert: false,
                color: [0.85, 0.47, 0.34] // Claude Code orange ~#DA7756
              }}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
