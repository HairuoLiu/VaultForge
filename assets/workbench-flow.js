(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const copy = {
    en: {
      folder: 'Folder', configure: 'Configure', review: 'Review parts', plan: 'Print plan', steps: 'Build steps',
      folderSettings: 'Folder settings', startTitle: 'Start with your Vault folder.',
      startHint: 'Choose the extracted resource folder above. Then we can preview the models and check which files are available.',
      browse: 'Browse sizes without a folder', configTitle: 'What would you like to build?',
      sizeHint: 'Depth is measured on a 42 mm grid, not the outside of the finished module. Check model dimensions in 3D preview.',
      placement: 'Does this drawer need a roof?', lower: 'No · another drawer sits above it', top: 'Yes · standalone, top tier or mounting',
      roofStyle: 'Roof style', noRoof: 'No roof is included. For a standalone drawer or the top of a stack, choose a roof.',
      withRoof: 'The selected roof will be included in the required parts.', moreOptions: 'More options & notes', sizeHelp: 'Sizing and assembly notes',
      reviewAction: 'Review required parts', reviewTitle: 'Parts for this build', edit: 'Change configuration',
      oneBuild: 'Add one module. You can rename it and change quantities in your print plan.', customizePlan: 'Name or print several modules', exportReviewPdf: 'Export Purchase BOM (PDF)',
      required: 'Required STL files', copiesHint: 'Quantities count STL copies for one module. Preview a file to check its geometry.',
      unresolved: 'Divider quantities depend on your layout. Fill them in after adding this build to your plan.',
      offline: 'Folder not connected. You can plan this build; connect your folder to preview or save its files.',
      files: n => `${n} required STL files for one module`, missing: n => `${n} required files are missing from this folder.`,
      optional: 'Optional parts stay separate until you choose an applicable configuration.',
      selection: (name, c) => `${name} ${c.width}${c.depth} / ${c.height}`, drawers: 'Drawer', sustainers: 'Sustainer'
    },
    zh: {
      folder: '文件夹', configure: '选配置', review: '核对零件', plan: '打印清单', steps: '组装准备步骤',
      folderSettings: '管理文件夹', startTitle: '先选择你的 Vault 文件夹。',
      startHint: '在上方选择解压后的资源文件夹，之后就能预览模型，并检查需要的文件是否齐全。',
      browse: '暂不连接，先看看规格', configTitle: '你想做什么？',
      sizeHint: '深度按 42 mm 网格计算，不是成品外尺寸。可在 3D 预览中核对模型尺寸。',
      placement: '这个抽屉需要顶盖吗？', lower: '不需要 · 上面还会叠放抽屉', top: '需要 · 独立使用、最顶层或吊装',
      roofStyle: '顶盖样式', noRoof: '当前不含顶盖。独立使用或放在最顶层时，请选择需要顶盖。',
      withRoof: '所选顶盖会一起列入必需零件。', moreOptions: '更多选项与组装备注', sizeHelp: '尺寸与组装备注',
      reviewAction: '查看必需零件', reviewTitle: '这次需要打印什么？', edit: '修改配置',
      oneBuild: '默认加入 1 套，名称和数量也可以稍后在打印清单中修改。', customizePlan: '命名或批量打印', exportReviewPdf: '🖨️ 导出当前配置采购单 (PDF)',
      required: '当前方案的必需文件', copiesHint: '数量按每套的 STL 打印份数计算，可先预览模型再准备打印。',
      unresolved: '隔板数量取决于你的布局，加入清单后还需填写。',
      offline: '尚未连接文件夹，可以先规划；连接后才能预览或保存文件。',
      files: n => `每套需要 ${n} 个 STL 文件`, missing: n => `当前文件夹缺少其中 ${n} 个文件，请先核对资源。`,
      optional: '选装配件单独列出，采用对应方案后才会计入清单。',
      selection: (name, c) => `${name} ${c.width}${c.depth} / ${c.height}`, drawers: '抽屉', sustainers: '收纳盒'
    }
  };
  let api;
  let phase = 'connect';
  let wasConnected = false;
  function scroll(id, focus) {
    $(id).scrollIntoView({ behavior: 'instant', block: 'start' });
    if (focus) { $(id).tabIndex = -1; $(id).focus({ preventScroll: true }); }
  }
  function update() {
    if (!api) return;
    const { language, system, configuration: c, tab } = api.snapshot();
    const t = copy[language];
    const connected = VaultResources.connected;
    if (connected && !wasConnected && phase === 'connect') phase = 'config';
    wasConnected = connected;
    document.querySelectorAll('[data-flow-copy]').forEach(node => { node.textContent = t[node.dataset.flowCopy]; });
    $('flow-steps').setAttribute('aria-label', t.steps);
    $('flow-steps').hidden = !['finder', 'plan'].includes(tab);
    $('flow-start').hidden = phase !== 'connect';
    $('config-panel').hidden = phase !== 'config';
    $('review-panel').hidden = phase !== 'review';
    $('flow-step-review').disabled = phase === 'connect';
    const step = tab === 'plan' ? 'tab-btn-plan' : tab === 'finder' ? phase === 'connect' ? 'flow-folder' : phase === 'config' ? 'tab-btn-finder' : 'flow-step-review' : '';
    $('flow-steps').querySelectorAll('button').forEach(button => {
      button.classList.toggle('is-current', button.id === step);
      button.removeAttribute('aria-pressed');
      if (button.id === step) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    $('flow-folder-toggle').hidden = !connected;
    $('drawer-placement').value = c.drawerRoof === 'none' ? 'lower' : 'top';
    $('drawer-roof-choice').hidden = system !== 'drawers' || c.drawerRoof === 'none';
    $('flow-roof-hint').hidden = system !== 'drawers';
    $('flow-roof-hint').textContent = c.drawerRoof === 'none' ? t.noRoof : t.withRoof;
    $('drawer-key-choice').hidden = system !== 'drawers';
    $('sustainer-lid-choice').hidden = system !== 'sustainers';
    $('flow-choice-summary').textContent = t.selection(t[system], c);
    $('title-size-files').textContent = t.required;
    $('file-action-hint').textContent = t.copiesHint;
    const parts = BuildPlan.resolve(system, c).parts;
    const missing = connected ? parts.filter(part => !VaultResources.getFile(part.path)).length : 0;
    $('flow-result-summary').textContent = [t.files(parts.length), !connected ? t.offline : missing ? t.missing(missing) : '', parts.some(part => part.qty === null) ? t.unresolved : '', system === 'drawers' && c.drawerRoof === 'none' ? t.noRoof : ''].filter(Boolean).join(' ');
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }
  function edit(move = true) {
    phase = 'config'; api.openTab('finder'); update();
    if (move) scroll('config-panel', true);
  }
  function review(move = true) {
    phase = 'review'; api.openTab('finder'); update();
    if (move) scroll('review-panel', true);
  }
  window.WorkbenchFlow = {
    init(options) { api = options; update(); }, update, edit, review,
    start() {
      phase = VaultResources.connected ? 'config' : 'connect';
      api.openTab('finder'); update(); scroll(VaultResources.connected ? 'config-panel' : 'vault-connection', true);
    },
    browse() { edit(); },
    folder() {
      if (!VaultResources.connected) phase = 'connect';
      api.openTab('finder');
      $('vault-connection').classList.add('is-expanded');
      $('flow-folder-toggle').setAttribute('aria-expanded', 'true');
      update(); scroll('vault-connection', true);
    },
    placement(value) {
      if (value === 'lower') $('drawer-roof').value = 'none';
      else if ($('drawer-roof').value === 'none') $('drawer-roof').value = 'grid';
      api.changeConfiguration();
    }
  };
  $('flow-folder-toggle').addEventListener('click', () => {
    const expanded = $('vault-connection').classList.toggle('is-expanded');
    $('flow-folder-toggle').setAttribute('aria-expanded', String(expanded));
  });
  window.addEventListener('vaultchange', () => {
    if (VaultResources.connected) {
      $('vault-connection').classList.remove('is-expanded');
      $('flow-folder-toggle').setAttribute('aria-expanded', 'false');
    }
    update();
  });
})();
