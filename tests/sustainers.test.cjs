const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const { root: resourceRoot, options: resourceOptions } = require('./resource-root.cjs');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'assets/sustainers.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'assets/component-notes.js'), 'utf8'), context);
const { options, resolve } = context.SustainerCatalog;
const selection = (overrides = {}) => ({ width: 'L', depth: '3', height: '1F', interior: 'empty', roof: 'whole', ...overrides });

test('all supported configurations contain only existing sustainer STL files', resourceOptions, () => {
  let sizes = 0;
  let configurations = 0;
  for (const width of ['S', 'M', 'L', 'XL']) {
    for (const depth of options(width).depths) {
      for (const height of options(width, depth).heights) {
        sizes++;
        const available = options(width, depth, height);
        for (const interior of available.interiors) {
          for (const roof of available.roofs) {
            const result = resolve({ width, depth, height, interior, roof });
            const parts = [...result.structure, ...result.mechanism, ...result.interiorParts];
            assert.equal(new Set(parts.map(part => part.path)).size, parts.length);
            for (const part of parts) {
              assert.ok(part.path.startsWith('02. SUSTAINERS/'), part.path);
              assert.ok(fs.statSync(path.join(resourceRoot, part.path)).isFile(), part.path);
              assert.ok(fs.readdirSync(path.dirname(path.join(resourceRoot, part.path))).includes(path.basename(part.path)), part.path);
              for (const lang of ['en', 'zh']) assert.ok(context.SustainerNotes[lang].role[part.role], `${lang}: ${part.role}`);
              assert.ok(!/Runner|Rails/.test(part.path), part.path);
            }
            assert.equal(result.structure.filter(part => part.role === 'module').length, 1);
            assert.equal(result.structure.filter(part => part.role === 'facade').length, 1);
            configurations++;
          }
        }
      }
    }
  }
  assert.equal(sizes, 50);
  assert.equal(configurations, 238);
});

test('XL restricts height; unsupported interiors and split lids are rejected', () => {
  assert.deepEqual(Array.from(options('XL', '3', '4F').heights), ['1F']);
  assert.throws(() => resolve(selection({ width: 'XL', height: '4F' })));
  assert.throws(() => resolve(selection({ width: 'S', interior: 'sealed' })));
  assert.throws(() => resolve(selection({ roof: 'split' })));
  assert.throws(() => resolve(selection({ depth: '8' })));
});

test('L4F uses its exact facade filename and tall locks, hinges and dividers', () => {
  const result = resolve(selection({ height: '4F', interior: 'dividers' }));
  assert.ok(result.structure.some(part => part.path.endsWith("L4F' Facade.stl")));
  assert.ok(result.mechanism.some(part => part.path.endsWith('L 2-4F Hinge.stl')));
  assert.ok(result.mechanism.some(part => part.path.endsWith('LOCK OUTER PART 2-4F.stl')));
  assert.ok(result.interiorParts.some(part => part.path.endsWith('L3-4F Depth Divider.stl')));
  assert.ok(result.interiorParts.some(part => part.path.endsWith('L-4F Width Divider.stl')));
});

test('M files preserve trailing spaces and lowercase facade naming', () => {
  const result = resolve(selection({ width: 'M', height: '4F' }));
  assert.ok(result.structure.some(part => part.path.endsWith('M3 4F Module .stl')));
  assert.ok(result.structure.some(part => part.path.endsWith('M4f Facade.stl')));
});

test('XL7 Gridfinity with a split lid lists both lid halves, connector and baseplate halves', () => {
  const result = resolve(selection({ width: 'XL', depth: '7', interior: 'gridfinity', roof: 'split' }));
  assert.equal(result.structure.filter(part => part.role === 'roof').length, 2);
  assert.equal(result.structure.filter(part => part.role === 'roofConnector').length, 1);
  assert.equal(result.interiorParts.length, 2);
  assert.ok(result.structure.some(part => part.path.endsWith('XL7 1F Flat Module.stl')));
  assert.ok(!result.structure.some(part => part.path.includes('Whole')));
});

test('sealed modules use seal dividers and no ordinary dividers or baseplates', () => {
  for (const width of ['L', 'XL']) {
    const result = resolve(selection({ width, interior: 'sealed' }));
    assert.ok(result.structure.some(part => part.path.includes('Sealed Module')));
    assert.ok(result.interiorParts.every(part => part.path.includes('Seal Divider')));
    assert.equal(result.interiorParts.length, width === 'L' ? 1 : 2);
    assert.ok(result.interiorParts.every(part => part.qty === null));
  }
});

test('paired STL files are printed once and lock pin sets twice', () => {
  for (const width of ['S', 'M', 'L', 'XL']) {
    const { mechanism } = resolve(selection({ width }));
    for (const role of ['rods', 'bottomHinge', 'topHinge']) assert.equal(mechanism.find(part => part.role === role).qty, 1);
    assert.equal(mechanism.find(part => part.role === 'bottomHinge').unit, 'pair');
    assert.equal(mechanism.find(part => part.role === 'rods').unit, 'pair');
    assert.equal(mechanism.find(part => part.role === 'topHinge').unit, ['S', 'M'].includes(width) ? 'piece' : 'pair');
    assert.equal(mechanism.find(part => part.role === 'lockPins').qty, 2);
  }
});

test('hardware matches the original manual reference', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(resolve(selection()).hardware)), [
    { size: 'M4 × 10 mm', qty: 8 }, { size: 'M4 × 14 mm', qty: 16 }, { size: 'M4 × 20 mm', qty: 7 }
  ]);
});
