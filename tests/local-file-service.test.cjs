const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/local-file-service.js'), 'utf8');
const component = '01. DRAWERS/07. Universal/Top Handle (Turn On Supports).stl';
const capable = { service: 'vault-workbench', revealLocal: true };
const response = (body, ok = true) => ({ ok, json: async () => body });
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
const tick = () => new Promise(resolve => setImmediate(resolve));

function harness({ location = { protocol: 'http:', hostname: '127.0.0.1' }, fetch: handler, fakeTimers = false } = {}) {
  const files = new Map([[component, { size: 123456, lastModified: 1700000000000 }]]);
  const requests = [];
  const timers = new Map();
  let timerId = 0;
  const context = vm.createContext({
    location, AbortController,
    setTimeout: fakeTimers ? (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId; } : setTimeout,
    clearTimeout: fakeTimers ? id => timers.delete(id) : clearTimeout,
    VaultResources: { getFile: name => files.get(name) || null },
    fetch(url, options) {
      requests.push({ url, ...options });
      return handler ? handler(url, options) : Promise.resolve(response(url.endsWith('capabilities') ? capable : { ok: true }));
    }
  });
  vm.runInContext(source, context);
  return {
    service: context.LocalFileService, files, requests, timers,
    expire(delay) {
      const timer = [...timers.values()].find(item => item.delay === delay);
      assert.ok(timer, `Expected an active ${delay} ms timer`);
      timer.callback();
    }
  };
}

test('file pages, hosted sites, HTTPS and localhost aliases never request a native service', async () => {
  for (const location of [
    { protocol: 'file:', hostname: '' },
    { protocol: 'https:', hostname: '127.0.0.1' },
    { protocol: 'http:', hostname: 'localhost' },
    { protocol: 'http:', hostname: 'example.com' }
  ]) {
    const app = harness({ location });
    assert.equal(await app.service.available(), false);
    assert.equal((await app.service.reveal(component)).error, 'unavailable');
    assert.equal(app.requests.length, 0);
  }
});

test('ordinary static servers and unsupported platforms remain unavailable until refreshed', async () => {
  for (const body of [null, {}, { service: 'other', revealLocal: true }, { service: 'vault-workbench', revealLocal: false }]) {
    let supported = false;
    const app = harness({ fetch: async () => response(supported ? capable : body) });
    assert.equal(await app.service.available(), false);
    assert.equal((await app.service.reveal(component)).error, 'unavailable');
    assert.equal(app.requests.length, 1);
    supported = true;
    assert.equal(await app.service.available(), false);
    assert.equal(await app.service.available({ refresh: true }), true);
    assert.equal(app.requests.length, 2);
  }
});

test('parallel availability checks share a request and a refresh supersedes an older result', async () => {
  const probes = [deferred(), deferred()];
  let index = 0;
  const app = harness({ fetch: () => probes[index++].promise });
  const first = app.service.available();
  const duplicate = app.service.available();
  assert.equal(app.requests.length, 1);
  const refresh = app.service.available({ refresh: true });
  assert.equal(app.requests.length, 2);
  probes[1].resolve(response({ ...capable, revealLocal: false }));
  assert.equal(await refresh, false);
  probes[0].resolve(response(capable));
  assert.equal(await first, false);
  assert.equal(await duplicate, false);
  assert.equal(await app.service.available(), false);
});

test('reveal posts only selected-file metadata after capability detection and coalesces duplicate actions', async () => {
  const action = deferred();
  const app = harness({ fetch: async url => url.endsWith('capabilities') ? response(capable) : action.promise });
  const first = app.service.reveal(component);
  const duplicate = app.service.reveal(component);
  await tick();
  assert.equal(app.requests.length, 2);
  const request = app.requests[1];
  assert.equal(request.url, '/__vault/reveal');
  assert.equal(request.method, 'POST');
  assert.equal(request.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(request.body), { path: component, size: 123456, lastModified: 1700000000000 });
  action.resolve(response({ ok: true }));
  assert.equal((await first).ok, true);
  assert.equal((await duplicate).ok, true);
  assert.equal(app.timers.size, 0);
});

test('missing files and a folder changed during detection never produce a reveal request', async () => {
  const probe = deferred();
  const app = harness({ fetch: () => probe.promise });
  assert.equal((await app.service.reveal('missing.stl')).error, 'missing');
  assert.equal(app.requests.length, 0);
  const pending = app.service.reveal(component);
  app.files.set(component, { size: 987654, lastModified: 1700000001000 });
  probe.resolve(response(capable));
  assert.equal((await pending).error, 'mismatch');
  assert.equal(app.requests.length, 1);
  app.files.set(component, { size: 123 });
  assert.equal((await app.service.reveal(component)).error, 'mismatch');
  assert.equal(app.requests.length, 1);
});

test('reveal preserves actionable backend errors and normalizes other failures', async () => {
  for (const error of ['resource_root', 'missing', 'mismatch', 'file_manager', 'path', 'platform']) {
    const app = harness({ fetch: async url => response(url.endsWith('capabilities') ? capable : { error }, url.endsWith('capabilities')) });
    const result = await app.service.reveal(component);
    assert.equal(result.ok, false);
    assert.equal(result.error, ['resource_root', 'missing', 'mismatch'].includes(error) ? error : 'failed');
  }
  const app = harness({ fetch: async url => url.endsWith('capabilities') ? response(capable) : { ok: true, json: async () => { throw new Error('HTML response'); } } });
  assert.equal((await app.service.reveal(component)).error, 'failed');
});

test('capability and reveal timeouts abort requests even if fetch does not settle', async () => {
  const app = harness({ fakeTimers: true, fetch: () => new Promise(() => {}) });
  const capability = app.service.available();
  app.expire(3000);
  assert.equal(await capability, false);
  assert.equal(app.requests[0].signal.aborted, true);
  assert.equal(app.timers.size, 0);

  const revealing = harness({ fakeTimers: true, fetch: async url => url.endsWith('capabilities') ? response(capable) : new Promise(() => {}) });
  const result = revealing.service.reveal(component);
  await tick();
  revealing.expire(8000);
  assert.equal((await result).error, 'unavailable');
  assert.equal(revealing.requests[1].signal.aborted, true);
  assert.equal(revealing.timers.size, 0);
});
