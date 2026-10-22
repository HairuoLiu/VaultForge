const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the exact bundled worker used by the browser, without a WebGL context.
let workerBlob;
const engine = vm.createContext({
  Blob, AbortController,
  URL: { createObjectURL(blob) { workerBlob = blob; return 'blob:test'; }, revokeObjectURL() {} },
  Worker: class { constructor(url) { assert.equal(url, 'blob:test'); } }
});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/vendor/vault-stl.min.js'), 'utf8'), engine);
engine.VaultSTL.createWorker();
const source = workerBlob.text();
async function parse(file) {
  const events = [];
  const self = { postMessage(data) { events.push(data); } };
  const context = vm.createContext({ self, performance, TextDecoder, AbortController });
  vm.runInContext(await source, context);
  await self.onmessage({ data: { file } });
  return events.at(-1);
}
function binary(triangles, vertices = [100, -20, 5, 110, -20, 5, 100, -10, 5]) {
  const buffer = new ArrayBuffer(84 + triangles * 50);
  const view = new DataView(buffer);
  view.setUint32(80, triangles, true);
  for (let triangle = 0; triangle < triangles; triangle++) {
    vertices.forEach((value, i) => view.setFloat32(84 + triangle * 50 + 12 + i * 4, value, true));
  }
  return buffer;
}

test('binary STL preserves original dimensions and all triangles in compact positions', async () => {
  const result = await parse(new Blob([binary(1)]));
  assert.equal(result.type, 'ready');
  assert.equal(result.triangles, 1);
  assert.deepEqual(Array.from(result.minimum), [100, -20, 5]);
  assert.deepEqual(Array.from(result.maximum), [110, -10, 5]);
  assert.deepEqual(Array.from(new Uint16Array(result.positions)), [0, 0, 0, 65535, 0, 0, 0, 65535, 0]);
});

test('binary STL whose header starts with solid remains binary', async () => {
  const buffer = binary(1);
  new Uint8Array(buffer).set(new TextEncoder().encode('solid binary model'));
  assert.equal((await parse(new Blob([buffer]))).type, 'ready');
});

test('ASCII STL is supported by the bundled Three.js loader', async () => {
  const ascii = `solid triangle\nfacet normal 0 0 1\nouter loop\nvertex 1 2 3\nvertex 5 2 3\nvertex 1 8 3\nendloop\nendfacet\nendsolid triangle`;
  const result = await parse(new Blob([ascii]));
  assert.equal(result.type, 'ready');
  assert.equal(result.triangles, 1);
  assert.deepEqual(Array.from(result.minimum), [1, 2, 3]);
  assert.deepEqual(Array.from(result.maximum), [5, 8, 3]);
});

test('chunk boundaries preserve the final triangle and its bounds', async () => {
  const count = 32769;
  const buffer = binary(count);
  new DataView(buffer).setFloat32(84 + (count - 1) * 50 + 12, 200, true);
  const result = await parse(new Blob([buffer]));
  assert.equal(result.type, 'ready');
  assert.equal(result.triangles, count);
  assert.equal(result.maximum[0], 200);
  assert.equal(new Uint16Array(result.positions).length, count * 9);
  assert.equal(new Uint16Array(result.positions)[(count - 1) * 9], 65535);
});

test('truncated, non-finite, empty and zero-size models report a useful failure', async () => {
  const nan = binary(1); new DataView(nan).setFloat32(96, NaN, true);
  for (const file of [new Blob([binary(1).slice(0, 100)]), new Blob([nan]), new Blob(['solid empty\nendsolid empty']), new Blob([binary(1, new Array(9).fill(0))])]) {
    const result = await parse(file);
    assert.equal(result.type, 'error');
    assert.equal(result.code, 'invalid');
  }
});

test('oversized meshes are rejected before allocating geometry', async () => {
  const header = binary(0);
  new DataView(header).setUint32(80, 12000001, true);
  const result = await parse({ size: 84 + 12000001 * 50, slice() { return new Blob([header]); } });
  assert.equal(result.type, 'error');
  assert.equal(result.code, 'tooLarge');
});
