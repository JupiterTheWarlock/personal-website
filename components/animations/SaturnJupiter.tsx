'use client';

import React, { useState, useRef, useEffect } from 'react';

interface SaturnJupiterProps {
  size?: number;
  className?: string;
  fitContainer?: boolean;
}

// 木星的ASCII字符集，从亮到暗
const JUPITER_CHARS = ['@', '%', '#', '*', '+', '=', ':', '-', '.', ' '];

// 星环字符
const RING_CHARS = ['-', '=', '~', '~', '=', '-'];

export default function SaturnJupiter({ size = 150, className = '', fitContainer = false }: SaturnJupiterProps) {
  const [frame, setFrame] = useState(0);
  const [containerHeight, setContainerHeight] = useState(size);
  const animationRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  // 监听容器高度变化
  useEffect(() => {
    if (!fitContainer || !containerRef.current) return;

    const updateHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.clientHeight;
        if (height > 0) {
          setContainerHeight(height);
        }
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [fitContainer]);

  // 木星的条纹和特征
  const jupiterBands = [
    { y: 0, height: 2, char: ' ', color: '#000000' },
    { y: 2, height: 1, char: '.', color: '#4a3828' },
    { y: 3, height: 2, char: ':', color: '#6b4c35' },
    { y: 5, height: 1, char: '-', color: '#8b5d3d' },
    { y: 6, height: 2, char: '=', color: '#a67b52' },
    { y: 8, height: 2, char: ':', color: '#c9946b' },
    { y: 10, height: 3, char: '=', color: '#c88a60' },
    { y: 13, height: 2, char: '#', color: '#b87852' },
    { y: 15, height: 2, char: ':', color: '#a67b52' },
    { y: 17, height: 2, char: '-', color: '#6b4c35' },
    { y: 19, height: 1, char: '.', color: '#4a3828' },
    { y: 20, height: 2, char: ' ', color: '#000000' },
  ];

  // 生成带星环的木星ASCII艺术
  const generateSaturnJupiter = (rotation: number) => {
    const width = 35;
    const height = 28;
    let ascii = '';

    // 大红斑的位置
    const redSpotX = Math.floor((rotation / 10) % width);

    // 星环参数
    const ringTilt = 0.3; // 星环倾斜角度
    const ringInnerRadius = 10;
    const ringOuterRadius = 17;

    for (let y = 0; y < height; y++) {
      // 计算当前行的星环位置
      const centerY = height / 2;
      const normalizedY = (y - centerY) / (height / 2);
      const ringY = normalizedY / ringTilt; // 考虑倾斜

      // 计算星环的X范围
      let ringLeftX = -1;
      let ringRightX = -1;

      if (Math.abs(ringY) <= 1) {
        const ringWidthAtY = Math.sqrt(1 - ringY * ringY);
        ringLeftX = Math.floor(width / 2 - ringWidthAtY * ringOuterRadius);
        ringRightX = Math.ceil(width / 2 + ringWidthAtY * ringOuterRadius);
      }

      // 木星的球体计算
      const jupiterCenterY = height / 2 - 1;
      const jupiterNormalizedY = (y - jupiterCenterY) / (height / 2 - 2);
      const jupiterRadius = Math.sqrt(1 - jupiterNormalizedY * jupiterNormalizedY);

      const jupiterWidth = Math.floor(22 * jupiterRadius);
      const jupiterLeftX = Math.floor((width - jupiterWidth) / 2);
      const jupiterRightX = jupiterLeftX + jupiterWidth;

      for (let x = 0; x < width; x++) {
        let char = ' ';

        // 绘制星环（后半部分，在木星后面）
        if (ringLeftX >= 0 && x >= ringLeftX && x <= ringRightX) {
          const distFromCenter = Math.abs(x - width / 2);
          const normalizedDist = distFromCenter / ringOuterRadius;

          // 只在木星后面绘制星环
          if (x < jupiterLeftX || x > jupiterRightX) {
            if (distFromCenter >= ringInnerRadius) {
              const ringIdx = Math.floor(normalizedDist * (RING_CHARS.length - 1));
              const waveOffset = Math.sin((x + rotation) * 0.2) * 2;
              const finalRingIdx = Math.max(0, Math.min(RING_CHARS.length - 1,
                Math.floor(ringIdx + waveOffset)));
              char = RING_CHARS[finalRingIdx];
            }
          }
        }

        // 绘制木星
        if (x >= jupiterLeftX && x <= jupiterRightX) {
          const band = jupiterBands.find(b => y >= b.y && y < b.y + b.height);

          if (band) {
            const relX = x - jupiterLeftX;
            const textureOffset = (x + rotation) % 3;

            const redSpotCenter = Math.floor((redSpotX + width / 2) % width);
            const distFromSpot = Math.abs(x - redSpotCenter);

            let jupiterChar = band.char;

            // 大红斑
            if (y >= 13 && y <= 14) {
              if (distFromSpot < 4) jupiterChar = '@';
              else if (distFromSpot < 5) jupiterChar = '#';
              else if (distFromSpot < 6) jupiterChar = '*';
            }

            // 条纹纹理
            if (textureOffset === 0 && jupiterChar === '=') jupiterChar = '-';
            else if (textureOffset === 1 && jupiterChar === ':') jupiterChar = '.';

            char = jupiterChar;
          }
        }

        // 绘制星环（前半部分，在木星前面）
        if (ringLeftX >= 0 && x >= ringLeftX && x <= ringRightX) {
          const distFromCenter = Math.abs(x - width / 2);
          if (distFromCenter >= ringInnerRadius && x > jupiterLeftX && x < jupiterRightX) {
            const normalizedDist = distFromCenter / ringOuterRadius;
            const ringIdx = Math.floor(normalizedDist * (RING_CHARS.length - 1));
            const waveOffset = Math.sin((x + rotation) * 0.2) * 2;
            const finalRingIdx = Math.max(0, Math.min(RING_CHARS.length - 1,
              Math.floor(ringIdx + waveOffset)));
            char = RING_CHARS[finalRingIdx];
          }
        }

        ascii += char;
      }
      ascii += '\n';
    }

    return ascii;
  };

  useEffect(() => {
    const animate = () => {
      setFrame(prev => (prev + 1) % 250);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const asciiArt = generateSaturnJupiter(frame);
  const displaySize = fitContainer ? containerHeight : size;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        fontFamily: 'monospace',
        fontSize: `${Math.max(8, displaySize / 8)}px`,
        lineHeight: '1',
        whiteSpace: 'pre',
        color: '#D4A574',
        textShadow: '0 0 10px rgba(212, 165, 116, 0.3)',
        display: 'inline-block',
        filter: 'drop-shadow(0 0 8px rgba(212, 165, 116, 0.2))',
        flexShrink: 0,
        height: fitContainer ? '100%' : 'auto',
      }}
      title="Saturn-style Jupiter ASCII Animation"
    >
      {asciiArt}
    </div>
  );
}
