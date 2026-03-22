import * as THREE from 'three';

export const CHUNK_SIZE = 400;
export const CHUNK_SEGMENTS = 48;
export const CHUNK_WORLD_SIZE = CHUNK_SIZE;
export const RENDER_DISTANCE = 3;

function hash2(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function valueNoise2(x, z) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);

  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);

  const nx0 = a + (b - a) * ux;
  const nx1 = c + (d - c) * ux;
  return nx0 + (nx1 - nx0) * uz;
}

function fbm2(x, z) {
  let sum = 0;
  let amplitude = 0.55;
  let frequency = 0.003;

  for (let i = 0; i < 5; i += 1) {
    sum += (valueNoise2(x * frequency, z * frequency) - 0.5) * 2 * amplitude;
    amplitude *= 0.52;
    frequency *= 2.02;
  }

  return sum;
}

export function terrainHeightAt(x, z) {
  const ridges = Math.abs(fbm2(x + 1200, z - 700)) * 18;
  const base = fbm2(x, z) * 42;
  const hills = Math.sin(x * 0.0022) * Math.cos(z * 0.002) * 14;
  return -10 + base + ridges + hills;
}

export function createTerrainSystem({ scene, renderOrigin }) {
  const chunks = new Map();
  const chunkPool = [];

  function chunkKey(cx, cz) {
    return `${cx},${cz}`;
  }

  function updateChunkGeometry(mesh, cx, cz) {
    const geo = mesh.geometry;
    const pos = geo.attributes.position;
    const color = geo.attributes.color;
    const worldOffsetX = cx * CHUNK_WORLD_SIZE;
    const worldOffsetZ = cz * CHUNK_WORLD_SIZE;

    for (let i = 0; i < pos.count; i += 1) {
      const localX = pos.getX(i);
      const localZ = pos.getZ(i);
      const worldX = localX + worldOffsetX;
      const worldZ = localZ + worldOffsetZ;
      const h = terrainHeightAt(worldX, worldZ);
      pos.setY(i, h);

      const t = THREE.MathUtils.clamp((h + 20) / 90, 0, 1);
      color.setXYZ(i, 0.13 + t * 0.22, 0.34 + t * 0.34, 0.14 + t * 0.18);
    }

    pos.needsUpdate = true;
    color.needsUpdate = true;
    geo.computeVertexNormals();
    mesh.position.set(worldOffsetX - renderOrigin.x, 0, worldOffsetZ - renderOrigin.z);
  }

  function createChunk(cx, cz) {
    const geo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, CHUNK_SEGMENTS, CHUNK_SEGMENTS);
    geo.rotateX(-Math.PI / 2);
    const colors = new Float32Array((CHUNK_SEGMENTS + 1) * (CHUNK_SEGMENTS + 1) * 3);
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.96,
        metalness: 0.03,
        flatShading: true
      })
    );
    mesh.receiveShadow = true;
    return { mesh, cx, cz };
  }

  function acquireChunk(cx, cz) {
    const chunk = chunkPool.pop() ?? createChunk(cx, cz);
    chunk.cx = cx;
    chunk.cz = cz;
    updateChunkGeometry(chunk.mesh, cx, cz);
    scene.add(chunk.mesh);
    return chunk;
  }

  function releaseChunk(chunk) {
    scene.remove(chunk.mesh);
    chunkPool.push(chunk);
  }

  function syncChunkRenderPositions() {
    for (const chunk of chunks.values()) {
      chunk.mesh.position.set(
        chunk.cx * CHUNK_WORLD_SIZE - renderOrigin.x,
        0,
        chunk.cz * CHUNK_WORLD_SIZE - renderOrigin.z
      );
    }
  }

  function updateChunks(playerX, playerZ) {
    const centerCX = Math.floor(playerX / CHUNK_WORLD_SIZE);
    const centerCZ = Math.floor(playerZ / CHUNK_WORLD_SIZE);
    const needed = new Set();

    for (let x = -RENDER_DISTANCE; x <= RENDER_DISTANCE; x += 1) {
      for (let z = -RENDER_DISTANCE; z <= RENDER_DISTANCE; z += 1) {
        const cx = centerCX + x;
        const cz = centerCZ + z;
        const key = chunkKey(cx, cz);
        needed.add(key);
        if (!chunks.has(key)) {
          chunks.set(key, acquireChunk(cx, cz));
        }
      }
    }

    for (const [key, chunk] of chunks) {
      if (!needed.has(key)) {
        releaseChunk(chunk);
        chunks.delete(key);
      }
    }
  }

  return {
    syncChunkRenderPositions,
    updateChunks
  };
}
