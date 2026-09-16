import { HOME_SCENE_ENVELOPE_POLICY } from "./home_scene_policy.js";

export const HOME_CAMERA_LIMIT_POLICY = Object.freeze({
  schemaVersion: "junkyard-home-camera-limits.v1",
  ...HOME_SCENE_ENVELOPE_POLICY.camera,
});

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export function clampHomeCameraTarget(cameraTarget) {
  const targetRadius = cameraTarget.length();
  if (!Number.isFinite(targetRadius)) {
    cameraTarget.set(0, 0, 0);
  } else if (targetRadius > HOME_CAMERA_LIMIT_POLICY.maximumPanRadius) {
    cameraTarget.setLength(HOME_CAMERA_LIMIT_POLICY.maximumPanRadius);
  }
  return cameraTarget;
}

export function constrainHomeCameraState(cameraPosition, cameraTarget, requestedOffset = null) {
  clampHomeCameraTarget(cameraTarget);
  const offset = requestedOffset?.clone?.()
    || cameraPosition.clone().sub(cameraTarget);
  const offsetRadius = offset.length();
  if (!Number.isFinite(offsetRadius) || offsetRadius < 0.0001) {
    offset.set(0, 0, HOME_CAMERA_LIMIT_POLICY.minimumOrbitRadius);
  } else if (
    offsetRadius < HOME_CAMERA_LIMIT_POLICY.minimumOrbitRadius
    || offsetRadius > HOME_CAMERA_LIMIT_POLICY.maximumOrbitRadius
  ) {
    offset.setLength(clamp(
      offsetRadius,
      HOME_CAMERA_LIMIT_POLICY.minimumOrbitRadius,
      HOME_CAMERA_LIMIT_POLICY.maximumOrbitRadius,
    ));
  }
  cameraPosition.copy(cameraTarget).add(offset);
  return { cameraPosition, cameraTarget };
}
