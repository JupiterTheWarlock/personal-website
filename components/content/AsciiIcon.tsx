'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AsciiIconProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

// ASCII 字符集 - 从暗到亮
const ASCII_CHARS = '@%#*+=:-. ';

export default function AsciiIcon({
  src,
  alt,
  width = 32,
  height = 32,
  className = '',
}: AsciiIconProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [asciiArt, setAsciiArt] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // 设置 canvas 尺寸
        const scale = 0.5; // 降低分辨率以提高 ASCII 效果
        canvas.width = width * scale;
        canvas.height = height * scale;

        // 绘制图像
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 获取像素数据
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // 转换为 ASCII
        let ascii = '';

        for (let y = 0; y < canvas.height; y += 2) {
          for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4;
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];

            // 跳过透明像素
            if (a < 128) {
              ascii += ' ';
              continue;
            }

            // 计算亮度
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

            // 映射到 ASCII 字符 (反转亮度，暗色用密集字符)
            const charIndex = Math.floor((1 - brightness) * (ASCII_CHARS.length - 1));
            const char = ASCII_CHARS[charIndex];

            ascii += char;
          }
          ascii += '\n';
        }

        setAsciiArt(ascii);
      } catch (error) {
        console.error('Failed to convert icon to ASCII:', error);
        setAsciiArt('[ICON]');
      }
    };

    img.onerror = () => {
      console.error(`Failed to load icon: ${src}`);
      setAsciiArt('[?]');
    };

    img.src = src;
  }, [src, width, height]);

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div
        ref={containerRef}
        className={className}
        style={{
          fontFamily: 'monospace',
          fontSize: `${Math.max(4, width / 8)}px`,
          lineHeight: '1.2',
          whiteSpace: 'pre',
          color: '#FFFFFF',
          width: `${width}px`,
          height: `${height}px`,
          overflow: 'hidden',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title={alt}
      >
        {asciiArt || '...'}
      </div>
    </>
  );
}
