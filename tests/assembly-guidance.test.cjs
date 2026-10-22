const test = require('node:test');
const assert = require('node:assert/strict');
require('../assets/sustainers.js');
const guidance = require('../assets/assembly-guidance.js');

const totals = rows => rows.reduce((values, row) => {
  values[row.size] = (values[row.size] || 0) + row.qty;
  return values;
}, {});

test('sustainer installation hardware totals agree with every supported bill of materials', () => {
  let checked = 0;
  for (const width of ['S', 'M', 'L', 'XL']) {
    for (const depth of SustainerCatalog.options(width).depths) {
      for (const height of SustainerCatalog.options(width, depth).heights) {
        const options = SustainerCatalog.options(width, depth, height);
        for (const interior of options.interiors) {
          for (const roof of options.roofs) {
            const config = { width, depth, height, interior, roof };
            const reference = guidance.forBuild('sustainers', config);
            assert.deepEqual(totals(reference.hardware), totals(SustainerCatalog.resolve(config).hardware));
            assert.equal(reference.hardware.filter(part => part.size === 'M4 × 14 mm').length, 2);
            assert.equal(reference.steps.some(step => step.id === 'split-lid'), roof === 'split');
            assert.equal(reference.warnings.length > 0, roof === 'split');
            assert.equal(reference.steps.some(step => step.id === 'dividers'), ['dividers', 'sealed'].includes(interior));
            checked++;
          }
        }
      }
    }
  }
  assert.equal(checked, 238);
});

test('only an explicitly selected grid-roof handle adds its installation and two bolts', () => {
  for (const drawerRoof of ['none', 'grid', 'bowl', 'mount', 'heavyweight']) {
    for (const topHandle of [undefined, false, true]) {
      const reference = guidance.forBuild('drawers', { height: '1F', drawerRoof, topHandle });
      const selected = drawerRoof === 'grid' && topHandle === true;
      assert.equal(reference.steps.some(step => step.id === 'roof-handle'), selected);
      assert.equal(reference.hardware.some(part => part.size === 'M6 × 50 mm'), selected);
      if (selected) assert.equal(reference.hardware.find(part => part.size === 'M6 × 50 mm').qty, 2);
      assert.equal(reference.hardware[0].qty, 4);
    }
  }
  assert.equal(guidance.forBuild('drawers', { height: '2F' }).hardware[0].qty, 6);
  assert.equal(guidance.forBuild('drawers', { height: '4F' }).hardware[0].qty, 6);
  assert.equal(guidance.forBuild('drawers', {}).hardware[0].qty, null);
});

test('unknown mounting hardware and heavyweight roof requirements remain explicitly unresolved', () => {
  assert.equal(guidance.forModification('wall').hardware[0].qty, null);
  for (const drawerRoof of ['mount', 'heavyweight']) {
    const result = guidance.forBuild('drawers', { height: '1F', drawerRoof });
    assert.ok(result.warnings.length);
    assert.ok(!result.hardware.some(part => part.size === 'M6 × 50 mm'));
  }
});

test('pull-out handle preserves the conflicting bolt specifications and both manual citations', () => {
  const result = guidance.forModification('pullHandle');
  const ambiguous = result.hardware.find(part => part.size.includes('35 mm'));
  assert.equal(ambiguous.qty, 2);
  assert.match(ambiguous.size, /M6/);
  assert.match(ambiguous.size, /M4/);
  assert.deepEqual(ambiguous.sources, [{ id: '01', page: 3 }, { id: '04', page: 13 }]);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0].text.zh, /不一致/);
  assert.match(result.warnings[0].text.en, /different bolt sizes/);
});

test('wheel hardware stays per wheel and caster hardware stays a separate base option', () => {
  const wheels = guidance.forModification('wheels').hardware;
  assert.deepEqual(wheels.map(part => part.qty), [6, 1, 1]);
  assert.ok(wheels.every(part => part.unit.en === 'per wheel'));
  const base = guidance.forModification('base').hardware;
  assert.equal(base.find(part => part.size === 'M8').qty, 4);
  assert.equal(base.find(part => part.size.startsWith('M16')).qty, 1);
  assert.match(base.find(part => part.size.startsWith('M16')).purpose.en, /choose one/);
});

test('all installation references have bilingual copy and valid local manual page targets', () => {
  const manuals = { '01': 20, '02': 8, '03': 7, '04': 17, '05': 12 };
  const references = ['base', 'backbone', 'wheels', 'feet', 'pullHandle', 'stationaryHandle', 'pegboard', 'wall'].map(guidance.forModification);
  references.push(guidance.forBuild('drawers', { height: '1F', drawerRoof: 'grid', topHandle: true }));
  references.push(guidance.forBuild('sustainers', { roof: 'split', interior: 'dividers' }));
  for (const result of references) {
    assert.ok(result.steps.length);
    assert.ok(result.hardware.length);
    for (const item of [...result.steps, ...result.hardware, ...result.notes, ...result.warnings]) {
      for (const key of ['title', 'note', 'text', 'unit', 'purpose']) {
        if (item[key]) for (const language of ['zh', 'en']) assert.ok(item[key][language], `${key}.${language}`);
      }
      if ('qty' in item) assert.ok(item.qty === null || Number.isInteger(item.qty) && item.qty > 0);
      assert.ok(item.sources.length);
      for (const source of item.sources) assert.ok(source.page >= 1 && source.page <= manuals[source.id], JSON.stringify(source));
    }
  }
  assert.deepEqual(guidance.forModification('all'), { steps: [], hardware: [], notes: [], warnings: [] });
  assert.throws(() => guidance.forBuild('unknown'));
});
