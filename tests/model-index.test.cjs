const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
require('../assets/drawer-files.js');
require('../assets/drawers.js');
require('../assets/component-notes.js');
require('../assets/drawer-accessories.js');
require('../assets/sustainers.js');
require('../assets/sustainer-accessories.js');
require('../assets/modification-files.js');
require('../assets/modifications.js');
const ModelIndex = require('../assets/model-index.js');
const VaultResources = require('../assets/vault-resources.js');
const { root, options: resourceOptions } = require('./resource-root.cjs');

const knownPaths = new Set([...DrawerFiles, ...ModificationFiles]);
for (const width of ['S', 'M', 'L', 'XL']) for (const depth of SustainerCatalog.options(width).depths) {
  for (const height of SustainerCatalog.options(width, depth).heights) {
    const options = SustainerCatalog.options(width, depth, height);
    for (const interior of options.interiors) for (const roof of options.roofs) {
      const configuration = { width, depth, height, interior, roof };
      const result = SustainerCatalog.resolve(configuration);
      for (const value of Object.values(result)) if (Array.isArray(value)) {
        for (const part of value) if (part.path) knownPaths.add(part.path);
      }
      for (const group of SustainerAccessories.resolve(configuration)) for (const part of group.items) knownPaths.add(part.path);
    }
  }
}
const record = filePath => ({ path: filePath, kind: 'stl', file: { name: filePath.split('/').at(-1), size: 1234 } });
const entries = ModelIndex.create([...knownPaths].map(record));
const search = (query, filters = {}) => ModelIndex.search(entries, { query, ...filters });
const paths = values => values.map(entry => entry.path);

test('all 733 supplied catalog models receive a bilingual purpose without introducing files', () => {
  assert.equal(entries.length, 733);
  assert.deepEqual(paths(entries).sort(), [...knownPaths].sort());
  assert.deepEqual(['drawers', 'sustainers', 'modifications'].map(system => entries.filter(entry => entry.system === system).length), [410, 225, 98]);
  assert.ok(entries.every(entry => entry.label.zh && entry.label.en));
  assert.ok(entries.every(entry => ModelIndex.types.some(type => type.key === entry.type)));
  assert.ok(entries.every(entry => entry.size === 1234));
});

test('the actual selected folder is authoritative, preserving every original archive path', resourceOptions, () => {
  const files = [];
  function walk(directory) {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      if (item.name.startsWith('.')) continue;
      const full = path.join(directory, item.name);
      if (item.isDirectory()) walk(full);
      else if (/\.stl$/i.test(item.name)) files.push({ name: item.name, size: fs.statSync(full).size, webkitRelativePath: 'Vault/' + path.relative(root, full).split(path.sep).join('/') });
    }
  }
  for (const directory of ['01. DRAWERS', '02. SUSTAINERS', '03. MODIFICATIONS']) walk(path.join(root, directory));
  const index = VaultResources.createIndex(files);
  const actual = ModelIndex.create(index.records.values());
  assert.equal(actual.length, 733);
  assert.deepEqual(paths(actual).sort(), files.map(file => file.webkitRelativePath.slice('Vault/'.length)).sort());
  assert.ok(actual.some(entry => entry.path.includes('Heawyweight')));
  assert.ok(actual.some(entry => entry.path.includes("L4F' Facade")));
});

test('new and same-name files remain discoverable by their full path without invented compatibility', () => {
  const fresh = ModelIndex.create([
    record('Custom/Spacer.stl'), record('Custom/Nested/Spacer.stl'), record('Custom/S3 Mount.stl'),
    record('01. DRAWERS/Custom Mystery.stl'), { path: 'Manual.pdf', kind: 'pdf', file: {} }
  ]);
  assert.equal(fresh.length, 4);
  assert.equal(ModelIndex.search(fresh, { query: 'spacer' }).length, 2);
  assert.equal(ModelIndex.search(fresh, { query: 'custom nested spacer' }).length, 1);
  assert.deepEqual(fresh.find(entry => entry.name === 'Spacer.stl').label, { zh: 'Spacer.stl', en: 'Spacer.stl' });
  assert.equal(ModelIndex.search(fresh, { query: 'S3' }).length, 1);
  assert.equal(ModelIndex.search(fresh, { width: 'S', depth: '3' }).length, 1);
  assert.equal(ModelIndex.search(fresh, { height: '1F' }).length, 0);
  assert.equal(fresh.find(entry => entry.name === 'Custom Mystery.stl').system, 'drawers');
  assert.equal(ModelIndex.create([record('Custom/Spacer.stl'), record('Custom/Spacer.stl')]).length, 1);
  assert.deepEqual(ModelIndex.create([]), []);
});

test('Chinese, English and mixed queries find handles, runners and dividers independently of UI language', () => {
  for (const [chinese, english] of [['提手', 'handle'], ['导轨', 'runner'], ['隔板', 'divider']]) {
    assert.deepEqual(new Set(paths(search(chinese))), new Set(paths(search(english))));
    assert.ok(search(chinese).length > 0);
  }
  assert.deepEqual(new Set(paths(search('把手'))), new Set(paths(search('handle'))));
  for (const query of ['S3 顶盖', 's3 ROOF', 'S3 roof', 'S3顶盖']) {
    assert.ok(search(query).some(entry => entry.name === 'S3 Grid Roof.stl'), query);
  }
  for (const query of ['L6 隔板', 'L6 divider', 'l6分隔板']) {
    assert.ok(search(query).some(entry => entry.name === 'L6-1F Depth Divider.stl'), query);
  }
  assert.ok(search('网格顶盖提手').some(entry => entry.name === 'Top Handle (Turn On Supports).stl'));
  assert.ok(!search('隔板').some(entry => entry.name === 'S3 Baseplate.stl'));
  assert.ok(!search('底板').some(entry => entry.name === 'S1F Divider.stl'));
  assert.ok(search('通用导轨').some(entry => entry.name === 'x3 Runner Guide.stl'));
});

