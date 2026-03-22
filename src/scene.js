import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';

export function createScene() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xd4e5ff, 260, 2200);

  const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 3200);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xdeebff, 0x35506a, 1.4);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffefcf, 1.4);
  sun.position.set(240, 260, 140);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 20;
  sun.shadow.camera.far = 1400;
  sun.shadow.camera.left = -520;
  sun.shadow.camera.right = 520;
  sun.shadow.camera.top = 520;
  sun.shadow.camera.bottom = -520;
  scene.add(sun);

  const fillLight = new THREE.DirectionalLight(0xb7d2ff, 0.32);
  fillLight.position.set(-220, 120, -140);
  scene.add(fillLight);

  const skyGeo = new THREE.SphereGeometry(2600, 36, 20);
  const sunDirection = sun.position.clone().normalize();
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x2d5d97) },
      horizonColor: { value: new THREE.Color(0xc9defd) },
      bottomColor: { value: new THREE.Color(0xf8fbff) },
      hazeColor: { value: new THREE.Color(0xf7e6ca) },
      sunColor: { value: new THREE.Color(0xfff2c9) },
      sunDirection: { value: sunDirection },
      offset: { value: 35 },
      exponent: { value: 0.72 }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 bottomColor;
      uniform vec3 hazeColor;
      uniform vec3 sunColor;
      uniform vec3 sunDirection;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;

      void main() {
        vec3 dir = normalize(vWorldPosition + vec3(0.0, offset, 0.0));
        float h = dir.y;
        float topMix = max(pow(max(h, 0.0), exponent), 0.0);
        float bottomMix = max(pow(max(-h, 0.0), exponent * 1.25), 0.0);
        float hazeBand = smoothstep(-0.08, 0.12, h) * (1.0 - smoothstep(0.12, 0.42, h));
        float sunGlow = pow(max(dot(dir, normalize(sunDirection)), 0.0), 96.0);
        float sunHalo = pow(max(dot(dir, normalize(sunDirection)), 0.0), 12.0) * 0.22;

        vec3 color = mix(horizonColor, topColor, topMix);
        color = mix(color, bottomColor, bottomMix * 0.82);
        color = mix(color, hazeColor, hazeBand * 0.22 + sunHalo);
        color += sunColor * sunGlow * 0.95;
        gl_FragColor = vec4(color, 1.0);
      }
    `
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyDome);

  return { camera, renderer, scene };
}
