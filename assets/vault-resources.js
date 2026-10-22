(function (root) {
  'use strict';
  const manuals = {
    '01': { en: '01_Instructions Manual.pdf', zh: '01_使用说明书_中文版.pdf' },
    '02': { en: '02_Drawer Assembly.pdf', zh: '02_抽屉组装_中文版.pdf' },
    '03': { en: '03_Sustainers Assembly.pdf', zh: '03_承托收纳盒组装_中文版.pdf' },
    '04': { en: '04_Modifications.pdf', zh: '04_选配改造件_中文版.pdf' },
    '05': { en: '05_Mounting Instructions.pdf', zh: '05_安装说明_中文版.pdf' }
  };
  const normalize = path => path.normalize('NFC').toLowerCase();
  const category = /^(01\. drawers|02\. sustainers|03\. modifications)$/i;
  const manualNames = new Set(Object.values(manuals).flatMap(Object.values).map(normalize));

  function createIndex(files) {
    const entries = Array.from(files, file => ({ file, parts: (file.webkitRelativePath || file.name).split('/') }));
    const roots = new Set();
    for (const { parts } of entries) {
      const at = parts.findIndex(part => category.test(part));
      if (at >= 0) roots.add(parts.slice(0, at).join('/'));
    }
    if (!roots.size) {
      for (const { parts } of entries) {
        if (manualNames.has(normalize(parts.at(-1)))) roots.add(parts.slice(0, -1).join('/'));
      }
    }
    if (!roots.size) throw new Error('invalidFolder');
    if (roots.size > 1) throw new Error('multipleVaults');
    const base = [...roots][0];
    const prefix = base ? base + '/' : '';
    const records = new Map();
    const ambiguous = new Set();
    const names = new Map();
    const counts = { stl: 0, pdf: 0, image: 0 };
    for (const { file, parts } of entries) {
      const fullPath = parts.join('/');
      if (!fullPath.startsWith(prefix)) continue;
      const path = fullPath.slice(prefix.length);
      if (path.split('/').some(part => part.startsWith('.'))) continue;
      const ext = file.name.split('.').at(-1).toLowerCase();
      const kind = ext === 'stl' ? 'stl' : ext === 'pdf' ? 'pdf' : /^(png|jpe?g|webp|gif)$/.test(ext) ? 'image' : null;
      if (!kind) continue;
      const key = normalize(path);
      const record = { file, path, kind };
      const name = normalize(file.name);
      if (!names.has(name)) names.set(name, []);
      names.get(name).push(record);
      if (records.has(key) || ambiguous.has(key)) {
        records.delete(key);
        ambiguous.add(key);
      } else records.set(key, record);
    }
    for (const record of records.values()) counts[record.kind]++;
    return { name: base.split('/').at(-1) || entries[0]?.parts[0] || 'Vault', records, ambiguous, names, counts };
  }

  function findManual(index, id, language) {
    if (!index || !manuals[id]) return null;
    for (const lang of [language, language === 'zh' ? 'en' : 'zh']) {
      const name = normalize(manuals[id][lang]);
      const exact = index.records.get(name);
      const matches = index.names.get(name) || [];
      const record = exact || (!index.ambiguous.has(name) && matches.length === 1 ? matches[0] : null);
      if (record) return { ...record, language: lang, fallback: lang !== language };
    }
    return null;
  }

  let index = null;
  const urls = new Map();
  function clearURLs() {
    for (const url of urls.values()) URL.revokeObjectURL(url);
    urls.clear();
  }
  function change(next) {
    clearURLs();
    index = next;
    if (root.dispatchEvent) root.dispatchEvent(new Event('vaultchange'));
  }
  const api = {
    createIndex, findManual, manuals,
    get index() { return index; },
    get connected() { return index !== null; },
    connect(files) { const next = createIndex(files); change(next); return next; },
    disconnect() { change(null); },
    getFile(path) { return index?.records.get(normalize(path))?.file || null; },
    getURL(path) {
      const file = api.getFile(path);
      if (!file) return null;
      const key = normalize(path);
      if (!urls.has(key)) urls.set(key, URL.createObjectURL(file));
      return urls.get(key);
    },
    manual(id, language) { return findManual(index, id, language); }
  };
  root.VaultResources = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
