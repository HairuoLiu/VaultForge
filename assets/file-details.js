(function () {
  'use strict';

  const cardSelector = '.file-card, .group-sub-item, .roof-card';
  const copy = { zh: '备注与路径', en: 'Notes & path' };

  function decorate(container, language) {
    const label = copy[language] || copy.en;
    const cards = [...container.querySelectorAll(cardSelector)];
    if (container.matches?.(cardSelector)) cards.unshift(container);

    cards.forEach(card => {
      const owns = element => element.closest(cardSelector) === card;
      let details = [...card.querySelectorAll('.file-details')].find(owns);
      const fields = [...card.querySelectorAll('.part-note, .roof-desc, .file-path')]
        .filter(element => owns(element) && !element.closest('.file-details'));
      if (!details && !fields.some(element => element.textContent.trim())) return;

      if (!details) {
        details = document.createElement('details');
        details.className = 'file-details';
        const summary = document.createElement('summary');
        const content = document.createElement('div');
        content.className = 'file-detail-content';
        details.append(summary, content);
        (card.querySelector('.file-info') || card).append(details);
        details.addEventListener('toggle', () => window.ScrollTrigger?.refresh());
      }

      const content = details.querySelector('.file-detail-content');
      fields.filter(field => !field.matches('.file-path')).forEach(field => content.append(field));
      fields.filter(field => field.matches('.file-path')).forEach(field => content.append(field));
      const summary = details.querySelector('summary');
      const name = card.querySelector('.part-role')?.textContent.trim()
        || card.querySelector('.file-name')?.textContent.trim();
      summary.textContent = label;
      summary.setAttribute('aria-label', name ? `${label} · ${name}` : label);
      card.classList.add('has-file-details');
    });
  }

  window.FileDetails = { decorate };
})();
