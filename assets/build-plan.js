(function (root) {
  'use strict';
  const statuses = ['pending', 'printed', 'assembled'];
  const integer = (value, min = 0) => Number.isInteger(value) && value >= min && value <= 999;

  function normalizeConfiguration(system, value = {}) {
    const choose = (options, selected) => options.includes(selected) ? selected : options[0];
    const width = choose(['S', 'M', 'L', 'XL'], value.width);
    const depth = choose(['3', '4', '5', '6', '7'], String(value.depth));
    if (system === 'sustainers') {
      const options = root.SustainerCatalog.options(width, depth, value.height);
      return { width, depth, height: options.height, interior: choose(options.interiors, value.interior), roof: choose(options.roofs, value.roof) };
    }
    const height = choose(root.DrawerCatalog.heights(width), value.height);
    const roofs = root.DrawerCatalog.resolve({ width, depth, height }).roofs.map(part => part.role);
    return { width, depth, height, key: choose(['standard', 'hidden'], value.key), drawerRoof: choose(['none', ...roofs], value.drawerRoof) };
  }

  function resolve(system, configuration) {
    if (system === 'sustainers') {
      const result = root.SustainerCatalog.resolve(configuration);
      return { parts: [...result.structure, ...result.mechanism, ...result.interiorParts], hardware: result.hardware };
    }
    if (system !== 'drawers') throw new Error('Unknown component system');
    const result = root.DrawerCatalog.resolve(configuration);
    if (!['standard', 'hidden'].includes(configuration.key) || !['none', ...result.roofs.map(part => part.role)].includes(configuration.drawerRoof)) throw new Error('Choose a valid key and roof');
    const keys = result.keys.filter(part => configuration.key === 'standard' ? part.role === 'standardKey' : part.role !== 'standardKey');
    return { parts: [...result.structure, ...result.mechanism, ...keys, ...result.roofs.filter(part => part.role === configuration.drawerRoof)], hardware: [{ size: 'M4 × 14 mm', qty: result.bolts }] };
  }

  function entry(value) {
    if (!value || !['drawers', 'sustainers'].includes(value.system) || !integer(value.count, 1)) throw new Error('Invalid build quantity');
    const configuration = normalizeConfiguration(value.system, value.configuration);
    // Stored plans must never silently change to a different build.
    if (Object.keys(configuration).some(key => configuration[key] !== value.configuration?.[key])) throw new Error('Unsupported saved configuration');
    const { parts } = resolve(value.system, configuration);
    const layout = {};
    for (const part of parts.filter(part => part.qty === null)) {
      const qty = value.layout?.[part.path];
      layout[part.path] = integer(qty) ? qty : null;
    }
    return { id: typeof value.id === 'string' ? value.id.slice(0, 100) : '', name: typeof value.name === 'string' ? value.name.trim().slice(0, 80) : '', system: value.system, configuration, count: value.count, layout, status: statuses.includes(value.status) ? value.status : 'pending' };
  }

  function summarize(entries) {
    const files = new Map();
    const hardware = new Map();
    let unresolved = 0;
    for (const raw of entries) {
      const build = entry(raw);
      const result = resolve(build.system, build.configuration);
      for (const part of result.parts) {
        const qty = part.qty === null ? build.layout[part.path] : part.qty;
        if (qty === 0) continue;
        if (!files.has(part.path)) files.set(part.path, { path: part.path, qty: 0, unresolved: 0 });
        const file = files.get(part.path);
        if (qty === null) { file.unresolved++; unresolved++; }
        else file.qty += qty * build.count;
      }
      for (const part of result.hardware) hardware.set(part.size, (hardware.get(part.size) || 0) + part.qty * build.count);
    }
    return { files: [...files.values()].sort((a, b) => a.path.localeCompare(b.path)), hardware: [...hardware].map(([size, qty]) => ({ size, qty })), unresolved };
  }

  function csv(entries) {
    const summary = summarize(entries);
    if (summary.unresolved) throw new Error('Complete layout quantities before exporting');
    // Prevent user-provided build names from becoming spreadsheet formulas.
    const cell = value => '"' + String(value ?? '').replace(/^[\s]*[=+@-]/, match => "'" + match).replace(/"/g, '""') + '"';
    const rows = [['type', 'name_or_path', 'quantity', 'unit', 'status', 'configuration']];
    entries.map(entry).forEach(build => rows.push(['build', build.name, build.count, 'modules', build.status, JSON.stringify({ system: build.system, ...build.configuration, layout: build.layout })]));
    summary.files.forEach(file => rows.push(['stl', file.path, file.qty, 'STL copies', '', '']));
    summary.hardware.forEach(part => rows.push(['hardware', part.size, part.qty, 'pieces', '', '']));
    return '\ufeff' + rows.map(row => row.map(cell).join(',')).join('\r\n') + '\r\n';
  }
  root.BuildPlan = { statuses, integer, normalizeConfiguration, resolve, entry, summarize, csv };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.BuildPlan;
})(globalThis);
