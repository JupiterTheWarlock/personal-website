'use client';

import AsciiAnimation from '../canvas/AsciiAnimation';
import { P5SketchProps } from '../canvas/P5Container';

interface RotatingSquareProps {
  size?: number;
  charSize?: number;
  color?: string;
  className?: string;
}

/**
 * 旋转正方形 ASCII 动画
 */
export default function RotatingSquare({
  size = 300,
  charSize = 10,
  color = '#D4A574',
  className = '',
}: RotatingSquareProps) {
  const sketch = ({ p, width, height }: P5SketchProps) => {
    let angle = 0;

    p.draw = () => {
      // 黑色背景
      p.background(0);

      // 设置中心
      p.translate(width / 2, height / 2);

      // 旋转
      p.rotate(angle);

      // 绘制多个嵌套正方形
      const squares = 5;
      for (let i = 0; i < squares; i++) {
        const size = (width / squares) * (squares - i) * 0.7;
        const brightness = 255 - (i * 40);

        p.push();
        p.rotate(angle * (i % 2 === 0 ? 1 : -1) * 0.5);
        p.noFill();
        p.stroke(brightness);
        p.strokeWeight(3);
        p.rectMode(p.CENTER);
        p.rect(0, 0, size, size);
        p.pop();
      }

      angle += 0.02;
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
