(function (root) {
  'use strict';

  const text = (zh, en) => ({ zh, en });
  const types = [
    { key: 'body', label: text('主体与面板', 'Bodies & panels') },
    { key: 'runner', label: text('导轨与滑动件', 'Runners & slides') },
    { key: 'roof', label: text('顶盖与连接件', 'Lids & connectors') },
    { key: 'handle', label: text('提手与把手', 'Handles') },
    { key: 'interior', label: text('底板与隔板', 'Baseplates & dividers') },
    { key: 'mechanism', label: text('铰链与锁定件', 'Hinges & locks') },
    { key: 'mount', label: text('底座与安装件', 'Bases & mounts') },
    { key: 'support', label: text('打印与安装辅助', 'Print & assembly aids') },
    { key: 'other', label: text('其他零件', 'Other parts') }
  ];
  const widths = ['S', 'M', 'L', 'XL'];
  const depths = ['3', '4', '5', '6', '7'];
  const heights = ['1F', '2F', '4F'];
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const pathKey = value => String(value).normalize('NFC').toLowerCase();
  const details = new WeakMap();
  let cachedCatalogs = [];
  let metadata;

  const aliases = [
    ['handle', 'handles', '提手', '把手', '拉手'],
    ['runner', 'runners', 'rail', 'rails', '导轨', '滑轨'],
    ['guide', 'guides', '导向件', '导向'],
    ['slide', 'slides', '滑动件', '滑动'],
    ['divider', 'dividers', '隔板', '分隔板', '隔仓', '分隔'],
    ['roof', 'roofs', 'lid', 'lids', '顶盖', '翻盖', '盖板', '上盖'],
    ['grid', '网格'], ['baseplate', 'baseplates', '底板'],
    ['module', 'modules', '外框', '盒体', '模块'],
    ['box', 'boxes', '内盒'], ['facade', 'facades', 'panel', 'panels', '面板'],
    ['hinge', 'hinges', '铰链'], ['rod', 'rods', '轴杆', '插销'],
    ['lock', 'locks', 'latch', 'latches', '锁扣', '锁舌', '锁定'],
    ['key', 'keys', '钥匙'], ['label', 'labels', '标签'],
    ['base', 'bases', '底座'], ['wheel', 'wheels', '轮组', '轮子'],
    ['tyre', 'tire', '轮胎'], ['foot', 'feet', '支脚'],
    ['backbone', 'backbones', '背板', '背部连接板'],
    ['wall', '壁挂'], ['pegboard', '洞洞板'],
    ['connector', 'connectors', '连接件'], ['pin', 'pins', '销钉', '固定销'],
    ['spring', 'springs', '弹簧'], ['support', 'supports', '支撑'],
    ['sealed', 'seal', '密封'], ['split', '分体'], ['whole', '整块', '整体'],
    ['drawer', 'drawers', '抽屉'], ['sustainer', 'sustainers', '收纳盒', '收纳箱', '承托盒'],
    ['modification', 'modifications', '改造件', '改造'],
    ['universal', '通用'],
    ['heavyweight', 'heawyweight', '加强'], ['top', '顶部'],
    ['width', '横向'], ['depth', '纵向'], ['standard', '标准'],
    ['hidden', '隐藏'], ['straight', '直边'], ['rounded', '圆边']
  ];
  const aliasMap = new Map(aliases.flatMap(group => group.map(alias => [alias, group])));
  const chineseAliases = [...aliasMap.keys()].filter(alias => /[\u3400-\u9fff]/.test(alias)).sort((a, b) => b.length - a.length);
  const labels = {
    roof: text('翻盖', 'Lid'), roofConnector: text('分体翻盖连接件', 'Split-lid connector'),
    grid: text('网格顶盖', 'Grid roof'), table: text('平面顶盖', 'Table roof'),
    bowl: text('托盘顶盖', 'Bowl roof'), mount: text('桌下安装顶盖', 'Under-table mount roof'),
    heavyweight: text('加强顶盖', 'Heavyweight roof'),
    topHinge: text('翻盖铰链', 'Lid hinge'), bottomHinge: text('盒体铰链', 'Body hinge'),
    rods: text('铰链插销', 'Hinge rods'), lockHolder: text('锁扣底座', 'Latch holder'),
    lockInner: text('锁扣内件', 'Inner latch'), lockOuter: text('锁扣外件', 'Outer latch'),
    lockPins: text('锁扣销钉套件', 'Latch pin set'), label: text('标签片', 'Label insert'),
    baseplate: text('Gridfinity 底板', 'Gridfinity baseplate'), divider: text('普通隔板', 'Standard divider'),
    depthDivider: text('纵向隔板', 'Depth divider'), widthDivider: text('横向隔板', 'Width divider'),
    sealDivider: text('密封型隔板', 'Seal divider'), sideSealDivider: text('侧边密封型隔板', 'Side seal divider'),
    centerSealDivider: text('中间密封型隔板', 'Center seal divider')
  };
  const roleTypes = {
    body: ['module', 'box', 'splitBox', 'backPanel', 'facade', 'xlFacade', 'alternateModule', 'alternateFacade', 'squareModuleAccessory'],
    runner: ['rails', 'guides', 'slides', 'stopper'],
    roof: ['grid', 'table', 'bowl', 'mount', 'heavyweight', 'roof', 'roofConnector', 'heavyweightInsert', 'heavyweightCut'],
    handle: ['topHandle', 'heavyweightHandle', 'pullHandle', 'stationaryHandle'],
    interior: ['drawerBaseplate', 'gridDivider', 'gridDividerEdge', 'gridDividerPin', 'unmatchedGridDivider', 'baseplate', 'divider', 'depthDivider', 'widthDivider', 'sealDivider', 'sideSealDivider', 'centerSealDivider'],
    mechanism: ['latch', 'springs', 'keyCap', 'standardKey', 'hiddenKey', 'hiddenKeyPart', 'topHinge', 'bottomHinge', 'rods', 'lockHolder', 'lockInner', 'lockOuter', 'lockPins', 'knob', 'handleLock', 'lockPart'],
    mount: ['base', 'baseWhole', 'baseSplit', 'baseConnector', 'backbone', 'moduleConnector', 'feet', 'pegIkea', 'pegUssa', 'wall', 'wallSecond', 'bushing', 'wheelCover', 'wheelDisk', 'tyre'],
    support: ['manualSupport', 'wheelJig']
  };
  const typeFor = role => Object.keys(roleTypes).find(key => roleTypes[key].includes(role)) || 'other';

  function purpose(part, system) {
    if (part.role === 'topHandle') return text('网格顶盖提手 · 需开启支撑', 'Grid roof handle · Supports required');
    if (part.label) {
      if (part.role === 'gridDivider') return text(part.label.zh.split(' · ')[0], part.label.en.split(' · ')[0]);
      return part.label;
    }
    if (system === 'modifications') {
      const copy = root.ModificationCatalog?.text;
      return text(copy?.zh.roles[part.role]?.[0] || part.name, copy?.en.roles[part.role]?.[0] || part.name);
    }
    if (system === 'drawers' && root.ComponentNotes?.zh.role[part.role]) {
      return text(root.ComponentNotes.zh.role[part.role], root.ComponentNotes.en.role[part.role]);
    }
    if (system === 'sustainers' && part.role === 'module') return text('收纳盒盒体', 'Case body');
    if (system === 'sustainers' && part.role === 'facade') return text('收纳盒前面板', 'Case facade');
    return labels[part.role] || text(part.path.split('/').at(-1), part.path.split('/').at(-1));
  }

  function catalogs() {
    const dependencies = [root.DrawerCatalog, root.DrawerAccessories, root.SustainerCatalog, root.SustainerAccessories, root.ModificationCatalog, root.ComponentNotes];
    if (metadata && dependencies.every((value, index) => value === cachedCatalogs[index])) return metadata;
    cachedCatalogs = dependencies;
    metadata = new Map();
    function add(part, system, configuration) {
      const key = pathKey(part.path);
      if (!metadata.has(key)) metadata.set(key, { label: purpose(part, system), type: typeFor(part.role), fits: new Set() });
      const value = metadata.get(key);
      if (configuration) value.fits.add([configuration.width || '', configuration.depth || '', configuration.height || ''].join('|'));
    }
    function addParts(result, system, configuration) {
      for (const parts of Object.values(result)) if (Array.isArray(parts)) {
        for (const part of parts) if (part.path) add(part, system, configuration);
      }
    }
    if (root.DrawerCatalog) for (const width of widths) for (const depth of depths) for (const height of root.DrawerCatalog.heights(width)) {
      const configuration = { width, depth, height };
      addParts(root.DrawerCatalog.resolve(configuration), 'drawers', configuration);
      if (root.DrawerAccessories) for (const drawerRoof of ['grid', 'heavyweight']) {
        for (const group of root.DrawerAccessories.resolve({ ...configuration, drawerRoof })) {
          for (const part of group.items) add(part, 'drawers', group.warning || group.requiresVerification ? null : configuration);
        }
      }
    }
    if (root.SustainerCatalog) for (const width of widths) for (const depth of root.SustainerCatalog.options(width).depths) {
      for (const height of root.SustainerCatalog.options(width, depth).heights) {
        const allowed = root.SustainerCatalog.options(width, depth, height);
        for (const interior of allowed.interiors) for (const roof of allowed.roofs) {
          const configuration = { width, depth, height, interior, roof };
          addParts(root.SustainerCatalog.resolve(configuration), 'sustainers', configuration);
        }
        if (root.SustainerAccessories) {
          const configuration = { width, depth, height, interior: 'empty', roof: 'whole' };
          for (const group of root.SustainerAccessories.resolve(configuration)) {
            for (const part of group.items) add(part, 'sustainers', group.requiresVerification ? null : configuration);
          }
        }
      }
    }
    if (root.ModificationCatalog) for (const part of root.ModificationCatalog.parts) add(part, 'modifications', part);
    return metadata;
  }

  function markedDimensions(path) {
    const result = { width: '', depth: '', height: '' };
    const model = path.match(/(?:^|[^a-z0-9])(XL|S|M|L)(\d+)(F)?(?=$|[^a-z0-9])/i);
    if (model) {
      result.width = model[1].toUpperCase();
      result[model[3] ? 'height' : 'depth'] = model[2] + (model[3] ? 'F' : '');
    }
    result.width ||= path.match(/(?:^|[^a-z0-9])(XL|S|M|L)(?=$|[^a-z0-9])/i)?.[1].toUpperCase() || '';
    result.height ||= path.match(/(?:^|[^a-z0-9])(\d+F)(?=$|[^a-z0-9])/i)?.[1].toUpperCase() || '';
    result.depth ||= path.match(/(?:^|[^a-z0-9])x(\d+)(?=$|[^a-z0-9])/i)?.[1] || '';
    return [result.width, result.depth, result.height];
  }

  function systemFor(path) {
    return /^01\. drawers\//i.test(path) ? 'drawers' : /^02\. sustainers\//i.test(path) ? 'sustainers'
      : /^03\. modifications\//i.test(path) ? 'modifications' : 'other';
  }

  function prepare(entry, fits) {
    const system = { drawers: 'drawer 抽屉', sustainers: 'sustainer 收纳盒', modifications: 'modification 改造件', other: '' }[entry.system];
    const primary = normalize([entry.name, entry.label.zh, entry.label.en].join(' '));
    const secondary = normalize([entry.path, system].join(' '));
    const words = (primary + ' ' + secondary).match(/[a-z]+/g) || [];
    details.set(entry, { fits, primary, secondary, words: [...new Set(words)] });
  }

  function create(records) {
    const catalog = catalogs();
    const entries = [];
    const seen = new Set();
    for (const record of records || []) {
      if (record.kind !== 'stl' || typeof record.path !== 'string' || seen.has(record.path)) continue;
      seen.add(record.path);
      const known = catalog.get(pathKey(record.path));
      const name = record.path.split('/').at(-1);
      const fits = known?.fits.size ? [...known.fits].map(value => value.split('|')) : [markedDimensions(record.path)];
      const entry = {
        path: record.path, name, system: systemFor(record.path), type: known?.type || 'other',
        label: { ...(known?.label || text(name, name)) },
        widths: [...new Set(fits.map(value => value[0]).filter(Boolean))].sort((a, b) => widths.indexOf(a) - widths.indexOf(b)),
        depths: [...new Set(fits.map(value => value[1]).filter(Boolean))].sort((a, b) => Number(a) - Number(b)),
        heights: [...new Set(fits.map(value => value[2]).filter(Boolean))].sort(),
        size: Number.isFinite(record.file?.size) ? record.file.size : null
      };
      prepare(entry, fits);
      entries.push(entry);
    }
    return entries.sort((a, b) => a.path.localeCompare(b.path, 'en', { numeric: true }));
  }

  function tokens(query) {
    const chunks = normalize(query).match(/[a-z]+\d+f?|\d+f|[a-z]+|\d+(?:\.\d+)?|[\u3400-\u9fff]+/g) || [];
    return chunks.flatMap(chunk => {
      if (!/[\u3400-\u9fff]/.test(chunk)) return [chunk];
      const found = [];
      let pending = '';
      for (let i = 0; i < chunk.length;) {
        const alias = chineseAliases.find(value => chunk.startsWith(value, i));
        if (alias) {
          if (pending) found.push(pending);
          pending = '';
          found.push(alias);
          i += alias.length;
        } else pending += chunk[i++];
      }
      if (pending) found.push(pending);
      return found;
    });
  }

  function oneEditApart(a, b) {
    if (Math.abs(a.length - b.length) > 1) return false;
    if (a.length === b.length) {
      const mismatches = [];
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) mismatches.push(i);
      return mismatches.length <= 1 || (mismatches.length === 2 && mismatches[1] === mismatches[0] + 1
        && a[mismatches[0]] === b[mismatches[1]] && a[mismatches[1]] === b[mismatches[0]]);
    }
    const [short, long] = a.length < b.length ? [a, b] : [b, a];
    let i = 0;
    while (i < short.length && short[i] === long[i]) i++;
    return short.slice(i) === long.slice(i + 1);
  }

  function dimension(token) {
    let match = token.match(/^(xl|s|m|l)(\d+)(f)?$/i);
    if (match) return { width: match[1].toUpperCase(), [match[3] ? 'height' : 'depth']: match[2] + (match[3] ? 'F' : '') };
    if (/^(xl|s|m|l)$/i.test(token)) return { width: token.toUpperCase() };
    if (/^\d+f$/i.test(token)) return { height: token.toUpperCase() };
    match = token.match(/^x(\d+)$/i);
    return match ? { depth: match[1] } : null;
  }

  function containsTerm(field, term, expanded) {
    // Semantic aliases must not turn "lid" into a match for "slide".
    if (expanded && /^[a-z]+$/.test(term)) return new RegExp('(^|[^a-z0-9])' + term + '(?=$|[^a-z0-9])').test(field);
    return field.includes(term);
  }

  function search(entries, filters = {}) {
    const constraints = {};
    for (const key of ['width', 'depth', 'height']) {
      if (filters[key] && filters[key] !== 'all') constraints[key] = String(filters[key]).toUpperCase();
    }
    const words = [];
    for (const token of tokens(filters.query)) {
      const size = dimension(token);
      if (!size) words.push(token);
      else for (const [key, value] of Object.entries(size)) {
        if (constraints[key] && constraints[key] !== value) return [];
        constraints[key] = value;
      }
    }
    const ranked = [];
    entries.forEach((entry, order) => {
      if (filters.system && filters.system !== 'all' && filters.system !== entry.system) return;
      if (filters.type && filters.type !== 'all' && filters.type !== entry.type) return;
      if (!details.has(entry)) prepare(entry, [markedDimensions(entry.path)]);
      const data = details.get(entry);
      if (!data.fits.some(fit => ['width', 'depth', 'height'].every((key, index) => !constraints[key] || fit[index] === constraints[key]))) return;
      let score = 0;
      for (const word of words) {
        const expanded = aliasMap.has(word);
        const terms = aliasMap.get(word) || [word];
        const primary = terms.some(term => containsTerm(data.primary, term, expanded));
        const secondary = !primary && terms.some(term => containsTerm(data.secondary, term, expanded));
        const fuzzy = !primary && !secondary && /^[a-z]{4,}$/.test(word)
          && data.words.some(candidate => candidate.length >= 4 && oneEditApart(word, candidate));
        if (!primary && !secondary && !fuzzy) return;
        score += primary ? (data.primary.includes(word) ? 4 : 3) : secondary ? 2 : 1;
      }
      ranked.push({ entry, score, order });
    });
    return ranked.sort((a, b) => b.score - a.score || a.order - b.order).map(result => result.entry);
  }

  const api = { create, search, types };
  root.ModelIndex = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
