import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Fallback plane in case GLB fails
function createFallbackPlane() {
  const fallbackPlane = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.45, 2.4, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0xd8dde6, metalness: 0.45, roughness: 0.4, side: THREE.DoubleSide })
  );
  body.rotation.z = Math.PI / 2;
  fallbackPlane.add(body);

  const wing = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.08, 2.8),
    new THREE.MeshStandardMaterial({ color: 0x3f566e, metalness: 0.25, roughness: 0.55, side: THREE.DoubleSide })
  );
  fallbackPlane.add(wing);

  const tailWing = wing.clone();
  tailWing.scale.set(0.7, 1, 0.42);
  tailWing.position.set(-1.2, 0.28, 0);
  fallbackPlane.add(tailWing);

  const fin = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.75, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x4d6d8a, metalness: 0.2, roughness: 0.5, side: THREE.DoubleSide })
  );
  fin.position.set(-1.2, 0.55, 0);
  fallbackPlane.add(fin);

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.34, 0.9, 14),
    new THREE.MeshStandardMaterial({ color: 0xf06a4a, metalness: 0.15, roughness: 0.45, side: THREE.DoubleSide })
  );
  nose.rotation.z = -Math.PI / 2;
  nose.position.set(1.62, 0, 0);
  fallbackPlane.add(nose);

  fallbackPlane.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return fallbackPlane;
}

// Normalize plane size and position
function normalizePlaneModel(planeModel) {
  const targetLength = 10;
  const bounds = new THREE.Box3().setFromObject(planeModel);
  const size = bounds.getSize(new THREE.Vector3());
  const longestAxis = Math.max(size.x, size.y, size.z);

  if (!Number.isFinite(longestAxis) || longestAxis <= 0) {
    console.warn('Plane model bounds were invalid; skipping normalization.');
    return;
  }

  const uniformScale = targetLength / longestAxis;
  planeModel.scale.setScalar(uniformScale);
  planeModel.updateMatrixWorld(true);

  const scaledBounds = new THREE.Box3().setFromObject(planeModel);
  const center = scaledBounds.getCenter(new THREE.Vector3());
  const groundedY = scaledBounds.min.y;

  planeModel.position.set(-center.x, -groundedY + 0.35, -center.z);
  planeModel.updateMatrixWorld(true);

  const normalizedBounds = new THREE.Box3().setFromObject(planeModel);
  const normalizedSize = normalizedBounds.getSize(new THREE.Vector3());
  console.info('Plane model normalized:', {
    uniformScale,
    size: normalizedSize.toArray(),
    center: normalizedBounds.getCenter(new THREE.Vector3()).toArray()
  });
}

// Main plane rig
export function createPlaneRig(scene) {
  const planeYaw = new THREE.Group();
  const planeRoll = new THREE.Group();
  const planePitch = new THREE.Group();

  planeYaw.add(planeRoll);
  planeRoll.add(planePitch);

  let planeModel = null;

  const loader = new GLTFLoader();
  const planeAssetUrl = new URL('./Models/jet3.glb', import.meta.url).href;

  loader.load(
    planeAssetUrl,
    (gltf) => {
      planeModel = gltf.scene;
      planeModel.rotation.y = Math.PI / 2;

      planeModel.traverse((child) => {
        if (!child.isMesh) return;

        child.castShadow = true;
        child.receiveShadow = true;

        if (child.geometry) {
          child.geometry.computeVertexNormals();
        }

        const materials = Array.isArray(child.material) ? child.material : [child.material];

        for (const mat of materials) {
          mat.side = THREE.FrontSide;

          // Handle opaque vs transparent properly
          if (mat.transparent) {
            mat.depthWrite = false;
            mat.alphaToCoverage = true;
          } else {
            mat.depthWrite = true;
          }
          mat.depthTest = true;

          if (mat.map) {
            mat.map.colorSpace = THREE.SRGBColorSpace;
            mat.map.anisotropy = 8;
          }

          mat.needsUpdate = true;
        }
      });

      normalizePlaneModel(planeModel);
      planePitch.add(planeModel);
      console.info('Plane model loaded:', planeAssetUrl);
    },
    undefined,
    (error) => {
      console.error('GLB failed to load, using fallback plane:', planeAssetUrl, error);
      planeModel = createFallbackPlane();
      planePitch.add(planeModel);
    }
  );

  scene.add(planeYaw);

  return {
    planeYaw,
    planeRoll,
    planePitch,
    getModel: () => planeModel
  };
}
