import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.161.0/examples/jsm/loaders/GLTFLoader.js';

export function createPlaneRig(scene) {
  // ---------------- Rig Hierarchy ----------------
  const planeYaw = new THREE.Group();
  const planeRoll = new THREE.Group();
  const planePitch = new THREE.Group();

  planeYaw.add(planeRoll);
  planeRoll.add(planePitch);

  // ---------------- Load Model ----------------
  const loader = new GLTFLoader();

  loader.load('Models/jet.glb', (gltf) => {
    const model = gltf.scene;

    // ---------------- Transform Fixes ----------------
    // You will likely tweak these 3 lines
    model.scale.set(1, 1, 1);
    model.position.set(0, 0, 0);
    model.rotation.y = Math.PI; // common forward-direction fix

    // ---------------- Rendering Improvements ----------------
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Improve material realism if needed
        if (child.material) {
          child.material.metalness = 0.5;
          child.material.roughness = 0.4;
        }
      }
    });

    // ✅ Attach model to flight rig
    planePitch.add(model);
  });

  // ---------------- Add to Scene ----------------
  scene.add(planeYaw);

  // ---------------- Return Controls ----------------
  return {
    planeYaw,
    planeRoll,
    planePitch
  };
}
