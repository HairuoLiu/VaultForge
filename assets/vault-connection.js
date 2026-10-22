(function () {
  'use strict';
  const text = {
    en: {
      title: 'Connect your local Vault', choose: 'Choose Vault folder', change: 'Change folder', rescan: 'Rescan folder', disconnect: 'Disconnect', reconnect: 'Reconnect folder',
      help: 'Select the extracted folder containing your STL files and manuals. Files stay on this device. The folder is remembered and restored after refreshing when access is allowed.',
      fallbackHelp: 'This browser cannot remember folder access. Select the folder again after refreshing. Files stay on this device.',
      permissionNeeded: 'Your folder is remembered. Click Reconnect folder to allow access again.',
      restoreFailed: 'The saved folder could not be read. Reconnect it or choose another folder.',
      rememberFailed: 'Folder access could not be saved. You may need to choose it again after refreshing.',
      forgetFailed: 'Disconnected, but the saved folder could not be forgotten. It may reconnect after refreshing; try Disconnect again.',
      empty: 'No folder connected', scanning: 'Indexing local files…', counts: (c) => `${c.stl} STL files · ${c.pdf} PDFs · ${c.image} images`,
      invalidFolder: 'No Vault folders or known manuals found. Select the extracted Vault folder.',
      multipleVaults: 'More than one Vault found. Select one Vault folder instead of its parent.',
      duplicates: n => `${n} conflicting paths excluded. Select a single, unambiguous copy of the resource pack.`,
      diagrams: 'Connect your Vault to view this diagram.', missingDiagram: 'This diagram is missing from the selected folder.',
      missingManuals: n => `${n} of 5 manuals are unavailable in either language.`,
      rescanHelp: 'Read the folder again to update its file list.'
    },
    zh: {
      title: '连接本地 Vault', choose: '选择 Vault 文件夹', change: '更换文件夹', rescan: '重新扫描', disconnect: '断开连接', reconnect: '重新连接',
      help: '选择解压后包含 STL 和说明书的文件夹。文件仅在本机读取；记住目录后，刷新时会在权限允许的情况下自动恢复。',
      fallbackHelp: '当前浏览器无法记住目录访问权限，刷新后需重新选择文件夹。文件仅在本机读取。',
      permissionNeeded: '已记住文件夹，点击「重新连接」即可重新授权访问。',
      restoreFailed: '暂时无法读取已保存的文件夹，请重新连接或更换目录。',
      rememberFailed: '目录访问记录未能保存，刷新后可能需要重新选择。',
      forgetFailed: '已断开，但未能清除目录记忆，刷新后可能恢复连接；请重试「断开连接」。',
      empty: '尚未连接文件夹', scanning: '正在建立本地文件索引…', counts: c => `${c.stl} 个 STL · ${c.pdf} 份 PDF · ${c.image} 张图片`,
      invalidFolder: '没有找到 Vault 组件目录或已知说明书，请选择解压后的 Vault 文件夹。',
      multipleVaults: '发现多份 Vault，请选择其中一份资源文件夹，不要选择它们的上级目录。',
      duplicates: n => `已排除 ${n} 个冲突路径，请选择一份路径不冲突的资源包。`,
      diagrams: '连接 Vault 后显示组件示意图。', missingDiagram: '所选文件夹中缺少这张示意图。',
      missingManuals: n => `5 份说明书中有 ${n} 份中英文版本均未找到。`,
      rescanHelp: '重新读取当前文件夹，更新文件列表。'
    }
  };
  let language = 'en';
  let error = '';
  let choosing = false;
  let handle = null;
  let remembered = false;
  const $ = id => document.getElementById(id);
  const input = $('vault-folder-input');
  function refresh() {
    const t = text[language];
    const index = VaultResources.index;
    $('vault-title').textContent = t.title;
    $('vault-help').textContent = VaultFolder.supported && (!index || handle) ? t.help : t.fallbackHelp;
    $('vault-choose').textContent = index || handle ? t.change : t.choose;
    input.setAttribute('aria-label', t.choose);
    $('vault-rescan').textContent = index ? t.rescan : t.reconnect;
    $('vault-rescan').title = t.rescanHelp;
    $('vault-disconnect').textContent = t.disconnect;
    $('vault-rescan').hidden = $('vault-disconnect').hidden = !index && !handle;
    ['vault-choose', 'vault-rescan', 'vault-disconnect'].forEach(id => { $(id).disabled = choosing; });
    $('vault-connection').setAttribute('aria-busy', String(choosing));
    $('vault-name').textContent = index ? index.name : handle ? handle.name : t.empty;
    $('vault-counts').textContent = choosing ? t.scanning : index ? t.counts(index.counts) : '';
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
  function chooseFallback() {
    input.value = '';
    // The picker must remain inside the modal when opened from a preview.
    (document.querySelector('dialog[open]') || $('vault-connection')).append(input);
    input.click();
  }
  function failure(e) {
    error = text[language][e?.message] ? e.message : 'restoreFailed';
  }
  async function connectHandle(next, save) {
    const files = await VaultFolder.files(next);
    // Validate before replacing the remembered directory or the live index.
    VaultResources.connect(files);
    handle = next;
    if (save || !remembered) {
      try { await VaultFolder.save(next); remembered = true; }
      catch (_) {
        remembered = false; error = 'rememberFailed';
        try { await VaultFolder.clear(); } catch (_) { /* Storage may be disabled. */ }
      }
    }
  }
  async function choose() {
    if (choosing) return;
    if (!VaultFolder.supported) return chooseFallback();
    choosing = true; error = ''; refresh();
    try {
      const next = await window.showDirectoryPicker({ id: 'vault-resources', mode: 'read' });
      await connectHandle(next, true);
    } catch (e) {
      if (e.name === 'SecurityError' || e.name === 'NotSupportedError') chooseFallback();
      else if (e.name !== 'AbortError') failure(e);
    } finally { choosing = false; refresh(); }
  }
  async function reconnect() {
    if (choosing) return;
    if (!handle) return choose();
    choosing = true; error = ''; refresh();
    try {
      // Request from the click handler to preserve the user activation.
      if (await handle.requestPermission({ mode: 'read' }) !== 'granted') {
        error = 'permissionNeeded'; VaultResources.disconnect();
      }
      else await connectHandle(handle, false);
    } catch (e) { failure(e); VaultResources.disconnect(); }
    finally { choosing = false; refresh(); }
  }
  async function restore() {
    if (!VaultFolder.supported) return;
    choosing = true; refresh();
    try {
      const saved = await VaultFolder.load();
      if (!saved || saved.kind !== 'directory') return;
      handle = saved; remembered = true;
      if (await handle.queryPermission({ mode: 'read' }) !== 'granted') error = 'permissionNeeded';
      else await connectHandle(handle, false);
    } catch (e) { if (handle) failure(e); }
    finally { choosing = false; refresh(); }
  }
  input.addEventListener('change', async () => {
    const files = Array.from(input.files || []);
    if (!files.length) return;
    choosing = true;
    refresh();
    await new Promise(resolve => setTimeout(resolve, 0));
    try {
      error = ''; VaultResources.connect(files); handle = null; remembered = false;
      try { await VaultFolder.clear(); } catch (_) { error = 'rememberFailed'; }
    }
    catch (e) { error = text[language][e.message] ? e.message : 'invalidFolder'; }
    finally { choosing = false; input.value = ''; $('vault-connection').setAttribute('aria-busy', 'false'); refresh(); }
  });
  $('vault-choose').addEventListener('click', choose);
  $('vault-rescan').addEventListener('click', reconnect);
  $('vault-disconnect').addEventListener('click', async () => {
    if (choosing) return;
    const previousHandle = handle;
    choosing = true; error = ''; handle = null; remembered = false;
    VaultResources.disconnect();
    try { await VaultFolder.clear(); } catch (_) { handle = previousHandle; error = 'forgetFailed'; }
    finally { choosing = false; refresh(); }
  });
  window.addEventListener('vaultchange', refresh);
  window.VaultConnection = { choose, ready: null, setLanguage(value) { language = value === 'zh' ? 'zh' : 'en'; refresh(); } };
  refresh();
  window.VaultConnection.ready = restore();
})();
