(function () {
  'use strict';
  const copy = {
    en: {
      interior: 'Interior options & related parts', roof: 'Roof, lid & carry options', general: 'Other accessories & archive variants',
      intro: 'These are optional or alternative parts. Check the notes before printing; browsing them does not add them to your print plan.',
      count: n => `${n} optional and reference files to explore`, browse: 'Browse optional parts',
      summary: n => `Optional parts · ${n} files`,
      files: n => `${n} files`, quantity: 'As needed · verify', selected: 'Included by the current option', apply: 'Use this option',
      selectedHint: 'Add this configuration to your print plan, then check or enter quantities.'
    },
    zh: {
      interior: '内部选装与配套零件', roof: '顶盖、翻盖与携带配件', general: '其他配件与替代版本',
      intro: '以下为选装或替代件，请先核对备注；浏览配件不会自动加入打印清单。',
      count: n => `另有 ${n} 个选装与参考文件可查看`, browse: '查看选装配件',
      summary: n => `添加选装配件 · ${n} 个文件`,
      files: n => `${n} 个文件`, quantity: '按需 · 先核对', selected: '当前方案已采用', apply: '使用此方案',
      selectedHint: '加入当前配置到打印清单后，再核对或填写用量。'
    }
  };
  const escape = value => String(value ?? '').replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);
  let active = {};
  window.AccessoryView = {
    render(system, configuration, language, apply) {
      const t = copy[language];
      const groups = (system === 'sustainers' ? SustainerAccessories : DrawerAccessories).resolve(configuration);
      const allPaths = new Set(groups.flatMap(group => group.items.map(item => item.path)));
      const previous = new Set([...document.querySelectorAll('.accessory-group[open]')].map(node => node.dataset.accessoryGroup));
      active = Object.fromEntries(groups.map(group => [group.id, group]));
      const overview = document.getElementById('accessory-overview');
      if (overview) overview.hidden = !groups.length;
      const overviewText = document.getElementById('accessory-overview-text');
      if (overviewText) overviewText.textContent = t.count(allPaths.size);
      const overviewLink = document.getElementById('accessory-overview-link');
      if (overviewLink) overviewLink.textContent = t.browse;
      const optional = document.getElementById('optional-accessories');
      if (optional) optional.hidden = !groups.length;
      const intro = document.getElementById('accessory-intro');
      if (intro) intro.textContent = t.intro;
      const summary = document.getElementById('accessory-summary');
      if (summary) summary.textContent = t.summary(allPaths.size);
      for (const slot of document.querySelectorAll('[data-accessory-slot]')) {
        const matching = groups.filter(group => (group.placement || 'general') === slot.dataset.accessorySlot);
        slot.hidden = !matching.length;
        slot.innerHTML = `<h4>${t[slot.dataset.accessorySlot]}</h4>` + matching.map(group => {
          const opened = previous.has(group.id);
          const selected = group.selected ? `<p class="accessory-status" tabindex="-1" role="status">${t.selected} · ${t.selectedHint}</p>` : group.select ? `<button type="button" class="accessory-select" data-accessory-select="${escape(group.id)}">${t.apply}</button>` : '';
          return `<details class="accessory-group" data-accessory-group="${escape(group.id)}" ${opened ? 'open' : ''}><summary><span>${escape(group.title[language])}</span><span class="accessory-group-count">${t.files(group.items.length)}</span></summary><p class="accessory-note ${group.requiresVerification || group.warning ? 'is-warning' : ''}">${escape(group.note[language])}</p>${selected}<ul class="item-list">${group.items.map(item => `<li class="file-card"><div class="file-info"><span class="part-role">${escape(item.label[language])}</span><a class="file-name" href="${escape(encodeURI(item.path))}">${escape(item.path.split('/').pop())}</a><span class="part-note">${escape(item.note[language])}</span><span class="file-path">${escape(item.path)}</span></div><span class="qty-tag">${item.qty == null ? t.quantity : `×${item.qty}`}</span></li>`).join('')}</ul></details>`;
        }).join('');
        slot.querySelectorAll('[data-accessory-select]').forEach(button => button.addEventListener('click', () => {
          const id = button.dataset.accessorySelect;
          const option = active[id]?.select;
          if (option) {
            apply(option);
            const optional = document.getElementById('optional-accessories');
            if (optional) optional.open = true;
            const updated = [...document.querySelectorAll('.accessory-group')].find(node => node.dataset.accessoryGroup === id);
            if (updated) updated.open = true;
            updated?.querySelector('.accessory-status')?.focus({ preventScroll: true });
          }
        }));
        slot.querySelectorAll('details').forEach(details => details.addEventListener('toggle', () => { if (window.ScrollTrigger) ScrollTrigger.refresh(); }));
      }
    },
    scrollToSlot(name) {
      const slot = document.querySelector(`[data-accessory-slot="${name}"]`);
      if (!slot || slot.hidden) return;
      document.getElementById('optional-accessories').open = true;
      slot.querySelectorAll('details').forEach(details => { details.open = true; });
      slot.scrollIntoView({ behavior: 'instant', block: 'start' });
      slot.tabIndex = -1;
      slot.focus({ preventScroll: true });
    },
    scrollToFirst() {
      const optional = document.getElementById('optional-accessories');
      if (optional) optional.open = true;
      const first = [...document.querySelectorAll('[data-accessory-slot]')].find(node => !node.hidden);
      if (first) first.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  };
})();
