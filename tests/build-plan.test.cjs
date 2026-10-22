const test = require('node:test');
const assert = require('node:assert/strict');
require('../assets/drawer-files.js');
require('../assets/drawers.js');
require('../assets/sustainers.js');
const plan = require('../assets/build-plan.js');
const state = require('../assets/workspace-state.js');
const drawer = (overrides = {}) => ({ width: 'S', depth: '3', height: '1F', key: 'standard', drawerRoof: 'none', topHandle: false, gearedRails: true, ...overrides });
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

test('the S3 Grid roof handle option includes its STL and both mounting bolts', () => {
  const configuration = drawer({ drawerRoof: 'grid', topHandle: true });
  const result = plan.resolve('drawers', configuration);
  const handle = result.parts.find(part => part.role === 'topHandle');
  assert.deepEqual(handle, { path: '01. DRAWERS/07. Universal/Top Handle (Turn On Supports).stl', qty: 1, role: 'topHandle' });
  assert.ok(DrawerFiles.includes(handle.path));
  assert.ok(result.parts.some(part => part.path === '01. DRAWERS/01. S Families/S3/Roofs/S3 Grid Roof.stl' && part.qty === 1));
  assert.deepEqual(result.hardware, [
    { size: 'M4 × 14 mm', qty: 4, role: 'drawerFacade', sourceManual: '01', sourcePage: 18 },
    { size: 'M6 × 50 mm', qty: 2, role: 'topHandle', sourceManual: '01', sourcePage: 18 }
  ]);
  for (const topHandle of [false, undefined]) {
    const withoutHandle = plan.resolve('drawers', { ...configuration, topHandle });
    assert.ok(!withoutHandle.parts.some(part => part.role === 'topHandle'));
    assert.ok(!withoutHandle.hardware.some(part => part.size.startsWith('M6')));
  }
});

test('handle quantities follow selected batches in merged files, hardware and CSV', () => {
  const entries = [
    build('drawers', drawer({ drawerRoof: 'grid', topHandle: true }), { count: 3 }),
    build('drawers', drawer({ drawerRoof: 'grid', height: '2F' }), { id: 'without-handle', count: 2 })
  ];
  const result = plan.summarize(entries);
  assert.equal(result.files.find(part => part.path.endsWith('/Top Handle (Turn On Supports).stl')).qty, 3);
  assert.deepEqual(result.hardware, [{ size: 'M4 × 14 mm', qty: 24 }, { size: 'M6 × 50 mm', qty: 6 }]);
  const output = plan.csv(entries);
  assert.ok(output.includes('"hardware","M6 × 50 mm","6","pieces"'));
  assert.ok(output.includes('"stl","01. DRAWERS/07. Universal/Top Handle (Turn On Supports).stl","3","STL copies"'));
  assert.ok(!plan.csv([entries[1]]).includes('M6 × 50 mm'));
});

test('changing roof clears the handle and incompatible explicit plans are rejected', () => {
  for (const drawerRoof of ['none', 'table', 'bowl', 'mount', 'heavyweight']) {
    const raw = drawer({ width: 'L', drawerRoof, topHandle: true });
    const normalized = plan.normalizeConfiguration('drawers', raw);
    assert.equal(normalized.topHandle, false, drawerRoof);
    assert.ok(!plan.resolve('drawers', normalized).parts.some(part => part.role === 'topHandle'));
    assert.throws(() => plan.resolve('drawers', raw), /Grid roof/);
    assert.throws(() => build('drawers', raw), /Unsupported saved configuration/);
  }
  for (const topHandle of ['true', 1, null]) {
    assert.throws(() => plan.resolve('drawers', drawer({ drawerRoof: 'grid', topHandle })));
    assert.throws(() => build('drawers', drawer({ drawerRoof: 'grid', topHandle })));
  }
});

test('existing saved drawer plans without a handle field retain their counts and progress', () => {
  const configuration = drawer({ drawerRoof: 'grid', key: 'hidden' });
  delete configuration.topHandle;
  delete configuration.gearedRails;
  const legacy = { id: 'legacy-grid', system: 'drawers', configuration, name: '原有工具抽屉', count: 3, status: 'printed', layout: {} };
  const restored = state.createStore(() => ({ getItem: () => JSON.stringify({ version: 1, configurations: { drawers: configuration }, builds: [legacy] }), setItem() {} }));
  assert.equal(restored.recovered, false);
  assert.equal(restored.value.configurations.drawers.topHandle, false);
  assert.equal(restored.value.configurations.drawers.gearedRails, true);
  assert.equal(restored.value.builds.length, 1);
  assert.deepEqual(restored.value.builds[0], { ...legacy, configuration: { ...configuration, topHandle: false, gearedRails: true } });
  assert.equal(plan.resolve('drawers', restored.value.builds[0].configuration).parts.find(part => part.role === 'rails').qty, 2);
  assert.deepEqual(plan.summarize(restored.value.builds).hardware, [{ size: 'M4 × 14 mm', qty: 12 }]);
});

test('opting out of geared lock rails keeps both required runner types and all hardware', () => {
  const configuration = drawer({ drawerRoof: 'grid', topHandle: true });
  const standard = plan.resolve('drawers', configuration);
  const simplified = plan.resolve('drawers', { ...configuration, gearedRails: false });
  assert.equal(standard.parts.find(part => part.role === 'rails').qty, 2);
  assert.deepEqual(simplified.parts, standard.parts.filter(part => part.role !== 'rails'));
  assert.deepEqual(simplified.hardware, standard.hardware);
  for (const role of ['guides', 'slides']) assert.equal(simplified.parts.find(part => part.role === role).qty, 2);
  const chosen = build('drawers', { ...configuration, gearedRails: false }, { count: 3 });
  assert.equal(chosen.configuration.gearedRails, false);
  assert.ok(!plan.csv([chosen]).includes('/Geared Rails/'));
  assert.equal(plan.summarize([chosen]).files.find(part => part.path.endsWith('/x3 Runner Guide.stl')).qty, 6);
});

test('geared rails default to the existing build and malformed saved choices are rejected', () => {
  const legacy = drawer({ drawerRoof: 'grid', topHandle: true });
  delete legacy.gearedRails;
  assert.equal(plan.normalizeConfiguration('drawers', legacy).gearedRails, true);
  assert.equal(build('drawers', legacy).configuration.gearedRails, true);
  assert.equal(plan.resolve('drawers', legacy).parts.find(part => part.role === 'rails').qty, 2);
  for (const gearedRails of ['false', 'true', 0, 1, null]) {
    const invalid = { ...legacy, gearedRails };
    assert.throws(() => plan.resolve('drawers', invalid), /geared lock rails/);
    assert.throws(() => build('drawers', invalid), /Unsupported saved configuration/);
  }
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
