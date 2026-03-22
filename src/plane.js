import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.161.0/examples/jsm/loaders/GLTFLoader.js';

export function createPlaneRig(scene) {
  const planeYaw = new THREE.Group();
  const planeRoll = new THREE.Group();
  const planePitch = new THREE.Group();

  planeYaw.add(planeRoll);
  planeRoll.add(planePitch);

  let planeModel = null; // ✅ important

  const loader = new GLTFLoader();

  loader.load(
    'Models/jet.glb',
    (gltf) => {
      planeModel = gltf.scene;

      planeModel.scale.set(1, 1, 1);
      planeModel.rotation.y = Math.PI;

      planeModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      planePitch.add(planeModel);
    },
    undefined,
    (error) => {
      console.error('GLB failed to load:', error);
    }
  );

  scene.add(planeYaw);

  return {
    planeYaw,
    planeRoll,
    planePitch,
    getModel: () => planeModel // ✅ lets you safely access it
  };
}
