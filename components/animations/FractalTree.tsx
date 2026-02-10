'use client';

import AsciiAnimation from '../canvas/AsciiAnimation';
import { P5SketchProps } from '../canvas/P5Container';

interface FractalTreeProps {
  size?: number;
  charSize?: number;
  color?: string;
  className?: string;
}

/**
 * 分形树 ASCII 动画
 */
export default function FractalTree({
  size = 300,
  charSize = 8,
  color = '#90EE90',
  className = '',
}: FractalTreeProps) {
  const sketch = ({ p, width, height }: P5SketchProps) => {
    let angle = 0;
    let len = 100;

    // 递归绘制分形树
    const drawBranch = (len: number) => {
      p.line(0, 0, 0, -len);
      p.translate(0, -len);

      if (len > 10) {
        p.push();
        p.rotate(angle);
        drawBranch(len * 0.67);
        p.pop();

        p.push();
        p.rotate(-angle);
        drawBranch(len * 0.67);
        p.pop();
      }
    };

    p.draw = () => {
      p.background(0);

      // 设置树的起点
      p.translate(width / 2, height);

      // 设置样式
      p.stroke(255);
      p.strokeWeight(2);

      // 动态调整角度
      angle = p.map(p.sin(p.frameCount * 0.02), -1, 1, 0, Math.PI / 3);

      // 绘制树
      drawBranch(len);
    };
  };

  return (
    <AsciiAnimation
      sketch={sketch}
      width={size}
      height={size}
      charSize={charSize}
      inverted={true}
      color={color}
      className={className}
    />
  );
}
