export const HOME_SCENE_ENVELOPE_POLICY = Object.freeze({
  schemaVersion: "junkyard-home-scene-envelope.v1",
  skyRadius: 96,
  classicStarRadiusMinimum: 82,
  classicStarRadiusMaximum: 92,
  jellyfishSkyRadius: 95.25,
  camera: Object.freeze({
    nearClip: 0.1,
    farClip: 220,
    minimumOrbitRadius: 2.8,
    maximumOrbitRadius: 34,
    maximumPanRadius: 12,
    skySafetyMargin: 8,
  }),
});
