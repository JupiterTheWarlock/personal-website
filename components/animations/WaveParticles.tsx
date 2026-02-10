'use client';

import AsciiAnimation from '../canvas/AsciiAnimation';
import { P5SketchProps } from '../canvas/P5Container';

interface WaveParticlesProps {
  width?: number;
  height?: number;
  charSize?: number;
  color?: string;
  className?: string;
}

/**
 * 波浪粒子 ASCII 动画
 */
export default function WaveParticles({
  width = 400,
  height = 200,
  charSize = 8,
  color = '#7DD3FC',
  className = '',
}: WaveParticlesProps) {
  const sketch = ({ p, width, height }: P5SketchProps) => {
    const particles: {
      x: number;
      y: number;
      baseY: number;
      size: number;
      speed: number;
      amplitude: number;
      phase: number;
    }[] = [];

    // 初始化粒子
    const cols = 30;
    const rows = 15;
    const xSpacing = width / cols;
    const ySpacing = height / rows;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        particles.push({
          x: i * xSpacing + xSpacing / 2,
          y: j * ySpacing + ySpacing / 2,
          baseY: j * ySpacing + ySpacing / 2,
          size: Math.random() * 8 + 4,
          speed: Math.random() * 0.03 + 0.02,
          amplitude: Math.random() * 20 + 10,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    let time = 0;

    p.draw = () => {
      p.background(0);

      time += 1;

      // 绘制波浪粒子
      particles.forEach((particle) => {
        // 计算波浪运动
        const waveY = Math.sin(time * particle.speed + particle.phase) * particle.amplitude;
        particle.y = particle.baseY + waveY;

        // 根据位置调整亮度
        const brightness = p.map(
          Math.abs(waveY),
          0,
          particle.amplitude,
          255,
          100
        );

        p.noStroke();
        p.fill(brightness);
        p.circle(particle.x, particle.y, particle.size);
      });

      // 添加一些水平连线
      p.stroke(150);
      p.strokeWeight(1);
      for (let j = 0; j < rows; j++) {
        p.noFill();
        p.beginShape();
        for (let i = 0; i < cols; i++) {
          const idx = i * rows + j;
          if (idx < particles.length) {
            p.vertex(particles[idx].x, particles[idx].y);
          }
        }
        p.endShape();
      }
    };
  };

  return (
    <AsciiAnimation
      sketch={sketch}
      width={width}
      height={height}
      charSize={charSize}
      inverted={true}
      color={color}
      className={className}
    />
  );
}
