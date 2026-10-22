const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
require('../assets/drawer-files.js');
require('../assets/drawers.js');
require('../assets/drawer-accessories.js');
const { root, options: resourceOptions } = require('./resource-root.cjs');

function configurations() {
  const result = [];
  for (const width of ['S', 'M', 'L', 'XL']) for (const depth of ['3', '4', '5', '6', '7']) {
    for (const height of DrawerCatalog.heights(width)) result.push({ width, depth, height });
  }
  return result;
}
const allItems = groups => groups.flatMap(group => group.items);

test('accessory discovery accounts for all 172 files absent from the core drawer catalog', () => {
  const core = new Set();
  const accessories = new Set();
  for (const configuration of configurations()) {
    for (const group of Object.values(DrawerCatalog.resolve(configuration))) {
      if (Array.isArray(group)) for (const part of group) core.add(part.path);
    }
    for (const drawerRoof of ['none', 'grid', 'heavyweight']) {
      for (const part of allItems(DrawerAccessories.resolve({ ...configuration, drawerRoof }))) accessories.add(part.path);
    }
  }
  assert.equal(core.size, 238);
  assert.equal(accessories.size, 172);
  assert.ok([...accessories].every(file => !core.has(file)));
  assert.deepEqual([...new Set([...core, ...accessories])].sort(), [...DrawerFiles].sort());
});

test('accessory links preserve exact archive names and only the verified handle has a fixed quantity', resourceOptions, () => {
  for (const configuration of configurations()) for (const drawerRoof of ['grid', 'heavyweight']) {
    const groups = DrawerAccessories.resolve({ ...configuration, drawerRoof });
    const paths = allItems(groups).map(part => part.path);
    assert.equal(paths.length, new Set(paths).size);
    for (const group of groups) {
      assert.ok(['interior', 'roof', 'general'].includes(group.placement));
      for (const lang of ['zh', 'en']) assert.ok(group.title[lang] && group.note[lang]);
      for (const part of group.items) {
        assert.ok(fs.readdirSync(path.dirname(path.join(root, part.path))).includes(path.basename(part.path)), part.path);
        assert.equal(part.qty, part.role === 'topHandle' ? 1 : null);
        for (const lang of ['zh', 'en']) assert.ok(part.label[lang] && part.note[lang]);
      }
    }
  }
});

test('the Grid handle offers a selectable option and reflects its configured state', () => {
  const configuration = { width: 'S', depth: '3', height: '1F', drawerRoof: 'grid' };
  const handle = DrawerAccessories.resolve(configuration).find(group => group.id === 'drawer-top-handle');
  assert.deepEqual(handle.select, { topHandle: true });
  assert.equal(handle.selected, false);
  assert.equal(handle.items[0].qty, 1);
  const selected = DrawerAccessories.resolve({ ...configuration, topHandle: true }).find(group => group.id === handle.id);
  assert.equal(selected.selected, true);
  for (const drawerRoof of ['none', 'table', 'bowl', 'mount']) {
    assert.ok(!DrawerAccessories.resolve({ ...configuration, drawerRoof }).some(group => group.id === handle.id));
  }
});

test('baseplates follow exact width and depth, including the split XL6 and XL7 plates', () => {
  const baseplates = configuration => DrawerAccessories.resolve(configuration).find(group => group.id === 'drawer-baseplates').items;
  assert.equal(baseplates({ width: 'S', depth: '3', height: '1F' }).length, 3);
  assert.equal(baseplates({ width: 'M', depth: '4', height: '2F' }).length, 2);
  assert.equal(baseplates({ width: 'L', depth: '5', height: '4F' }).length, 1);
  assert.deepEqual(baseplates({ width: 'XL', depth: '7', height: '1F' }).map(part => path.basename(part.path)), ['XL7 Baseplate Part 1.stl', 'XL7 Baseplate Part 2.stl']);
});

test('divider height and full-span labels follow the supplied hole-count diagrams', () => {
  const small = DrawerAccessories.resolve({ width: 'S', depth: '3', height: '1F' });
  assert.ok(!small.some(group => group.id === 'drawer-dividers-2f'));
  const smallDividers = small.find(group => group.id === 'drawer-dividers-1f').items.filter(part => part.role === 'gridDivider');
  assert.deepEqual(smallDividers.map(part => parseInt(path.basename(part.path), 10)), [5, 6, 7, 8, 9, 10]);
  assert.match(smallDividers.at(-1).label.en, /Full width \/ depth/);
  const medium = DrawerAccessories.resolve({ width: 'M', depth: '7', height: '2F' });
  const dividers = medium.find(group => group.id === 'drawer-dividers-2f').items;
  assert.match(dividers.find(part => part.path.endsWith('/18-M, x5.stl')).label.en, /Full width$/);
  assert.match(dividers.find(part => part.path.endsWith('/26-L, x7.stl')).label.en, /Full depth$/);
  assert.ok(dividers.every(part => !/\/(27|28|29|30|31|32-XL)\.stl$/.test(part.path)));
});

test('unmatched tall XL dividers remain clearly separated as reference-only files', () => {
  assert.equal(DrawerAccessories.unmatched.length, 6);
  for (const configuration of configurations()) {
    const groups = DrawerAccessories.resolve(configuration);
    const reference = groups.find(group => group.id === 'archive-other-sizes');
    assert.equal(Boolean(reference), configuration.width === 'XL');
    if (reference) {
      assert.equal(reference.warning, true);
      assert.equal(reference.items.length, 6);
    }
    const recommended = allItems(groups.filter(group => !group.warning));
    assert.ok(recommended.every(part => !DrawerAccessories.unmatched.some(other => other.path === part.path)));
  }
});

test('roof accessories are conditional, and alternate modules cannot be mistaken for ordinary parts', () => {
  const configuration = { width: 'XL', depth: '6', height: '1F' };
  assert.ok(!DrawerAccessories.resolve({ ...configuration, drawerRoof: 'none' }).some(group => group.placement === 'roof'));
  const grid = DrawerAccessories.resolve({ ...configuration, drawerRoof: 'grid' });
  assert.equal(grid.find(group => group.placement === 'roof').items.length, 1);
  const heavy = DrawerAccessories.resolve({ ...configuration, drawerRoof: 'heavyweight' });
  assert.ok(heavy.find(group => group.placement === 'roof').items.some(part => part.path.endsWith('XL6 Heavyweight Roof Cut.stl')));
  assert.equal(heavy.find(group => group.id === 'drawer-alternate-modules').warning, true);
  const regularL = DrawerAccessories.resolve({ width: 'L', depth: '4', height: '2F' });
  assert.equal(regularL.find(group => group.id === 'drawer-alternate-modules').items.length, 3);
  assert.throws(() => DrawerAccessories.resolve({ width: 'XL', depth: '4', height: '2F' }));
});
