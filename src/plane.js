import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';

export function createPlaneRig(scene) {
  const planeYaw = new THREE.Group();
  const planeRoll = new THREE.Group();
  const planePitch = new THREE.Group();
  const plane = new THREE.Group();
  planeYaw.add(planeRoll);
  planeRoll.add(planePitch);
  planePitch.add(plane);

  const fighterBodyMat = new THREE.MeshStandardMaterial({
    color: 0x909aa4,
    metalness: 0.28,
    roughness: 0.58,
    flatShading: true
  });
  const fighterDarkMat = new THREE.MeshStandardMaterial({
    color: 0x5a6169,
    metalness: 0.18,
    roughness: 0.7,
    flatShading: true
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x727c86,
    metalness: 0.12,
    roughness: 0.62,
    flatShading: true
  });
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0x6f93c4,
    emissive: 0x10233b,
    metalness: 0.22,
    roughness: 0.18,
    transparent: true,
    opacity: 0.78
  });

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.92, 9.2, 10, 1, false),
    fighterBodyMat
  );
  body.rotation.z = -Math.PI / 2;
  body.scale.set(1, 0.96, 1.08);
  body.position.set(0.1, 0.06, 0);
  body.castShadow = true;
  plane.add(body);

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.46, 2.75, 5, 1),
    fighterBodyMat
  );
  nose.rotation.z = -Math.PI / 2;
  nose.position.set(5.95, 0.08, 0);
  nose.castShadow = true;
  plane.add(nose);

  const chin = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.22, 0.72), fighterDarkMat);
  chin.position.set(4.35, -0.32, 0);
  chin.castShadow = true;
  plane.add(chin);

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

  const wingShape = new THREE.Shape();
  wingShape.moveTo(2.8, 0.0);
  wingShape.lineTo(1.32, -0.12);
  wingShape.lineTo(-1.08, 0.08);
  wingShape.lineTo(-2.55, 2.45);
  wingShape.lineTo(0.9, 0.56);
  wingShape.lineTo(2.8, 0.0);

  const wingGeometry = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.14,
    bevelEnabled: false
  });
  wingGeometry.rotateX(Math.PI / 2);
  wingGeometry.translate(0, 0.02, -0.07);

  const leftWing = new THREE.Mesh(wingGeometry, fighterBodyMat);
  leftWing.position.set(0.18, -0.04, 0.56);
  leftWing.castShadow = true;
  plane.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeometry, fighterBodyMat);
  rightWing.position.set(0.18, -0.04, -0.56);
  rightWing.scale.z = -1;
  rightWing.castShadow = true;
  plane.add(rightWing);

  const strakeGeo = new THREE.BoxGeometry(1.4, 0.08, 0.36);
  const leftStrake = new THREE.Mesh(strakeGeo, accentMat);
  leftStrake.position.set(2.05, -0.08, 0.53);
  leftStrake.rotation.z = THREE.MathUtils.degToRad(18);
  leftStrake.castShadow = true;
  plane.add(leftStrake);

  const rightStrake = leftStrake.clone();
  rightStrake.position.z = -0.53;
  rightStrake.rotation.z = THREE.MathUtils.degToRad(-18);
  plane.add(rightStrake);

  const tailWing = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.12, 2.95), fighterBodyMat);
  tailWing.position.set(-3.55, 0.3, 0);
  tailWing.castShadow = true;
  plane.add(tailWing);

  const finGeometry = new THREE.BoxGeometry(1.0, 1.65, 0.14);
  const leftFin = new THREE.Mesh(finGeometry, fighterBodyMat);
  leftFin.position.set(-3.72, 1.24, 0.58);
  leftFin.rotation.z = THREE.MathUtils.degToRad(-27);
  leftFin.castShadow = true;
  plane.add(leftFin);

  const rightFin = leftFin.clone();
  rightFin.position.z = -0.58;
  rightFin.rotation.z = THREE.MathUtils.degToRad(-27);
  plane.add(rightFin);

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

  const exhaustGeo = new THREE.CylinderGeometry(0.24, 0.34, 0.92, 8, 1, true);
  const exhaustLeft = new THREE.Mesh(exhaustGeo, fighterDarkMat);
  exhaustLeft.rotation.z = Math.PI / 2;
  exhaustLeft.position.set(-4.86, 0.0, 0.43);
  exhaustLeft.castShadow = true;
  plane.add(exhaustLeft);

  const exhaustRight = exhaustLeft.clone();
  exhaustRight.position.z = -0.43;
  plane.add(exhaustRight);

  const belly = new THREE.Mesh(new THREE.BoxGeometry(4.25, 0.18, 1.12), fighterDarkMat);
  belly.position.set(-0.35, -0.54, 0);
  belly.castShadow = true;
  plane.add(belly);

  const spine = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.18, 0.58), accentMat);
  spine.position.set(-0.55, 0.42, 0);
  spine.rotation.z = THREE.MathUtils.degToRad(-4);
  spine.castShadow = true;
  plane.add(spine);

  const cockpitGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 10, 10),
    new THREE.MeshStandardMaterial({
      color: 0x9ec1ff,
      emissive: 0x1c3f72,
      metalness: 0.0,
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
