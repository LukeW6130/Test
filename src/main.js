import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';
import { createFlightSimulator, createFlightState } from './flight.js';
import { createMarkerSystem } from './markers.js';
import { createPlaneRig } from './plane.js';
import { createScene } from './scene.js';
import { CHUNK_SIZE, createTerrainSystem } from './terrain.js';

const { scene, camera, renderer } = createScene();
const renderOrigin = new THREE.Vector3();
const planeWorld = new THREE.Vector3(0, 55, 0);
const floatingOriginThreshold = CHUNK_SIZE * 0.5;
const planeWorldQuat = new THREE.Quaternion();

const terrainSystem = createTerrainSystem({ scene, renderOrigin });
const markerSystem = createMarkerSystem({ scene, renderOrigin });
const { planeYaw, planeRoll, planePitch } = createPlaneRig(scene);
const flight = createFlightState();
const keyState = new Set();
const hud = {
  speedEl: document.getElementById('speed'),
  altitudeEl: document.getElementById('altitude'),
  throttleValueEl: document.getElementById('throttleValue'),
  throttleFillEl: document.getElementById('throttleFill')
};

renderOrigin.copy(planeWorld);
renderOrigin.y = 0;
planeYaw.position.set(0, planeWorld.y, 0);
terrainSystem.updateChunks(planeWorld.x, planeWorld.z);

const { syncRenderedWorld, updateFlight } = createFlightSimulator({
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
});

window.addEventListener('keydown', (event) => keyState.add(event.key.toLowerCase()));
window.addEventListener('keyup', (event) => keyState.delete(event.key.toLowerCase()));
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
const fixedStep = 1 / 120;
let accumulator = 0;
const chaseOffsetVec = new THREE.Vector3();
const targetPosVec = new THREE.Vector3();
const lookTargetVec = new THREE.Vector3();

function updateCamera(dt) {
  chaseOffsetVec.set(-19, 8.5, 0).applyQuaternion(planeWorldQuat);
  targetPosVec.copy(planeYaw.position).add(chaseOffsetVec);
  camera.position.lerp(targetPosVec, 1 - Math.exp(-5.2 * dt));

  lookTargetVec
    .set(10, 1.8, 0)
    .applyQuaternion(planeWorldQuat)
    .add(planeYaw.position);

  camera.lookAt(lookTargetVec);
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.04);
  accumulator += dt;

  let substeps = 0;
  while (accumulator >= fixedStep && substeps < 5) {
    updateFlight(fixedStep);
    accumulator -= fixedStep;
    substeps += 1;
  }

  if (substeps === 5 && accumulator > fixedStep * 2) {
    accumulator = fixedStep;
  }

  syncRenderedWorld();
  updateCamera(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
