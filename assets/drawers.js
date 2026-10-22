(function (root) {
  'use strict';
  const files = new Map(root.DrawerFiles.map(path => [path.toLowerCase(), path]));
  function exact(path) {
    const found = files.get(path.toLowerCase());
    if (!found) throw new Error('Missing drawer component: ' + path);
    return found;
  }
  const item = (path, qty, role) => ({ path: exact(path), qty, role });
  const heights = width => width === 'XL' ? ['1F'] : ['1F', '2F', '4F'];
  function resolve({ width: w, depth: d, height: h }) {
    if (!['S', 'M', 'L', 'XL'].includes(w) || !['3', '4', '5', '6', '7'].includes(String(d)) || !heights(w).includes(h)) throw new Error('Unsupported drawer configuration');
    const family = { S: '01. S Families', M: '02. M Families', L: '03. L Families', XL: '05. XL Families' }[w];
    const base = '01. DRAWERS/' + family + '/';
    const universal = '01. DRAWERS/07. Universal/';
    const wd = w + d;
    const runner = (w === 'XL' ? 'XL' : 'x') + d;
    const structure = [item(`${base}${wd}/Modules/${wd} Module ${h}.stl`, 1, 'module')];
    if (w === 'XL' && Number(d) >= 6) {
      [1, 2].forEach(part => structure.push(item(`${base}${wd}/Boxes/${wd} Box 1F Part ${part}.stl`, 1, 'splitBox')));
    } else {
      structure.push(item(`${base}${wd}/Boxes/${wd} Box ${h}.stl`, 1, 'box'));
      if (w === 'XL') structure.push(item(`${base}${wd}/Boxes/${wd} Back Panel.stl`, 1, 'backPanel'));
    }
    structure.push(
      item(w === 'XL' ? `${base}XL Facade 1F.stl` : `${base}Facades/${w}${h} (Turn On Supports).stl`, 1, w === 'XL' ? 'xlFacade' : 'facade'),
      item(`${universal}Geared Rails/${w} Rails.stl`, 2, 'rails'),
      item(`${universal}Runners/${runner} Runner Guides.stl`, 2, 'guides'),
      item(`${universal}Runners/${runner} Runner Slides.stl`, 2, 'slides')
    );
    const mechanism = [
      item(universal + 'Runners/Runner Stopper.stl', 2, 'stopper'),
      item(universal + 'Latch.stl', 1, 'latch'),
      item(universal + 'Springs.stl', 2, 'springs'),
      item(universal + 'Key Cap.stl', 1, 'keyCap'),
      item(universal + 'Facade Cap.stl', 1, 'facadeCap'),
      item(universal + 'Label.stl', 1, 'label')
    ];
    const keys = [item(universal + 'Key (Turn On Supports).stl', 1, 'standardKey'), item(universal + 'Hidden Key (Turn On Supports).stl', 1, 'hiddenKey'), item(universal + 'Hidden Key Part 2 (Turn on Supports).stl', 1, 'hiddenKeyPart')];
    const roofNames = { grid: 'Grid', table: 'Table', bowl: 'Bowl', mount: 'Under Table Mount' };
    if (w === 'L' || w === 'XL') roofNames.heavyweight = 'Heawyweight';
    const roofs = Object.entries(roofNames).map(([role, name]) => item(`${base}${wd}/Roofs/${wd} ${name} Roof.stl`, 1, role));
    return { structure, mechanism, keys, roofs, bolts: h === '1F' ? 4 : 6 };
  }
  root.DrawerCatalog = { heights, resolve };
})(globalThis);
