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
    pitchRate: 3.0,
    rollRate: 4.0,
    maxRoll: THREE.MathUtils.degToRad(78),
    rollAuthority: 9.0,
    rollReturn: 5.4,
    rollOppositionDamping: 4.0,
    yawRate: 0.8,
    pitchDamping: 3.0,
    rollDamping: 3.0,
    yawDamping: 2.0,
    liftCoeff: 0.0065,
    dragCoeff: 0.0035,
    inducedDrag: 0.0012,
    thrust: 18,
    throttle: 0.72,
    throttleAdjustRate: 0.55,
    afterburnerFactor: 1.65,
    gravity: 9.8,
    stallSink: 5.0,
    aoa: 0,
    aoaLiftFactor: 2.2,
    aoaDragFactor: 0.65,
    criticalAoa: 0.22,
    maxAoa: 0.48,
    turnDragCoeff: 0.00018,
    liftYawFactor: 0.55,
    baseLiftCoeff: 0.5
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
  const forwardVec = new THREE.Vector3();
  const upVec = new THREE.Vector3();
  const velocityDirVec = new THREE.Vector3(1, 0, 0);
  const thrustForceVec = new THREE.Vector3();
  const dragForceVec = new THREE.Vector3();
  const liftForceVec = new THREE.Vector3();
  const gravityForceVec = new THREE.Vector3(0, -1, 0);
  const accelVec = new THREE.Vector3();
  const liftDirVec = new THREE.Vector3();
  let markerRefreshTimer = 0;

  function updateRenderOrigin() {
    const shiftX = Math.abs(planeWorld.x - renderOrigin.x) > floatingOriginThreshold
      ? planeWorld.x - renderOrigin.x
      : 0;
    const shiftZ = Math.abs(planeWorld.z - renderOrigin.z) > floatingOriginThreshold
      ? planeWorld.z - renderOrigin.z
      : 0;

    if (shiftX === 0 && shiftZ === 0) {
      return;
    }

    renderOrigin.x += shiftX;
    renderOrigin.z += shiftZ;
    camera.position.x -= shiftX;
    camera.position.z -= shiftZ;
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
    const pitchInput = (keyState.has('w') ? 1 : 0) - (keyState.has('s') ? 1 : 0);
    const rollInput = (keyState.has('d') ? 1 : 0) - (keyState.has('a') ? 1 : 0);
    const yawInput = (keyState.has('q') ? 1 : 0) - (keyState.has('e') ? 1 : 0);
    const throttleInput = (keyState.has('r') ? 1 : 0) - (keyState.has('f') ? 1 : 0);

    flight.throttle = THREE.MathUtils.clamp(
      flight.throttle + throttleInput * flight.throttleAdjustRate * dt,
      0,
      1
    );

    const inputAlpha = 1 - Math.exp(-16 * dt);
    flight.pitchInputSmoothed = THREE.MathUtils.lerp(flight.pitchInputSmoothed, pitchInput, inputAlpha);
    flight.rollInputSmoothed = THREE.MathUtils.lerp(flight.rollInputSmoothed, rollInput, inputAlpha);
    flight.yawInputSmoothed = THREE.MathUtils.lerp(flight.yawInputSmoothed, yawInput, inputAlpha);

    const speedFactor = THREE.MathUtils.clamp(flight.speed / flight.maxSpeed, 0, 1);
    const controlScale = Math.max(0.6, 1 - speedFactor * 0.4);
    flight.pitchVel += flight.pitchInputSmoothed * flight.pitchRate * controlScale * dt;
    const desiredRoll = flight.rollInputSmoothed * flight.maxRoll;
    const rollError = desiredRoll - flight.roll;
    flight.rollVel += rollError * flight.rollAuthority * controlScale * dt;
    flight.yawVel += flight.yawInputSmoothed * flight.yawRate * dt;

    const bankTurnStrength = 1.8;
    flight.yawVel += -Math.sin(flight.roll) * bankTurnStrength * dt;

    if (Math.abs(flight.pitchInputSmoothed) < 1e-3) {
      flight.pitchVel -= 0.15 * dt;
    }
    if (Math.abs(flight.rollInputSmoothed) < 1e-3) {
      flight.rollVel += -flight.roll * flight.rollReturn * dt;
    } else if (Math.sign(flight.rollInputSmoothed) !== Math.sign(flight.roll) && Math.abs(flight.roll) > 1e-3) {
      flight.rollVel += -flight.roll * flight.rollOppositionDamping * Math.abs(flight.rollInputSmoothed) * dt;
    }

    flight.pitchVel -= flight.pitchVel * flight.pitchDamping * dt;
    flight.rollVel -= flight.rollVel * flight.rollDamping * dt;
    flight.yawVel -= flight.yawVel * flight.yawDamping * dt;

    flight.pitch = THREE.MathUtils.clamp(flight.pitch + flight.pitchVel * dt, -10, 10);
    flight.roll = THREE.MathUtils.clamp(flight.roll + flight.rollVel * dt, -flight.maxRoll, flight.maxRoll);
    flight.yaw += flight.yawVel * dt;
    flight.yaw = ((flight.yaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

    planeYaw.rotation.y = flight.yaw;
    planeRoll.rotation.x = flight.roll;
    planePitch.rotation.z = flight.pitch;
    planePitch.getWorldQuaternion(planeWorldQuat);

    forwardVec.set(1, 0, 0).applyQuaternion(planeWorldQuat).normalize();
    const airSpeed = flight.velocity.length();
    if (airSpeed > 1e-6) {
      velocityDirVec.copy(flight.velocity).normalize();
    } else {
      velocityDirVec.copy(forwardVec);
    }

    const rightVec = new THREE.Vector3(0, 0, 1).applyQuaternion(planeWorldQuat).normalize();
    const sideSpeed = flight.velocity.dot(rightVec);
    const sideDamping = 2.5;
    flight.velocity.addScaledVector(rightVec, -sideSpeed * sideDamping * dt);
    upVec.set(0, 1, 0).applyQuaternion(planeWorldQuat).normalize();

    const forwardPitch = Math.atan2(forwardVec.y, Math.hypot(forwardVec.x, forwardVec.z));
    const velocityPitch = Math.atan2(velocityDirVec.y, Math.hypot(velocityDirVec.x, velocityDirVec.z));
    flight.aoa = THREE.MathUtils.clamp(forwardPitch - velocityPitch, -flight.maxAoa, flight.maxAoa);
    const positiveAoa = Math.max(0, flight.aoa);
    const stallProgress = THREE.MathUtils.clamp(
      (positiveAoa - flight.criticalAoa) / Math.max(1e-6, flight.maxAoa - flight.criticalAoa),
      0,
      1
    );
    const effectiveAoa = positiveAoa * (1 - 0.65 * stallProgress);

    let thrust = flight.thrust * flight.throttle;
    if (keyState.has('shift')) {
      thrust *= flight.afterburnerFactor;
    }

    const loadFactor = 1 / Math.max(0.35, Math.abs(Math.cos(flight.roll)));
    const parasiteDrag = flight.dragCoeff * airSpeed * airSpeed;
    const inducedDrag = flight.inducedDrag * airSpeed * airSpeed * (
      Math.abs(flight.aoa) * flight.aoaDragFactor + (loadFactor - 1) * 0.85
    );
    const turnDrag = flight.turnDragCoeff * airSpeed * airSpeed * Math.abs(flight.rollInputSmoothed);
    const totalDrag = parasiteDrag + inducedDrag + turnDrag;

    thrustForceVec.copy(forwardVec).multiplyScalar(thrust);
    dragForceVec.copy(velocityDirVec).multiplyScalar(-totalDrag);

    liftDirVec.copy(upVec);
    const perpLift = upVec.clone().sub(
      velocityDirVec.clone().multiplyScalar(upVec.dot(velocityDirVec))
    ).normalize();
    liftDirVec.lerp(perpLift, 0.35).normalize();

    const aoaForLift = flight.aoa >= 0 ? effectiveAoa : flight.aoa * 0.7;
    let liftCoefficient = flight.baseLiftCoeff + aoaForLift * flight.aoaLiftFactor;
    liftCoefficient *= 1 - stallProgress * 0.65;
    liftCoefficient = THREE.MathUtils.clamp(liftCoefficient, -0.2, 1.2);

    const liftMagnitude = flight.liftCoeff * airSpeed * airSpeed * liftCoefficient;
    liftForceVec.copy(liftDirVec).multiplyScalar(liftMagnitude);

    accelVec
      .copy(thrustForceVec)
      .add(dragForceVec)
      .add(liftForceVec)
      .addScaledVector(gravityForceVec, flight.gravity);

    flight.velocity.addScaledVector(accelVec, dt);

    const alignStrength = 0.6;
    const desiredDir = forwardVec.clone();
    const currentSpeed = flight.velocity.length();
    const alignedVel = desiredDir.multiplyScalar(currentSpeed);
    flight.velocity.lerp(alignedVel, alignStrength * dt);

    flight.speed = flight.velocity.length();
    if (flight.speed > flight.maxSpeed) {
      flight.velocity.multiplyScalar(flight.maxSpeed / flight.speed);
      flight.speed = flight.maxSpeed;
    }

    planeWorld.addScaledVector(flight.velocity, dt);

    const groundY = terrainHeightAt(planeWorld.x, planeWorld.z);
    const floorHeight = groundY + 5;
    if (planeWorld.y < floorHeight) {
      planeWorld.y = floorHeight;
      if (flight.velocity.y < 0) {
        flight.velocity.y = 0;
      }
      flight.pitch *= 0.9;
      flight.pitchVel *= 0.5;
    }

    updateRenderOrigin();
    syncRenderedWorld();
    terrainSystem.updateChunks(planeWorld.x, planeWorld.z);

    markerRefreshTimer += dt;
    if (markerRefreshTimer >= 0.08) {
      markerRefreshTimer = 0;
      markerSystem.refreshAroundPlayer(planeWorld);
    }

    hud.speedEl.textContent = flight.speed.toFixed(0);
    hud.altitudeEl.textContent = Math.max(0, planeWorld.y - groundY).toFixed(0);
    const throttlePercent = Math.round(flight.throttle * 100);
    hud.throttleValueEl.textContent = `${throttlePercent}%`;
    hud.throttleFillEl.style.width = `${throttlePercent}%`;
  }

  return {
    syncRenderedWorld,
    updateFlight
  };
}
