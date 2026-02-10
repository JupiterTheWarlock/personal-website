'use client';

import { useEffect, useRef } from 'react';
import p5 from 'p5';

export interface P5SketchProps {
  p: p5;
  width: number;
  height: number;
}

export type P5Sketch = (props: P5SketchProps) => void;

interface P5ContainerProps {
  sketch: P5Sketch;
  width?: number;
  height?: number;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  className?: string;
}

/**
 * p5.js React 包装器 - 在无全局模式下运行 p5
 */
export default function P5Container({
  sketch,
  width = 400,
  height = 400,
  onCanvasReady,
  className = '',
}: P5ContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // p5 instance mode - 避免全局污染
    const instance = new p5((p: p5) => {
      p.setup = () => {
        const canvas = p.createCanvas(width, height);
        canvas.parent(containerRef.current!);

        // 调用用户的 sketch 函数
        sketch({ p, width, height });

        // 通知外部 canvas 已就绪
        if (onCanvasReady && canvas.elt) {
          onCanvasReady(canvas.elt);
        }
      };

      p.draw = () => {
        // 用户可以在 sketch 中定义自己的 draw
      };

      p.windowResized = () => {
        // 可以在这里处理响应式调整
      };
    }, containerRef.current);

    p5InstanceRef.current = instance;

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [sketch, width, height, onCanvasReady]);

  return <div ref={containerRef} className={className} />;
}
