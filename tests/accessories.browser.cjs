// Run with: node tests/accessories.browser.cjs /path/to/agent-browser
// Uses an isolated temporary profile and needs no original resource archive.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const browser = process.argv[2] || 'agent-browser';
const session = 'vault-accessories-' + process.pid;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-accessories-'));
const run = (...args) => execFileSync(browser, ['--session', session, ...args], { encoding: 'utf8', timeout: 45000 });
const evaluate = code => execFileSync(browser, ['--session', session, 'eval', '--stdin'], { input: code, encoding: 'utf8', timeout: 15000 });
const check = code => evaluate(`(() => { ${code} })()`);
const scrollTo = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({behavior:'instant',block:'center'});`);
const click = selector => {
  scrollTo(selector);
  run('snapshot', '-i');
  run('click', selector);
};
const select = (selector, value) => {
  scrollTo(selector);
  run('select', selector, value);
};
const openGroup = id => evaluate(`
  document.getElementById('optional-accessories').open = true;
  document.querySelector('[data-accessory-group="${id}"]').open = true;
`);
const verifyRequiredParts = () => check(`
  const expected = BuildPlan.resolve(currentSystem, readConfiguration()).parts;
  const rendered = [...document.querySelectorAll('#size-files .file-card')];
  if (rendered.length !== expected.length) throw new Error('The review omits or adds required files');
  const rowsByPath = new Map();
  for (const row of rendered) {
    const filePath = row.querySelector('.file-path').textContent.trim();
    if (rowsByPath.has(filePath)) throw new Error('The review repeats a required file: ' + filePath);
    if (!row.closest('.required-parts-group')) throw new Error('A required file has no purpose group: ' + filePath);
    rowsByPath.set(filePath, row);
  }
  for (const part of expected) {
    const row = rowsByPath.get(part.path);
    if (!row) throw new Error('The review disagrees with the print plan about a file: ' + part.path);
    const expectedQuantity = part.qty === null ? configurationText[currentLang].perNeed : '×' + part.qty;
    if (row.querySelector('.qty-tag').textContent.trim() !== expectedQuantity) throw new Error('The review disagrees with the print plan about a quantity: ' + part.path);
  }
