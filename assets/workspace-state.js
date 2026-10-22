(function (root) {
  'use strict';
  const key = 'vault-workbench.v1';
  function normalize(value) {
    const source = value?.version === 1 ? value : {};
    const configurations = {};
    for (const system of ['drawers', 'sustainers']) configurations[system] = root.BuildPlan.normalizeConfiguration(system, source.configurations?.[system] || {});
    const builds = [];
    const ids = new Set();
    for (const raw of Array.isArray(source.builds) ? source.builds.slice(0, 200) : []) {
      try {
        const build = root.BuildPlan.entry(raw);
        if (build.id && !ids.has(build.id)) { builds.push(build); ids.add(build.id); }
      } catch (_) { /* Discard invalid saved entries without breaking the workspace. */ }
    }
    const modifications = {};
    for (const field of ['category', 'width', 'depth', 'height']) {
      const input = source.modifications?.[field];
      modifications[field] = typeof input === 'string' && input.length <= 30 ? input : 'all';
    }
    const inputModels = source.models || {};
    const models = { query: typeof inputModels.query === 'string' ? inputModels.query.slice(0, 160) : '', page: Number.isInteger(inputModels.page) && inputModels.page > 0 ? Math.min(inputModels.page, 10000) : 1 };
    for (const [field, choices] of Object.entries({ system: ['all', 'drawers', 'sustainers', 'modifications', 'other'], width: ['all', 'S', 'M', 'L', 'XL'], depth: ['all', '3', '4', '5', '6', '7'], height: ['all', '1F', '2F', '4F'] })) models[field] = choices.includes(inputModels[field]) ? inputModels[field] : 'all';
    models.type = typeof inputModels.type === 'string' && /^[a-z]{1,30}$/.test(inputModels.type) ? inputModels.type : 'all';
    return { version: 1, language: source.language === 'zh' ? 'zh' : 'en', system: source.system === 'sustainers' ? 'sustainers' : 'drawers', tab: ['finder', 'models', 'modifications', 'manuals', 'plan'].includes(source.tab) ? source.tab : 'finder', manual: /^0[1-5]$/.test(source.manual) ? source.manual : '01', manualPage: Number.isInteger(source.manualPage) && source.manualPage > 0 && source.manualPage < 10000 ? source.manualPage : null, configurations, modifications, models, builds };
  }
  function createStore(getStorage) {
    let available = true;
    let recovered = false;
    let value;
    try {
      const saved = getStorage().getItem(key);
      const parsed = saved ? JSON.parse(saved) : null;
      value = normalize(parsed);
      recovered = !!saved && (parsed?.version !== 1 || (Array.isArray(parsed?.builds) && value.builds.length !== parsed.builds.length));
    } catch (error) { value = normalize(null); recovered = error instanceof SyntaxError; available = recovered; }
    return {
      get value() { return value; },
      get available() { return available; },
      get recovered() { return recovered; },
      save(patch) {
        value = normalize({ ...value, ...patch });
        try { getStorage().setItem(key, JSON.stringify(value)); available = true; }
        catch (_) { available = false; }
        return available;
      }
    };
  }
  root.WorkspaceState = { normalize, createStore };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.WorkspaceState;
})(globalThis);
