(function () {
  'use strict';
  const messages = {
    en: {
      download: 'Save a copy', missing: 'Missing locally', needFolder: 'Select your Vault folder first.',
      missingMessage: 'This file is missing or has a conflicting path in the selected folder.',
      hint: 'Preview models here, or click a filename to save a copy. Paths below each filename locate the original in your Vault.'
    },
    zh: {
      download: '保存副本', missing: '本地缺失', needFolder: '请先选择 Vault 文件夹。',
      missingMessage: '所选文件夹中没有找到这个文件，或该路径存在冲突。',
      hint: '点击「3D 预览」查看模型，点击文件名保存副本；文件名下方显示原文件在 Vault 中的相对路径。'
    }
  };
  let language = 'en';
  let timer;
  const feedback = document.createElement('div');
  feedback.className = 'file-feedback'; feedback.hidden = true;
  feedback.setAttribute('role', 'status'); feedback.setAttribute('aria-live', 'polite');
  document.body.append(feedback);
  function notify(key) {
    clearTimeout(timer);
    (document.querySelector('dialog[open]') || document.body).append(feedback);
    feedback.textContent = messages[language][key]; feedback.hidden = false;
    timer = setTimeout(() => { feedback.hidden = true; }, 6000);
  }
  function decorate(container) {
    container.querySelectorAll('a.file-name, .stl-download-link, #stl-download').forEach(anchor => {
      let path = anchor.dataset.localStl;
      if (!path) {
        try { path = decodeURIComponent(anchor.getAttribute('href') || ''); } catch (_) { return; }
      }
      if (!path.toLowerCase().endsWith('.stl')) return;
      anchor.dataset.localStl = path;
      const missing = VaultResources.connected && !VaultResources.getFile(path);
      anchor.dataset.missing = String(missing);
      anchor.title = messages[language][missing ? 'missingMessage' : 'download'];
      anchor.setAttribute('aria-disabled', String(missing));
      anchor.removeAttribute('href');
      anchor.setAttribute('role', 'button');
      anchor.tabIndex = 0;
      anchor.removeAttribute('download');
      if (anchor.matches('.stl-download-link')) {
        anchor.textContent = '↓'; anchor.setAttribute('aria-label', messages[language].download + ': ' + path.split('/').pop());
      }
      if (anchor.matches('.file-name')) {
        let badge = anchor.parentElement.querySelector('.local-file-status');
        if (!badge) { badge = document.createElement('span'); badge.className = 'local-file-status'; anchor.after(badge); }
        badge.textContent = missing ? messages[language].missing : '';
        badge.hidden = !missing;
      }
    });
  }
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[data-local-stl]');
    if (!anchor) return;
    event.preventDefault();
    if (!VaultResources.connected) { notify('needFolder'); VaultConnection.choose(); return; }
    const file = VaultResources.getFile(anchor.dataset.localStl);
    const url = VaultResources.getURL(anchor.dataset.localStl);
    if (!url) return notify('missingMessage');
    const download = document.createElement('a');
    download.href = url; download.download = file.name;
    document.body.append(download); download.click(); download.remove();
  });
  document.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('a[data-local-stl]')) {
      event.preventDefault(); event.target.click();
    }
  });
  window.addEventListener('vaultchange', () => { clearTimeout(timer); feedback.hidden = true; decorate(document); });
  window.LocalFiles = {
    decorate,
    setLanguage(value) {
      language = value === 'zh' ? 'zh' : 'en';
      clearTimeout(timer); feedback.hidden = true;
      const hint = document.getElementById('file-action-hint');
      if (hint) hint.textContent = messages[language].hint;
      decorate(document);
    }
  };
})();
