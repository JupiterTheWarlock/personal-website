import { VOID_JELLYFISH_GEOMETRY } from "./void_jellyfish_geometry.js";

const STATE_LABELS = Object.freeze({
  idle: "待机",
  attentive: "注视",
  thinking: "思考",
  working: "工作",
  review: "审核",
  waiting: "等待",
  success: "完成",
  failed: "失败",
  interrupted: "中断",
});

export const VOID_JELLYFISH_AGENT_PROTOCOL = "junkyard-agent-protocol.v3";

const STATE_PRIORITY = Object.freeze({
  idle: 10,
  attentive: 20,
  thinking: 30,
  waiting: 40,
  working: 50,
  review: 55,
  success: 75,
  failed: 90,
  interrupted: 95,
});

const TENTACLE_POSE_PROFILES = Object.freeze({
  hidden: Object.freeze({ tentacleReveal: 0, tentacleLength: 1, tentacleSway: 0, tentacleSpread: 0 }),
  normal: Object.freeze({ tentacleReveal: .82, tentacleLength: 1, tentacleSway: .72, tentacleSpread: .28 }),
  extended: Object.freeze({ tentacleReveal: 1, tentacleLength: 1.25, tentacleSway: 1.6, tentacleSpread: 1 }),
});

export const VOID_JELLYFISH_TENTACLE_POSE_BY_STATE = Object.freeze({
  idle: "hidden",
  attentive: "hidden",
  thinking: "hidden",
  working: "extended",
  review: "normal",
  waiting: "hidden",
  success: "hidden",
  failed: "hidden",
  interrupted: "hidden",
});

const REST_PROFILE = Object.freeze({
  x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1,
  gazeX: 0, gazeY: 0, eyeScale: 1, squint: 0, glow: .20,
  ...TENTACLE_POSE_PROFILES.hidden,
  orbitSpeed: 0, orbitRadius: 0, tremble: 0, stun: 0,
});

const STATE_PROFILES = Object.freeze({
  idle:        { ...REST_PROFILE },
  attentive:   { ...REST_PROFILE },
  thinking:    { x: 0, y: -2, rotate: 1.2, scaleX: 1.01, scaleY: 1.01, gazeX: 0, gazeY: 0, eyeScale: 1.04, squint: .02, glow: .52, ...TENTACLE_POSE_PROFILES.hidden, orbitSpeed: 332.5, orbitRadius: .68, tremble: 0, stun: 0 },
  working:     { x: 0, y: -3, rotate: 0, scaleX: 1.035, scaleY: .98, gazeX: 0, gazeY: 0, eyeScale: 1.01, squint: .98, glow: .76, ...TENTACLE_POSE_PROFILES.extended, orbitSpeed: 0, orbitRadius: 0, tremble: 1, stun: 0 },
  review:      { x: 0, y: -2, rotate: 4.2, scaleX: .99, scaleY: 1.02, gazeX: -.34, gazeY: -.08, eyeScale: .98, squint: .16, glow: .48, ...TENTACLE_POSE_PROFILES.normal, orbitSpeed: 0, orbitRadius: 0, tremble: 0, stun: 0 },
  waiting:     { ...REST_PROFILE },
  success:     { x: 0, y: -5, rotate: 0, scaleX: 1.045, scaleY: 1.045, gazeX: 0, gazeY: -.12, eyeScale: 1.08, squint: 0, glow: 1, ...TENTACLE_POSE_PROFILES.hidden, orbitSpeed: 0, orbitRadius: 0, tremble: 0, stun: 0 },
  failed:      { x: 0, y: 5, rotate: 2.5, scaleX: 1.045, scaleY: .94, gazeX: 0, gazeY: .12, eyeScale: 1.02, squint: .04, glow: .12, ...TENTACLE_POSE_PROFILES.hidden, orbitSpeed: 105, orbitRadius: 0, tremble: 0, stun: 1 },
  interrupted: { x: 0, y: 4, rotate: -5, scaleX: 1.06, scaleY: .92, gazeX: -.18, gazeY: .1, eyeScale: 1.16, squint: 0, glow: .22, ...TENTACLE_POSE_PROFILES.hidden, orbitSpeed: 0, orbitRadius: 0, tremble: 0, stun: 0 },
});

export function motionTargetForState(name) {
  return STATE_PROFILES[name] ? { ...STATE_PROFILES[name] } : null;
}

export const VOID_JELLYFISH_STATES = Object.freeze(Object.keys(STATE_LABELS));

export const VOID_JELLYFISH_MOTION_PROFILE = Object.freeze({
  version: "void-jellyfish-motion.v7",
  spring: Object.freeze({ mass: 1, stiffness: 175, damping: 24 }),
  springs: Object.freeze({
    pose: Object.freeze({ mass: 1, stiffness: 175, damping: 24 }),
    gaze: Object.freeze({ mass: 1, stiffness: 260, damping: 28 }),
  }),
  maxDeltaSeconds: .04,
  breathAmplitude: 2.4,
  breathHz: .27,
  breathRotate: .48,
  breathScaleX: .012,
  breathScaleY: .024,
  tentacleNoiseSpeed: 1.25,
  tentacleNoiseAmplitude: 12.5,
  tentacleNoiseSlowAmplitude: 5.5,
  tentacleNoiseLagAmplitude: 8,
  workPulsePeriod: 1.24,
  workPulseDuty: .42,
  workPulseX: 1.8,
  workPulseY: 1.65,
  workPulseRotate: 3.2,
  workPulseScaleX: .012,
  workPulseScaleY: .018,
  blinkMinMs: 2500,
  blinkMaxMs: 5200,
  gestureDurations: Object.freeze({ blink: 170, nod: 430, shake: 620, success: 720, recoil: 520, impact: 920, alert: 420, glance: 520 }),
});

