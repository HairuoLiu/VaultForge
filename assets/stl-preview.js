(function () {
  'use strict';
  const messages = {
    en: {
      preview: '3D preview', download: 'Save a copy', close: 'Close preview', reset: 'Reset view', front: 'Front', top: 'Top',
      title: 'Component preview', chooseFolder: 'Choose Vault folder',
      needFolder: 'Choose your extracted Vault folder to preview its models. Files stay on this device.',
      missing: 'This component was not found in the selected folder. Choose the Vault folder containing this component.',
      loading: 'Reading the model…', parsing: 'Preparing the 3D model…', ready: 'Ready',
      invalid: 'This file does not contain a valid STL mesh. Choose another copy of the component.',
      readError: 'The model could not be read. Check the file path, or select your Vault folder again.',
      tooLarge: 'This model exceeds the preview limit of 12 million triangles. Save a copy to open it in your slicer.',
      webgl: '3D rendering is unavailable in this browser. Try a browser with WebGL 2 enabled.',
      libraryError: 'The preview library could not load. Keep the assets folder alongside index.html and try again.',
      hint: 'Drag to rotate · Scroll / pinch to zoom · Right-drag to pan',
      keyboard: 'Focusable 3D canvas. Drag to rotate, scroll to zoom. Arrow keys pan; Ctrl + arrows rotate.',
      units: 'STL has no unit metadata. Dimensions below are interpreted as millimeters.',
      dimensions: 'Dimensions', triangles: 'triangles', large: 'Large model · Loading in chunks',
      fileSize: 'File size', retry: 'Retry',
      revealLocal: 'Show in folder', revealingLocal: 'Locating…',
      revealedLocal: 'Requested the file manager to select the original file.',
      localUnavailable: 'Cannot reach the preview service. Restart the launcher and reopen its page.',
      localMismatch: 'The selected file does not match the service’s resource folder. Select that folder again, or restart the service with --resource-root pointing to your Vault folder.',
      localFailed: 'Could not locate the file. Check that your file manager is available, then try again.'
    },
    zh: {
      preview: '3D 预览', download: '保存副本', close: '关闭预览', reset: '重置视角', front: '正视图', top: '俯视图',
      title: '组件立体预览', chooseFolder: '选择 Vault 文件夹',
      needFolder: '选择解压后的 Vault 文件夹，即可预览其中的模型。文件仅在本机读取。',
      missing: '所选文件夹中没有找到这个组件，请选择包含该组件的 Vault 文件夹。',
      loading: '正在读取模型…', parsing: '正在准备 3D 模型…', ready: '已加载',
      invalid: '文件中没有有效的 STL 模型，请重新选择该组件文件。',
      readError: '模型读取失败，请检查文件路径，或重新选择 Vault 文件夹。',
      tooLarge: '模型超过 1,200 万三角面的预览上限，可保存副本后使用切片软件打开。',
      webgl: '当前浏览器未能启用 3D 显示，请使用支持 WebGL 2 的浏览器。',
      libraryError: '预览组件加载失败，请确认 assets 文件夹与 index.html 一起保留，然后重试。',
      hint: '拖动旋转 · 滚轮 / 双指缩放 · 右键拖动平移',
      keyboard: '3D 预览画布：拖动旋转，滚轮缩放；方向键平移，Ctrl 加方向键旋转。',
      units: 'STL 未记录长度单位，下方尺寸按毫米解释。',
      dimensions: '模型尺寸', triangles: '个三角面', large: '大模型 · 正在分块加载',
      fileSize: '文件大小', retry: '重新加载',
      revealLocal: '定位到文件', revealingLocal: '正在定位…',
      revealedLocal: '已请求在文件管理器中选中原文件。',
      localUnavailable: '无法连接预览服务，请重新运行启动脚本并打开其页面。',
      localMismatch: '所选文件与服务的资源目录不匹配。请重新选择该目录，或通过 --resource-root 指定 Vault 文件夹后重启服务。',
      localFailed: '定位失败，请确认文件管理器可用后重试。'
    }
  };
  let language = document.documentElement.lang.startsWith('zh') ? 'zh' : 'en';
  const t = () => messages[language];
  const dialog = document.createElement('dialog');
  dialog.id = 'stl-dialog';
  dialog.className = 'stl-dialog';
  dialog.setAttribute('aria-labelledby', 'stl-filename');
  dialog.innerHTML = `
    <header class="stl-header"><div><p class="stl-eyebrow" data-stl-text="title"></p><h2 id="stl-filename"></h2></div><button type="button" class="stl-close" id="stl-close">×</button></header>
    <div class="stl-toolbar"><div class="stl-views"><button type="button" id="stl-reset" data-stl-text="reset" disabled></button><button type="button" id="stl-front" data-stl-text="front" disabled></button><button type="button" id="stl-top" data-stl-text="top" disabled></button></div><span id="stl-file-size"></span></div>
    <div class="stl-stage" id="stl-stage"><div class="stl-canvas-host" id="stl-canvas-host"></div><div class="stl-message" id="stl-message"><span class="stl-cube" aria-hidden="true">◇</span><p id="stl-status" role="status" aria-live="polite"></p><progress id="stl-progress" max="100" hidden></progress><div class="stl-pickers" id="stl-pickers"><button type="button" id="stl-folder-button" data-stl-text="chooseFolder"></button><button type="button" id="stl-retry" data-stl-text="retry" hidden></button></div></div></div>
    <div class="stl-meta"><span id="stl-dimensions"></span><span id="stl-triangles"></span></div>
    <footer class="stl-footer"><div><p data-stl-text="hint"></p><p class="stl-units" data-stl-text="units"></p><p id="stl-local-status" role="status" aria-live="polite" hidden></p></div><div class="stl-footer-actions"><button type="button" id="stl-reveal-local" class="button" data-stl-text="revealLocal" hidden disabled></button><a id="stl-download" class="button primary" download data-stl-text="download"></a></div></footer>
    `;
  document.body.append(dialog);
  const $ = id => document.getElementById(id);
  let current = null;
  let state = 'needFolder';
  let jobId = 0;
  let worker = null;
  let enginePromise = null;
  let sceneState = null;
  let opener = null;
  let previousOverflow = '';
  let progressValue = null;
  let fileSize = 0;
  let modelInfo = null;
  let localAvailable = false;
  let localBusy = false;
  let localStatus = '';
  let localRequest = 0;

  function updateLocalAction() {
    $('stl-reveal-local').hidden = !localAvailable;
    $('stl-reveal-local').disabled = localBusy || !current || !VaultResources.getFile(current.path);
    $('stl-reveal-local').textContent = t()[localBusy ? 'revealingLocal' : 'revealLocal'];
    $('stl-local-status').hidden = !localStatus;
    $('stl-local-status').textContent = t()[localStatus] || '';
  }

  async function detectLocalService() {
    const request = ++localRequest;
    localAvailable = false; localBusy = false; localStatus = '';
    updateLocalAction();
    const available = await window.LocalFileService?.available({ refresh: true });
    if (request !== localRequest) return;
    localAvailable = available === true;
    updateLocalAction();
  }

  async function revealLocalFile() {
    const file = current && VaultResources.getFile(current.path);
    if (!localAvailable || localBusy || !file) return;
    const request = ++localRequest;
    localBusy = true; localStatus = '';
    updateLocalAction();
    try {
      const result = await window.LocalFileService.reveal(current.path);
      if (request !== localRequest) return;
      localStatus = result.ok ? 'revealedLocal' : result.error === 'unavailable' ? 'localUnavailable' :
        ['resource_root', 'missing', 'mismatch'].includes(result.error) ? 'localMismatch' : 'localFailed';
    } catch (_) {
      if (request === localRequest) localStatus = 'localUnavailable';
    } finally {
      if (request === localRequest) { localBusy = false; updateLocalAction(); }
    }
  }

  function setState(next) {
    state = next;
    dialog.dataset.state = next;
    const loading = next === 'loading' || next === 'parsing';
    $('stl-stage').setAttribute('aria-busy', String(loading));
    $('stl-message').hidden = next === 'ready';
    $('stl-progress').hidden = !loading;
    if (loading && progressValue !== null) $('stl-progress').value = progressValue;
    else $('stl-progress').removeAttribute('value');
    $('stl-pickers').hidden = loading || next === 'ready';
    $('stl-retry').hidden = next === 'needFolder' || next === 'missing';
    $('stl-status').textContent = t()[next] || t().readError;
    ['stl-reset', 'stl-front', 'stl-top'].forEach(id => { $(id).disabled = next !== 'ready'; });
    updateMetadata();
  }

  function updateMetadata() {
    $('stl-file-size').textContent = fileSize ? `${t().fileSize}: ${(fileSize / 1048576).toFixed(1)} MB${fileSize > 64 * 1048576 && state !== 'ready' ? ' · ' + t().large : ''}` : '';
    $('stl-dimensions').textContent = modelInfo ? `${t().dimensions}: ${modelInfo.size.map(value => value.toFixed(2)).join(' × ')} mm` : '';
    $('stl-triangles').textContent = modelInfo ? `${modelInfo.triangles.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')} ${t().triangles}` : '';
  }

  function setLanguage(value) {
    language = value === 'zh' ? 'zh' : 'en';
    dialog.lang = language === 'zh' ? 'zh-CN' : 'en';
    dialog.querySelectorAll('[data-stl-text]').forEach(element => { element.textContent = t()[element.dataset.stlText]; });
    $('stl-close').setAttribute('aria-label', t().close);
    $('stl-progress').setAttribute('aria-label', t().parsing);
    if (sceneState) sceneState.renderer.domElement.setAttribute('aria-label', t().keyboard);
    setState(state);
    updateLocalAction();
  }

  function cancelJob() {
    jobId++;
    if (worker) worker.terminate();
    worker = null;
  }

  function clearScene() {
    if (!sceneState) return;
    const { controls, observer, renderer, scene } = sceneState;
    sceneState = null;
    controls.dispose();
    observer.disconnect();
    scene.traverse(object => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => material.dispose());
      }
    });
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  }

  function ensureEngine() {
    if (window.VaultSTL) return Promise.resolve(window.VaultSTL);
    if (!enginePromise) {
      enginePromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = new URL('assets/vendor/vault-stl.min.js', document.baseURI).href;
        script.onload = () => window.VaultSTL ? resolve(window.VaultSTL) : reject(new Error('libraryError'));
        script.onerror = () => { script.remove(); reject(new Error('libraryError')); };
        document.head.append(script);
      }).catch(error => { enginePromise = null; throw error; });
    }
    return enginePromise;
  }

  function createScene(T) {
    const host = $('stl-canvas-host');
    let renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' }); }
    catch (_) { throw new Error('webgl'); }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .9;
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute('aria-label', t().keyboard);
    host.append(renderer.domElement);
    const scene = new T.Scene();
    scene.background = new T.Color(0x202720);
    const camera = new T.PerspectiveCamera(40, 1, .01, 10000);
    camera.position.set(150, 130, 170);
    scene.add(new T.HemisphereLight(0xffffff, 0x59614e, 1.4));
    const key = new T.DirectionalLight(0xfff1df, 2.4);
    key.position.set(2, 4, 3); scene.add(key);
    const fill = new T.DirectionalLight(0xdceaff, 1.1);
    fill.position.set(-3, 1, -2); scene.add(fill);
    const controls = new T.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.listenToKeyEvents(renderer.domElement);
    const render = () => {
      if (dialog.open && sceneState && sceneState.renderer === renderer) renderer.render(scene, camera);
    };
    controls.addEventListener('change', render);
    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      render();
    };
    const observer = new ResizeObserver(resize);
    sceneState = { T, scene, camera, controls, renderer, observer, render, radius: 1 };
    observer.observe(host);
    renderer.domElement.addEventListener('webglcontextlost', event => {
      if (!sceneState || sceneState.renderer !== renderer) return;
      event.preventDefault(); cancelJob(); setState('webgl');
    });
    resize();
  }

  function setView(view) {
    if (!sceneState || !modelInfo) return;
    const { camera, controls, radius, T, render } = sceneState;
    const verticalFov = camera.fov * Math.PI / 180;
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
    const distance = radius / Math.sin(Math.min(verticalFov, horizontalFov) / 2) * 1.15;
    const direction = view === 'top' ? [0, 1, .0001] : view === 'front' ? [0, .0001, 1] : [1, .85, 1.2];
    camera.position.copy(new T.Vector3(...direction).normalize().multiplyScalar(distance));
    camera.near = Math.max(.001, radius / 1000);
    camera.far = Math.max(100, distance * 100);
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    controls.minDistance = radius * .1;
    controls.maxDistance = distance * 8;
    controls.update(); render();
  }

  function displayModel(data) {
    const { T, scene } = sceneState;
    const size = data.maximum.map((max, i) => max - data.minimum[i]);
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.BufferAttribute(new Uint16Array(data.positions), 3, true));
    geometry.boundingBox = new T.Box3(new T.Vector3(0, 0, 0), new T.Vector3(1, 1, 1));
    geometry.boundingSphere = new T.Sphere(new T.Vector3(.5, .5, .5), Math.sqrt(3) / 2);
    const material = new T.MeshStandardMaterial({ color: 0xa9b7a0, roughness: .8, metalness: .03, side: T.DoubleSide, flatShading: true });
    const mesh = new T.Mesh(geometry, material);
    mesh.scale.set(...size.map(value => value || .000001));
    mesh.position.set(...size.map(value => -value / 2));
    const group = new T.Group();
    group.rotation.x = -Math.PI / 2;
    group.add(mesh); scene.add(group);
    const maxSize = Math.max(...size);
    const grid = new T.GridHelper(maxSize * 2.6, 20, 0x718269, 0x3e493a);
    grid.position.y = -size[2] / 2 - maxSize * .015;
    scene.add(grid);
    sceneState.radius = Math.hypot(...size) / 2;
    modelInfo = { size, triangles: data.triangles };
    setState('ready'); setView('reset');
  }

  async function startLoad() {
    cancelJob(); clearScene();
    const token = jobId;
    fileSize = 0; modelInfo = null; progressValue = null;
    setState('loading');
    try {
      const file = VaultResources.getFile(current.path);
      if (!file) {
        setState(VaultResources.connected ? 'missing' : 'needFolder');
        return;
      }
      if (token !== jobId || !dialog.open) return;
      fileSize = file.size;
      const T = await ensureEngine();
      if (token !== jobId || !dialog.open) return;
      createScene(T);
      setState('parsing');
      worker = T.createWorker();
      worker.onmessage = ({ data }) => {
        if (token !== jobId || !dialog.open) return;
        if (data.type === 'progress') { progressValue = data.value; $('stl-progress').value = data.value; }
        else if (data.type === 'ready') {
          worker.terminate(); worker = null;
          try { displayModel(data); } catch (_) { clearScene(); setState('webgl'); }
        } else if (data.type === 'error') {
          worker.terminate(); worker = null; clearScene(); setState(data.code);
        }
      };
      worker.onerror = () => {
        if (token !== jobId || !dialog.open) return;
        cancelJob(); clearScene(); setState('invalid');
      };
      worker.postMessage({ file });
    } catch (error) {
      if (token !== jobId || !dialog.open || error.name === 'AbortError') return;
      clearScene(); setState(messages.en[error.message] ? error.message : 'readError');
    }
  }

  function open(path, href, trigger) {
    current = { path, href, name: path.split('/').pop() };
    opener = trigger;
    $('stl-filename').textContent = current.name;
    $('stl-download').dataset.localStl = path;
    $('stl-download').href = href;
    if (window.LocalFiles) LocalFiles.decorate(dialog);
    setLanguage(language);
    if (!dialog.open) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
    }
    $('stl-close').focus();
    detectLocalService();
    startLoad();
  }

  function decorate(container) {
    container.querySelectorAll('a.file-name').forEach(anchor => {
      const path = anchor.dataset.localStl || decodeURIComponent(anchor.getAttribute('href') || '');
      if (!path.toLowerCase().endsWith('.stl')) return;
      const card = anchor.closest('.file-card, .group-sub-item, .roof-card');
      if (!card || card.querySelector('.stl-actions')) return;
      const actions = document.createElement('div'); actions.className = 'stl-actions';
      const button = document.createElement('button'); button.type = 'button'; button.className = 'stl-preview-button';
      button.textContent = t().preview;
      button.setAttribute('aria-label', `${t().preview}: ${path.split('/').pop()}`);
      button.addEventListener('click', () => open(path, encodeURI(path), button));
      const download = document.createElement('a'); download.className = 'stl-download-link';
      download.href = encodeURI(path); download.download = ''; download.textContent = '↓';
      download.setAttribute('aria-label', `${t().download}: ${path.split('/').pop()}`);
      actions.append(button, download); card.append(actions);
    });
  }

  $('stl-folder-button').addEventListener('click', () => VaultConnection.choose());
  $('stl-reveal-local').addEventListener('click', revealLocalFile);
  window.addEventListener('vaultchange', () => {
    localRequest++; localBusy = false; localStatus = '';
    updateLocalAction();
    if (dialog.open && current) { detectLocalService(); startLoad(); }
    else { cancelJob(); clearScene(); }
  });
  $('stl-retry').addEventListener('click', () => startLoad());
  $('stl-reset').addEventListener('click', () => setView('reset'));
  $('stl-front').addEventListener('click', () => setView('front'));
  $('stl-top').addEventListener('click', () => setView('top'));
  $('stl-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    localRequest++; localBusy = false; localStatus = '';
    cancelJob(); clearScene(); modelInfo = null;
    document.body.style.overflow = previousOverflow;
    if (opener && opener.isConnected) opener.focus();
  });
  window.STLPreview = { decorate, setLanguage };
  setLanguage(language);
})();