`);

let opened = false;
try {
  run('--profile', profile, 'open', pathToFileURL(path.resolve(__dirname, '../index.html')).href);
  opened = true;
  run('set', 'media', 'light', 'reduced-motion');
  run('set', 'viewport', '1280', '900');
  run('wait', '--fn', '!!window.AccessoryView && !!document.querySelector("[data-accessory-group]")');
  run('snapshot', '-i');
  check(`
    if (VaultResources.connected) throw new Error('The test must not use a personal folder connection');
    if (!document.getElementById('reference-title').textContent.trim()) throw new Error('Assembly reference is blank on first load');
    if (!document.querySelector('[data-accessory-group="drawer-baseplates"] .file-path').textContent.includes('/S3/')) throw new Error('Initial accessories do not match S3');
    if (workspaceStore.value.builds.length) throw new Error('The temporary profile contains an unexpected print plan');
    if (document.getElementById('flow-start').hidden || !document.getElementById('config-panel').hidden || !document.getElementById('review-panel').hidden) throw new Error('The disconnected first visit does not start at the folder step');
    if (document.getElementById('optional-accessories').open || document.querySelector('.accessory-group[open]')) throw new Error('Optional parts should start collapsed');
  `);
  verifyRequiredParts();
  click('#flow-browse');
  check(`if (document.getElementById('config-panel').hidden || !document.getElementById('review-panel').hidden) throw new Error('Browsing without a folder did not open configuration');`);

  select('#width', 'M');
  select('#depth', '7');
  select('#height', '2F');
  check(`
    const group = document.querySelector('[data-accessory-group="drawer-baseplates"]');
    if (![...group.querySelectorAll('.file-path')].every(node => node.textContent.includes('/M7/'))) throw new Error('Baseplates did not follow the changed width and depth');
    const tall = document.querySelector('[data-accessory-group="drawer-dividers-2f"]');
    if (!tall || !tall.textContent.includes('18-M, x5.stl') || !tall.textContent.includes('26-L, x7.stl')) throw new Error('The 2F divider choices do not match M7');
    if (!document.getElementById('accessory-roof').hidden) throw new Error('Roof accessories appear without a selected roof');
  `);
  select('#drawer-placement', 'top');
  check(`if (document.getElementById('drawer-roof').value !== 'grid' || document.getElementById('drawer-roof-choice').hidden) throw new Error('Choosing a top drawer did not expose and select its roof');`);
  check(`if (!document.querySelector('[data-accessory-group="drawer-top-handle"]')) throw new Error('The Grid roof handle is missing');`);
  verifyRequiredParts();
  select('#width', 'XL');
  select('#drawer-roof', 'heavyweight');
  check(`
    if (document.getElementById('height').value !== '1F') throw new Error('XL did not return to its supported height');
    if (document.querySelector('[data-accessory-group="drawer-dividers-2f"]')) throw new Error('Tall dividers are recommended for XL 1F');
    if (document.querySelector('[data-accessory-group="drawer-top-handle"]')) throw new Error('Grid handle remains after selecting the heavyweight roof');
    const group = document.querySelector('[data-accessory-group="drawer-heavyweight-accessories"]');
    if (!group || !group.textContent.includes('XL7 Heavyweight Roof Cut.stl')) throw new Error('Heavyweight accessories do not match XL7');
  `);
  verifyRequiredParts();
  console.log('PASS: drawer accessories follow dimensions, height and the selected roof');

  click('#lang-toggle');
  check(`
    if (document.documentElement.lang !== 'zh-CN') throw new Error('Chinese language was not selected');
    if (!document.getElementById('accessory-interior').textContent.includes('内部选装')) throw new Error('Accessory headings did not switch to Chinese');
    if (!document.getElementById('reference-title').textContent.includes('结构')) throw new Error('Assembly reference did not switch to Chinese');
  `);
  click('#lang-toggle');
  check(`
    if (document.documentElement.lang !== 'en') throw new Error('English language was not restored');
    if (!document.getElementById('accessory-roof').textContent.includes('Heavyweight')) throw new Error('Accessory annotations did not return to English');
    if (!document.getElementById('reference-title').textContent.includes('fits together')) throw new Error('Assembly reference did not return to English');
  `);
  console.log('PASS: accessory annotations and assembly reference switch between both languages');

  click('#system-sustainers');
  select('#width', 'L');
  select('#depth', '6');
  select('#height', '2F');
  select('#interior', 'empty');
  click('#flow-review');
  check(`if (document.getElementById('review-panel').hidden || !document.getElementById('config-panel').hidden) throw new Error('Review did not replace the configuration controls');`);
  openGroup('dividers');
  click('[data-accessory-select="dividers"]');
  run('wait', '--fn', 'document.getElementById("interior").value === "dividers"');
  check(`
    if (!document.getElementById('size-files').textContent.includes('L6 2F Dividers Module.stl')) throw new Error('Using dividers did not update the required case body');
    if (workspaceStore.value.builds.length) throw new Error('Using an option unexpectedly added a print-plan entry');
    const group = document.querySelector('[data-accessory-group="dividers"]');
    if (!group.open || document.activeElement !== group.querySelector('.accessory-status')) throw new Error('Using an option lost keyboard focus instead of focusing its status');
    if (group.querySelector('[data-accessory-select]')) throw new Error('The adopted option still offers its apply button');
    if (!document.getElementById('optional-accessories').open || document.getElementById('review-panel').hidden) throw new Error('Using an option hid its review context');
  `);
  verifyRequiredParts();
  console.log('PASS: applying an interior updates the body and keeps focus without adding a build');

  click('#plan-add-form button[type="submit"]');
  check(`
    if (workspaceStore.value.builds.length !== 1) throw new Error('Explicitly adding the configuration failed');
    window.accessoryTestPlan = JSON.stringify(workspaceStore.value.builds);
  `);
  verifyRequiredParts();
  openGroup('gridfinity');
  click('[data-accessory-select="gridfinity"]');
  check(`
    if (document.getElementById('interior').value !== 'gridfinity') throw new Error('Gridfinity option did not update the interior control');
    if (!document.getElementById('size-files').textContent.includes('L6 2F Flat Module.stl')) throw new Error('Gridfinity option did not select the Flat body');
    if (JSON.stringify(workspaceStore.value.builds) !== window.accessoryTestPlan) throw new Error('Changing the current option changed an existing print-plan entry');
    if (!document.activeElement.matches('[data-accessory-group="gridfinity"] .accessory-status')) throw new Error('Gridfinity status did not receive focus');
  `);
  console.log('PASS: switching the current option preserves an already saved print plan');

  click('[data-reference-system="modifications"]');
  check(`if (currentTab !== 'modifications') throw new Error('The modification reference did not select its workspace tab');`);
  click('#reference-parts');
  run('wait', '--fn', 'Math.abs(document.getElementById("workspace").getBoundingClientRect().top) < 100');
  check(`
    if (currentTab !== 'modifications' || !document.getElementById('tab-modifications').classList.contains('active')) throw new Error('The parts action did not keep the modification workspace active');
    if (Math.abs(document.getElementById('workspace').getBoundingClientRect().top) >= 100) throw new Error('The parts action left the user at the hidden finder anchor');
  `);
  console.log('PASS: modification reference navigates to its visible workspace');

  for (const [system, manual] of [['drawers', '02'], ['sustainers', '03'], ['modifications', '04']]) {
    click(`[data-reference-system="${system}"]`);
    if (system !== 'modifications') {
      click('#reference-hardware');
      check(`if (currentTab !== 'finder' || document.getElementById('review-panel').hidden || !document.getElementById('hardware-details').checkVisibility()) throw new Error('${system} hardware link did not reveal the required hardware');`);
      click('#reference-parts');
      check(`if (document.getElementById('review-panel').hidden || !document.getElementById('optional-accessories').open) throw new Error('${system} parts link did not reveal the optional parts');`);
      verifyRequiredParts();
    }
    click('#reference-manual');
    check(`if (currentTab !== 'manuals' || currentManual !== '${manual}') throw new Error('${system} opened the wrong assembly manual');`);
  }
  console.log('PASS: each assembly system opens its matching manual');
  assert.equal(run('errors').trim(), '', 'Browser reported JavaScript errors');
} finally {
  if (opened) run('close');
}