test('size queries use verified shared runner applicability and never confuse S3 with XL3', () => {
  const small = search('S3 导轨');
  assert.ok(small.some(entry => entry.name === 'x3 Runner Guide.stl'));
  assert.ok(small.some(entry => entry.name === 'x3 Runner Slide.stl'));
  assert.ok(!small.some(entry => entry.name.includes(' XL')));
  const extraLarge = search('XL3 runner');
  assert.ok(extraLarge.some(entry => entry.name === 'x3 Runner Guide XL.stl'));
  assert.ok(!extraLarge.some(entry => entry.name === 'x3 Runner Guide.stl'));
  assert.ok(search('S3').every(entry => entry.widths.includes('S') && entry.depths.includes('3')));
  assert.deepEqual(search('S8 导轨'), []);
  assert.deepEqual(search('S33 runner'), []);
  assert.deepEqual(search('S3 8F'), []);
  assert.deepEqual(search('XL3', { width: 'S' }), []);
});

test('English synonyms match complete words instead of accidental substrings', () => {
  for (const query of ['S3 roof', 'S3 顶盖', 'S3 lid']) {
    const results = search(query);
    assert.ok(results.some(entry => entry.name === 'S3 Grid Roof.stl'), query);
    assert.ok(!results.some(entry => /Runner Slide/i.test(entry.name)), query);
  }
  assert.ok(!search('底座').some(entry => /Baseplate/i.test(entry.name)));
  assert.ok(search('handl').some(entry => entry.name === 'Top Handle (Turn On Supports).stl'));
});

test('height and combined filters preserve valid configurations without cross-product false matches', () => {
  assert.ok(search('S3-1F module').some(entry => entry.name === 'S3 Module 1F.stl'));
  assert.ok(search('S1F facade').some(entry => entry.name === 'S1F Facade.stl'));
  assert.ok(search('XL3 4F').length === 0);
  const tall = search('2F divider', { system: 'sustainers', width: 'L', depth: '6' });
  assert.ok(tall.some(entry => entry.name === 'L6-2F Depth Divider.stl'));
  assert.ok(!tall.some(entry => entry.name === 'L6-1F Depth Divider.stl'));
  const longDivider = entries.find(entry => entry.path.includes('20MM TALL/26-L, x7.stl'));
  assert.ok(longDivider);
  assert.equal(ModelIndex.search([longDivider], { query: 'S7' }).length, 1);
  assert.equal(ModelIndex.search([longDivider], { query: 'L3' }).length, 1);
  assert.equal(ModelIndex.search([longDivider], { query: 'S3' }).length, 0);
});

test('unmarked modifications and unverified alternates are not treated as universally compatible', () => {
  const wheel = entries.find(entry => entry.name === 'Disk.stl');
  assert.deepEqual(wheel.widths, []);
  assert.equal(ModelIndex.search([wheel], { width: 'S' }).length, 0);
  const alternate = entries.find(entry => entry.path === '02. SUSTAINERS/05. Universal/Facades/S1F.stl');
  assert.deepEqual(alternate.widths, ['S']);
  assert.deepEqual(alternate.heights, ['1F']);
  assert.deepEqual(alternate.depths, []);
  assert.equal(ModelIndex.search([alternate], { query: 'S3' }).length, 0);
});

test('partial names and one English typo are tolerated while all query terms must match', () => {
  const handle = '01. DRAWERS/07. Universal/Top Handle (Turn On Supports).stl';
  for (const query of ['handl', 'hadnle', 'handke', 'S3 hadle', 'TOP handle', 'top handls']) {
    assert.ok(paths(search(query)).includes(handle), query);
  }
  assert.ok(search('S3 runer').some(entry => entry.name === 'x3 Runner Guide.stl'));
  assert.deepEqual(search('S3 runner impossibleword'), []);
  assert.deepEqual(search('notarealmodel'), []);
});

test('search ranks name and purpose matches ahead of directory-only matches without mutating entries', () => {
  const fixture = ModelIndex.create([record('A Handle/A Spacer.stl'), record('Z/Handle.stl')]);
  const original = JSON.stringify(fixture);
  assert.equal(ModelIndex.search(fixture, { query: 'handle' })[0].name, 'Handle.stl');
  assert.equal(JSON.stringify(fixture), original);
  assert.notEqual(ModelIndex.search(fixture, {}), fixture);
});

test('system and part filters compose with search, and clearing restores the full index', () => {
  const selected = search('提手', { system: 'modifications', type: 'handle', width: 'S' });
  assert.ok(selected.length > 0);
  assert.ok(selected.every(entry => entry.system === 'modifications' && entry.type === 'handle' && entry.widths.includes('S')));
  assert.deepEqual(search('', { system: 'all', type: 'all', width: 'all', depth: 'all', height: 'all' }), entries);
  assert.deepEqual(search('   '), entries);
});
