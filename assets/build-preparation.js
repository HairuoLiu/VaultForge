(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const copy = {
    zh: { topHandle: '安装网格顶盖提手', topHandleHint: '同时加入 1 份顶部提手 STL 和 2 颗 M6 × 50 mm 螺丝。提手打印需开启支撑。', assemblyTitle: '安装顺序与说明', size: '五金规格', quantity: '每套数量', purpose: '安装用途', pieces: '颗', perBuild: '按当前配置的 1 套用量列出，加入打印清单后随模块数量累计。', source: (id, page) => `${id} 号说明书 · 第 ${page} 页`, reviewTitle: '这些项目还需核对', addedHandle: '含顶部提手' },
    en: { topHandle: 'Include the Grid roof handle', topHandleHint: 'Adds one top-handle STL and two M6 × 50 mm bolts. Enable supports when printing the handle.', assemblyTitle: 'Assembly order & guides', size: 'Hardware', quantity: 'Per module', purpose: 'Used for', pieces: 'pcs', perBuild: 'Quantities are for one configured module. Your print plan multiplies them by the number of modules.', source: (id, page) => `Manual ${id} · page ${page}`, reviewTitle: 'Check before assembly', addedHandle: 'Top handle included' }
  };
  function links(sources, language) {
    return [...new Map(sources.map(source => [`${source.id}:${source.page}`, source])).values()].map(source => `<a href="#workspace" onclick="openManualAt('${source.id}', ${source.page})">${copy[language].source(source.id, source.page)}</a>`).join(' · ');
  }
  window.BuildPreparation = {
    render(system, configuration, language) {
      const t = copy[language];
      t.gearedRails = language === 'zh' ? '加入齿形锁定条（可选）' : 'Include geared locking rails (optional)';
      t.gearedRailsHint = language === 'zh' ? '用于增强锁定力，或同一外框内放多个内盒；不影响必需的滑动导轨。参考 02 号说明书第 4 页。' : 'For extra locking force or multiple boxes in one module. The required runner guides and slides remain included. See manual 02, page 4.';
      const result = BuildPlan.resolve(system, configuration);
      const guide = AssemblyGuidance.forBuild(system, configuration);
      document.querySelectorAll('[data-preparation-copy]').forEach(node => { node.textContent = t[node.dataset.preparationCopy]; });
      $('drawer-handle-choice').hidden = system !== 'drawers' || configuration.drawerRoof !== 'grid';
      $('drawer-rails-choice').hidden = system !== 'drawers';
      const rows = result.hardware.map(part => {
        const matching = guide.hardware.filter(item => item.size === part.size);
        const purpose = matching.map(item => (matching.length > 1 && item.qty != null ? `×${item.qty} ` : '') + item.purpose[language]).join('；') || ComponentNotes[language].hardwareUse?.[part.role] || '';
        const sources = matching.flatMap(item => item.sources || []);
        if (!sources.length && part.sourceManual) sources.push({ id: part.sourceManual, page: part.sourcePage });
        return `<tr><th scope="row">${escape(part.size)}</th><td>×${part.qty}</td><td>${escape(purpose)}<div class="preparation-source">${links(sources, language)}</div></td></tr>`;
      }).join('');
      $('hardware-spec').innerHTML = `<table class="build-hardware-table"><thead><tr><th>${t.size}</th><th>${t.quantity}</th><th>${t.purpose}</th></tr></thead><tbody>${rows}</tbody></table><p class="source-note">${t.perBuild}</p>`;
      const critical = configuration.topHandle ? 'roof-handle' : configuration.drawerRoof === 'mount' ? 'under-table' : configuration.roof === 'split' ? 'split-lid' : 'roof';
      $('build-assembly-steps').innerHTML = guide.steps.map(step => `<li><details class="assembly-step" ${step.id === critical ? 'open' : ''}><summary>${escape(step.title[language])}</summary><p>${escape(step.note[language])}</p><div class="preparation-source">${links(step.sources || [], language)}</div></details></li>`).join('');
      const warnings = guide.warnings || [];
      $('build-cautions').hidden = !warnings.length;
      $('build-cautions').innerHTML = warnings.length ? `<strong>${t.reviewTitle}</strong>${warnings.map(warning => `<p>${escape(warning.text[language])} <span class="preparation-source">${links(warning.sources || [], language)}</span></p>`).join('')}` : '';
      if (configuration.drawerRoof === 'heavyweight') {
        $('build-cautions').insertAdjacentHTML('beforeend', `<button type="button" class="flow-text-button" onclick="AccessoryView.scrollToSlot('roof')">${language === 'zh' ? '查看对应提手、嵌件和备选顶盖' : 'Review the matching handle, inserts and roof variant'}</button>`);
      }
    }
  };
})();
