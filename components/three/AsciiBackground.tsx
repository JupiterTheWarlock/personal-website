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
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      className={`ascii-background ${className}`}
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        style={{ background: 'transparent' }}
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
