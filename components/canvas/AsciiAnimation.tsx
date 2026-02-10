'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import P5Container, { P5SketchProps, P5Sketch } from './P5Container';

// ASCII 字符集 - 从暗到亮
const ASCII_CHARS = ['@', '%', '#', '*', '+', '=', ':', '-', '.', ' '];

export interface AsciiAnimationProps {
  sketch: P5Sketch;
  width?: number;
  height?: number;
  charSize?: number;
  className?: string;
  inverted?: boolean;
  color?: string;
  showCanvas?: boolean; // 调试用，显示原始 canvas
}

/**
 * ASCII 动画基础组件
 * 将 p5.js Canvas 渲染的内容转换为 ASCII 字符显示
 */
export default function AsciiAnimation({
  sketch,
  width = 400,
  height = 400,
  charSize = 8,
  className = '',
  inverted = false,
  color = '#D4A574',
  showCanvas = false,
}: AsciiAnimationProps) {
  const [asciiOutput, setAsciiOutput] = useState<string>('');
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>();

  // 处理 canvas 就绪
  const handleCanvasReady = useCallback((canvasEl: HTMLCanvasElement) => {
    setCanvas(canvasEl);
  }, []);

  // 将 Canvas 转换为 ASCII
  const renderToAscii = useCallback((canvasEl: HTMLCanvasElement) => {
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    const canvasWidth = canvasEl.width;
    const canvasHeight = canvasEl.height;

    // 缩放采样以提高性能
    const scale = 0.5;
    const scaledWidth = Math.floor(canvasWidth * scale);
    const scaledHeight = Math.floor(canvasHeight * scale);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = scaledWidth;
    tempCanvas.height = scaledHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.drawImage(canvasEl, 0, 0, scaledWidth, scaledHeight);

    const imageData = tempCtx.getImageData(0, 0, scaledWidth, scaledHeight);
    const pixels = imageData.data;

    const gridWidth = Math.ceil(scaledWidth / charSize);
    const gridHeight = Math.ceil(scaledHeight / charSize);

    let ascii = '';

    for (let gridY = 0; gridY < gridHeight; gridY++) {
      for (let gridX = 0; gridX < gridWidth; gridX++) {
        let totalBrightness = 0;
        let pixelCount = 0;

        const startX = gridX * charSize;
        const startY = gridY * charSize;
        const endX = Math.min(startX + charSize, scaledWidth);
        const endY = Math.min(startY + charSize, scaledHeight);

        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const idx = (y * scaledWidth + x) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            totalBrightness += brightness;
            pixelCount++;
          }
        }

        const avgBrightness = totalBrightness / pixelCount;
        let charIndex = Math.floor(avgBrightness * (ASCII_CHARS.length - 1));

        if (inverted) {
          charIndex = ASCII_CHARS.length - 1 - charIndex;
        }

        charIndex = Math.max(0, Math.min(ASCII_CHARS.length - 1, charIndex));
        ascii += ASCII_CHARS[charIndex];
      }
      ascii += '\n';
    }

    setAsciiOutput(ascii);
  }, [charSize, inverted]);

  // 动画循环
  useEffect(() => {
    if (!canvas) return;

    const animate = () => {
      renderToAscii(canvas);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [canvas, renderToAscii]);

  return (
    <div className={`relative inline-block ${className}`}>
      {/* 隐藏的 p5 canvas - 使用多种方式确保完全不可见 */}
      <div style={{ display: 'none', visibility: 'hidden', position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <P5Container
          sketch={sketch}
          width={width}
          height={height}
          onCanvasReady={handleCanvasReady}
        />
      </div>

      {/* 调试：显示原始 canvas */}
      {showCanvas && canvas && (
        <div className="absolute top-0 left-0 opacity-20 pointer-events-none">
          <img src={canvas.toDataURL()} alt="debug" style={{ width, height }} />
        </div>
      )}

      {/* ASCII 输出 */}
      <pre
        style={{
          fontFamily: 'monospace',
          fontSize: `${charSize}px`,
          lineHeight: `${charSize * 0.8}px`,
          whiteSpace: 'pre',
          color,
          textShadow: `0 0 10px ${color}40`,
          filter: `drop-shadow(0 0 5px ${color}30)`,
        }}
      >
        {asciiOutput}
      </pre>
    </div>
  );
}
