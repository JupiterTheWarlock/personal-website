'use client';

import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// 读取 shader 代码
const fragmentShader = `
uniform sampler2D tDiffuse;
uniform vec2 uResolution;
uniform float uPixelSize;
uniform float uTime;

in vec2 vUv;
out vec4 fragColor;

// ASCII 字符集 - 从暗到亮
// @ % # * + = : - .
const int CHAR_COUNT = 9;

// 字符亮度映射函数
float getCharDensity(int charIndex, vec2 pixelCoord) {
    vec2 grid = floor(pixelCoord);

    // @ 符号
    if (charIndex == 0) {
        vec2 center = vec2(2.0, 3.0);
        float outer = length(grid - center) < 2.5 ? 1.0 : 0.0;
        float inner = length(grid - center) < 1.5 ? 1.0 : 0.0;
        return outer - inner;
    }
    // % 符号
    else if (charIndex == 1) {
        float d1 = abs(grid.x - grid.y) < 1.0 ? 1.0 : 0.0;
        float d2 = abs(grid.x - (6.0 - grid.y)) < 1.0 ? 1.0 : 0.0;
        return d1 + d2;
    }
    // # 符号
    else if (charIndex == 2) {
        float v = (grid.x == 1.0 || grid.x == 3.0) ? 1.0 : 0.0;
        float h = (grid.y >= 1.0 && grid.y <= 5.0) ? 1.0 : 0.0;
        return max(v, h * 0.3);
    }
    // * 符号
    else if (charIndex == 3) {
        vec2 center = vec2(2.0, 3.0);
        float cross = (abs(grid.x - 2.0) < 0.5 || abs(grid.y - 3.0) < 0.5) ? 1.0 : 0.0;
        float diag = (abs(grid.x - grid.y + 1.0) < 0.5 || abs(grid.x + grid.y - 5.0) < 0.5) ? 1.0 : 0.0;
        return max(cross, diag);
    }
    // + 符号
    else if (charIndex == 4) {
        float v = (abs(grid.x - 2.0) < 0.5 && grid.y >= 1.0 && grid.y <= 5.0) ? 1.0 : 0.0;
        float h = (abs(grid.y - 3.0) < 0.5 && grid.x >= 0.0 && grid.x <= 4.0) ? 1.0 : 0.0;
        return max(v, h);
    }
    // = 符号
    else if (charIndex == 5) {
        float h1 = abs(grid.y - 2.0) < 0.5 ? 1.0 : 0.0;
        float h2 = abs(grid.y - 4.0) < 0.5 ? 1.0 : 0.0;
        return max(h1, h2) * (grid.x >= 0.0 && grid.x <= 4.0 ? 1.0 : 0.0);
    }
    // : 符号
    else if (charIndex == 6) {
        return (abs(grid.y - 2.0) < 0.5 || abs(grid.y - 4.0) < 0.5) && abs(grid.x - 2.0) < 0.5 ? 1.0 : 0.0;
    }
    // - 符号
    else if (charIndex == 7) {
        return abs(grid.y - 3.0) < 0.5 && grid.x >= 1.0 && grid.x <= 3.0 ? 1.0 : 0.0;
    }
    // . 符号
    else if (charIndex == 8) {
        return abs(grid.x - 2.0) < 0.5 && abs(grid.y - 4.0) < 0.5 ? 1.0 : 0.0;
    }

    return 0.0;
}

void main() {
    vec2 pixelCoord = gl_FragCoord.xy;

    // 计算字符块的大小
    float charSize = uPixelSize;

    // 将像素坐标对齐到字符网格
    vec2 cellCoord = floor(pixelCoord / charSize) * charSize;

    // 采样该字符块中心的颜色
    vec2 sampleUv = (cellCoord + charSize * 0.5) / uResolution;
    vec4 color = texture(tDiffuse, sampleUv);

    // 计算亮度 (使用感知权重)
    float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));

    // 根据亮度选择字符索引 (0 = 最暗/@, 8 = 最亮/.)
    int charIndex = int(luminance * float(CHAR_COUNT - 1));
    charIndex = clamp(charIndex, 0, CHAR_COUNT - 1);

    // 获取当前像素在字符块内的相对坐标
    vec2 localPixel = mod(pixelCoord, charSize);

    // 将坐标缩放到 5x7 字符网格
    vec2 gridCoord = floor(localPixel / charSize * vec2(5.0, 7.0));

    // 获取字符密度
    float charDensity = getCharDensity(charIndex, gridCoord);

    // 应用字符密度到颜色，混合效果以保持可读性
    float mixFactor = 0.7; // 70% ASCII 效果，30% 原始内容
    vec3 finalColor = mix(color.rgb, color.rgb * charDensity, mixFactor);

    fragColor = vec4(finalColor, color.a);
}
`;

interface AsciiEffectProps {
  pixelSize?: number;
}

export default function AsciiEffect({ pixelSize = 12.0 }: AsciiEffectProps) {
  const { gl, scene, camera, size } = useThree();

  const effect = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      fragmentShader,
      vertexShader: `
        in vec3 position;
        in vec2 uv;
        out vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      uniforms: {
        tDiffuse: { value: null },
        uResolution: { value: new THREE.Vector2(size.width, size.height) },
        uPixelSize: { value: pixelSize },
        uTime: { value: 0 },
      },
    });

    return { material, quad: new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material) };
  }, [pixelSize, size.width, size.height]);

  useEffect(() => {
    effect.material.uniforms.uResolution.value.set(size.width, size.height);
    effect.material.uniforms.uPixelSize.value = pixelSize;
  }, [size, pixelSize, effect]);

  useFrame((state) => {
    effect.material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  useEffect(() => {
    scene.add(effect.quad);
    return () => {
      scene.remove(effect.quad);
      effect.material.dispose();
      effect.quad.geometry.dispose();
    };
  }, [effect, scene]);

  return null;
}
