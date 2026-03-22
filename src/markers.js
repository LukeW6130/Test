import * as THREE from 'three';
import { CHUNK_WORLD_SIZE, RENDER_DISTANCE, terrainHeightAt } from './terrain.js';

export function createMarkerSystem({ scene, renderOrigin }) {
  const markerCount = 420;
  const markerGeo = new THREE.ConeGeometry(2.2, 10, 6);
  const markerMat = new THREE.MeshStandardMaterial({ color: 0x2f7f34, roughness: 0.9 });
  const markerMesh = new THREE.InstancedMesh(markerGeo, markerMat, markerCount);
  markerMesh.castShadow = false;
  markerMesh.receiveShadow = false;
  markerMesh.frustumCulled = false;
  markerMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(markerMesh);

  const markerData = Array.from({ length: markerCount }, () => ({
    x: (Math.random() - 0.5) * 3000,
    y: 0,
    z: (Math.random() - 0.5) * 3000,
    rotationY: Math.random() * Math.PI * 2
  }));
  const markerDummy = new THREE.Object3D();
  const markerResetDistance = CHUNK_WORLD_SIZE * (RENDER_DISTANCE + 1.75);
  const markerResetDistanceSq = markerResetDistance * markerResetDistance;

  function updateMarkerMatrix(index) {
    const marker = markerData[index];
    markerDummy.position.set(marker.x - renderOrigin.x, marker.y, marker.z - renderOrigin.z);
    markerDummy.rotation.set(0, marker.rotationY, 0);
    markerDummy.scale.setScalar(1);
    markerDummy.updateMatrix();
    markerMesh.setMatrixAt(index, markerDummy.matrix);
  }

  function setMarkerInstance(index, x, z, rotationY = Math.random() * Math.PI * 2) {
    const marker = markerData[index];
    marker.x = x;
    marker.y = terrainHeightAt(x, z) + 5;
    marker.z = z;
    marker.rotationY = rotationY;
    updateMarkerMatrix(index);
  }

  function syncMarkerRenderPositions() {
    for (let i = 0; i < markerCount; i += 1) {
      updateMarkerMatrix(i);
    }
    markerMesh.instanceMatrix.needsUpdate = true;
  }

  function initialize() {
    for (let i = 0; i < markerCount; i += 1) {
      const marker = markerData[i];
      setMarkerInstance(i, marker.x, marker.z, marker.rotationY);
    }
    markerMesh.instanceMatrix.needsUpdate = true;
  }

  function refreshAroundPlayer(planeWorld) {
    for (let i = 0; i < markerCount; i += 1) {
      const marker = markerData[i];
      const dx = marker.x - planeWorld.x;
      const dz = marker.z - planeWorld.z;
      if (dx * dx + dz * dz > markerResetDistanceSq) {
        const x = planeWorld.x + (Math.random() - 0.5) * 1700;
        const z = planeWorld.z + (Math.random() - 0.5) * 1700;
        setMarkerInstance(i, x, z);
      }
    }
    markerMesh.instanceMatrix.needsUpdate = true;
  }

  initialize();

  return {
    refreshAroundPlayer,
    syncMarkerRenderPositions
  };
}
