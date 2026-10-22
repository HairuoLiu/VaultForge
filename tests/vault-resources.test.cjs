const test = require('node:test');
const assert = require('node:assert/strict');
const vault = require('../assets/vault-resources.js');

function file(path, content = 'fixture') {
  const value = new File([content], path.split('/').at(-1));
  Object.defineProperty(value, 'webkitRelativePath', { value: path });
  return value;
}
const modelPath = '01. DRAWERS/07. Universal/Latch.stl';

test('renamed or wrapped Vault roots preserve component paths without reading file bytes', () => {
  const model = file('Downloads/My renamed Vault/' + modelPath);
  model.arrayBuffer = () => { throw new Error('Do not parse models during indexing'); };
  const index = vault.createIndex([model, file('Downloads/My renamed Vault/01_Instructions Manual.pdf')]);
  assert.equal(index.name, 'My renamed Vault');
  assert.equal(index.records.get(modelPath.toLowerCase()).file, model);
  assert.deepEqual(index.counts, { stl: 1, pdf: 1, image: 0 });
});

test('manuals fall back independently and prefer the requested language', () => {
  const index = vault.createIndex([
    file('Vault/' + modelPath),
    file('Vault/01_Instructions Manual.pdf'),
    file('Vault/02_Drawer Assembly.pdf'),
    file('Vault/02_抽屉组装_中文版.pdf')
  ]);
  assert.equal(vault.findManual(index, '01', 'zh').language, 'en');
  assert.equal(vault.findManual(index, '01', 'zh').fallback, true);
  assert.equal(vault.findManual(index, '02', 'zh').language, 'zh');
  assert.equal(vault.findManual(index, '02', 'zh').fallback, false);
  assert.equal(vault.findManual(index, '02', 'en').language, 'en');
  assert.equal(vault.findManual(index, '03', 'zh'), null);
});

test('manual-only folders and uniquely named nested manuals are supported', () => {
  const only = vault.createIndex([file('Manuals/01_使用说明书_中文版.pdf')]);
  assert.equal(vault.findManual(only, '01', 'en').language, 'zh');
  const nested = vault.createIndex([file('Vault/' + modelPath), file('Vault/Manuals/01_Instructions Manual.pdf')]);
  assert.equal(vault.findManual(nested, '01', 'zh').path, 'Manuals/01_Instructions Manual.pdf');
});

test('case and Unicode normalization never silently select a conflicting model', () => {
  const index = vault.createIndex([
    file('Vault/01. DRAWERS/Café.stl'),
    file('Vault/01. DRAWERS/Cafe\u0301.STL'),
    file('Vault/01. DRAWERS/unique.stl')
  ]);
  assert.equal(index.ambiguous.size, 1);
  assert.equal(index.records.has('01. drawers/café.stl'), false);
  assert.equal(index.counts.stl, 1);
});

test('duplicate nested manuals are ambiguous; a known root copy takes precedence', () => {
  const files = [file('Vault/' + modelPath), file('Vault/a/01_Instructions Manual.pdf'), file('Vault/b/01_Instructions Manual.pdf')];
  assert.equal(vault.findManual(vault.createIndex(files), '01', 'en'), null);
  files.push(file('Vault/01_Instructions Manual.pdf'));
  assert.equal(vault.findManual(vault.createIndex(files), '01', 'en').path, '01_Instructions Manual.pdf');
});

test('multiple resource packs and unrelated folders cannot replace a valid selection', () => {
  vault.connect([file('Vault/' + modelPath)]);
  assert.throws(() => vault.connect([file('Downloads/a/' + modelPath), file('Downloads/b/' + modelPath)]), /multipleVaults/);
  assert.throws(() => vault.connect([file('Other/notes.txt')]), /invalidFolder/);
  assert.equal(vault.connected, true);
  assert.ok(vault.getFile(modelPath));
  vault.disconnect();
});

test('switching or disconnecting releases generated URLs and clears old files', async () => {
  vault.connect([file('Vault/' + modelPath, 'first')]);
  const old = vault.getURL(modelPath);
  assert.equal(vault.getURL(modelPath.toUpperCase()), old);
  assert.equal(await (await fetch(old)).text(), 'first');
  vault.connect([file('Other/01_Instructions Manual.pdf')]);
  assert.equal(vault.getFile(modelPath), null);
  await assert.rejects(fetch(old));
  const pdf = vault.getURL('01_Instructions Manual.pdf');
  vault.disconnect();
  await assert.rejects(fetch(pdf));
  assert.equal(vault.connected, false);
  assert.equal(vault.manual('01', 'zh'), null);
});
