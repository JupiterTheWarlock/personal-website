'use client';

import React, { useEffect, useState, useRef } from 'react';

interface AsciiJupiterProps {
  size?: number;
  className?: string;
  fitContainer?: boolean;
}

// 木星的ASCII字符集，从亮到暗
const JUPITER_CHARS = ['@', '%', '#', '*', '+', '=', ':', '-', '.', ' '];

export default function AsciiJupiter({ size = 100, className = '', fitContainer = false }: AsciiJupiterProps) {
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

  // 木星的条纹和特征（重新定义以适应新的高度）
  const jupiterBands = [
    { y: 0, height: 2, char: ' ', color: '#000000' },      // 太空
    { y: 2, height: 1, char: '.', color: '#4a3828' },      // 北极
    { y: 3, height: 2, char: ':', color: '#6b4c35' },
    { y: 5, height: 1, char: '-', color: '#8b5d3d' },
    { y: 6, height: 2, char: '=', color: '#a67b52' },      // 北温带
    { y: 8, height: 2, char: ':', color: '#c9946b' },
    { y: 10, height: 3, char: '=', color: '#c88a60' },     // 大红斑区域
    { y: 13, height: 2, char: '#', color: '#b87852' },     // 大红斑
    { y: 15, height: 2, char: ':', color: '#a67b52' },     // 南热带
    { y: 17, height: 2, char: '-', color: '#6b4c35' },     // 南温带
    { y: 19, height: 1, char: '.', color: '#4a3828' },     // 南极
    { y: 20, height: 2, char: ' ', color: '#000000' },     // 太空
  ];

  // 生成木星ASCII艺术
  const generateJupiter = (rotation: number) => {
    const width = 25;
    const height = 18; // 调整高度使其接近正圆形
    let ascii = '';

    // 大红斑的位置（随着旋转移动）
    const redSpotX = Math.floor((rotation / 10) % width);

    for (let y = 0; y < height; y++) {
      // 计算当前行的半径
      const centerY = height / 2;
      const normalizedY = (y - centerY) / (height / 2);
      const radius = Math.sqrt(1 - normalizedY * normalizedY);

      // 计算该行的有效宽度（球体边缘）
      const rowWidth = Math.floor(width * radius);

      // 计算左边距（居中）
      const leftPadding = Math.floor((width - rowWidth) / 2);

      for (let x = 0; x < width; x++) {
        if (x < leftPadding || x >= leftPadding + rowWidth) {
          ascii += ' '; // 球体外部
        } else {
          // 找到对应的条纹
          const band = jupiterBands.find(b => y >= b.y && y < b.y + b.height);

          if (band) {
            // 计算在条纹内的相对位置（用于创建条纹纹理）
            const relX = x - leftPadding;
            const textureOffset = (x + rotation) % 3;

            // 检查是否在大红斑区域（更新为新位置 y: 13-14）
            const isInRedSpotArea = y >= 13 && y <= 14;
            const redSpotCenter = Math.floor((redSpotX + width / 2) % width);
            const distFromSpot = Math.abs(relX + leftPadding - redSpotCenter);

            let char = band.char;

            // 大红斑特殊处理
            if (isInRedSpotArea && distFromSpot < 4) {
              char = '@'; // 大红斑用更密集的字符
            } else if (isInRedSpotArea && distFromSpot < 5) {
              char = '#';
            } else if (isInRedSpotArea && distFromSpot < 6) {
              char = '*';
            }

            // 添加条纹纹理变化
            if (textureOffset === 0 && char === '=') {
              char = '-';
            } else if (textureOffset === 1 && char === ':') {
              char = '.';
            }

            ascii += char;
          } else {
            ascii += ' ';
          }
        }
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

  const asciiArt = generateJupiter(frame);

  const displaySize = fitContainer ? containerHeight : size;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        fontFamily: 'monospace',
        fontSize: `${Math.max(8, displaySize / 6)}px`,
        lineHeight: '1',
        whiteSpace: 'pre',
        color: '#D4A574',
        textShadow: '0 0 10px rgba(212, 165, 116, 0.3)',
        display: 'inline-block',
        filter: 'drop-shadow(0 0 8px rgba(212, 165, 116, 0.2))',
        flexShrink: 0,
        height: fitContainer ? '100%' : 'auto',
      }}
      title="Jupiter ASCII Animation"
    >
      {asciiArt}
    </div>
  );
}
