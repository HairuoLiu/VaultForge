const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function harness({ permission = 'granted', saved = true, supported = true, saveFails = false } = {}) {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      dataset: {}, handlers: {}, attributes: {}, files: [], clicks: 0,
      setAttribute(name, value) { this.attributes[name] = value; },
      addEventListener(name, callback) { this.handlers[name] = callback; },
      append() {}, click() { this.clicks++; }
    });
    return elements.get(id);
  };
  const listeners = new Map();
  const model = new File(['model'], 'model.stl');
  Object.defineProperty(model, 'webkitRelativePath', { value: 'Vault/01. DRAWERS/model.stl' });
  let permissionRequests = 0;
  const handle = {
    kind: 'directory', name: 'Vault',
    queryPermission: async () => permission,
    requestPermission: async () => { permissionRequests++; return 'granted'; }
  };
  let stored = saved ? handle : null;
  const context = vm.createContext({
    Event, URL, setTimeout,
    document: { getElementById: element, querySelectorAll: () => [], querySelector: () => null },
    addEventListener(name, callback) { listeners.set(name, callback); },
    dispatchEvent(event) { listeners.get(event.type)?.(); },
    showDirectoryPicker: async () => handle,
    VaultFolder: {
      supported, load: async () => stored,
      save: async value => { if (saveFails) throw new Error('Storage unavailable'); stored = value; },
      clear: async () => { stored = null; },
      files: async () => [model]
    }
  });
  context.window = context;
  for (const file of ['vault-resources.js', 'vault-connection.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets', file), 'utf8'), context);
  }
  return { context, element, get stored() { return stored; }, get permissionRequests() { return permissionRequests; } };
}

test('saved folder restores without prompting and restores readable resources', async () => {
  const app = harness();
  await app.context.VaultConnection.ready;
  assert.equal(app.context.VaultResources.connected, true);
  assert.equal(await app.context.VaultResources.getFile('01. DRAWERS/model.stl').text(), 'model');
  assert.equal(app.permissionRequests, 0);
});

test('expired permission waits for an explicit reconnect click and preserves the folder', async () => {
  const app = harness({ permission: 'prompt' });
  await app.context.VaultConnection.ready;
  assert.equal(app.context.VaultResources.connected, false);
  assert.equal(app.element('vault-name').textContent, 'Vault');
  assert.equal(app.element('vault-rescan').textContent, 'Reconnect folder');
  assert.equal(app.permissionRequests, 0);
  await app.element('vault-rescan').handlers.click();
  assert.equal(app.permissionRequests, 1);
  assert.equal(app.context.VaultResources.connected, true);
});

test('disconnect also forgets a folder whose permission has expired', async () => {
  const app = harness({ permission: 'denied' });
  await app.context.VaultConnection.ready;
  await app.element('vault-disconnect').handlers.click();
  assert.equal(app.stored, null);
  assert.equal(app.context.VaultResources.connected, false);
  assert.equal(app.element('vault-rescan').hidden, true);
});

test('unavailable storage keeps the current session usable and explains the limitation', async () => {
  const app = harness({ saved: false, saveFails: true });
  await app.context.VaultConnection.ready;
  await app.context.VaultConnection.choose();
  assert.equal(app.context.VaultResources.connected, true);
  assert.equal(app.stored, null);
  assert.match(app.element('vault-notice').textContent, /could not be saved/);
});

test('unsupported browsers and rejected directory pickers retain the basic folder picker', async () => {
  for (const supported of [false, true]) {
    const app = harness({ saved: false, supported });
    await app.context.VaultConnection.ready;
    app.context.showDirectoryPicker = async () => { throw Object.assign(new Error(), { name: 'SecurityError' }); };
    await app.context.VaultConnection.choose();
    assert.equal(app.element('vault-folder-input').clicks, 1);
  }
});

test('revoked access clears stale files and offers reconnection without forgetting the folder', async () => {
  const app = harness();
  await app.context.VaultConnection.ready;
  const oldURL = app.context.VaultResources.getURL('01. DRAWERS/model.stl');
  app.stored.requestPermission = async () => 'denied';
  await app.element('vault-rescan').handlers.click();
  assert.equal(app.context.VaultResources.connected, false);
  assert.equal(app.context.VaultResources.getFile('01. DRAWERS/model.stl'), null);
  await assert.rejects(fetch(oldURL));
  assert.ok(app.stored);
  assert.equal(app.element('vault-rescan').textContent, 'Reconnect folder');
});

test('an unavailable remembered folder cannot leave the old file index connected', async () => {
  const app = harness();
  await app.context.VaultConnection.ready;
  app.context.VaultFolder.files = async () => { throw Object.assign(new Error('Folder removed'), { name: 'NotFoundError' }); };
  await app.element('vault-rescan').handlers.click();
  assert.equal(app.context.VaultResources.connected, false);
  assert.ok(app.stored);
  assert.match(app.element('vault-notice').textContent, /could not be read/);
});
