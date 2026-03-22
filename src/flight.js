import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';
import { terrainHeightAt } from './terrain.js';

export function createFlightState() {
  return {
    velocity: new THREE.Vector3(55, 0, 0),
    speed: 55,

    minSpeed: 25,
    cruiseSpeed: 60,
    maxSpeed: 150,
    stallSpeed: 25,

    pitch: 0,
    roll: 0,
    yaw: 0,

    pitchVel: 0,
    rollVel: 0,
    yawVel: 0,

    pitchInputSmoothed: 0,
    rollInputSmoothed: 0,
    yawInputSmoothed: 0,

    pitchRate: 2.2,
    rollRate: 4.5,
    yawRate: 0.8,

    maxRoll: THREE.MathUtils.degToRad(75),

    rollAuthority: 8.5,
    rollReturn: 4.8,
    rollOppositionDamping: 3.5,

    pitchDamping: 2.5,
    rollDamping: 3.0,
    yawDamping: 2.0,

    liftCoeff: 0.006,
    dragCoeff: 0.003,
    inducedDrag: 0.0015,
    turnDragCoeff: 0.00025,

    thrust: 20,
    throttle: 0.72,
    throttleAdjustRate: 0.55,
    afterburnerFactor: 1.7,

    gravity: 9.8,

    aoa: 0,
    aoaLiftFactor: 2.0,
    aoaDragFactor: 0.7,
    criticalAoa: 0.22,
    maxAoa: 0.45,

    baseLiftCoeff: 0.45
  };
}

