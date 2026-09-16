'use client';

import { useEffect } from 'react';

const MOTION = {
  maxTiltDegrees: 10,
  spring: 240,
  damping: 22,
  maxDeltaSeconds: 1 / 30,
  settlePosition: 0.01,
  settleVelocity: 0.02,
} as const;

const PARALLAX = {
  farPixelsPerDegree: 0.24,
  nearPixelsPerDegree: 0.58,
  farMaximumPixels: 2.4,
  nearMaximumPixels: 5.8,
} as const;

interface PanelMotion {
  pitch: number;
  yaw: number;
  pitchVelocity: number;
  yawVelocity: number;
  targetPitch: number;
  targetYaw: number;
  hovered: boolean;
  lastTimestamp: number;
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

function stepAxis(value: number, velocity: number, target: number, deltaTime: number) {
  const nextVelocity = (
    velocity + (target - value) * MOTION.spring * deltaTime
  ) * Math.exp(-MOTION.damping * deltaTime);
  return [value + nextVelocity * deltaTime, nextVelocity] as const;
}

export function useTiltCardMotion() {
  useEffect(() => {
    const motions = new Map<HTMLElement, PanelMotion>();
    let animationFrame = 0;

    const getMotion = (panel: HTMLElement) => {
      let motion = motions.get(panel);
      if (!motion) {
        motion = {
          pitch: 0,
          yaw: 0,
          pitchVelocity: 0,
          yawVelocity: 0,
          targetPitch: 0,
          targetYaw: 0,
          hovered: false,
          lastTimestamp: 0,
        };
        motions.set(panel, motion);
      }
      return motion;
    };

    const clearPanel = (panel: HTMLElement) => {
      panel.classList.remove('is-tilt-hovered');
      panel.style.removeProperty('--paper-tilt-x');
      panel.style.removeProperty('--paper-tilt-y');
      panel.style.removeProperty('--paper-far-x');
      panel.style.removeProperty('--paper-far-y');
      panel.style.removeProperty('--paper-near-x');
      panel.style.removeProperty('--paper-near-y');
    };

    const animate = (timestamp: number) => {
      animationFrame = 0;
      let needsAnotherFrame = false;

      motions.forEach((motion, panel) => {
        if (!panel.isConnected) {
          motions.delete(panel);
          return;
        }
        const deltaTime = motion.lastTimestamp
          ? Math.min(Math.max((timestamp - motion.lastTimestamp) / 1000, 0), MOTION.maxDeltaSeconds)
          : MOTION.maxDeltaSeconds;
        motion.lastTimestamp = timestamp;
        [motion.pitch, motion.pitchVelocity] = stepAxis(
          motion.pitch,
          motion.pitchVelocity,
          motion.targetPitch,
          deltaTime,
        );
        [motion.yaw, motion.yawVelocity] = stepAxis(
          motion.yaw,
          motion.yawVelocity,
          motion.targetYaw,
          deltaTime,
        );

        panel.style.setProperty('--paper-tilt-x', `${motion.pitch.toFixed(3)}deg`);
        panel.style.setProperty('--paper-tilt-y', `${motion.yaw.toFixed(3)}deg`);
        panel.style.setProperty('--paper-far-x', `${clamp(-motion.yaw * PARALLAX.farPixelsPerDegree, -PARALLAX.farMaximumPixels, PARALLAX.farMaximumPixels).toFixed(3)}px`);
        panel.style.setProperty('--paper-far-y', `${clamp(motion.pitch * PARALLAX.farPixelsPerDegree, -PARALLAX.farMaximumPixels, PARALLAX.farMaximumPixels).toFixed(3)}px`);
        panel.style.setProperty('--paper-near-x', `${clamp(-motion.yaw * PARALLAX.nearPixelsPerDegree, -PARALLAX.nearMaximumPixels, PARALLAX.nearMaximumPixels).toFixed(3)}px`);
        panel.style.setProperty('--paper-near-y', `${clamp(motion.pitch * PARALLAX.nearPixelsPerDegree, -PARALLAX.nearMaximumPixels, PARALLAX.nearMaximumPixels).toFixed(3)}px`);

        const settled = Math.abs(motion.pitch - motion.targetPitch) < MOTION.settlePosition
          && Math.abs(motion.yaw - motion.targetYaw) < MOTION.settlePosition
          && Math.abs(motion.pitchVelocity) < MOTION.settleVelocity
          && Math.abs(motion.yawVelocity) < MOTION.settleVelocity;
        if (!motion.hovered && settled) {
          clearPanel(panel);
          motions.delete(panel);
        } else {
          needsAnotherFrame = true;
        }
      });

      if (needsAnotherFrame) animationFrame = requestAnimationFrame(animate);
    };

    const schedule = () => {
      if (!animationFrame) animationFrame = requestAnimationFrame(animate);
    };

    const flatten = (panel: HTMLElement) => {
      panel.classList.remove('is-tilt-hovered');
      const motion = motions.get(panel);
      if (!motion) return;
      motion.targetPitch = 0;
      motion.targetYaw = 0;
      motion.hovered = false;
      schedule();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const target = event.target instanceof Element ? event.target : null;
      const panel = target?.closest<HTMLElement>('[data-tilt-card]');
      if (!panel) {
        motions.forEach((_motion, trackedPanel) => flatten(trackedPanel));
        return;
      }

      motions.forEach((_motion, trackedPanel) => {
        if (trackedPanel !== panel) flatten(trackedPanel);
      });
      const rect = panel.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const normalizedX = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
      const normalizedY = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
      const motion = getMotion(panel);
      motion.targetPitch = -normalizedY * MOTION.maxTiltDegrees;
      motion.targetYaw = normalizedX * MOTION.maxTiltDegrees;
      motion.hovered = true;
      panel.classList.add('is-tilt-hovered');
      schedule();
    };

    const onPointerOut = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const panel = target?.closest<HTMLElement>('[data-tilt-card]');
      if (!panel) return;
      if (!(event.relatedTarget instanceof Node && panel.contains(event.relatedTarget))) flatten(panel);
    };

    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerout', onPointerOut, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerout', onPointerOut);
      if (animationFrame) cancelAnimationFrame(animationFrame);
      motions.forEach((_motion, panel) => clearPanel(panel));
      motions.clear();
    };
  }, []);
}
