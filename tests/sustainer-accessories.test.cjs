const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { root: resourceRoot, options: resourceOptions } = require('./resource-root.cjs');
const context = vm.createContext({});
for (const name of ['sustainers', 'sustainer-accessories']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/' + name + '.js'), 'utf8'), context);
}
const { SustainerCatalog: catalog, SustainerAccessories: accessories } = context;
const selection = overrides => ({ width: 'L', depth: '3', height: '1F', interior: 'empty', roof: 'whole', ...overrides });
const plain = value => JSON.parse(JSON.stringify(value));

function configurations() {
  const values = [];
  for (const width of ['S', 'M', 'L', 'XL']) {
    for (const depth of catalog.options(width).depths) {
      for (const height of catalog.options(width, depth).heights) {
        const allowed = catalog.options(width, depth, height);
        for (const interior of allowed.interiors) {
          for (const roof of allowed.roofs) values.push({ width, depth, height, interior, roof });
        }
      }
    }
  }
  return values;
}

test('all sustainer accessory plans use supported configurations and bilingual annotations', () => {
  for (const current of configurations()) {
    const groups = accessories.resolve(current);
    assert.equal(new Set(groups.map(group => group.id)).size, groups.length);
    for (const group of groups) {
      assert.ok(['roof', 'interior', 'general'].includes(group.placement));
      for (const language of ['zh', 'en']) {
        assert.ok(group.title[language]);
        assert.ok(group.note[language]);
        for (const item of group.items) {
          assert.ok(item.label[language], item.path);
          assert.ok(item.note[language], item.path);
        }
      }
      assert.equal(new Set(group.items.map(item => item.path)).size, group.items.length);
      if (group.select) {
        const next = catalog.resolve({ ...current, ...group.select });
        const expected = [...next.structure, ...next.mechanism, ...next.interiorParts];
        for (const item of group.items) assert.ok(expected.some(part => part.path === item.path), item.path);
        assert.equal(group.selected, Object.entries(group.select).every(([key, value]) => current[key] === value));
      }
    }
  }
});

test('discovery preserves the selected bill of materials and unset divider quantities', () => {
  const current = selection({ width: 'L', depth: '6', height: '4F' });
  const before = plain(catalog.resolve(current));
  const groups = accessories.resolve(current);
  assert.deepEqual(plain(catalog.resolve(current)), before);
  assert.equal(current.interior, 'empty');
  assert.equal(current.roof, 'whole');
  assert.equal(groups.find(group => group.id === 'dividers').selected, false);
  assert.ok(groups.filter(group => ['dividers', 'sealed'].includes(group.id)).every(group => group.items.every(item => item.qty === null)));
  assert.ok(groups.find(group => group.id === 'dividers').note.en.includes('Dividers module'));
  assert.ok(groups.find(group => group.id === 'sealed').note.en.includes('Sealed module'));
});

test('XL7 offers both Gridfinity halves and all split-lid parts, but no unverified facade', () => {
  const groups = accessories.resolve(selection({ width: 'XL', depth: '7' }));
  const baseplates = groups.find(group => group.id === 'gridfinity').items;
  assert.equal(baseplates.length, 2);
  assert.ok(baseplates.some(item => item.path.endsWith('XL7 Part 1  Gridfinity Baseplate.stl')));
  assert.ok(baseplates.some(item => item.path.endsWith('XL7 Part 2  Gridfinity Baseplate.stl')));
  const lid = groups.find(group => group.id === 'split-roof');
  assert.deepEqual(plain(lid.select), { roof: 'split' });
  assert.equal(lid.items.filter(item => item.role === 'roof').length, 2);
  assert.equal(lid.items.filter(item => item.role === 'roofConnector').length, 1);
  assert.ok(groups.find(group => group.id === 'sealed').items.some(item => item.role === 'centerSealDivider'));
  assert.ok(!groups.some(group => group.id === 'facade-verify'));
});

test('narrow modules do not advertise sealed interiors or unsupported split lids', () => {
  for (const width of ['S', 'M']) {
    const groups = accessories.resolve(selection({ width, height: '4F' }));
    assert.ok(!groups.some(group => group.id === 'sealed' || group.id === 'split-roof'));
    const dividers = groups.find(group => group.id === 'dividers');
    assert.equal(dividers.items.length, 1);
    assert.ok(dividers.items[0].path.endsWith(width + '4F Divider.stl'));
  }
  assert.throws(() => accessories.resolve(selection({ width: 'XL', height: '4F' })));
  assert.throws(() => accessories.resolve(selection({ depth: '8' })));
});

test('alternate facades require verification and never offer one-click substitution', () => {
  const found = new Set();
  for (const current of configurations()) {
    const group = accessories.resolve(current).find(value => value.id === 'facade-verify');
    if (!group) continue;
    assert.equal(group.requiresVerification, true);
    assert.equal(group.select, undefined);
    assert.equal(group.selected, false);
    assert.equal(group.items.length, 1);
    assert.equal(group.items[0].qty, null);
    assert.equal(group.items[0].path, '02. SUSTAINERS/05. Universal/Facades/' + current.width + current.height + '.stl');
    assert.ok(!catalog.resolve(current).structure.some(part => part.path === group.items[0].path));
    found.add(group.items[0].path);
  }
  assert.equal(found.size, 9);
});

test('catalog plus accessory discovery exposes every original sustainer STL with exact path casing', resourceOptions, () => {
  const covered = new Set();
  for (const current of configurations()) {
    const result = catalog.resolve(current);
    [...result.structure, ...result.mechanism, ...result.interiorParts].forEach(item => covered.add(item.path));
    accessories.resolve(current).forEach(group => group.items.forEach(item => covered.add(item.path)));
  }
  const directory = path.join(resourceRoot, '02. SUSTAINERS');
  const actual = fs.readdirSync(directory, { recursive: true }).filter(file => /\.stl$/i.test(file)).map(file => '02. SUSTAINERS/' + file.split(path.sep).join('/'));
  assert.deepEqual([...covered].sort(), actual.sort());
  assert.equal(covered.size, 225);
  for (const file of covered) {
    const absolute = path.join(resourceRoot, file);
    assert.ok(fs.statSync(absolute).isFile(), file);
    assert.ok(fs.readdirSync(path.dirname(absolute)).includes(path.basename(absolute)), file);
  }
});
