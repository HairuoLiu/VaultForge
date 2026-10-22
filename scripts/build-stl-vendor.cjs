// Install pinned build dependencies outside the project, then pass that directory:
// npm install --prefix /tmp/vault-stl-build --no-audit --no-fund three@0.180.0 esbuild@0.25.10
// node scripts/build-stl-vendor.cjs /tmp/vault-stl-build
const path = require('node:path');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const dependencyRoot = path.resolve(process.argv[2]);
const requireDependency = createRequire(path.join(dependencyRoot, 'package.json'));
const { build } = requireDependency('esbuild');
const root = path.resolve(__dirname, '..');
(async () => {
  const common = { bundle: true, minify: true, platform: 'browser', target: 'es2020', nodePaths: [path.join(dependencyRoot, 'node_modules')], legalComments: 'inline' };
  const worker = await build({ ...common, entryPoints: [path.join(root, 'assets/stl-worker.js')], write: false, format: 'iife' });
  const entry = `
    export { Scene, Color, PerspectiveCamera, WebGLRenderer, HemisphereLight, DirectionalLight,
      Mesh, MeshStandardMaterial, BufferGeometry, BufferAttribute, Box3, Sphere, Vector3,
      Group, GridHelper, DoubleSide, ACESFilmicToneMapping } from 'three';
    export { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    const workerSource = ${JSON.stringify(worker.outputFiles[0].text)};
    export function createWorker() {
      const url = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
      try { return new Worker(url); } finally { URL.revokeObjectURL(url); }
    }
  `;
  await build({ ...common, stdin: { contents: entry, resolveDir: dependencyRoot }, format: 'iife', globalName: 'VaultSTL', outfile: path.join(root, 'assets/vendor/vault-stl.min.js'), banner: { js: '/* Three.js 0.180.0 (MIT). Built with esbuild 0.25.10; see three-LICENSE.txt. */' } });
  fs.copyFileSync(path.join(dependencyRoot, 'node_modules/three/LICENSE'), path.join(root, 'assets/vendor/three-LICENSE.txt'));
})();
