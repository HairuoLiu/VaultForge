(function () {
  'use strict';
  const copy = {
    en: {
      title: 'See how it fits together.', intro: 'A readable structure reference, with the next step close at hand.',
      drawers: 'Drawers', sustainers: 'Sustainers', modifications: 'Modifications',
      current: 'Your configuration', reference: 'System reference', systems: 'Assembly systems', pan: 'Diagram. Use arrow keys to scroll when enlarged.',
      disclaimer: 'This diagram explains the system. Dimensions and required parts follow your selected configuration.',
      zoom: 'Enlarge diagram', close: 'Close diagram', zoomIn: 'Zoom in', zoomOut: 'Zoom out', fit: 'Fit image',
      manual: 'Open matching assembly guide', parts: 'Review optional parts', hardware: 'Check hardware',
      connect: 'Connect Vault folder', change: 'Choose another folder',
      disconnected: 'Connect your resource folder to see the original component diagrams.',
      missing: 'This reference image is missing from the selected folder. You can still use the parts list and manuals.',
      source: 'Original diagram · USSA Design',
      drawerTip: 'Follow the module, box and runner assembly. Add a roof only where your stack needs one.',
      sustainerTip: 'Check the lid, hinge and latch set together. Interior parts must match the body variant.',
      modsTip: 'Check the selected modification and mounting instructions before combining optional parts.',
      imageHint: 'Open the complete diagram · Zoom to read the labels'
    },
    zh: {
      title: '看清结构，再开始组装。', intro: '把零件的配合关系看清楚，也把下一步操作放在手边。',
      drawers: '抽屉', sustainers: '收纳盒', modifications: '选配改造件',
      current: '当前配置', reference: '系列结构参考', systems: '组装系列', pan: '结构图；放大后可使用方向键滚动。',
      disclaimer: '图解用于理解系列结构；实际尺寸与必需零件以当前配置的文件列表为准。',
      zoom: '放大结构图', close: '关闭结构图', zoomIn: '放大', zoomOut: '缩小', fit: '适合窗口',
      manual: '查看对应组装说明', parts: '查看可选配件', hardware: '核对五金用量',
      connect: '连接 Vault 文件夹', change: '更换资源文件夹',
      disconnected: '连接资源文件夹后，即可查看原包组件结构图。',
      missing: '所选文件夹缺少这张结构图，仍可查看零件列表和组装说明。',
      source: '原包结构图 · USSA Design',
      drawerTip: '按外框、内盒与导轨的配合关系组装；顶盖只在需要的位置选装。',
      sustainerTip: '翻盖、铰链和锁扣需成套核对；内装配件要与盒体方案匹配。',
      modsTip: '组合选配件前，先核对对应改造方案与安装说明。',
      imageHint: '查看完整图解 · 放大阅读零件标注'
    }
  };
  const diagrams = {
    drawers: '01. DRAWERS/Drawers Naming.png',
    sustainers: '02. SUSTAINERS/Sustainer Naming.png',
    modifications: '03. MODIFICATIONS/XL Mods Naming.png'
  };
  const $ = id => document.getElementById(id);
  let state = { system: 'drawers', language: 'en', configuration: {} };
  let callbacks;
  let zoom = 1;
  const t = () => copy[state.language];
  const dialog = $('reference-dialog');
  function setZoom(value) {
    zoom = Math.max(1, Math.min(4, value));
    const fullImage = $('reference-full-image');
    const pan = $('reference-pan');
    const source = $('reference-image');
    const ratio = source.naturalWidth / source.naturalHeight || 1;
    const fitWidth = Math.min(pan.clientWidth, parseFloat(getComputedStyle(pan).maxHeight) * ratio);
    fullImage.style.width = `${fitWidth * zoom}px`;
    $('reference-zoom-value').textContent = `${Math.round(zoom * 100)}%`;
    $('reference-zoom-out').disabled = zoom <= 1;
    $('reference-zoom-in').disabled = zoom >= 4;
    if (zoom === 1) $('reference-pan').scrollTo(0, 0);
  }
  function refresh() {
    const text = t();
    document.querySelectorAll('[data-reference-copy]').forEach(node => { node.textContent = text[node.dataset.referenceCopy]; });
    document.querySelectorAll('[data-reference-system]').forEach(button => {
      button.textContent = text[button.dataset.referenceSystem];
      button.setAttribute('aria-pressed', String(button.dataset.referenceSystem === state.system));
    });
    const c = state.configuration;
    $('reference-configuration').textContent = state.system === 'modifications' ? text.modifications : `${text[state.system]} · ${c.width || 'S'}${c.depth || '3'} / ${c.height || '1F'}`;
    $('reference-tip').textContent = text[state.system === 'drawers' ? 'drawerTip' : state.system === 'sustainers' ? 'sustainerTip' : 'modsTip'];
    const url = VaultResources.getURL(diagrams[state.system]);
    $('reference-figure').hidden = !url;
    $('reference-empty').hidden = !!url;
    $('reference-layout').classList.toggle('is-empty', !url);
    $('reference-empty-message').textContent = text[VaultResources.connected ? 'missing' : 'disconnected'];
    $('reference-connect').textContent = text[VaultResources.connected ? 'change' : 'connect'];
    $('reference-image').alt = `${text[state.system]} · ${text.reference}`;
    $('reference-image-open').setAttribute('aria-label', text.zoom);
    $('reference-pan').setAttribute('aria-label', text.pan);
    document.querySelector('.reference-systems').setAttribute('aria-label', text.systems);
    if (url) $('reference-image').src = url;
    else $('reference-image').removeAttribute('src');
    $('reference-hardware').hidden = state.system === 'modifications';
    if (dialog.open) dialog.close();
  }
  window.AssemblyReference = {
    init(actions) { callbacks = actions; refresh(); },
    update(next) { state = next; refresh(); }
  };
  document.querySelectorAll('[data-reference-system]').forEach(button => button.addEventListener('click', () => callbacks?.system(button.dataset.referenceSystem)));
  $('reference-connect').addEventListener('click', () => VaultConnection.choose());
  $('reference-manual').addEventListener('click', event => { event.preventDefault(); callbacks?.manual(state.system); });
  $('reference-parts').addEventListener('click', event => { event.preventDefault(); callbacks?.parts(state.system); });
  $('reference-hardware').addEventListener('click', event => { event.preventDefault(); callbacks?.hardware(); });
  $('reference-image-open').addEventListener('click', () => {
    const url = VaultResources.getURL(diagrams[state.system]);
    if (!url) return;
    $('reference-full-image').src = url;
    $('reference-full-image').alt = $('reference-image').alt;
    $('reference-dialog-title').textContent = `${t()[state.system]} · ${t().reference}`;
    dialog.showModal(); setZoom(1); $('reference-close').focus();
  });
  $('reference-close').addEventListener('click', () => dialog.close());
  $('reference-zoom-in').addEventListener('click', () => setZoom(zoom + .5));
  $('reference-zoom-out').addEventListener('click', () => setZoom(zoom - .5));
  $('reference-fit').addEventListener('click', () => setZoom(1));
  $('reference-full-image').addEventListener('load', () => { if (dialog.open) setZoom(zoom); });
  window.addEventListener('resize', () => { if (dialog.open) setZoom(zoom); });
  dialog.addEventListener('close', () => { $('reference-full-image').removeAttribute('src'); $('reference-image-open').focus({ preventScroll: true }); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  window.addEventListener('vaultchange', refresh);
})();
