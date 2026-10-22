(function () {
  'use strict';
  const catalog = ModificationCatalog;
  const $ = id => document.getElementById(id);
  const container = $('tab-modifications');
  const dimensions = ['width', 'depth', 'height'];
  const escape = value => String(value).replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);
  const presentation = {
    en: {
      title: 'Choose what to add',
      intro: 'Start with a purpose, then choose a size and follow the matching guide.',
      back: 'Back to all modifications',
      count: count => `${count} STL files`,
      hardware: 'Hardware to prepare',
      hardwareIntro: 'Quantities below apply to the stated unit. Confirm the total for your assembly.',
      hardwareSize: 'Hardware', hardwareQuantity: 'Quantity / unit', hardwarePurpose: 'Use and reference',
      unknownQuantity: 'Confirm for your assembly',
      unknownSize: 'Confirm hardware specification',
      steps: 'Assembly steps',
      warning: 'Confirm before assembly',
      printableFiles: 'Printable components',
      descriptions: {
        base: 'Support the modules with a matching base.',
        backbone: 'Connect modules and lock the handle assembly.',
        wheels: 'Build wheels for a mobile setup.',
        feet: 'Add support feet to the base.',
        pullHandle: 'Add a handle for pulling the assembly.',
        stationaryHandle: 'Add a fixed carrying handle.',
        pegboard: 'Attach an IKEA Skådis or USSA pegboard.',
        wall: 'Mount the modules on a wall.'
      }
    },
    zh: {
      title: '想给收纳系统加什么？',
      intro: '先按用途选一类，再选尺寸、核对文件和对应的组装说明。',
      back: '返回全部改造类别',
      count: count => `${count} 个 STL 文件`,
      hardware: '需要另外准备的五金',
      hardwareIntro: '数量按每项注明的单位计算，整套用量请结合实际组装方案确认。',
      hardwareSize: '五金规格', hardwareQuantity: '数量 / 适用单位', hardwarePurpose: '用途与原版参考',
      unknownQuantity: '按方案确认',
      unknownSize: '规格待确认',
      steps: '安装步骤',
      warning: '安装前请确认',
      printableFiles: '对应的打印文件',
      descriptions: {
        base: '为整组模块提供底部支撑。',
        backbone: '连接模块，配合提手锁定机构。',
        wheels: '让整组收纳模块方便移动。',
        feet: '给底座增加支撑脚。',
        pullHandle: '配合背部机构拖动模块。',
        stationaryHandle: '增加固定的搬运提手。',
        pegboard: '连接 IKEA Skådis 或 USSA 洞洞板。',
        wall: '把模块安装到墙面。'
      }
    }
  };
  let language = 'en';
  let browserOpen = false;
  function selection() {
    return Object.fromEntries(['category', ...dimensions].map(key => [key, $('mod-' + key).value || 'all']));
  }
  function fill(key, values, selected) {
    const t = catalog.text[language];
    const input = $('mod-' + key);
    input.replaceChildren(...values.map(value => {
      const label = value === 'all' ? t.all : key === 'category' ? catalog.categories[value][language] : key === 'depth' ? `${value} · ${Number(value) * 42} mm` : value;
      return new Option(label, value);
    }));
    input.value = values.includes(selected) ? selected : 'all';
    input.disabled = values.length === 1;
    input.parentElement.hidden = values.length === 1;
  }
  function refresh() {
    const t = catalog.text[language];
    const saved = selection();
    fill('category', ['all', ...Object.keys(catalog.categories)], saved.category);
    $('mod-category').parentElement.hidden = true;
    const scope = { category: $('mod-category').value };
    for (const key of dimensions) {
      const values = [...new Set(catalog.filter(scope).map(part => part[key]).filter(Boolean))];
      values.sort((a, b) => key === 'width' ? ['S', 'M', 'L', 'XL'].indexOf(a) - ['S', 'M', 'L', 'XL'].indexOf(b) : a.localeCompare(b));
      fill(key, ['all', ...values], saved[key]);
      scope[key] = $('mod-' + key).value;
    }
    const selectors = container.querySelector('.mod-selectors');
    if (selectors) selectors.hidden = dimensions.every(key => $('mod-' + key).parentElement.hidden);
    render();
  }
  function scrollTo(id) {
    const target = $(id);
    if (!target) return;
    target.scrollIntoView({ behavior: 'instant', block: 'start' });
    target.focus({ preventScroll: true });
  }
  function renderCategories(chosen) {
    const cards = $('mod-category-cards');
    if (!cards) return;
    const copy = presentation[language];
    cards.innerHTML = Object.entries(catalog.categories).map(([key, category]) => {
      const selected = browserOpen && chosen.category === key;
      const count = catalog.filter({ category: key }).length;
      return `<button type="button" class="mod-category-card${selected ? ' is-selected' : ''}" data-mod-category="${key}" aria-pressed="${selected}" aria-controls="mod-browser"><span class="mod-category-name">${escape(category[language])}</span><span class="mod-category-purpose">${escape(copy.descriptions[key])}</span><span class="mod-category-count">${escape(copy.count(count))}</span></button>`;
    }).join('');
    if ($('mod-overview-title')) $('mod-overview-title').textContent = copy.title;
    if ($('mod-back-categories')) $('mod-back-categories').textContent = copy.back;
    if ($('mod-browser')) $('mod-browser').hidden = !browserOpen;
    const category = catalog.categories[chosen.category];
    if ($('mod-selection-heading')) $('mod-selection-heading').textContent = category ? category[language] : copy.title;
  }
  function source(manual, page, label, accessibleLabel = label) {
    return `<a href="#workspace" aria-label="${escape(accessibleLabel)}" onclick="openManualAt('${manual}', ${page})">${escape(label)} ↗</a>`;
  }
  function guidanceSources(sources = []) {
    return sources.filter(item => /^0[1-5]$/.test(item.id) && Number.isInteger(item.page) && item.page > 0).map(item => {
      const label = language === 'zh' ? `${item.id} · 第 ${item.page} 页` : `${item.id} · p. ${item.page}`;
      const accessibleLabel = language === 'zh' ? `${item.id} 号说明书 · 第 ${item.page} 页` : `Manual ${item.id} · page ${item.page}`;
      return source(item.id, item.page, label, accessibleLabel);
    }).join(' ');
  }
  function guidance(category) {
    const data = window.AssemblyGuidance?.forModification(category);
    if (!data) return '';
    const copy = presentation[language];
    const localized = value => typeof value === 'string' ? value : value?.[language] || '';
    const warnings = (data.warnings || []).map(item => `<div class="mod-guidance-warning"><strong>${escape(copy.warning)}</strong><p>${escape(localized(item.text))}</p><div class="mod-guidance-sources">${guidanceSources(item.sources)}</div></div>`).join('');
    const hardware = (data.hardware || []).map(item => {
      const known = Number.isFinite(item.qty) && item.qty > 0;
      const quantity = known ? String(item.qty) : copy.unknownQuantity;
      const unit = localized(item.unit);
      const size = localized(item.size);
      return `<tr><th scope="row">${escape(!size || size === '—' ? copy.unknownSize : size)}</th><td class="mod-hardware-quantity${known ? '' : ' is-unconfirmed'}"><strong>${escape(quantity)}</strong>${unit ? `<span>${escape(unit)}</span>` : ''}</td><td><span>${escape(localized(item.purpose))}</span><div class="mod-guidance-sources">${guidanceSources(item.sources)}</div></td></tr>`;
    }).join('');
    const hardwareSection = hardware ? `<section class="mod-hardware" aria-labelledby="mod-hardware-title-${category}"><h4 id="mod-hardware-title-${category}">${escape(copy.hardware)}</h4><p class="mod-guidance-intro">${escape(copy.hardwareIntro)}</p><table><thead><tr><th scope="col">${escape(copy.hardwareSize)}</th><th scope="col">${escape(copy.hardwareQuantity)}</th><th scope="col">${escape(copy.hardwarePurpose)}</th></tr></thead><tbody>${hardware}</tbody></table></section>` : '';
    const notes = (data.notes || []).map(item => `<li><span>${escape(localized(item.text))}</span><div class="mod-guidance-sources">${guidanceSources(item.sources)}</div></li>`).join('');
    const steps = (data.steps || []).map(item => `<li><strong>${escape(localized(item.title))}</strong><p>${escape(localized(item.note))}</p><div class="mod-guidance-sources">${guidanceSources(item.sources)}</div></li>`).join('');
    return `<div class="mod-guidance">${warnings}${hardwareSection}${notes ? `<ul class="mod-guidance-notes">${notes}</ul>` : ''}${steps ? `<section class="mod-assembly-steps" aria-labelledby="mod-steps-title-${category}"><h4 id="mod-steps-title-${category}">${escape(copy.steps)}</h4><ol>${steps}</ol></section>` : ''}</div>`;
  }
  function render() {
    const t = catalog.text[language];
    const chosen = selection();
    renderCategories(chosen);
    const parts = browserOpen ? catalog.filter(chosen) : [];
    $('mod-count').textContent = t.count(parts.length);
    $('mod-note').textContent = t.note;
    $('mod-empty').hidden = parts.length !== 0;
    $('mod-groups').innerHTML = Object.keys(catalog.categories).map(key => {
      const group = parts.filter(part => part.category === key);
      if (!group.length) return '';
      const category = catalog.categories[key];
      const pageLabel = language === 'zh' ? `${t.source} · ${category.manual} 号说明书第 ${category.page} 页` : `${t.source} · Manual ${category.manual}, page ${category.page}`;
      const heading = chosen.category === key && $('mod-selection-heading') ? '' : `<h3 class="section-title" id="mod-heading-${key}">${escape(category[language])} <span class="mod-group-count">${group.length}</span></h3>`;
      const label = heading ? `mod-heading-${key}` : 'mod-selection-heading';
      return `<section class="mod-group" aria-labelledby="${label}">${heading}<p class="interior-description mod-assembly-note">${escape(t.categoryNotes[key])}</p><p class="source-note catalog-note mod-guide-link">${source(category.manual, category.page, pageLabel)}</p>${guidance(key)}<h4 class="mod-files-title">${escape(presentation[language].printableFiles)}</h4><ul class="item-list">${group.map(part => {
        const [role, note] = t.roles[part.role];
        const tags = [part.width, part.depth ? (language === 'zh' ? `${part.depth} 单元` : `Depth ${part.depth}`) : null, part.height].filter(Boolean).join(' · ') || t.unmarked;
        return `<li class="file-card"><div class="file-info"><span class="part-role">${escape(role)} · ${escape(tags)}</span><a class="file-name" href="${escape(encodeURI(part.path))}">${escape(part.name)}</a><span class="part-note">${escape(note)}</span><span class="file-path">${escape(part.path)}</span></div></li>`;
      }).join('')}</ul></section>`;
    }).join('');
    STLPreview.decorate(container);
    LocalFiles.decorate(container);
    if (window.FileDetails) FileDetails.decorate(container, language);
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }
  ['category', ...dimensions].forEach(key => $('mod-' + key).addEventListener('change', () => {
    if (key === 'category') browserOpen = Boolean(catalog.categories[$('mod-category').value]);
    refresh();
    window.dispatchEvent(new Event('modificationchange'));
  }));
  if ($('mod-category-cards')) $('mod-category-cards').addEventListener('click', event => {
    const button = event.target.closest('[data-mod-category]');
    if (!button) return;
    $('mod-category').value = button.dataset.modCategory;
    browserOpen = true;
    refresh();
    window.dispatchEvent(new Event('modificationchange'));
    scrollTo('mod-selection-heading');
  });
  function showCategories(move = true) {
    browserOpen = false;
    render();
    if (move) scrollTo('mod-overview-title');
  }
  if ($('mod-back-categories')) $('mod-back-categories').addEventListener('click', () => showCategories());
  window.ModificationView = {
    selection,
    showCategories,
    restore(value) {
      value = value || {};
      browserOpen = Boolean(catalog.categories[value.category]);
      // Restore dependent filters in order so each option exists before selection.
      for (const key of ['category', ...dimensions]) {
        const input = $('mod-' + key);
        input.value = [...input.options].some(option => option.value === value[key]) ? value[key] : 'all';
        refresh();
      }
    },
    setLanguage(value) {
      language = value === 'zh' ? 'zh' : 'en';
      const t = catalog.text[language];
      ['category', ...dimensions].forEach(key => $('mod-label-' + key).textContent = t[key]);
      $('mod-intro').textContent = presentation[language].intro;
      $('mod-manual-link').textContent = t.manual;
      $('mod-mount-link').textContent = t.mountManual;
      $('mod-file-hint').textContent = t.hint;
      $('mod-empty').textContent = t.empty;
      $('mod-summary-title').textContent = t.files;
      $('mod-sources').innerHTML = source('01', 3, t.hardware) + ' · ' + source('01', 13, t.naming);
      refresh();
    }
  };
})();
