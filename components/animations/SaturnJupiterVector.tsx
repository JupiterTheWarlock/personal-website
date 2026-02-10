'use client';

import AsciiAnimation from '../canvas/AsciiAnimation';
import { P5SketchProps } from '../canvas/P5Container';

interface SaturnJupiterVectorProps {
  size?: number;
  charSize?: number;
  className?: string;
}

/**
 * 带星环的木星 - 使用 p5.js 矢量图形绘制，然后转换为 ASCII
 */
export default function SaturnJupiterVector({
  size = 200,
  charSize = 8,
  className = '',
}: SaturnJupiterVectorProps) {
  const sketch = ({ p, width, height }: P5SketchProps) => {
    let rotation = 0;

    p.draw = () => {
      // 黑色背景
      p.background(0);

      const centerX = width / 2;
      const centerY = height / 2;
      const planetRadius = Math.min(width, height) * 0.35;

      rotation += 0.02;

      // 绘制星环后半部分（在行星后面）
      drawRing(p, centerX, centerY, planetRadius, rotation, true);

      // 绘制木星本体
      drawJupiter(p, centerX, centerY, planetRadius, rotation);

      // 绘制星环前半部分（在行星前面）
      drawRing(p, centerX, centerY, planetRadius, rotation, false);
    };

    // 绘制木星
    const drawJupiter = (p: any, cx: number, cy: number, radius: number, rot: number) => {
      p.push();
      p.translate(cx, cy);

      // 绘制球体底色
      p.noStroke();
      p.fill(180, 140, 100);
      p.circle(0, 0, radius * 2);

      // 绘制条纹
      const bands = [
        { y: -0.7, h: 0.1, color: [100, 70, 50] },
        { y: -0.5, h: 0.15, color: [140, 100, 70] },
        { y: -0.3, h: 0.12, color: [160, 120, 80] },
        { y: -0.1, h: 0.08, color: [180, 140, 100] },
        { y: 0.05, h: 0.1, color: [150, 110, 75] },
        { y: 0.2, h: 0.12, color: [170, 130, 90] },
        { y: 0.4, h: 0.15, color: [140, 100, 70] },
        { y: 0.65, h: 0.1, color: [120, 85, 60] },
      ];

      bands.forEach((band) => {
        const bandY = band.y * radius;
        const bandHeight = band.h * radius;

        // 使用剪裁区域确保条纹只在球体内
        p.drawingContext.save();
        p.drawingContext.beginPath();
        p.drawingContext.arc(0, 0, radius, 0, Math.PI * 2);
        p.drawingContext.clip();

        p.fill(band.color[0], band.color[1], band.color[2]);
        p.noStroke();
        p.rect(-radius, bandY - bandHeight / 2, radius * 2, bandHeight);

        p.drawingContext.restore();
      });

      // 绘制大红斑
      const spotX = Math.sin(rot * 0.5) * radius * 0.3;
      const spotY = radius * 0.1;
      const spotSize = radius * 0.2;

      p.drawingContext.save();
      p.drawingContext.beginPath();
      p.drawingContext.arc(0, 0, radius, 0, Math.PI * 2);
      p.drawingContext.clip();

      p.fill(180, 80, 60);
      p.noStroke();
      p.ellipse(spotX, spotY, spotSize, spotSize * 0.6);

      p.drawingContext.restore();

      // 添加高光效果
      p.drawingContext.save();
      p.drawingContext.beginPath();
      p.drawingContext.arc(0, 0, radius, 0, Math.PI * 2);
      p.drawingContext.clip();

      p.fill(255, 255, 255, 30);
      p.noStroke();
      p.circle(-radius * 0.3, -radius * 0.3, radius * 0.4);

      p.drawingContext.restore();

      p.pop();
    };

    // 绘制星环
    const drawRing = (
      p: any,
      cx: number,
      cy: number,
      planetRadius: number,
      rot: number,
      back: boolean
    ) => {
      p.push();
      p.translate(cx, cy);

      // 星环倾斜
      p.rotate(0.3);

      const innerRadius = planetRadius * 1.4;
      const outerRadius = planetRadius * 2.2;

      // 绘制多个同心圆环
      const ringCount = 8;
      for (let i = 0; i < ringCount; i++) {
        const t = i / (ringCount - 1);
        const radius = innerRadius + t * (outerRadius - innerRadius);
        const thickness = (outerRadius - innerRadius) / ringCount * 0.8;

        // 根据是否绘制后半部分来决定Y范围
        const shouldDraw = back ? (i >= ringCount / 2) : (i < ringCount / 2);

        if (shouldDraw) {
          const brightness = 150 + Math.sin(rot + i) * 50;
          p.fill(brightness, brightness * 0.9, brightness * 0.7, 200);
          p.noStroke();

          // 绘制椭圆弧
          p.beginShape();
          const startAngle = back ? 0 : Math.PI;
          const endAngle = back ? Math.PI : Math.PI * 2;

          for (let a = startAngle; a <= endAngle; a += 0.1) {
            const x = Math.cos(a) * radius;
            const y = Math.sin(a) * radius * 0.3; // 压扁成椭圆
            p.vertex(x, y);
          }

          // 内圈
          for (let a = endAngle; a >= startAngle; a -= 0.1) {
            const x = Math.cos(a) * (radius - thickness);
            const y = Math.sin(a) * (radius - thickness) * 0.3;
            p.vertex(x, y);
          }

          p.endShape(p.CLOSE);
        }
      }

      p.pop();
    };
  };

  // 画布比例适配图形：星环外径 = planetRadius*2.2，水平需 4.4*planetRadius，planetRadius=min(w,h)*0.35
  // 以高度为基准时需 width >= height * 4.4*0.35 ≈ 1.54*height，取 1.6 留边
  const canvasHeight = size;
  const canvasWidth = Math.round(size * 1.6);

  return (
    <div className={`h-full w-full ${className}`}>
      <AsciiAnimation
        sketch={sketch}
        width={canvasWidth}
        height={canvasHeight}
        charSize={charSize}
        inverted={true}
        color="#D4A574"
        fillContainer={true}
      />
    </div>
  );
}
