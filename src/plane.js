import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.161.0/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

loader.load('models/plane.glb', (gltf) => {
  const model = gltf.scene;

  model.scale.set(1, 1, 1); // adjust if needed
  model.position.set(0, 0, 0);

  scene.add(model);
});

export function createPlaneRig(scene) {
  const planeYaw = new THREE.Group();
  const planeRoll = new THREE.Group();
  const planePitch = new THREE.Group();
  const plane = new THREE.Group();
  planeYaw.add(planeRoll);
  planeRoll.add(planePitch);
  planePitch.add(plane);

  // ---------------- Materials ----------------
  const fighterBodyMat = new THREE.MeshStandardMaterial({
    color: 0x8a949e,
    metalness: 0.55,
    roughness: 0.42
  });

  const fighterDarkMat = new THREE.MeshStandardMaterial({
    color: 0x3e454c,
    metalness: 0.6,
    roughness: 0.5
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x6d7680,
    metalness: 0.45,
    roughness: 0.35
  });

  const canopyMat = new THREE.MeshPhysicalMaterial({
    color: 0x88bfff,
    metalness: 0,
    roughness: 0.05,
    transmission: 0.9,
    thickness: 0.5,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    transparent: true,
    opacity: 0.8
  });

  // ---------------- Body ----------------
  const bodyGeo = new THREE.CylinderGeometry(0.42, 0.92, 9.2, 24, 3);
  bodyGeo.computeVertexNormals();
  const body = new THREE.Mesh(bodyGeo, fighterBodyMat);
  body.rotation.z = -Math.PI / 2;
  body.scale.set(1, 0.96, 1.08);
  body.position.set(0.1, 0.06, 0);
  body.castShadow = true;
  plane.add(body);

  // ---------------- Nose ----------------
  const noseGeo = new THREE.ConeGeometry(0.46, 2.75, 12, 3);
  noseGeo.computeVertexNormals();
  const nose = new THREE.Mesh(noseGeo, fighterBodyMat);
  nose.rotation.z = -Math.PI / 2;
  nose.position.set(5.95, 0.08, 0);
  nose.castShadow = true;
  plane.add(nose);

  // ---------------- Chin ----------------
  const chin = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.22, 0.72), fighterDarkMat);
  chin.position.set(4.35, -0.32, 0);
  chin.castShadow = true;
  plane.add(chin);

  // ---------------- Canopy ----------------
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.64, 1.18), canopyMat);
  canopy.position.set(1.9, 0.72, 0);
  canopy.rotation.z = THREE.MathUtils.degToRad(-8);
  canopy.castShadow = true;
  plane.add(canopy);

  const canopyBase = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.14, 1.28), accentMat);
  canopyBase.position.set(1.85, 0.38, 0);
  canopyBase.rotation.z = THREE.MathUtils.degToRad(-8);
  canopyBase.castShadow = true;
  plane.add(canopyBase);

  // ---------------- Wings ----------------
  const wingShape = new THREE.Shape();
  wingShape.moveTo(2.8, 0.0);
  wingShape.lineTo(1.32, -0.12);
  wingShape.lineTo(-1.08, 0.08);
  wingShape.lineTo(-2.55, 2.45);
  wingShape.lineTo(0.9, 0.56);
  wingShape.lineTo(2.8, 0.0);

  const wingGeometry = new THREE.ExtrudeGeometry(wingShape, { depth: 0.14, bevelEnabled: false });
  wingGeometry.rotateX(Math.PI / 2);
  wingGeometry.translate(0, 0.02, -0.07);
  wingGeometry.computeVertexNormals();

  const leftWing = new THREE.Mesh(wingGeometry, fighterBodyMat);
  leftWing.position.set(0.18, -0.04, 0.56);
  leftWing.castShadow = true;
  plane.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeometry, fighterBodyMat);
  rightWing.position.set(0.18, -0.04, -0.56);
  rightWing.scale.z = -1;
  rightWing.castShadow = true;
  plane.add(rightWing);

  // ---------------- Tail Wing ----------------
  const tailWing = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.12, 2.95), fighterBodyMat);
  tailWing.position.set(-3.55, 0.3, 0);
  tailWing.castShadow = true;
  plane.add(tailWing);

  // ---------------- Fins ----------------
  const finGeometry = new THREE.BoxGeometry(1.0, 1.65, 0.14);
  const leftFin = new THREE.Mesh(finGeometry, fighterBodyMat);
  leftFin.position.set(-3.72, 1.24, 0.58);
  leftFin.rotation.z = THREE.MathUtils.degToRad(27);
  leftFin.castShadow = true;
  plane.add(leftFin);

  const rightFin = leftFin.clone();
  rightFin.position.z = -0.58;
  rightFin.rotation.z = THREE.MathUtils.degToRad(27);
  plane.add(rightFin);

  // ---------------- Engines ----------------
  const engineGeo = new THREE.BoxGeometry(2.9, 0.64, 0.72);
  const engineLeft = new THREE.Mesh(engineGeo, fighterDarkMat);
  engineLeft.position.set(-1.95, -0.08, 0.46);
  engineLeft.castShadow = true;
  plane.add(engineLeft);

  const engineRight = engineLeft.clone();
  engineRight.position.z = -0.46;
  plane.add(engineRight);

  const engineBridge = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.16, 0.92), accentMat);
  engineBridge.position.set(-1.55, -0.24, 0);
  engineBridge.castShadow = true;
  plane.add(engineBridge);

  // ---------------- Exhaust Glow ----------------
  const exhaustGlowMat = new THREE.MeshBasicMaterial({ color: 0xff6a00, transparent: true, opacity: 0.7 });
  const exhaustGlow = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), exhaustGlowMat);
  exhaustGlow.position.set(-4.86, 0.0, 0.43);
  plane.add(exhaustGlow);

  // ---------------- Cockpit Glow ----------------
  const cockpitGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 10, 10),
    new THREE.MeshStandardMaterial({
      color: 0x9ec1ff,
      emissive: 0x1c3f72,
      metalness: 0,
      roughness: 0.15,
      transparent: true,
      opacity: 0.35
    })
  );
  cockpitGlow.scale.set(1.8, 0.7, 1.1);
  cockpitGlow.position.set(1.95, 0.77, 0);
  cockpitGlow.castShadow = true;
  plane.add(cockpitGlow);

  scene.add(planeYaw);

  return {
    planeYaw,
    planeRoll,
    planePitch
  };
}
