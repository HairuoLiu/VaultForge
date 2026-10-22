(function (root) {
  'use strict';
  const $ = id => document.getElementById(id);
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const copy = {
    en: {
      tab: 'Print plan', title: 'Your print plan', intro: 'Combine builds into one STL and hardware list. Totals include all builds, including completed ones. Status applies to the entire named batch.',
      name: 'Build name (optional)', count: 'Number of modules', add: 'Add to print plan', view: 'View print plan', empty: 'Your plan is empty. Choose a configuration in Component Finder, then add it here.',
      export: 'Export CSV', remove: 'Remove', restore: 'Load configuration', status: 'Batch status', pending: 'To print', printed: 'Printed', assembled: 'Assembled',
      layout: 'Layout quantities · STL copies per module', layoutHint: 'Enter a quantity for each divider file; enter 0 when unused. Paired parts already in one STL count as one copy. Changing quantities resets the batch to “To print”.',
      unresolved: 'Fill in all layout quantities below before exporting.', files: 'Combined STL list', hardware: 'Combined hardware reference',
      copies: 'STL copies', unknown: 'Quantity needed', missing: 'Missing locally', disconnected: 'Select your Vault folder to check file availability.',
      storage: 'This browser cannot save your workspace. Your changes remain available in this tab; export your list before closing.', recovered: 'Some saved data could not be restored. Check your plan before printing.',
      invalid: 'Use whole numbers: 1–999 modules, 0–999 copies per module.', limit: 'A plan can contain up to 200 named builds.', added: 'Added to your print plan.',
      hardwareNote: 'Hardware totals follow the catalog’s manual references. Check mounting holes and any extra hardware needed for your installation.',
      keyLabel: 'Key style', roofLabel: 'Drawer roof · one per module', standard: 'Standard key', hidden: 'Hidden key · 2 files', none: 'No roof · lower tiers',
      grid: 'Grid roof', table: 'Table roof', bowl: 'Bowl roof', mount: 'Under-table mount roof', heavyweight: 'Heavyweight roof',
      drawers: 'Drawers', sustainers: 'Sustainers', emptyInterior: 'Empty', gridfinity: 'Gridfinity', dividers: 'Dividers', sealed: 'Sealed dividers', whole: 'Whole lid', split: 'Split lid',
      zero: 'No STL copies required.', total: (builds, count) => `${builds} builds · ${count} modules`, saved: 'Settings and your print plan are saved in this browser when storage is available. Select your Vault folder again after reopening.'
    },
    zh: {
      tab: '打印清单', title: '你的打印清单', intro: '合并多种配置的 STL 和五金数量。汇总包含全部方案，包括已完成的方案；进度状态适用于整批模块。',
      name: '方案名称（可选）', count: '模块数量', add: '加入打印清单', view: '查看打印清单', empty: '清单还是空的。先在组件查找器选好配置，再加入打印清单。',
      export: '导出 CSV', remove: '移除', restore: '载入配置', status: '整批进度', pending: '待打印', printed: '已打印', assembled: '已组装',
      layout: '布局数量 · 每个模块的 STL 打印份数', layoutHint: '填写每种分隔板文件的份数，不需要的填 0。一个 STL 内已配对的零件按一份计算。修改数量后，整批进度重置为“待打印”。',
      unresolved: '请先补齐下方布局数量，再导出清单。', files: '合并后的 STL 清单', hardware: '五金备料汇总',
      copies: 'STL 份数', unknown: '待填数量', missing: '本地缺失', disconnected: '选择 Vault 文件夹后，可检查清单中文件是否齐全。',
      storage: '当前浏览器无法保存工作状态。本标签页内仍可继续使用，关闭前请导出清单。', recovered: '部分保存的数据无法恢复，请在打印前检查清单。',
      invalid: '请填写整数：模块数量 1–999，每模块打印份数 0–999。', limit: '一份清单最多保存 200 个方案。', added: '已加入打印清单。',
      hardwareNote: '五金数量沿用目录中的说明书参考值；组装前请核对实际孔位，以及安装方式所需的额外五金。',
      keyLabel: '锁匙方案', roofLabel: '抽屉顶盖 · 每模块一个', standard: '标准锁匙', hidden: '隐藏锁匙 · 两个文件', none: '不需要顶盖 · 非顶层',
      grid: 'Gridfinity 网格顶盖', table: '平整桌面顶盖', bowl: '内凹托盘顶盖', mount: '桌底吊装顶盖', heavyweight: '重型提手顶盖',
      drawers: '抽屉', sustainers: '承托收纳盒', emptyInterior: '空盒', gridfinity: 'Gridfinity 底板', dividers: '分隔板', sealed: '密封分隔板', whole: '整块翻盖', split: '分体翻盖',
      zero: '无需打印 STL。', total: (builds, count) => `${builds} 个方案 · ${count} 个模块`, saved: '浏览器存储可用时，自动保存设置与打印清单。重新打开后，仍需选择 Vault 文件夹。'
    }
  };
  let language = 'en';
  let api;
  const t = () => copy[language];
  function description(build) {
    const c = build.configuration;
    const choices = build.system === 'drawers' ? [t()[c.key], t()[c.drawerRoof]] : [t()[c.interior === 'empty' ? 'emptyInterior' : c.interior], t()[c.roof]];
    return `${t()[build.system]} ${c.width}${c.depth} / ${c.height} · ${choices.join(' · ')}`;
  }
  function storageNotice() {
    if (!api) return;
    $('workspace-save-status').textContent = !api.store.available ? t().storage : api.store.recovered ? t().recovered : t().saved;
    $('workspace-save-status').dataset.warning = String(!api.store.available || api.store.recovered);
  }
  function render({ preserveEditors = false } = {}) {
    if (!api) return;
    const builds = api.store.value.builds;
    const summary = BuildPlan.summarize(builds);
    $('plan-empty').hidden = builds.length > 0;
    $('plan-content').hidden = builds.length === 0;
    $('plan-export').disabled = !builds.length || !!summary.unresolved;
    $('plan-unresolved').hidden = !summary.unresolved;
    $('plan-count').textContent = t().total(builds.length, builds.reduce((sum, build) => sum + build.count, 0));
    if (!preserveEditors) $('plan-entries').innerHTML = builds.map((build, index) => {
      const id = 'build-' + index;
      const layout = Object.entries(build.layout);
      return `<li class="plan-entry" data-build-index="${index}"><p class="plan-description">${escape(description(build))}</p><div class="plan-fields"><div><label for="${id}-name">${t().name}</label><input id="${id}-name" data-field="name" maxlength="80" value="${escape(build.name)}"></div><div><label for="${id}-count">${t().count}</label><input id="${id}-count" data-field="count" type="number" min="1" max="999" step="1" required value="${build.count}"></div><div><label for="${id}-status">${t().status}</label><select id="${id}-status" data-field="status">${BuildPlan.statuses.map(status => `<option value="${status}" ${status === build.status ? 'selected' : ''}>${t()[status]}</option>`).join('')}</select></div></div>${layout.length ? `<fieldset class="plan-layout"><legend>${t().layout}</legend><p class="source-note">${t().layoutHint}</p>${layout.map(([path, qty], i) => `<div class="plan-layout-row"><label for="${id}-layout-${i}">${escape(path.split('/').pop())}</label><input id="${id}-layout-${i}" data-layout="${escape(path)}" type="number" min="0" max="999" step="1" placeholder="${t().unknown}" value="${qty ?? ''}"></div>`).join('')}</fieldset>` : ''}<div class="plan-actions"><button type="button" data-action="restore">${t().restore}</button><button type="button" data-action="remove">${t().remove}</button></div></li>`;
    }).join('');
    const quantity = file => file.unresolved ? t().unknown + (file.qty ? ` (+${file.qty})` : '') : `×${file.qty}`;
    const fileMarkup = file => `<li class="file-card" data-plan-path="${escape(file.path)}"><div class="file-info"><a class="file-name" href="${escape(encodeURI(file.path))}">${escape(file.path.split('/').pop())}</a><span class="file-path">${escape(file.path)}</span></div><span class="qty-tag">${escape(quantity(file))}</span></li>`;
    const files = $('plan-files');
    if (!preserveEditors) files.innerHTML = summary.files.map(fileMarkup).join('');
    else {
      // Keep active controls attached between pointer-down, blur and click.
      const paths = new Set(summary.files.map(file => file.path));
      for (const row of [...files.children]) if (!paths.has(row.dataset.planPath)) row.remove();
      const existing = new Map([...files.children].map(row => [row.dataset.planPath, row]));
      summary.files.forEach((file, index) => {
        const row = existing.get(file.path);
        if (row) row.querySelector('.qty-tag').textContent = quantity(file);
        else {
          const template = document.createElement('template');
          template.innerHTML = fileMarkup(file);
          files.insertBefore(template.content.firstElementChild, files.children[index] || null);
        }
      });
    }
    $('plan-hardware').innerHTML = summary.hardware.map(part => `<li><strong>${escape(part.size)}</strong><span>×${part.qty}</span></li>`).join('');
    $('plan-availability').hidden = VaultResources.connected;
    STLPreview.decorate($('plan-files'));
    LocalFiles.decorate($('plan-files'));
    storageNotice();
    if (root.ScrollTrigger && !preserveEditors) ScrollTrigger.refresh();
  }
  function save(builds, preserveEditors = false) { api.store.save({ builds }); render({ preserveEditors }); }
  function setLanguage(value) {
    language = value === 'zh' ? 'zh' : 'en';
    document.querySelectorAll('[data-plan-copy]').forEach(element => { element.textContent = t()[element.dataset.planCopy]; });
    render();
  }
  function drawerOptions(configuration) {
    for (const [id, values, selected] of [
      ['drawer-key', ['standard', 'hidden'], configuration.key],
      ['drawer-roof', ['none', ...DrawerCatalog.resolve(configuration).roofs.map(part => part.role)], configuration.drawerRoof]
    ]) {
      $(id).replaceChildren(...values.map(value => new Option(t()[value], value)));
      $(id).value = values.includes(selected) ? selected : values[0];
    }
  }
  function init(options) {
    api = options;
    $('plan-add-form').addEventListener('submit', event => {
      event.preventDefault();
      if (!$('plan-add-form').reportValidity()) return;
      if (api.store.value.builds.length >= 200) { $('plan-add-status').textContent = t().limit; return; }
      const selected = api.selection();
      const count = Number($('plan-add-count').value);
      if (!BuildPlan.integer(count, 1)) { $('plan-add-status').textContent = t().invalid; return; }
      const id = root.crypto?.randomUUID ? root.crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
      const build = BuildPlan.entry({ ...selected, id, name: $('plan-add-name').value, count, status: 'pending', layout: {} });
      save([...api.store.value.builds, build]);
      $('plan-add-name').value = '';
      $('plan-add-status').textContent = t().added;
    });
    $('plan-entries').addEventListener('change', event => {
      const input = event.target;
      const row = input.closest('[data-build-index]');
      if (!row) return;
      const builds = api.store.value.builds.map(build => ({ ...build, layout: { ...build.layout } }));
      const build = builds[Number(row.dataset.buildIndex)];
      if (input.matches('input[type="number"]') && !input.checkValidity()) { input.reportValidity(); return; }
      if (input.dataset.layout) {
        const qty = input.value === '' ? null : Number(input.value);
        if (qty !== null && !BuildPlan.integer(qty)) return;
        build.layout[input.dataset.layout] = qty;
        build.status = 'pending';
      } else if (input.dataset.field === 'count') { build.count = Number(input.value); build.status = 'pending'; }
      else if (input.dataset.field === 'name') build.name = input.value;
      else if (input.dataset.field === 'status') build.status = input.value;
      row.querySelector('[data-field="status"]').value = build.status;
      save(builds, true);
    });
    $('plan-entries').addEventListener('click', event => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const index = Number(button.closest('[data-build-index]').dataset.buildIndex);
      const builds = api.store.value.builds;
      if (button.dataset.action === 'restore') api.restore(builds[index]);
      else { save(builds.filter((_, i) => i !== index)); ($('plan-entries').querySelector('button') || $('tab-btn-plan')).focus(); }
    });
    $('plan-export').addEventListener('click', () => {
      const invalid = $('tab-plan').querySelector('input:invalid');
      if (invalid) { invalid.reportValidity(); return; }
      const csv = BuildPlan.csv(api.store.value.builds);
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url; link.download = 'vault-print-plan.csv'; document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    root.addEventListener('vaultchange', render);
    render();
  }
  root.PrintPlanView = { init, setLanguage, drawerOptions, storageNotice, render };
})(globalThis);
