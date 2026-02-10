import { useRef, useEffect, useCallback } from 'react';

// ASCII 字符集 - 从暗到亮
const ASCII_CHARS = ['@', '%', '#', '*', '+', '=', ':', '-', '.', ' '];

interface UseAsciiRendererOptions {
  charSize?: number;
  resolution?: number;
  inverted?: boolean; // true = 亮字符在暗背景
}

interface UseAsciiRendererReturn {
  asciiOutput: string[][];
  renderCanvasToAscii: (canvas: HTMLCanvasElement) => void;
}

/**
 * 将 Canvas 像素数据转换为 ASCII 字符网格
 */
export function useAsciiRenderer(options: UseAsciiRendererOptions = {}): UseAsciiRendererReturn {
  const { charSize = 8, resolution = 1, inverted = false } = options;
  const asciiOutputRef = useRef<string[][]>([]);

  const renderCanvasToAscii = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = Math.floor(canvas.width / resolution);
    const height = Math.floor(canvas.height / resolution);

    // 创建临时 canvas 进行缩放采样
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // 缩放绘制到临时 canvas
    tempCtx.drawImage(canvas, 0, 0, width, height);

    // 获取像素数据
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const pixels = imageData.data;

    // 计算每个字符块的网格尺寸
    const gridWidth = Math.ceil(width / charSize);
    const gridHeight = Math.ceil(height / charSize);

    const asciiGrid: string[][] = [];

    // 遍历每个字符块
    for (let gridY = 0; gridY < gridHeight; gridY++) {
      asciiGrid[gridY] = [];
      for (let gridX = 0; gridX < gridWidth; gridX++) {
        // 计算当前块的平均亮度
        let totalBrightness = 0;
        let pixelCount = 0;

        const startX = gridX * charSize;
        const startY = gridY * charSize;
        const endX = Math.min(startX + charSize, width);
        const endY = Math.min(startY + charSize, height);

        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const idx = (y * width + x) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];

            // 使用感知亮度公式
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            totalBrightness += brightness;
            pixelCount++;
          }
        }

        const avgBrightness = totalBrightness / pixelCount;

        // 将亮度映射到 ASCII 字符
        let charIndex = Math.floor(avgBrightness * (ASCII_CHARS.length - 1));

        // 反转（如果需要）
        if (inverted) {
          charIndex = ASCII_CHARS.length - 1 - charIndex;
        }

        charIndex = Math.max(0, Math.min(ASCII_CHARS.length - 1, charIndex));
        asciiGrid[gridY][gridX] = ASCII_CHARS[charIndex];
      }
    }

    asciiOutputRef.current = asciiGrid;
  }, [charSize, resolution, inverted]);

  return {
    asciiOutput: asciiOutputRef.current,
    renderCanvasToAscii,
  };
}
