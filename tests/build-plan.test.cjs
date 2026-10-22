const test = require('node:test');
const assert = require('node:assert/strict');
require('../assets/drawer-files.js');
require('../assets/drawers.js');
require('../assets/sustainers.js');
const plan = require('../assets/build-plan.js');
const state = require('../assets/workspace-state.js');
const drawer = (overrides = {}) => ({ width: 'S', depth: '3', height: '1F', key: 'standard', drawerRoof: 'none', ...overrides });
const sustainer = (overrides = {}) => ({ width: 'XL', depth: '7', height: '1F', interior: 'gridfinity', roof: 'split', ...overrides });
const build = (system, configuration, overrides = {}) => plan.entry({ id: 'example', system, configuration, count: 1, ...overrides });

test('drawer choices exclude unused keys and roofs while retaining both hidden-key files', () => {
  const standard = plan.resolve('drawers', drawer());
  assert.equal(standard.parts.filter(part => /Key \(/.test(part.path)).length, 1);
  assert.ok(!standard.parts.some(part => part.path.includes('Hidden Key') || part.path.includes('/Roofs/')));
  const hidden = plan.resolve('drawers', drawer({ key: 'hidden', drawerRoof: 'grid' }));
  assert.equal(hidden.parts.filter(part => part.path.includes('Hidden Key')).length, 2);
  assert.equal(hidden.parts.filter(part => part.path.includes('/Roofs/')).length, 1);
  assert.ok(!hidden.parts.some(part => part.role === 'standardKey'));
  assert.throws(() => plan.resolve('drawers', drawer({ drawerRoof: 'heavyweight' })));
});

test('multiple batches merge exact paths and sum hardware, including completed batches', () => {
  const entries = [build('drawers', drawer(), { count: 3 }), build('drawers', drawer({ height: '2F', key: 'hidden' }), { id: 'tall', count: 2, status: 'assembled' })];
  const result = plan.summarize(entries);
  assert.equal(result.files.find(file => file.path.endsWith('/Springs.stl')).qty, 10);
  assert.equal(result.files.find(file => file.path.endsWith('/Key (Turn On Supports).stl')).qty, 3);
  assert.equal(result.files.find(file => file.path.endsWith('/Hidden Key (Turn On Supports).stl')).qty, 2);
  assert.deepEqual(result.hardware, [{ size: 'M4 × 14 mm', qty: 24 }]);
});

test('paired hinges, split lids, baseplate halves and pin sets retain STL-copy semantics', () => {
  const chosen = build('sustainers', sustainer(), { count: 3 });
  const result = plan.summarize([chosen]);
  const parts = plan.resolve('sustainers', chosen.configuration).parts;
  for (const part of parts.filter(part => part.unit === 'pair' || ['roof', 'roofConnector', 'baseplate'].includes(part.role))) {
    assert.equal(result.files.find(file => file.path === part.path).qty, 3, part.path);
  }
  assert.equal(result.files.find(file => file.path.includes('1 SET OF PINS')).qty, 6);
});

test('unknown layout quantities block CSV; explicit zero omits unused divider files', () => {
  const chosen = build('sustainers', sustainer({ interior: 'dividers' }), { count: 2 });
  const paths = Object.keys(chosen.layout);
  assert.equal(paths.length, 2);
  assert.equal(plan.summarize([chosen]).unresolved, 2);
  assert.throws(() => plan.csv([chosen]), /layout/);
  chosen.layout[paths[0]] = 3;
  chosen.layout[paths[1]] = 0;
  const result = plan.summarize([chosen]);
  assert.equal(result.unresolved, 0);
  assert.equal(result.files.find(file => file.path === paths[0]).qty, 6);
  assert.ok(!result.files.some(file => file.path === paths[1]));
  assert.match(plan.csv([chosen]), /STL copies/);
});

test('known contributions do not hide unresolved quantities for the same file', () => {
  const first = build('sustainers', sustainer({ interior: 'sealed' }));
  const second = build('sustainers', sustainer({ interior: 'sealed' }), { id: 'second', count: 2 });
  const path = Object.keys(first.layout)[0];
  first.layout[path] = 4;
  const file = plan.summarize([first, second]).files.find(file => file.path === path);
  assert.equal(file.qty, 4);
  assert.equal(file.unresolved, 1);
  assert.throws(() => plan.csv([first, second]));
});

test('CSV quotes names and paths, preserves Chinese and neutralizes spreadsheet formulas', () => {
  const output = plan.csv([build('drawers', drawer(), { name: '=SUM(1,2) "抽屉"\n第二行' })]);
  assert.ok(output.startsWith('\ufeff'));
  assert.ok(output.includes('"\'=SUM(1,2) ""抽屉""\n第二行"'));
  assert.ok(output.endsWith('\r\n'));
});

test('invalid batch counts and incompatible saved plans are rejected rather than changed', () => {
  for (const count of [0, -1, 1.5, 1000, NaN, Infinity, '3']) assert.throws(() => build('drawers', drawer(), { count }));
  assert.throws(() => build('drawers', drawer({ width: 'XL', height: '4F' })));
  assert.throws(() => build('sustainers', sustainer({ width: 'S', interior: 'sealed' })));
});

test('workspace restores both systems, language, tab, manual, filters and named progress', () => {
  let disk;
  const storage = { getItem: () => disk, setItem: (_, value) => { disk = value; } };
  const first = state.createStore(() => storage);
  const configurations = { drawers: drawer({ key: 'hidden', drawerRoof: 'bowl' }), sustainers: sustainer() };
  const builds = [build('drawers', configurations.drawers, { name: '工具抽屉', count: 3, status: 'printed' })];
  assert.ok(first.save({ language: 'zh', system: 'sustainers', tab: 'plan', manual: '03', manualPage: 6, configurations, modifications: { category: 'wheels', width: 'XL' }, builds }));
  const restored = state.createStore(() => storage);
  assert.equal(restored.value.language, 'zh');
  assert.equal(restored.value.system, 'sustainers');
  assert.equal(restored.value.tab, 'plan');
  assert.equal(restored.value.manualPage, 6);
  assert.equal(restored.value.modifications.category, 'wheels');
  assert.deepEqual(restored.value.configurations, configurations);
  assert.deepEqual(restored.value.builds, builds);
});

test('unavailable storage keeps changes usable in memory; corrupt data starts safely', () => {
  const denied = state.createStore(() => { throw new Error('Storage disabled'); });
  assert.equal(denied.available, false);
  assert.equal(denied.save({ language: 'zh' }), false);
  assert.equal(denied.value.language, 'zh');
  const corrupt = state.createStore(() => ({ getItem: () => '{broken', setItem() {} }));
  assert.equal(corrupt.recovered, true);
  assert.equal(corrupt.value.tab, 'finder');
  assert.ok(corrupt.save({ language: 'zh' }));
  const valid = build('drawers', drawer());
  const value = state.normalize({ version: 1, builds: [valid, { ...valid, id: 'bad', count: -2 }, valid], configurations: { drawers: { width: 'XL', height: '4F', drawerRoof: 'invalid' } } });
  assert.equal(value.builds.length, 1);
  assert.equal(value.configurations.drawers.height, '1F');
  assert.equal(value.configurations.drawers.drawerRoof, 'none');
});
