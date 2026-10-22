(function () {
  'use strict';
  const text = {
    en: {
      title: 'Connect your local Vault', choose: 'Choose Vault folder', change: 'Change folder', rescan: 'Select folder again', disconnect: 'Disconnect',
      help: 'Select the extracted folder containing your STL files and manuals. Files stay on this device. Select it again after refreshing this page.',
      empty: 'No folder connected', scanning: 'Indexing local files…', counts: (c) => `${c.stl} STL files · ${c.pdf} PDFs · ${c.image} images`,
      invalidFolder: 'No Vault folders or known manuals found. Select the extracted Vault folder.',
      multipleVaults: 'More than one Vault found. Select one Vault folder instead of its parent.',
      duplicates: n => `${n} conflicting paths excluded. Select a single, unambiguous copy of the resource pack.`,
      diagrams: 'Connect your Vault to view this diagram.', missingDiagram: 'This diagram is missing from the selected folder.',
      missingManuals: n => `${n} of 5 manuals are unavailable in either language.`,
      rescanHelp: 'To refresh the file list, select the same folder again.'
    },
    zh: {
      title: '连接本地 Vault', choose: '选择 Vault 文件夹', change: '更换文件夹', rescan: '重新选择扫描', disconnect: '断开连接',
      help: '选择解压后包含 STL 和说明书的文件夹。文件仅在本机读取；刷新页面后需要重新选择。',
      empty: '尚未连接文件夹', scanning: '正在建立本地文件索引…', counts: c => `${c.stl} 个 STL · ${c.pdf} 份 PDF · ${c.image} 张图片`,
      invalidFolder: '没有找到 Vault 组件目录或已知说明书，请选择解压后的 Vault 文件夹。',
      multipleVaults: '发现多份 Vault，请选择其中一份资源文件夹，不要选择它们的上级目录。',
      duplicates: n => `已排除 ${n} 个冲突路径，请选择一份路径不冲突的资源包。`,
      diagrams: '连接 Vault 后显示组件示意图。', missingDiagram: '所选文件夹中缺少这张示意图。',
      missingManuals: n => `5 份说明书中有 ${n} 份中英文版本均未找到。`,
      rescanHelp: '重新选择同一个文件夹，即可更新文件列表。'
    }
  };
  let language = 'en';
  let error = '';
  let choosing = false;
  const $ = id => document.getElementById(id);
  const input = $('vault-folder-input');
  function refresh() {
    const t = text[language];
    const index = VaultResources.index;
    $('vault-title').textContent = t.title;
    $('vault-help').textContent = t.help;
    $('vault-choose').textContent = index ? t.change : t.choose;
    input.setAttribute('aria-label', t.choose);
    $('vault-rescan').textContent = t.rescan;
    $('vault-rescan').title = t.rescanHelp;
    $('vault-disconnect').textContent = t.disconnect;
    $('vault-rescan').hidden = $('vault-disconnect').hidden = !index;
    $('vault-name').textContent = index ? index.name : t.empty;
    $('vault-counts').textContent = index ? t.counts(index.counts) : '';
    $('vault-connection').dataset.connected = String(!!index);
    const warnings = [];
    if (error) warnings.push(t[error]);
    if (index?.ambiguous.size) warnings.push(t.duplicates(index.ambiguous.size));
    const missing = index ? Object.keys(VaultResources.manuals).filter(id => !VaultResources.manual(id, language)).length : 0;
    if (missing) warnings.push(t.missingManuals(missing));
    $('vault-notice').textContent = warnings.join(' ');
    $('vault-notice').hidden = !warnings.length;
    document.querySelectorAll('img[data-vault-path]').forEach(img => {
      const url = VaultResources.getURL(img.dataset.vaultPath);
      img.hidden = !url;
      if (url) img.src = url;
      else img.removeAttribute('src');
      let label = img.parentElement.querySelector('.diagram-empty');
      if (!label) { label = document.createElement('span'); label.className = 'diagram-empty'; img.parentElement.append(label); }
      label.hidden = !!url;
      label.textContent = index ? t.missingDiagram : t.diagrams;
    });
  }
  function choose() {
    if (choosing) return;
    input.value = '';
    // The picker must remain inside the modal when opened from a preview.
    (document.querySelector('dialog[open]') || $('vault-connection')).append(input);
    input.click();
  }
  input.addEventListener('change', async () => {
    const files = Array.from(input.files || []);
    if (!files.length) return;
    choosing = true;
    $('vault-connection').setAttribute('aria-busy', 'true');
    $('vault-counts').textContent = text[language].scanning;
    await new Promise(resolve => setTimeout(resolve, 0));
    try { error = ''; VaultResources.connect(files); }
    catch (e) { error = text[language][e.message] ? e.message : 'invalidFolder'; }
    finally { choosing = false; input.value = ''; $('vault-connection').setAttribute('aria-busy', 'false'); refresh(); }
  });
  $('vault-choose').addEventListener('click', choose);
  $('vault-rescan').addEventListener('click', choose);
  $('vault-disconnect').addEventListener('click', () => { error = ''; VaultResources.disconnect(); });
  window.addEventListener('vaultchange', refresh);
  window.VaultConnection = { choose, setLanguage(value) { language = value === 'zh' ? 'zh' : 'en'; refresh(); } };
  refresh();
})();
