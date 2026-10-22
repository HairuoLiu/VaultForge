const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
require('../assets/drawer-files.js');
require('../assets/drawers.js');
require('../assets/component-notes.js');
const { root, options: resourceOptions } = require('./resource-root.cjs');

test('all runner depths use singular filenames and the dedicated XL subfolder', () => {
  for (const width of ['S', 'M', 'L', 'XL']) for (const depth of ['3', '4', '5', '6', '7']) {
    const parts = DrawerCatalog.resolve({ width, depth, height: '1F' }).structure;
    const directory = '01. DRAWERS/07. Universal/Runners/' + (width === 'XL' ? 'XL Runners/' : '');
    for (const [role, name] of [['guides', 'Guide'], ['slides', 'Slide']]) {
      const part = parts.find(part => part.role === role);
      assert.equal(part.path, `${directory}x${depth} Runner ${name}${width === 'XL' ? ' XL' : ''}.stl`);
      assert.equal(part.qty, 2);
    }
  }
});

test('all 50 drawer configurations resolve exact existing filenames with bilingual roles', resourceOptions, () => {
  let count = 0;
  for (const width of ['S', 'M', 'L', 'XL']) for (const depth of ['3', '4', '5', '6', '7']) for (const height of DrawerCatalog.heights(width)) {
    const result = DrawerCatalog.resolve({ width, depth, height });
    for (const part of [...result.structure, ...result.mechanism, ...result.keys, ...result.roofs]) {
      assert.ok(fs.existsSync(path.join(root, part.path)), part.path);
      assert.ok(fs.readdirSync(path.dirname(path.join(root, part.path))).includes(path.basename(part.path)), part.path);
      if (!result.roofs.includes(part)) for (const lang of ['en', 'zh']) assert.ok(ComponentNotes[lang].role[part.role]);
    }
    count++;
  }
  assert.equal(count, 50);
});

test('XL height, separate back panels and split boxes follow the supplied archive', () => {
  assert.throws(() => DrawerCatalog.resolve({ width: 'XL', depth: '3', height: '2F' }));
  const small = DrawerCatalog.resolve({ width: 'XL', depth: '3', height: '1F' });
  assert.equal(small.structure.filter(p => p.role === 'backPanel').length, 1);
  assert.ok(small.structure.some(p => p.path.endsWith('/XL Facade 1F.stl')));
  const large = DrawerCatalog.resolve({ width: 'XL', depth: '7', height: '1F' });
  assert.equal(large.structure.filter(p => p.role === 'splitBox').length, 2);
  assert.equal(large.structure.filter(p => p.role === 'backPanel').length, 0);
});

test('case and original misspellings are retained, with no invented Key Lock file', () => {
  const small = DrawerCatalog.resolve({ width: 'S', depth: '3', height: '4F' });
  assert.ok(small.structure[0].path.endsWith('Module 4f.stl'));
  assert.ok(!small.mechanism.some(p => p.path.endsWith('/Key Lock.stl')));
  const large = DrawerCatalog.resolve({ width: 'L', depth: '7', height: '2F' });
  assert.ok(large.roofs.some(p => p.path.endsWith('Heawyweight Roof.stl')));
  assert.equal(large.bolts, 6);
});