export function createFlightSimulator({
  flight,
  keyState,
  planeYaw,
  planeRoll,
  planePitch,
  planeWorld,
  planeWorldQuat,
  renderOrigin,
  floatingOriginThreshold,
  camera,
  terrainSystem,
  markerSystem,
  hud
}) {
  const forward = new THREE.Vector3();
  const up = new THREE.Vector3();
  const right = new THREE.Vector3();
  const velocityDir = new THREE.Vector3();

  const thrustForce = new THREE.Vector3();
  const dragForce = new THREE.Vector3();
  const liftForce = new THREE.Vector3();
  const accel = new THREE.Vector3();

  const gravityVec = new THREE.Vector3(0, -1, 0);

  let markerTimer = 0;

  function expDamp(value, damping, dt) {
    return value * Math.exp(-damping * dt);
  }

  function updateRenderOrigin() {
    const dx = Math.abs(planeWorld.x - renderOrigin.x) > floatingOriginThreshold
      ? planeWorld.x - renderOrigin.x : 0;

    const dz = Math.abs(planeWorld.z - renderOrigin.z) > floatingOriginThreshold
      ? planeWorld.z - renderOrigin.z : 0;

    if (!dx && !dz) return;

    renderOrigin.x += dx;
    renderOrigin.z += dz;

    camera.position.x -= dx;
    camera.position.z -= dz;
  }

  function syncRenderedWorld() {
    planeYaw.position.set(
      planeWorld.x - renderOrigin.x,
      planeWorld.y,
      planeWorld.z - renderOrigin.z
    );

    terrainSystem.syncChunkRenderPositions();
    markerSystem.syncMarkerRenderPositions();
  }

  function updateFlight(dt) {
    // Prevent instability on low FPS spikes
    dt = Math.min(dt, 0.033);

    const pitchInput = (keyState.has('w') ? 1 : 0) - (keyState.has('s') ? 1 : 0);
    const rollInput = (keyState.has('d') ? 1 : 0) - (keyState.has('a') ? 1 : 0);
    const yawInput = (keyState.has('q') ? 1 : 0) - (keyState.has('e') ? 1 : 0);
    const throttleInput = (keyState.has('r') ? 1 : 0) - (keyState.has('f') ? 1 : 0);

    // Throttle
    flight.throttle = THREE.MathUtils.clamp(
      flight.throttle + throttleInput * flight.throttleAdjustRate * dt,
      0, 1
    );

    // Input smoothing
    const alpha = 1 - Math.exp(-14 * dt);
    flight.pitchInputSmoothed = THREE.MathUtils.lerp(flight.pitchInputSmoothed, pitchInput, alpha);
    flight.rollInputSmoothed  = THREE.MathUtils.lerp(flight.rollInputSmoothed,  rollInput,  alpha);
    flight.yawInputSmoothed   = THREE.MathUtils.lerp(flight.yawInputSmoothed,   yawInput,   alpha);

    const speedFactor = THREE.MathUtils.clamp(flight.speed / flight.maxSpeed, 0, 1);
    const controlScale = Math.max(0.6, 1 - speedFactor * 0.4);

    // Rotational dynamics
    flight.pitchVel += flight.pitchInputSmoothed * flight.pitchRate * controlScale * dt;

    const desiredRoll = flight.rollInputSmoothed * flight.maxRoll;
    const rollError = desiredRoll - flight.roll;
    flight.rollVel += rollError * flight.rollAuthority * dt;

    flight.yawVel += flight.yawInputSmoothed * flight.yawRate * dt;

    // Bank turning
    flight.yawVel += -Math.sin(flight.roll) * 1.5 * dt;

    // Stabilization
    if (Math.abs(flight.rollInputSmoothed) < 0.01) {
      flight.rollVel += -flight.roll * flight.rollReturn * dt;
    }

    // Exponential damping
    flight.pitchVel = expDamp(flight.pitchVel, flight.pitchDamping, dt);
    flight.rollVel  = expDamp(flight.rollVel,  flight.rollDamping,  dt);
    flight.yawVel   = expDamp(flight.yawVel,   flight.yawDamping,   dt);

    // Apply rotation
    flight.pitch = THREE.MathUtils.clamp(
      flight.pitch + flight.pitchVel * dt,
      THREE.MathUtils.degToRad(-60),
      THREE.MathUtils.degToRad(60)
    );

    flight.roll = THREE.MathUtils.clamp(
      flight.roll + flight.rollVel * dt,
      -flight.maxRoll,
      flight.maxRoll
    );

    flight.yaw += flight.yawVel * dt;

    planeYaw.rotation.y = flight.yaw;
    planeRoll.rotation.x = flight.roll;
    planePitch.rotation.z = flight.pitch;

    planePitch.getWorldQuaternion(planeWorldQuat);

    // Orientation vectors
    forward.set(1, 0, 0).applyQuaternion(planeWorldQuat).normalize();
    up.set(0, 1, 0).applyQuaternion(planeWorldQuat).normalize();
    right.set(0, 0, 1).applyQuaternion(planeWorldQuat).normalize();

    const airSpeed = flight.velocity.length();
    velocityDir.copy(flight.velocity).normalize();

    // AOA
    const forwardPitch = Math.atan2(forward.y, Math.hypot(forward.x, forward.z));
    const velocityPitch = Math.atan2(velocityDir.y, Math.hypot(velocityDir.x, velocityDir.z));

    flight.aoa = THREE.MathUtils.clamp(
      forwardPitch - velocityPitch,
      -flight.maxAoa,
      flight.maxAoa
    );

    const stallProgress = THREE.MathUtils.clamp(
      (Math.max(0, flight.aoa) - flight.criticalAoa) /
      (flight.maxAoa - flight.criticalAoa),
      0, 1
    );

    // Forces
    let thrust = flight.thrust * flight.throttle;
    if (keyState.has('shift')) thrust *= flight.afterburnerFactor;

    const parasiteDrag = flight.dragCoeff * airSpeed * airSpeed;
    const inducedDrag = flight.inducedDrag * airSpeed * airSpeed *
      (Math.abs(flight.aoa) + Math.abs(Math.sin(flight.roll)));

    const turnDrag = flight.turnDragCoeff * airSpeed * airSpeed *
      Math.abs(Math.sin(flight.roll));

    const totalDrag = parasiteDrag + inducedDrag + turnDrag;

    thrustForce.copy(forward).multiplyScalar(thrust);
    dragForce.copy(velocityDir).multiplyScalar(-totalDrag);

    let liftCoeff = flight.baseLiftCoeff + flight.aoa * flight.aoaLiftFactor;
    liftCoeff *= (1 - stallProgress * 0.7);
    liftCoeff = THREE.MathUtils.clamp(liftCoeff, -0.2, 1.2);

    const liftMag = flight.liftCoeff * airSpeed * airSpeed * liftCoeff;

    liftForce.copy(up).multiplyScalar(liftMag);

    accel.copy(thrustForce)
      .add(dragForce)
      .add(liftForce)
      .addScaledVector(gravityVec, flight.gravity);

    flight.velocity.addScaledVector(accel, dt);

    // Speed clamp
    flight.speed = flight.velocity.length();
    if (flight.speed > flight.maxSpeed) {
      flight.velocity.multiplyScalar(flight.maxSpeed / flight.speed);
      flight.speed = flight.maxSpeed;
    }

    // Position
    planeWorld.addScaledVector(flight.velocity, dt);

    // Ground collision
    const groundY = terrainHeightAt(planeWorld.x, planeWorld.z);
    const floor = groundY + 5;

    if (planeWorld.y < floor) {
      planeWorld.y = floor;
      if (flight.velocity.y < 0) flight.velocity.y = 0;
      flight.pitch *= 0.9;
    }

    // World systems
    updateRenderOrigin();
    syncRenderedWorld();

    terrainSystem.updateChunks(planeWorld.x, planeWorld.z);

    markerTimer += dt;
    if (markerTimer > 0.08) {
      markerTimer = 0;
      markerSystem.refreshAroundPlayer(planeWorld);
    }

    // HUD
    hud.speedEl.textContent = flight.speed.toFixed(0);
    hud.altitudeEl.textContent = Math.max(0, planeWorld.y - groundY).toFixed(0);

    const t = Math.round(flight.throttle * 100);
    hud.throttleValueEl.textContent = `${t}%`;
    hud.throttleFillEl.style.width = `${t}%`;
  }

  return {
    updateFlight,
    syncRenderedWorld
  };
}
