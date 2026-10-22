const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
require('../assets/modification-files.js');
require('../assets/modifications.js');
const catalog = globalThis.ModificationCatalog;
const { root, options: resourceOptions } = require('./resource-root.cjs');

function stls(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? stls(file) : entry.name.endsWith('.stl') ? [path.relative(root, file).split(path.sep).join('/')] : [];
  });
}

test('all 98 modification STL files are reachable with their exact original paths', resourceOptions, () => {
  const actual = stls(path.join(root, '03. MODIFICATIONS')).sort();
  const listed = catalog.filter().map(part => part.path).sort();
  assert.equal(listed.length, 98);
  assert.deepEqual(listed, actual);
  assert.equal(new Set(listed).size, listed.length);
  for (const part of catalog.parts) {
    assert.ok(fs.readdirSync(path.dirname(path.join(root, part.path))).includes(part.name));
    assert.equal(decodeURI(encodeURI(part.path)), part.path);
    for (const lang of ['en', 'zh']) {
      assert.ok(catalog.categories[part.category][lang]);
      assert.equal(catalog.text[lang].roles[part.role].length, 2);
      assert.ok(catalog.text[lang].roles[part.role].every(Boolean));
      assert.ok(catalog.text[lang].categoryNotes[part.category]);
    }
  }
});

test('base filters preserve the connector and distinguish whole and split alternatives', () => {
  const parts = catalog.filter({ category: 'base', width: 'S', depth: '6' });
  assert.equal(parts.length, 4);
  assert.equal(parts.filter(p => p.role === 'baseSplit').length, 2);
  assert.equal(parts.filter(p => p.role === 'baseWhole').length, 1);
  assert.equal(parts.filter(p => p.role === 'baseConnector').length, 1);
  assert.ok(parts.every(p => !p.width || p.width === 'S'));
  assert.equal(catalog.filter({ category: 'base', width: 'XL', depth: '3' }).length, 2);
});

test('height-specific mounts do not invent XL 2F or 4F files', () => {
  const pegs = catalog.filter({ category: 'pegboard', width: 'XL' });
  assert.equal(pegs.length, 2);
  assert.ok(pegs.every(p => p.height === '1F'));
  assert.deepEqual(new Set(pegs.map(p => p.role)), new Set(['pegIkea', 'pegUssa']));
  assert.equal(catalog.filter({ category: 'pegboard', width: 'XL', height: '2F' }).length, 0);
  const mounts = catalog.filter({ category: 'wall', width: 'L', height: '4F' });
  assert.equal(mounts.length, 2);
  assert.ok(mounts.some(p => p.role === 'wallSecond'));
  assert.ok(mounts.some(p => p.width === 'L' && p.height === '4F'));
});

test('shared wheel files remain visible and have the correct roles', () => {
  const wheels = catalog.filter({ category: 'wheels', width: 'XL', depth: '7', height: '1F' });
  assert.equal(wheels.length, 5);
  assert.equal(wheels.find(p => p.role === 'tyre').name, 'Tyre (TPU).stl');
  assert.equal(wheels.find(p => p.role === 'wheelJig').name, 'Jig.stl');
  assert.equal(catalog.filter({ category: 'backbone', width: 'S' }).filter(p => p.role === 'lockPart').length, 1);
});

test('category sources refer to pages in the appropriate supplied manual', () => {
  for (const category of Object.values(catalog.categories)) {
    assert.ok(['04', '05'].includes(category.manual));
    assert.ok(category.page >= 1 && category.page <= (category.manual === '04' ? 17 : 12));
  }
  assert.equal(catalog.categories.wall.manual, '05');
});
