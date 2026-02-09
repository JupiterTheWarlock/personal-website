'use client';

import { useEffect } from 'react';

/**
 * 简化版 ASCII 效果组件
 * 使用 CSS 和 SVG filter 实现轻量级 ASCII 效果
 */
export default function AsciiOverlaySimple() {
  useEffect(() => {
    // 创建 SVG filter 用于像素化效果
    const createSvgFilter = () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.style.position = 'absolute';
      svg.style.width = '0';
      svg.style.height = '0';

      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
      filter.setAttribute('id', 'ascii-pixelate');

      // 创建像素化效果
      const feColorMatrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
      feColorMatrix.setAttribute('type', 'matrix');
      feColorMatrix.setAttribute('values', '0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0');

      filter.appendChild(feColorMatrix);
      defs.appendChild(filter);
      svg.appendChild(defs);
      document.body.appendChild(svg);
    };

    createSvgFilter();

    // 添加 ASCII 字符纹理样式
    const style = document.createElement('style');
    style.textContent = `
      .ascii-texture {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1000;
        opacity: 0.03;
        background-image: url("data:image/svg+xml,%3Csvg width='12' height='14' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='0' y='12' font-family='monospace' font-size='12' fill='%23cccccc'%3E@%3C/text%3E%3C/svg%3E");
        background-size: 12px 14px;
        mix-blend-mode: overlay;
      }

      .terminal-window::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: repeating-linear-gradient(
          0deg,
          rgba(0, 0, 0, 0.05),
          rgba(0, 0, 0, 0.05) 1px,
          transparent 1px,
          transparent 2px
        );
        pointer-events: none;
      }

      .ascii-border::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border: 1px solid rgba(192, 192, 192, 0.1);
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);

    // 添加纹理覆盖层
    const texture = document.createElement('div');
    texture.className = 'ascii-texture';
    document.body.appendChild(texture);

    return () => {
      // 清理
      if (document.querySelector('.ascii-texture')) {
        document.querySelector('.ascii-texture')?.remove();
      }
      style.remove();
    };
  }, []);

  return null;
}
