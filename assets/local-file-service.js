(function (root) {
  'use strict';

  let capability = null;
  let pendingCapability = null;
  let capabilityRequest = 0;
  const pendingReveals = new Map();
  const failures = new Set(['resource_root', 'missing', 'mismatch']);

  function isLocalOrigin() {
    return root.location?.protocol === 'http:' && root.location.hostname === '127.0.0.1';
  }

  async function request(url, options, timeout) {
    const controller = new AbortController();
    let timer;
    try {
      return await Promise.race([
        (async () => {
          const response = await fetch(url, { ...options, signal: controller.signal });
          const body = await response.json().catch(() => null);
          return { response, body };
        })(),
        new Promise((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new Error('timeout'));
          }, timeout);
        })
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  async function available({ refresh = false } = {}) {
    if (!isLocalOrigin()) return false;
    if (!refresh && capability !== null) return capability;
    if (!refresh && pendingCapability) return pendingCapability;
    const token = ++capabilityRequest;
    capability = null;
    pendingCapability = (async () => {
      let supported = false;
      try {
        const { response, body } = await request('/__vault/capabilities', { cache: 'no-store' }, 3000);
        supported = response.ok && body?.service === 'vault-workbench' && body.revealLocal === true;
      } catch (_) { /* A normal static server has no native file service. */ }
      // A refresh supersedes an older response, including callers awaiting it.
      if (token !== capabilityRequest) return available();
      capability = supported;
      pendingCapability = null;
      return supported;
    })();
    return pendingCapability;
  }

  async function revealFile(path, file) {
    if (!await available() || !isLocalOrigin()) return { ok: false, error: 'unavailable' };
    // The selected folder may have changed while the capability request was pending.
    if (root.VaultResources?.getFile(path) !== file) return { ok: false, error: 'mismatch' };
    if (!Number.isFinite(file.size) || !Number.isFinite(file.lastModified)) return { ok: false, error: 'mismatch' };
    try {
      const { response, body } = await request('/__vault/reveal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, size: file.size, lastModified: file.lastModified })
      }, 8000);
      if (response.ok && body?.ok === true) return { ok: true };
      return { ok: false, error: failures.has(body?.error) ? body.error : 'failed' };
    } catch (_) {
      return { ok: false, error: 'unavailable' };
    }
  }

  async function reveal(path) {
    if (!isLocalOrigin()) return { ok: false, error: 'unavailable' };
    const file = typeof path === 'string' && path ? root.VaultResources?.getFile(path) : null;
    if (!file) return { ok: false, error: 'missing' };
    const previous = pendingReveals.get(path);
    if (previous?.file === file) return previous.promise;
    const promise = revealFile(path, file);
    const entry = { file, promise };
    pendingReveals.set(path, entry);
    try {
      return await promise;
    } finally {
      if (pendingReveals.get(path) === entry) pendingReveals.delete(path);
    }
  }

  root.LocalFileService = { available, reveal };
})(globalThis);
