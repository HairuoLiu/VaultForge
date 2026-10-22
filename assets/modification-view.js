(function () {
  'use strict';
  const catalog = ModificationCatalog;
  const $ = id => document.getElementById(id);
  const container = $('tab-modifications');
  const dimensions = ['width', 'depth', 'height'];
  const escape = value => String(value).replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);
  let language = 'en';
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
    const scope = { category: $('mod-category').value };
    for (const key of dimensions) {
      const values = [...new Set(catalog.filter(scope).map(part => part[key]).filter(Boolean))];
      values.sort((a, b) => key === 'width' ? ['S', 'M', 'L', 'XL'].indexOf(a) - ['S', 'M', 'L', 'XL'].indexOf(b) : a.localeCompare(b));
      fill(key, ['all', ...values], saved[key]);
      scope[key] = $('mod-' + key).value;
    }
    render();
  }
  function source(manual, page, label) {
    return `<a href="#workspace" onclick="openManualAt('${manual}', ${page})">${escape(label)} ↗</a>`;
  }
  function render() {
    const t = catalog.text[language];
    const chosen = selection();
    const parts = catalog.filter(chosen);
    $('mod-count').textContent = t.count(parts.length);
    $('mod-note').textContent = t.note;
    $('mod-empty').hidden = parts.length !== 0;
    $('mod-groups').innerHTML = Object.keys(catalog.categories).map(key => {
      const group = parts.filter(part => part.category === key);
      if (!group.length) return '';
      const category = catalog.categories[key];
      const pageLabel = language === 'zh' ? `${t.source} · ${category.manual} 号说明书第 ${category.page} 页` : `${t.source} · Manual ${category.manual}, page ${category.page}`;
      return `<section class="mod-group" aria-labelledby="mod-heading-${key}"><h3 class="section-title" id="mod-heading-${key}">${escape(category[language])} <span class="mod-group-count">${group.length}</span></h3><p class="interior-description">${escape(t.categoryNotes[key])}</p><p class="source-note catalog-note">${source(category.manual, category.page, pageLabel)}</p><ul class="item-list">${group.map(part => {
        const [role, note] = t.roles[part.role];
        const tags = [part.width, part.depth ? (language === 'zh' ? `${part.depth} 单元` : `Depth ${part.depth}`) : null, part.height].filter(Boolean).join(' · ') || t.unmarked;
        return `<li class="file-card"><div class="file-info"><span class="part-role">${escape(role)} · ${escape(tags)}</span><a class="file-name" href="${escape(encodeURI(part.path))}">${escape(part.name)}</a><span class="part-note">${escape(note)}</span><span class="file-path">${escape(part.path)}</span></div></li>`;
      }).join('')}</ul></section>`;
    }).join('');
    STLPreview.decorate(container);
    LocalFiles.decorate(container);
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }
  ['category', ...dimensions].forEach(key => $('mod-' + key).addEventListener('change', refresh));
  window.ModificationView = {
    setLanguage(value) {
      language = value === 'zh' ? 'zh' : 'en';
      const t = catalog.text[language];
      ['category', ...dimensions].forEach(key => $('mod-label-' + key).textContent = t[key]);
      $('mod-intro').textContent = t.intro;
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