let instanceSequence = 0;
const motionClocks = new WeakMap();

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function smootherStep(value) {
  const t = clamp(value, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function noisePoint(index, seed) {
  const raw = Math.sin((index + seed * 131.7) * 12.9898) * 43758.5453;
  return (raw - Math.floor(raw)) * 2 - 1;
}

export function smoothNoise1D(time, seed = 0) {
  const base = Math.floor(Number(time) || 0);
  const fraction = (Number(time) || 0) - base;
  const blend = smootherStep(fraction);
  const a = noisePoint(base, Number(seed) || 0);
  const b = noisePoint(base + 1, Number(seed) || 0);
  return a + (b - a) * blend;
}

export function intermittentSpringPulse(elapsedSeconds, periodSeconds = VOID_JELLYFISH_MOTION_PROFILE.workPulsePeriod, activeRatio = VOID_JELLYFISH_MOTION_PROFILE.workPulseDuty) {
  const period = Math.max(.25, Number(periodSeconds) || VOID_JELLYFISH_MOTION_PROFILE.workPulsePeriod);
  const duty = clamp(activeRatio, .1, .8);
  const elapsed = Math.max(0, Number(elapsedSeconds) || 0);
  const phase = (elapsed % period) / period;
  if (phase >= duty) return 0;
  const active = phase / duty;
  const envelope = Math.sin(Math.PI * active) ** .55 * Math.exp(-2.45 * active);
  return Math.sin(active * Math.PI * 5) * envelope;
}

export function springStep(value, velocity, target, deltaSeconds, spring = VOID_JELLYFISH_MOTION_PROFILE.spring) {
  const dt = clamp(deltaSeconds, 0, VOID_JELLYFISH_MOTION_PROFILE.maxDeltaSeconds);
  if (!dt) return { value, velocity };
  const mass = Math.max(.0001, Number(spring.mass) || 1);
  const stiffness = Math.max(0, Number(spring.stiffness) || 0) / mass;
  const damping = Math.max(0, Number(spring.damping) || 0) / mass;
  const displacement = value - target;
  const discriminant = damping * damping - 4 * stiffness;
  let nextDisplacement;
  let nextVelocity;
  if (Math.abs(discriminant) < .000001) {
    const root = -damping / 2;
    const coefficient = velocity - root * displacement;
    const decay = Math.exp(root * dt);
    nextDisplacement = (displacement + coefficient * dt) * decay;
    nextVelocity = (velocity + root * coefficient * dt) * decay;
  } else if (discriminant < 0) {
    const decayRate = damping / 2;
    const frequency = Math.sqrt(stiffness - decayRate * decayRate);
    const angle = frequency * dt;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const coefficient = (velocity + decayRate * displacement) / frequency;
    const decay = Math.exp(-decayRate * dt);
    nextDisplacement = decay * (displacement * cosine + coefficient * sine);
    nextVelocity = decay * (
      (velocity * cosine)
      - ((decayRate * coefficient) + (frequency * displacement)) * sine
    );
  } else {
    const rootDistance = Math.sqrt(discriminant);
    const rootA = (-damping + rootDistance) / 2;
    const rootB = (-damping - rootDistance) / 2;
    const coefficientA = (velocity - rootB * displacement) / (rootA - rootB);
    const coefficientB = displacement - coefficientA;
    const decayA = Math.exp(rootA * dt);
    const decayB = Math.exp(rootB * dt);
    nextDisplacement = coefficientA * decayA + coefficientB * decayB;
    nextVelocity = rootA * coefficientA * decayA + rootB * coefficientB * decayB;
  }
  return { value: target + nextDisplacement, velocity: nextVelocity };
}

export function createVoidJellyfishMotionClock({ windowTarget, documentTarget } = {}) {
  const view = windowTarget || globalThis;
  const documentRef = documentTarget || view.document;
  const instances = new Set();
  let frame = 0;
  let frameCount = 0;
  let lastTimestamp = 0;
  const requestFrame = view.requestAnimationFrame?.bind(view) || globalThis.requestAnimationFrame?.bind(globalThis);
  const cancelFrame = view.cancelAnimationFrame?.bind(view) || globalThis.cancelAnimationFrame?.bind(globalThis);
  const canAdvance = (instance) => (
    instance?.host?.isConnected !== false
    && !instance?.host?.hidden
    && !instance?.host?.closest?.("[hidden]")
  );
  const schedule = () => {
    if (!frame && instances.size && documentRef?.hidden !== true && requestFrame) frame = requestFrame(tick);
  };
  const tick = (timestamp) => {
    frame = 0;
    lastTimestamp = Number(timestamp) || 0;
    frameCount += 1;
    for (const instance of instances) {
      if (canAdvance(instance)) instance.advance(timestamp);
      else instance.rebaseClock(timestamp);
    }
    schedule();
  };
  const onVisibilityChange = () => {
    if (documentRef?.hidden) {
      if (frame && cancelFrame) cancelFrame(frame);
      frame = 0;
      for (const instance of instances) instance.rebaseClock(0);
    } else {
      for (const instance of instances) instance.rebaseClock(0);
      schedule();
    }
  };
  documentRef?.addEventListener?.("visibilitychange", onVisibilityChange);
  return Object.freeze({
    register(instance) {
      instances.add(instance);
      schedule();
    },
    unregister(instance) {
      instances.delete(instance);
      if (!instances.size && frame && cancelFrame) {
        cancelFrame(frame);
        frame = 0;
      }
    },
    snapshot() {
      return Object.freeze({ instanceCount: instances.size, frameActive: Boolean(frame), frameCount, lastTimestamp });
    },
    destroy() {
      if (frame && cancelFrame) cancelFrame(frame);
      frame = 0;
      instances.clear();
      documentRef?.removeEventListener?.("visibilitychange", onVisibilityChange);
    },
  });
}

function defaultMotionClock(host) {
  const view = host?.ownerDocument?.defaultView || globalThis;
  let clock = motionClocks.get(view);
  if (!clock) {
    clock = createVoidJellyfishMotionClock({ windowTarget: view, documentTarget: host?.ownerDocument });
    motionClocks.set(view, clock);
  }
  return clock;
}

export function gazeVectorFromClientPoint(clientX, clientY, eyeRect, viewportWidth, viewportHeight) {
  const rect = eyeRect || {};
  const width = Math.max(1, Number(rect.width) || 0);
  const height = Math.max(1, Number(rect.height) || 0);
  const centerX = (Number(rect.left) || 0) + width / 2;
  const centerY = (Number(rect.top) || 0) + height / 2;
  const rangeX = Math.max(width * 2, (Number(viewportWidth) || width) * .24);
  const rangeY = Math.max(height * 2, (Number(viewportHeight) || height) * .24);
  return {
    x: clamp((Number(clientX) - centerX) / rangeX, -1, 1),
    y: clamp((Number(clientY) - centerY) / rangeY, -1, 1),
  };
}

export function gazeVectorFromProjectedEye(clientX, clientY, projection, viewportWidth, viewportHeight) {
  const eyeRect = projection?.eyeRect || {};
  const width = Math.max(1, Number(eyeRect.width) || 0);
  const height = Math.max(1, Number(eyeRect.height) || 0);
  const fallbackCenterX = (Number(eyeRect.left) || 0) + width / 2;
  const fallbackCenterY = (Number(eyeRect.top) || 0) + height / 2;
  const centerX = Number.isFinite(Number(projection?.eyeCenter?.x))
    ? Number(projection.eyeCenter.x)
    : fallbackCenterX;
  const centerY = Number.isFinite(Number(projection?.eyeCenter?.y))
    ? Number(projection.eyeCenter.y)
    : fallbackCenterY;
  const deltaX = Number(clientX) - centerX;
  const deltaY = Number(clientY) - centerY;
  const pointerDistance = Math.hypot(deltaX, deltaY);
  if (pointerDistance < 0.001) return { x: 0, y: 0 };

  const right = projection?.gazeBasis?.right || {};
  const down = projection?.gazeBasis?.down || {};
  const rightX = Number(right.x);
  const rightY = Number(right.y);
  const downX = Number(down.x);
  const downY = Number(down.y);
  const determinant = rightX * downY - rightY * downX;
  if (
    ![rightX, rightY, downX, downY, determinant].every(Number.isFinite)
    || Math.abs(determinant) < 0.0001
  ) {
    return gazeVectorFromClientPoint(
      clientX,
      clientY,
      eyeRect,
      viewportWidth,
      viewportHeight,
    );
  }

  const localX = (deltaX * downY - deltaY * downX) / determinant;
  const localY = (rightX * deltaY - rightY * deltaX) / determinant;
  const localLength = Math.hypot(localX, localY);
  if (localLength < 0.0001) return { x: 0, y: 0 };
  const viewportRange = Math.min(
    Math.max(1, Number(viewportWidth) || width),
    Math.max(1, Number(viewportHeight) || height),
  ) * .24;
  const strength = clamp(
    pointerDistance / Math.max(width * 2, height * 2, viewportRange),
    0,
    1,
  );
  return {
    x: clamp(localX / localLength * strength, -1, 1),
    y: clamp(localY / localLength * strength, -1, 1),
  };
}

function itemFromEvent(event) {
  return event?.data?.item || event?.item || event?.data || {};
}

export function signalFromAgentEvent(event) {
  const type = String(event?.type || "");
  const item = itemFromEvent(event);
  const itemType = String(item?.type || "");
  const status = String(item?.status || event?.data?.status || "");

  if (["turn.failed"].includes(type)) return { state: "failed", gesture: "impact", duration: 1050, fallback: "idle" };
  if (["turn.stopped"].includes(type)) return { state: "interrupted", gesture: "recoil", duration: 950, fallback: "idle" };
  if (["turn.completed"].includes(type)) return { state: "success", gesture: "success", duration: 900, fallback: "idle" };
  if (type === "turn/completed") {
    const turnStatus = String(event?.data?.status || status || "completed");
    if (turnStatus === "failed") return { state: "failed", gesture: "impact", duration: 1050, fallback: "idle" };
    if (turnStatus === "interrupted") return { state: "interrupted", gesture: "recoil", duration: 950, fallback: "idle" };
    return { state: "success", gesture: "success", duration: 900, fallback: "idle" };
  }
  if (type === "turn/started") return { state: "thinking" };
  if (type === "turn/lease/cancelling") return { state: "interrupted", gesture: "recoil", duration: 950, fallback: "thinking" };
  if (["thread/started", "thread.created"].includes(type)) return { state: "attentive" };
  if (type === "item.created") {
    if (["tool_call", "authorization_event"].includes(itemType)) return { state: "working", gesture: itemType === "authorization_event" ? "alert" : null };
    return { state: "thinking" };
  }
  if (type === "item/started") {
    if (itemType === "qualityCheck") return { state: "review" };
    if (itemType === "dynamicToolCall") return { state: "working" };
    if (itemType === "authorization") return { state: "working", gesture: "alert" };
    if (itemType === "actionPlan") return { state: "waiting" };
    return { state: "attentive" };
  }
  if (type === "item/completed") {
    if (status === "discarded") return { state: "interrupted", gesture: "recoil", duration: 900, fallback: "thinking" };
    if (status === "failed") return { state: "failed", gesture: "impact", duration: 900, fallback: "thinking" };
    if (status === "declined") return { state: "thinking", gesture: "glance" };
    if (itemType === "actionPlan") return { state: "waiting" };
    if (itemType === "dynamicToolCall") return { state: "thinking", gesture: "nod" };
    if (itemType === "qualityCheck") return { state: "thinking" };
  }
  return null;
}

export function stateFromThread(thread, options = {}) {
  if (!thread || typeof thread !== "object") return options.hasPending ? "waiting" : "idle";
  const activeTurn = [...(thread.turns || [])].reverse().find((turn) => turn?.status === "inProgress");
  if (activeTurn || thread.status === "active" || thread.activeTurnId || options.jobRunning) {
    const activeItem = [...(activeTurn?.items || [])].reverse().find((item) => item?.status === "inProgress");
    if (activeItem?.type === "qualityCheck") return "review";
    if (["dynamicToolCall", "authorization"].includes(activeItem?.type)) return "working";
    if (activeItem?.type === "actionPlan") return "waiting";
    return "thinking";
  }
  if (options.hasPending) return "waiting";
  const lastTurn = [...(thread.turns || [])].reverse().find((turn) => turn?.status);
  if (lastTurn?.status === "failed") return "failed";
  if (["interrupted", "stopped"].includes(lastTurn?.status)) return "interrupted";
  return "idle";
}

export function stateFromSession(session, thread = null) {
  if (!session || typeof session !== "object") return "idle";
  const threads = Object.values(session.threads || {}).filter((value) => value && typeof value === "object");
  const activeThread = thread && typeof thread === "object"
    ? thread
    : threads.find((value) => (
      value.status === "active"
      || value.activeTurnId
      || [...(value.turns || [])].some((turn) => turn?.status === "inProgress")
    ));
  return stateFromThread(activeThread, { hasPending: Boolean(session.pending) });
}

function seededRandom(seed) {
  let current = (Number(seed) || 0x5f3759df) >>> 0;
  return () => {
    current = (1664525 * current + 1013904223) >>> 0;
    return current / 0x100000000;
  };
}

function petMarkup(id) {
  const geometry = VOID_JELLYFISH_GEOMETRY;
  const tentacles = [0, 1, 2, 3].map((index) => `
    <path data-tentacle-outline="${index}" class="vj-tentacle-outline" d=""></path>
    <path data-tentacle="${index}" class="vj-tentacle" d=""></path>`).join("");
  return `
    <div class="void-jellyfish-shell" data-state="idle" data-connection="online">
      <svg class="void-jellyfish-svg" viewBox="${geometry.viewBox}" role="img" aria-labelledby="${id}-title ${id}-desc">
        <title id="${id}-title">虚空水母</title>
        <desc id="${id}-desc">紫黑色瘦长水滴独眼助手，正在待机。</desc>
        <defs>
          <clipPath id="${id}-eye-clip"><path d="${geometry.eyePath}"></path></clipPath>
          <filter id="${id}-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="10"></feGaussianBlur></filter>
        </defs>
        <g data-part="root">
          <ellipse data-part="halo" cx="120" cy="205" rx="69" ry="84" fill="#7654b5" filter="url(#${id}-glow)" opacity="0"></ellipse>
          <g data-part="tentacles" aria-hidden="true">${tentacles}</g>
          <g data-part="body">
            <path class="vj-body" d="${geometry.bodyPath}"></path>
            <g data-part="eye" clip-path="url(#${id}-eye-clip)">
              <path class="vj-eye-white" d="${geometry.eyePath}"></path>
              <g data-part="iris">
                <circle class="vj-iris" cx="${geometry.iris.cx}" cy="${geometry.iris.cy}" r="${geometry.iris.radius}"></circle>
                <circle class="vj-pupil" cx="${geometry.pupil.cx}" cy="${geometry.pupil.cy}" r="${geometry.pupil.radius}"></circle>
              </g>
              <path data-part="spiral" class="vj-spiral" d="M120 184 C120 176 131 176 131 185 C131 197 115 200 107 190 C96 176 109 159 129 162 C153 166 159 194 142 209"></path>
              <rect data-part="upper-lid" class="vj-lid" x="66" y="144" width="108" height="42"></rect>
              <rect data-part="lower-lid" class="vj-lid" x="66" y="183" width="108" height="42"></rect>
            </g>
            <path class="vj-eye-line" d="${geometry.eyePath}"></path>
            <path class="vj-closed-eye" d="M72 184 Q120 205 168 184"></path>
          </g>
        </g>
      </svg>
      <span class="void-jellyfish-state" aria-hidden="true">待机</span>
    </div>`;
}

export class VoidJellyfish {
  constructor(host, options = {}) {
    if (!host) throw new Error("VoidJellyfish requires a host element.");
    this.host = host;
    this.options = options;
    this.motion = {
      ...VOID_JELLYFISH_MOTION_PROFILE,
      ...(options.motion || {}),
      springs: {
        ...VOID_JELLYFISH_MOTION_PROFILE.springs,
        ...(options.motion?.springs || {}),
      },
    };
    this.id = `void-jellyfish-${++instanceSequence}`;
    this.random = seededRandom(options.seed || instanceSequence * 8191);
    this.reducedMotion = options.reducedMotion ?? globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    this.speed = clamp(options.speed || 1, .1, 3);
    this.state = "idle";
    this.fallbackState = "idle";
    this.stateUntil = 0;
    this.statePriority = STATE_PRIORITY.idle;
    this.connected = true;
    this.showTentacles = options.showTentacles !== false;
    this.allowBlink = options.allowBlink !== false;
    this.autoSchedule = options.autoSchedule !== false;
    this.pointerGaze = { x: 0, y: 0, until: 0 };
    this.clientPointer = null;
    this.gesture = null;
    this.blink = null;
    this.lastFrame = 0;
    this.elapsed = 0;
    this.destroyed = false;
    this.current = {};
    this.lastProcedural = { breath: 0, workPulse: 0 };
    this.velocity = {};
    this.target = {};
    Object.entries(STATE_PROFILES.idle).forEach(([key, value]) => {
      this.current[key] = value;
      this.velocity[key] = 0;
      this.target[key] = value;
    });
    host.classList.add("void-jellyfish-host");
    host.dataset.motionClock = this.autoSchedule ? "shared-display-refresh" : "external-display-refresh";
    host.dataset.motionProfile = this.motion.version;
    if (options.variant) host.dataset.variant = options.variant;
    host.dataset.blinkEnabled = String(this.allowBlink);
    host.innerHTML = petMarkup(this.id);
    this.shell = host.querySelector(".void-jellyfish-shell");
    this.svg = host.querySelector(".void-jellyfish-svg");
    this.rootPart = host.querySelector('[data-part="root"]');
    this.bodyPart = host.querySelector('[data-part="body"]');
    this.eyePart = host.querySelector('[data-part="eye"]');
    this.irisPart = host.querySelector('[data-part="iris"]');
    this.spiral = host.querySelector('[data-part="spiral"]');
    this.upperLid = host.querySelector('[data-part="upper-lid"]');
    this.lowerLid = host.querySelector('[data-part="lower-lid"]');
    this.eyeLine = host.querySelector(".vj-eye-line");
    this.closedEye = host.querySelector(".vj-closed-eye");
    this.halo = host.querySelector('[data-part="halo"]');
    this.stateLabel = host.querySelector(".void-jellyfish-state");
    this.description = host.querySelector(`#${this.id}-desc`);
    this.tentacles = [0, 1, 2, 3].map((index) => ({
      inner: host.querySelector(`[data-tentacle="${index}"]`),
      outer: host.querySelector(`[data-tentacle-outline="${index}"]`),
    }));
    this.nextBlinkAt = this._nextBlink(0);
    this._mediaQuery = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)") || null;
    this._mediaHandler = (event) => {
      if (options.reducedMotion == null) this.setReducedMotion(event.matches);
    };
    if (options.reducedMotion == null) {
      this._mediaQuery?.addEventListener?.("change", this._mediaHandler);
    }
    this.clock = options.clock || defaultMotionClock(host);
    if (this.autoSchedule) this.clock.register(this);
  }

  _nextBlink(now) {
    return now + this.motion.blinkMinMs + this.random() * (this.motion.blinkMaxMs - this.motion.blinkMinMs);
  }

  setState(name, options = {}) {
    if (!STATE_PROFILES[name]) return false;
    const now = performance.now();
    const priority = options.priority ?? STATE_PRIORITY[name];
    if (this.stateUntil > now && priority < this.statePriority && !options.force) return false;
    this.state = name;
    this.statePriority = priority;
    this.fallbackState = STATE_PROFILES[options.fallback] ? options.fallback : (name === "waiting" ? "waiting" : "idle");
    this.stateUntil = options.duration ? now + options.duration / this.speed : 0;
    this.shell.dataset.state = name;
    this.stateLabel.textContent = STATE_LABELS[name];
    this.description.textContent = `紫黑色瘦长水滴独眼助手，当前状态：${STATE_LABELS[name]}。`;
    this.options.onStateChange?.(name, this.snapshot());
    if (options.gesture) this.trigger(options.gesture);
    return true;
  }

  trigger(name) {
    if (name === "blink") {
      if (!this.allowBlink) return;
      this.blink = { name, startedAt: performance.now(), duration: this.motion.gestureDurations.blink / this.speed };
      return;
    }
    const duration = this.motion.gestureDurations[name];
    if (!duration) return;
    this.gesture = { name, startedAt: performance.now(), duration: duration / this.speed };
  }

  handleAgentEvent(event) {
    const signal = signalFromAgentEvent(event);
    if (!signal) return null;
    if (signal.state) this.setState(signal.state, signal);
    else if (signal.gesture) this.trigger(signal.gesture);
    return signal;
  }

  syncFromSession(session, thread = null, options = {}) {
    const next = stateFromSession(session, thread);
    this.setState(next, { priority: STATE_PRIORITY[next], ...options });
    return next;
  }

  setConnection(connected) {
    this.connected = Boolean(connected);
    this.shell.dataset.connection = this.connected ? "online" : "offline";
    if (!this.connected) this.setState("waiting", { priority: 40 });
  }

  setReducedMotion(enabled) {
    this.reducedMotion = Boolean(enabled);
    this.shell.dataset.reducedMotion = String(this.reducedMotion);
    if (this.reducedMotion) {
      this.gesture = null;
      this.blink = null;
    }
  }

  setSpeed(value) {
    this.speed = clamp(value, .1, 3);
  }

  setMotionTuning({ poseStiffness, poseDamping, gazeStiffness, gazeDamping } = {}) {
    const numberOr = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
    this.motion.springs = {
      pose: {
        ...this.motion.springs.pose,
        stiffness: numberOr(poseStiffness, this.motion.springs.pose.stiffness),
        damping: numberOr(poseDamping, this.motion.springs.pose.damping),
      },
      gaze: {
        ...this.motion.springs.gaze,
        stiffness: numberOr(gazeStiffness, this.motion.springs.gaze.stiffness),
        damping: numberOr(gazeDamping, this.motion.springs.gaze.damping),
      },
    };
  }

  setTentaclesVisible(visible) {
    this.showTentacles = Boolean(visible);
  }

  lookAt(x, y, duration = 1000) {
    this.pointerGaze = { x: clamp(x, -1, 1), y: clamp(y, -1, 1), until: performance.now() + duration };
  }

  lookAtClient(clientX, clientY, duration = 1800) {
    this.clientPointer = {
      clientX: Number(clientX) || 0,
      clientY: Number(clientY) || 0,
      until: performance.now() + duration,
    };
    return this.pointerGaze;
  }

  snapshot() {
    return {
      motionProfile: this.motion.version,
      state: this.state,
      label: STATE_LABELS[this.state],
      connected: this.connected,
      reducedMotion: this.reducedMotion,
      blinkEnabled: this.allowBlink,
      speed: this.speed,
      pointerGaze: {
        x: Number(this.pointerGaze.x.toFixed(3)),
        y: Number(this.pointerGaze.y.toFixed(3)),
        active: this.pointerGaze.until > performance.now(),
      },
      current: Object.fromEntries(Object.entries(this.current).map(([key, value]) => [key, Number(value.toFixed(3))])),
      gesture: this.gesture?.name || null,
      tentaclePose: VOID_JELLYFISH_TENTACLE_POSE_BY_STATE[this.state],
      procedural: {
        breath: Number(this.lastProcedural.breath.toFixed(3)),
        workPulse: Number(this.lastProcedural.workPulse.toFixed(3)),
      },
    };
  }

  _gestureOverlay(now) {
    const overlay = { x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1, gazeX: 0 };
    if (!this.gesture || this.reducedMotion) return overlay;
    const progress = clamp((now - this.gesture.startedAt) / this.gesture.duration, 0, 1);
    const wave = Math.sin(Math.PI * progress);
    const decay = 1 - smootherStep(progress);
    switch (this.gesture.name) {
      case "nod": overlay.y += 8 * Math.sin(Math.PI * 2 * progress) * decay; break;
      case "shake": overlay.rotate += 8 * Math.sin(Math.PI * 4 * progress) * decay; break;
      case "success": overlay.y -= 7 * wave; overlay.scaleX += .075 * wave; overlay.scaleY += .075 * wave; break;
      case "recoil": overlay.y -= 5 * wave; overlay.scaleX += .09 * wave; overlay.scaleY -= .08 * wave; break;
      case "impact":
        overlay.x += 12 * Math.sin(Math.PI * 7 * progress) * decay;
        overlay.y += 5 * Math.sin(Math.PI * 5 * progress) * decay;
        overlay.rotate += 17 * Math.sin(Math.PI * 6 * progress) * decay;
        overlay.scaleX += .12 * wave * decay;
        overlay.scaleY -= .1 * wave * decay;
        break;
      case "alert": overlay.y -= 4 * wave; overlay.scaleX += .055 * wave; overlay.scaleY += .035 * wave; break;
      case "glance": overlay.gazeX += .75 * Math.sin(Math.PI * 2 * progress) * decay; break;
      default: break;
    }
    if (progress >= 1) this.gesture = null;
    return overlay;
  }

  _blinkAmount(now) {
    if (!this.blink || this.reducedMotion) return 0;
    const progress = clamp((now - this.blink.startedAt) / this.blink.duration, 0, 1);
    const amount = Math.sin(Math.PI * progress) ** .7;
    if (progress >= 1) this.blink = null;
    return amount;
  }

  _updateTargets(now) {
    const profile = STATE_PROFILES[this.state] || STATE_PROFILES.idle;
    Object.entries(profile).forEach(([key, value]) => { this.target[key] = value; });
    if (!this.showTentacles) this.target.tentacleReveal = 0;
    if (this.clientPointer?.until > now && ["idle", "attentive", "waiting"].includes(this.state)) {
      let rect = this.eyePart.getBoundingClientRect();
      if (!rect.width || !rect.height) rect = this.svg.getBoundingClientRect();
      const view = this.svg.ownerDocument?.defaultView || globalThis;
      const gaze = gazeVectorFromClientPoint(
        this.clientPointer.clientX,
        this.clientPointer.clientY,
        rect,
        view.innerWidth,
        view.innerHeight,
      );
      this.pointerGaze = { ...gaze, until: this.clientPointer.until };
    } else if (this.clientPointer?.until <= now) {
      this.clientPointer = null;
    }
    if (this.pointerGaze.until > now && ["idle", "attentive", "waiting"].includes(this.state)) {
      this.target.gazeX = clamp(this.target.gazeX + this.pointerGaze.x, -1, 1);
      this.target.gazeY = clamp(this.target.gazeY + this.pointerGaze.y, -1, 1);
    }
  }

  _updatePhysics(deltaSeconds) {
    Object.keys(this.current).forEach((key) => {
      if (key === "irisAngle" || key === "orbitSpeed") return;
      if (this.reducedMotion) {
        this.current[key] = this.target[key];
        this.velocity[key] = 0;
        return;
      }
      const channel = ["gazeX", "gazeY", "eyeScale", "squint"].includes(key) ? "gaze" : "pose";
      const stepped = springStep(this.current[key], this.velocity[key], this.target[key], deltaSeconds, this.motion.springs[channel]);
      this.current[key] = stepped.value;
      this.velocity[key] = stepped.velocity;
    });
    this.current.orbitSpeed = this.reducedMotion ? 0 : this.target.orbitSpeed;
    this.current.irisAngle = ((this.current.irisAngle || 0) + this.current.orbitSpeed * deltaSeconds * this.speed) % 360;
  }

  _renderTentacles(now, rootY) {
    const specs = [
      { x: 82, length: 55, bias: -1, spreadX: -55, lift: .42 },
      { x: 107, length: 72, bias: -.35, spreadX: -24, lift: .14 },
      { x: 133, length: 68, bias: .35, spreadX: 24, lift: .14 },
      { x: 158, length: 54, bias: 1, spreadX: 55, lift: .42 },
    ];
    const reveal = clamp(this.current.tentacleReveal, 0, 1);
    const lengthScale = Math.max(0, this.current.tentacleLength);
    const sway = this.current.tentacleSway * (this.reducedMotion ? 0 : 1);
    const spread = clamp(this.current.tentacleSpread, 0, 1);
    specs.forEach((spec, index) => {
      if (reveal < .01) {
        const collapsed = `M ${spec.x.toFixed(2)} 256 C ${spec.x.toFixed(2)} 256, ${spec.x.toFixed(2)} 256, ${spec.x.toFixed(2)} 256`;
        this.tentacles[index].inner.setAttribute("d", collapsed);
        this.tentacles[index].outer.setAttribute("d", collapsed);
        this.tentacles[index].inner.style.opacity = "0";
        this.tentacles[index].outer.style.opacity = "0";
        return;
      }
      const length = spec.length * reveal * lengthScale;
      const wandering = smoothNoise1D(this.elapsed * this.motion.tentacleNoiseSpeed * (1 + index * .055), index * 2.17 + .31);
      const slowWandering = smoothNoise1D(this.elapsed * this.motion.tentacleNoiseSpeed * (.46 + index * .026), index * 3.11 + 4.7);
      const drift = (wandering * this.motion.tentacleNoiseAmplitude + slowWandering * this.motion.tentacleNoiseSlowAmplitude) * sway + spec.bias * 3 * reveal;
      const lag = smoothNoise1D(this.elapsed * this.motion.tentacleNoiseSpeed * (.78 + index * .041), index * 1.73 + 8.2) * this.motion.tentacleNoiseLagAmplitude * sway - rootY * .32;
      const startY = 256;
      const spreadOffset = spec.spreadX * spread;
      const c1x = spec.x + drift * .22 + spreadOffset * .22;
      const c2x = spec.x + drift * .7 + lag + spreadOffset * .7;
      const endX = spec.x + drift + spreadOffset;
      const endY = startY + length * (1 - spec.lift * spread);
      const path = `M ${spec.x.toFixed(2)} ${startY} C ${c1x.toFixed(2)} ${(startY + length * .28).toFixed(2)}, ${c2x.toFixed(2)} ${(startY + length * .68 - spec.lift * length * spread * .45).toFixed(2)}, ${endX.toFixed(2)} ${endY.toFixed(2)}`;
      this.tentacles[index].inner.setAttribute("d", path);
      this.tentacles[index].outer.setAttribute("d", path);
      this.tentacles[index].inner.style.opacity = String(clamp(reveal * 1.7, 0, 1));
      this.tentacles[index].outer.style.opacity = String(clamp(reveal * 1.7, 0, 1));
    });
  }

  _render(now) {
    const overlay = this._gestureOverlay(now);
    const blink = this.allowBlink
      ? Math.max(this._blinkAmount(now), clamp(this.current.squint, 0, .98))
      : 0;
    const breath = this.reducedMotion ? 0 : Math.sin(this.elapsed * Math.PI * 2 * this.motion.breathHz);
    const tremble = this.reducedMotion ? 0 : this.current.tremble;
    const workPulse = tremble * intermittentSpringPulse(this.elapsed, this.motion.workPulsePeriod, this.motion.workPulseDuty);
    const pulseNoise = smoothNoise1D(this.elapsed * 7.2, 19.4);
    const x = this.current.x + overlay.x + workPulse * (this.motion.workPulseX + pulseNoise * .55);
    const y = this.current.y + overlay.y + breath * this.motion.breathAmplitude - Math.abs(workPulse) * this.motion.workPulseY;
    const rotate = this.current.rotate + overlay.rotate + breath * this.motion.breathRotate + workPulse * (this.motion.workPulseRotate + pulseNoise * .65);
    const scaleX = this.current.scaleX * overlay.scaleX * (1 + breath * this.motion.breathScaleX + workPulse * this.motion.workPulseScaleX);
    const scaleY = this.current.scaleY * overlay.scaleY * (1 - breath * this.motion.breathScaleY - workPulse * this.motion.workPulseScaleY);
    this.lastProcedural = { breath, workPulse };
    this.rootPart.setAttribute("transform", `translate(${x.toFixed(3)} ${y.toFixed(3)}) rotate(${rotate.toFixed(3)} 120 174) translate(120 174) scale(${scaleX.toFixed(4)} ${scaleY.toFixed(4)}) translate(-120 -174)`);
    const orbitAngle = this.current.irisAngle * Math.PI / 180;
    const orbitRadius = this.reducedMotion ? 0 : this.current.orbitRadius;
    const gazeX = clamp(this.current.gazeX + overlay.gazeX + Math.cos(orbitAngle) * orbitRadius, -1, 1);
    const gazeY = clamp(this.current.gazeY + Math.sin(orbitAngle) * orbitRadius, -1, 1);
    const eyeScale = this.current.eyeScale;
    this.eyePart.setAttribute("transform", `translate(${(gazeX * 1.6).toFixed(2)} ${(gazeY * 1.2).toFixed(2)}) translate(120 184) scale(${eyeScale.toFixed(3)}) translate(-120 -184)`);
    this.irisPart.setAttribute("transform", `translate(${(gazeX * 13).toFixed(2)} ${(gazeY * 9).toFixed(2)}) rotate(${this.current.irisAngle.toFixed(2)} 120 184)`);
    this.upperLid.setAttribute("transform", `translate(0 ${(-40 * (1 - blink)).toFixed(2)})`);
    this.lowerLid.setAttribute("transform", `translate(0 ${(40 * (1 - blink)).toFixed(2)})`);
    const closedAmount = clamp((blink - .62) / .32, 0, 1);
    this.eyeLine.style.opacity = String(1 - closedAmount);
    this.closedEye.style.opacity = String(closedAmount);
    const stun = clamp(this.current.stun, 0, 1) * (1 - closedAmount);
    this.irisPart.style.opacity = String(1 - stun);
    this.spiral.style.opacity = String(stun);
    this.spiral.setAttribute("transform", `rotate(${this.current.irisAngle.toFixed(2)} 120 184)`);
    this.halo.setAttribute("opacity", String(clamp(this.current.glow * .33, 0, .35)));
    this._renderTentacles(now, y);
    this.options.onFrame?.(this.snapshot(), now);
  }

  advance(now = performance.now()) {
    if (this.destroyed) return;
    const deltaSeconds = !this.reducedMotion && this.lastFrame
      ? clamp((now - this.lastFrame) / 1000, 0, this.motion.maxDeltaSeconds) * this.speed
      : 0;
    this.lastFrame = now;
    this.elapsed += deltaSeconds;
    if (this.stateUntil && now >= this.stateUntil) {
      const fallback = this.fallbackState;
      this.stateUntil = 0;
      this.statePriority = STATE_PRIORITY[fallback];
      this.setState(fallback, { force: true });
    }
    if (this.allowBlink && !this.reducedMotion && now >= this.nextBlinkAt && !this.blink) {
      this.trigger("blink");
      this.nextBlinkAt = this._nextBlink(now);
    }
    this._updateTargets(now);
    this._updatePhysics(deltaSeconds);
    this._render(now);
  }

  rebaseClock(now = 0) {
    this.lastFrame = Number(now) || 0;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.autoSchedule) this.clock.unregister(this);
    this._mediaQuery?.removeEventListener?.("change", this._mediaHandler);
    this.host.innerHTML = "";
    this.host.classList.remove("void-jellyfish-host");
  }
}

export function mountVoidJellyfish(host, options = {}) {
  return new VoidJellyfish(host, options);
}
