(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const pageSize = 50;
  const defaults = { query: '', system: 'all', type: 'all', width: 'all', depth: 'all', height: 'all', page: 1 };
  const copy = {
    zh: {
      title: '找到你要的模型。', intro: '用中文、英文或规格，搜索整个资源文件夹。',
      searchLabel: '搜索全部模型', placeholder: '搜索名称、用途或规格，例如 S3 导轨', search: '搜索', try: '试试',
      examples: { runner: 'S3 导轨', handle: '提手', divider: 'L6 隔板' },
      all: '全部', drawers: '抽屉', sustainers: '收纳盒', modifications: '改造件', other: '其他',
      systems: '模型所属系统', more: '按类型和规格筛选', type: '零件类型', width: '宽度规格', depth: '深度', height: '层高',
      sizeHint: '尺寸按已知适配关系筛选；未确认规格的文件仍可通过名称或路径搜索。',
      reset: '清除搜索与筛选', connect: '选择 Vault 文件夹', prev: '上一页', next: '下一页', pagination: '模型搜索结果分页',
      count: (total, start, end) => total ? `${total} 个匹配文件 · 显示 ${start}–${end}` : '没有匹配的文件',
      source: (name, count) => `${name} 中的 ${count} 个 STL 文件。目录按实际文件建立，新增模型也会收录。`,
      disconnected: '连接文件夹后，可搜索其中的全部 STL。',
      noFolder: '先连接你的模型文件夹', noFolderHint: '使用上方已连接的 Vault 文件夹即可，无需再次导入。文件只在本地处理。',
      noFiles: '这个文件夹中没有 STL 文件', noFilesHint: '请选择包含抽屉、收纳盒或改造件的完整资源包。',
      noMatches: '换个关键词试试', noMatchesHint: '可以搜索原文件名，也可以减少关键词或清除规格筛选。',
      conflicts: count => `${count} 个 STL 路径存在冲突，暂未列入可用结果。请核对资源文件夹。`,
      page: (number, total) => `第 ${number} / ${total} 页`, fullPath: '完整路径', copyPath: '复制路径',
      copyLabel: name => `复制相对路径：${name}`, copied: '已复制相对路径', copyFailed: '未能复制，请展开完整路径后手动复制。',
      locate: '定位到文件', locating: '正在定位…', located: '已请求在文件管理器中选中原文件。',
      unavailable: '无法连接本地预览服务，请重新启动脚本。', mismatch: '页面与脚本的资源目录不一致，或文件已更新，请重新扫描并核对。', failed: '定位失败，请核对文件或重试。',
      unknown: '未分类文件', unspecified: '规格未标注', depthTag: value => `深度 ${value}`, fileSize: '文件大小'
    },
    en: {
      title: 'Find your next part.', intro: 'Search your entire resource folder by name, purpose or size, in either language.',
      searchLabel: 'Search all models', placeholder: 'Search names, purposes or sizes, e.g. S3 runner', search: 'Search', try: 'Try',
      examples: { runner: 'S3 runner', handle: 'handle', divider: 'L6 divider' },
      all: 'All', drawers: 'Drawers', sustainers: 'Cases', modifications: 'Modifications', other: 'Other',
      systems: 'Model system', more: 'Filter by type and size', type: 'Part type', width: 'Width', depth: 'Depth', height: 'Height',
      sizeHint: 'Size filters use known compatibility. Files without confirmed sizes remain searchable by name or path.',
      reset: 'Clear search & filters', connect: 'Choose Vault folder', prev: 'Previous', next: 'Next', pagination: 'Model search result pages',
      count: (total, start, end) => total ? `${total} matching files · Showing ${start}–${end}` : 'No matching files',
      source: (name, count) => `${count} STL files in ${name}. The index follows the actual folder, including newly added models.`,
      disconnected: 'Connect your folder to search all of its STL files.',
      noFolder: 'Connect your model folder', noFolderHint: 'Uses the Vault folder connected above. No separate import is needed, and files stay on this device.',
      noFiles: 'No STL files in this folder', noFilesHint: 'Choose the complete resource pack containing drawers, cases or modifications.',
      noMatches: 'Try another search', noMatchesHint: 'Try an original filename, fewer keywords, or clear the size filters.',
      conflicts: count => `${count} STL paths conflict and are excluded from available results. Check your resource folder.`,
      page: (number, total) => `Page ${number} of ${total}`, fullPath: 'Full path', copyPath: 'Copy path',
      copyLabel: name => `Copy relative path: ${name}`, copied: 'Relative path copied', copyFailed: 'Could not copy. Expand the full path and copy it manually.',
      locate: 'Show in folder', locating: 'Locating…', located: 'Requested the file manager to select the original file.',
      unavailable: 'Cannot reach the local preview service. Restart the launcher.', mismatch: 'The page and launcher use different resources, or this file changed. Rescan and check the folder.', failed: 'Could not locate the file. Check it and try again.',
      unknown: 'Unclassified file', unspecified: 'Size not specified', depthTag: value => `Depth ${value}`, fileSize: 'File size'
    }
  };
  let language = 'en';
  let state = { ...defaults };
  let entries = [];
  let onChange = () => {};
  let initialized = false;
  let active = false;
  let hasLocalService = false;
  let timer;
  let motion;
  let capabilityRequest = 0;
  const t = () => copy[language];

  function filtered() {
    return state.query.trim() || ['system', 'type', 'width', 'depth', 'height'].some(key => state[key] !== 'all');
  }

  function selectOptions(id, choices, selected) {
    $(id).replaceChildren(...choices.map(([value, text]) => new Option(text, value)));
    $(id).value = selected;
  }

  function updateLabels() {
    document.querySelectorAll('[data-model-copy]').forEach(node => { node.textContent = t()[node.dataset.modelCopy]; });
    $('model-query').placeholder = t().placeholder;
    if ($('model-query').value !== state.query) $('model-query').value = state.query;
    $('model-systems').setAttribute('aria-label', t().systems);
    $('model-pagination').setAttribute('aria-label', t().pagination);
    document.querySelectorAll('[data-model-example]').forEach(button => { button.textContent = t().examples[button.dataset.modelExample]; });
    selectOptions('model-type', [['all', t().all], ...ModelIndex.types.map(type => [type.key, type.label[language]])], state.type);
    for (const [field, values] of Object.entries({ width: ['S', 'M', 'L', 'XL'], depth: ['3', '4', '5', '6', '7'], height: ['1F', '2F', '4F'] })) {
      selectOptions('model-' + field, [['all', t().all], ...values.map(value => [value, value])], state[field]);
    }
  }

  function fileSize(bytes) {
    if (!Number.isFinite(bytes)) return '';
    return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function fileMarkup(entry) {
    const label = entry.label[language] === entry.name ? t().unknown : entry.label[language];
    const dimensions = [entry.widths.join(' / '), entry.depths.length ? t().depthTag(entry.depths.join(' / ')) : '', entry.heights.join(' / ')].filter(Boolean).join(' · ') || t().unspecified;
    const separator = entry.path.lastIndexOf('/');
    const directory = separator < 0 ? VaultResources.index.name : entry.path.slice(0, separator);
    return `<li class="file-card model-file" data-model-path="${escape(entry.path)}"><div class="file-info"><span class="part-role">${escape(label)}</span><a class="file-name" href="${escape(encodeURI(entry.path))}">${escape(entry.name)}</a><div class="model-file-meta"><span>${escape(t()[entry.system])}</span><span>${escape(dimensions)}</span>${entry.size != null ? `<span title="${t().fileSize}">${fileSize(entry.size)}</span>` : ''}</div><span class="model-directory">${escape(directory)}</span><details class="file-details"><summary>${t().fullPath}</summary><div class="file-detail-content"><span class="file-path">${escape(entry.path)}</span></div></details><span class="model-feedback" role="status" aria-live="polite" hidden></span></div></li>`;
  }

  function render() {
    if (!initialized) return;
    const connected = VaultResources.connected;
    const matches = connected ? ModelIndex.search(entries, state) : [];
    const pages = Math.max(1, Math.ceil(matches.length / pageSize));
    if (connected) state.page = Math.min(state.page, pages);
    const offset = (state.page - 1) * pageSize;
    const visible = matches.slice(offset, offset + pageSize);
    document.querySelectorAll('[data-model-system]').forEach(button => {
      const system = button.dataset.modelSystem;
      const count = system === 'all' ? entries.length : entries.filter(entry => entry.system === system).length;
      button.innerHTML = `${t()[system]}<span>${count}</span>`;
      button.setAttribute('aria-pressed', String(state.system === system));
      button.hidden = system === 'other' && !count && state.system !== 'other';
    });
    $('model-result-count').textContent = connected ? t().count(matches.length, offset + 1, offset + visible.length) : t().disconnected;
    $('model-reset').hidden = !filtered();
    $('model-source-note').textContent = connected ? t().source(VaultResources.index.name, entries.length) : '';
    const conflicts = connected ? [...VaultResources.index.ambiguous].filter(path => path.endsWith('.stl')).length : 0;
    $('model-conflicts').hidden = !conflicts;
    $('model-conflicts').textContent = conflicts ? t().conflicts(conflicts) : '';
    $('model-empty').hidden = !!matches.length;
    $('model-empty-title').textContent = !connected ? t().noFolder : entries.length ? t().noMatches : t().noFiles;
    $('model-empty-hint').textContent = !connected ? t().noFolderHint : entries.length ? t().noMatchesHint : t().noFilesHint;
    $('model-connect').hidden = connected && !!entries.length;
    $('model-results').innerHTML = visible.map(fileMarkup).join('');
    STLPreview.decorate($('model-results'));
    LocalFiles.decorate($('model-results'));
    $('model-results').querySelectorAll('.model-file').forEach(row => {
      const actions = row.querySelector('.stl-actions');
      const copyButton = document.createElement('button');
      copyButton.type = 'button'; copyButton.dataset.modelCopyPath = ''; copyButton.textContent = t().copyPath;
      copyButton.setAttribute('aria-label', t().copyLabel(row.querySelector('.file-name').textContent));
      const locateButton = document.createElement('button');
      locateButton.type = 'button'; locateButton.dataset.modelLocate = ''; locateButton.textContent = t().locate;
      locateButton.hidden = !hasLocalService;
      actions.insertBefore(copyButton, actions.querySelector('.stl-download-link'));
      actions.insertBefore(locateButton, actions.querySelector('.stl-download-link'));
      row.querySelector('.file-details').addEventListener('toggle', () => window.ScrollTrigger?.refresh());
    });
    $('model-pagination').hidden = matches.length <= pageSize;
    $('model-prev').disabled = state.page <= 1;
    $('model-next').disabled = state.page >= pages;
    $('model-page').textContent = t().page(state.page, pages);
    window.ScrollTrigger?.refresh();
  }

  function rebuild() {
    entries = ModelIndex.create(VaultResources.index?.records.values() || []);
    render();
  }

  function change(patch, { scroll = false } = {}) {
    clearTimeout(timer);
    const query = String(patch.query ?? $('model-query').value).slice(0, 160);
    const queryChanged = query !== state.query;
    state = { ...state, page: 1, ...patch, query };
    if (queryChanged) state.page = 1;
    render();
    onChange();
    if (scroll) {
      $('model-result-count').scrollIntoView({ behavior: 'instant', block: 'start' });
      $('model-result-count').tabIndex = -1;
      $('model-result-count').focus({ preventScroll: true });
    }
  }

  function notify(row, message) {
    const feedback = row.querySelector('.model-feedback');
    feedback.hidden = false;
    feedback.textContent = message;
  }

  async function copyPath(row, button) {
    const path = row.dataset.modelPath;
    let copied = false;
    try { await navigator.clipboard.writeText(path); copied = true; } catch (_) { /* Local HTML may require the selection-based fallback. */ }
    if (!copied) {
      const input = document.createElement('textarea');
      input.value = path; input.readOnly = true; input.className = 'model-clipboard';
      document.body.append(input); input.select();
      try { copied = document.execCommand('copy'); } catch (_) { /* The visible path remains available for manual copying. */ }
      input.remove();
      if (button.isConnected) button.focus({ preventScroll: true });
    }
    if (row.isConnected) {
      notify(row, copied ? t().copied : t().copyFailed);
      if (!copied) row.querySelector('.file-details').open = true;
    }
  }

  async function locate(row, button) {
    if (button.disabled) return;
    button.disabled = true; button.textContent = t().locating;
    const result = await LocalFileService.reveal(row.dataset.modelPath);
    if (!row.isConnected) return;
    button.disabled = false; button.textContent = t().locate;
    const message = result.ok ? t().located : result.error === 'unavailable' ? t().unavailable : ['mismatch', 'resource_root', 'missing'].includes(result.error) ? t().mismatch : t().failed;
    notify(row, message);
  }

  function animateEntry() {
    motion?.revert();
    motion = null;
    if (!window.gsap || !active) return;
    motion = gsap.matchMedia();
    motion.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.model-intro, .model-toolbar', { y: 10, opacity: 0, duration: .28, stagger: .05, ease: 'power2.out', clearProps: 'all' });
      gsap.from('#model-results > :nth-child(-n+6)', { y: 8, opacity: 0, duration: .24, stagger: .025, ease: 'power2.out', clearProps: 'all' });
    });
  }

  window.ModelLibrary = {
    selection() { return { ...state, query: $('model-query').value.slice(0, 160) }; },
    setLanguage(value) {
      language = value === 'zh' ? 'zh' : 'en';
      if (!initialized) return;
      state.query = $('model-query').value.slice(0, 160);
      updateLabels(); render();
    },
    async activate(value) {
      const entering = value && !active;
      active = value;
      if (!active) { motion?.revert(); motion = null; return; }
      if (entering) animateEntry();
      const request = ++capabilityRequest;
      const available = await LocalFileService.available({ refresh: entering });
      if (request !== capabilityRequest || !active) return;
      hasLocalService = available;
      document.querySelectorAll('[data-model-locate]').forEach(button => { button.hidden = !available; });
    },
    init(options) {
      language = options.language === 'zh' ? 'zh' : 'en';
      state = { ...defaults, ...options.selection };
      if (!ModelIndex.types.some(type => type.key === state.type)) state.type = 'all';
      onChange = options.onChange;
      initialized = true;
      updateLabels();
      $('model-more').open = ['type', 'width', 'depth', 'height'].some(key => state[key] !== 'all');
      $('model-query').addEventListener('input', event => {
        clearTimeout(timer);
        if (event.isComposing) return;
        timer = setTimeout(() => change({ query: $('model-query').value.slice(0, 160) }), 140);
      });
      $('model-query').addEventListener('compositionend', () => change({ query: $('model-query').value.slice(0, 160) }));
      $('model-search').addEventListener('submit', event => { event.preventDefault(); change({ query: $('model-query').value.slice(0, 160) }); });
      document.querySelectorAll('[data-model-example]').forEach(button => button.addEventListener('click', () => {
        $('model-query').value = t().examples[button.dataset.modelExample];
        change({ ...defaults, query: $('model-query').value });
        updateLabels(); $('model-query').focus({ preventScroll: true });
      }));
      document.querySelectorAll('[data-model-system]').forEach(button => button.addEventListener('click', () => change({ query: $('model-query').value, system: button.dataset.modelSystem })));
      for (const field of ['type', 'width', 'depth', 'height']) $('model-' + field).addEventListener('change', event => change({ query: $('model-query').value, [field]: event.target.value }));
      $('model-reset').addEventListener('click', () => { state = { ...defaults }; updateLabels(); change({}); $('model-query').focus({ preventScroll: true }); });
      $('model-connect').addEventListener('click', () => VaultConnection.choose());
      $('model-prev').addEventListener('click', () => change({ page: state.page - 1 }, { scroll: true }));
      $('model-next').addEventListener('click', () => change({ page: state.page + 1 }, { scroll: true }));
      $('model-results').addEventListener('click', event => {
        const button = event.target.closest('[data-model-copy-path], [data-model-locate]');
        if (!button) return;
        const row = button.closest('.model-file');
        if (button.hasAttribute('data-model-copy-path')) copyPath(row, button);
        else locate(row, button);
      });
      window.addEventListener('vaultchange', rebuild);
      rebuild();
    }
  };
})();
