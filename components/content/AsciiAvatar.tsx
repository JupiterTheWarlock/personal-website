'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AsciiAvatarProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}

// ASCII 字符集 - 从暗到亮
const ASCII_CHARS = '@%#*+=:-. ';

// 彩色字符类型
interface ColoredChar {
  char: string;
  color: string;
}

export default function AsciiAvatar({
  src,
  alt,
  size = 128,
  className = '',
}: AsciiAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [asciiArt, setAsciiArt] = useState<ColoredChar[][]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 重置状态
    setError('');
    setAsciiArt('');

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // 设置 canvas 尺寸 - 确保是整数
        const scale = 0.5;
        const width = Math.floor(size * scale);
        const height = Math.floor(size * scale);

        canvas.width = width;
        canvas.height = height;

        // 绘制圆形图像
        ctx.clearRect(0, 0, width, height);
        ctx.save();
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, width / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, 0, 0, width, height);
        ctx.restore();

        // 获取像素数据
        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;

        // 转换为彩色 ASCII
        const coloredAscii: ColoredChar[][] = [];
        const charsLength = ASCII_CHARS.length;

        for (let y = 0; y < height; y += 2) {
          const row: ColoredChar[] = [];
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;

            // 检查索引是否有效
            if (i + 3 >= pixels.length) {
              row.push({ char: ' ', color: 'transparent' });
              continue;
            }

            const r = pixels[i] ?? 0;
            const g = pixels[i + 1] ?? 0;
            const b = pixels[i + 2] ?? 0;
            const a = pixels[i + 3] ?? 0;

            // 跳过透明像素（圆形裁剪外部）
            if (a < 128) {
              row.push({ char: ' ', color: 'transparent' });
              continue;
            }

            // 计算亮度
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

            // 映射到 ASCII 字符 (反转亮度，暗色用密集字符)
            let charIndex = Math.floor((1 - brightness) * (charsLength - 1));

            // 确保 charIndex 在有效范围内
            charIndex = Math.max(0, Math.min(charsLength - 1, charIndex));

            // 使用原始颜色
            row.push({
              char: ASCII_CHARS[charIndex],
              color: `rgb(${r}, ${g}, ${b})`
            });
          }
          coloredAscii.push(row);
        }

        setAsciiArt(coloredAscii);
      } catch (err) {
        console.error('Failed to convert avatar to ASCII:', err);
        setError('CORS_ERROR');
      }
    };

    img.onerror = (e) => {
      console.error(`Failed to load avatar: ${src}`, e);
      setError('LOAD_ERROR');
    };

    img.src = src;
  }, [src, size]);

  // 计算字体大小，使 ASCII 适合容器
  const fontSize = Math.max(6, size / 16);

  // 如果有错误，显示原始图片（降级方案）
  if (error === 'CORS_ERROR' || error === 'LOAD_ERROR') {
    return (
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={className}
        style={{
          borderRadius: '50%',
          objectFit: 'cover',
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect fill="#333" width="128" height="128"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#FFF" font-size="40">?</text></svg>');
        }}
      />
    );
  }

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div
        className={className}
        style={{
          fontFamily: 'monospace',
          fontSize: `${fontSize}px`,
          lineHeight: '1',
          width: `${size}px`,
          height: `${size}px`,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          backgroundColor: '#000000',
          boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)',
        }}
        title={alt}
      >
        {asciiArt.length > 0 ? (
          asciiArt.map((row, y) => (
            <div key={y} style={{ display: 'flex', alignItems: 'center' }}>
              {row.map((item, x) => (
                <span
                  key={`${y}-${x}`}
                  style={{
                    color: item.color,
                    visibility: item.char === ' ' ? 'hidden' : 'visible',
                  }}
                >
                  {item.char}
                </span>
              ))}
            </div>
          ))
        ) : (
          'Loading...'
        )}
      </div>
    </>
  );
}
