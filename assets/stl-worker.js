import { STLLoader } from 'three/addons/loaders/STLLoader.js';

// Large binary files are read in bounded chunks. Packed positions retain every
// triangle while avoiding a full source buffer and duplicated normal arrays.
const CHUNK_TRIANGLES = 32768;
const MAX_TRIANGLES = 12000000;
const ASCII_LIMIT = 32 * 1024 * 1024;

self.onmessage = async ({ data: { file } }) => {
  try {
    if (!file || file.size < 15) throw new Error('invalid');
    const header = await file.slice(0, 84).arrayBuffer();
    const count = header.byteLength >= 84 ? new DataView(header).getUint32(80, true) : 0;
    const binary = count > 0 && file.size === 84 + count * 50;
    let triangles = count;
    let minimum = [Infinity, Infinity, Infinity];
    let maximum = [-Infinity, -Infinity, -Infinity];
    let positions;
    let lastProgress = 0;
    const progress = value => {
      if (performance.now() - lastProgress > 100 || value === 100) {
        self.postMessage({ type: 'progress', value });
        lastProgress = performance.now();
      }
    };
    const include = (axis, value) => {
      if (!Number.isFinite(value)) throw new Error('invalid');
      minimum[axis] = Math.min(minimum[axis], value);
      maximum[axis] = Math.max(maximum[axis], value);
    };
    if (binary) {
      if (triangles > MAX_TRIANGLES) throw new Error('tooLarge');
      for (let first = 0; first < triangles; first += CHUNK_TRIANGLES) {
        const end = Math.min(triangles, first + CHUNK_TRIANGLES);
        const view = new DataView(await file.slice(84 + first * 50, 84 + end * 50).arrayBuffer());
        for (let triangle = 0; triangle < end - first; triangle++) {
          for (let vertex = 0; vertex < 9; vertex++) include(vertex % 3, view.getFloat32(triangle * 50 + 12 + vertex * 4, true));
        }
        progress(45 * end / triangles);
      }
      const span = minimum.map((min, axis) => maximum[axis] - min);
      if (!span.some(value => value > 0) || !span.every(Number.isFinite)) throw new Error('invalid');
      positions = new Uint16Array(triangles * 9);
      for (let first = 0; first < triangles; first += CHUNK_TRIANGLES) {
        const end = Math.min(triangles, first + CHUNK_TRIANGLES);
        const view = new DataView(await file.slice(84 + first * 50, 84 + end * 50).arrayBuffer());
        for (let triangle = 0; triangle < end - first; triangle++) {
          for (let vertex = 0; vertex < 9; vertex++) {
            const axis = vertex % 3;
            const value = view.getFloat32(triangle * 50 + 12 + vertex * 4, true);
            positions[(first + triangle) * 9 + vertex] = Math.round((value - minimum[axis]) / (span[axis] || 1) * 65535);
          }
        }
        progress(45 + 55 * end / triangles);
      }
    } else {
      if (file.size > ASCII_LIMIT) throw new Error('invalid');
      const prefix = new TextDecoder().decode(header).trimStart();
      if (!prefix.startsWith('solid')) throw new Error('invalid');
      const geometry = new STLLoader().parse(await file.arrayBuffer());
      const source = geometry.getAttribute('position');
      if (!source || source.count < 3 || source.count % 3) throw new Error('invalid');
      triangles = source.count / 3;
      for (let i = 0; i < source.array.length; i++) include(i % 3, source.array[i]);
      const span = minimum.map((min, axis) => maximum[axis] - min);
      if (!span.some(value => value > 0) || !span.every(Number.isFinite)) throw new Error('invalid');
      positions = new Uint16Array(source.array.length);
      for (let i = 0; i < source.array.length; i++) positions[i] = Math.round((source.array[i] - minimum[i % 3]) / (span[i % 3] || 1) * 65535);
      geometry.dispose();
    }
    progress(100);
    self.postMessage({ type: 'ready', positions: positions.buffer, minimum, maximum, triangles }, [positions.buffer]);
  } catch (error) {
    self.postMessage({ type: 'error', code: error.message === 'tooLarge' ? 'tooLarge' : 'invalid' });
  }
};
