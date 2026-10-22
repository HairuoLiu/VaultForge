// Run with: node tests/assembly-readiness.browser.cjs /path/to/agent-browser
// Uses an isolated profile and browses the catalog without personal resource files.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const browser = process.argv[2] || 'agent-browser';
const session = 'vault-assembly-' + process.pid;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-assembly-'));
const run = (...args) => execFileSync(browser, ['--session', session, ...args], { encoding: 'utf8', timeout: 45000 });
const evaluate = code => execFileSync(browser, ['--session', session, 'eval', '--stdin'], { input: code, encoding: 'utf8', timeout: 15000 });
const inspect = code => evaluate('(() => { ' + code + ' })()');
const expect = (condition, message) => inspect('if (!(' + condition + ')) throw new Error(' + JSON.stringify(message) + ');');
const prepare = selector => {
  evaluate('document.querySelector(' + JSON.stringify(selector) + ').scrollIntoView({behavior:"instant",block:"center"});');
  run('snapshot', '-i');
};
const click = selector => { prepare(selector); run('click', selector); };
const select = (selector, value) => { prepare(selector); run('select', selector, value); };
const handlePath = '01. DRAWERS/07. Universal/Top Handle (Turn On Supports).stl';
const handleRow = 'Array.from(document.querySelectorAll("#size-files .file-card")).find(row => row.querySelector(".file-path").textContent.trim() === ' + JSON.stringify(handlePath) + ')';
const planHandleRow = 'Array.from(document.querySelectorAll("#plan-files .file-card")).find(row => row.dataset.planPath === ' + JSON.stringify(handlePath) + ')';

let opened = false;
try {
  run('--profile', profile, 'open', pathToFileURL(path.resolve(__dirname, '../index.html')).href);
  opened = true;
  run('set', 'media', 'light', 'reduced-motion');
  run('set', 'viewport', '1280', '960');
  run('wait', '--fn', '!!window.AssemblyGuidance && !!window.BuildPreparation && !!window.WorkbenchFlow');
  evaluate('VaultConnection.ready');
  expect('!VaultResources.connected && workspaceStore.value.builds.length === 0', 'Regression must start without a folder or existing personal plans');
  click('#flow-browse');
  select('#width', 'S');
  select('#depth', '3');
  select('#height', '1F');
  select('#drawer-placement', 'top');
  expect('document.getElementById("drawer-top-handle").checkVisibility() && !document.getElementById("drawer-top-handle").checked', 'Grid roof must visibly offer an optional, initially unchecked handle');
  prepare('#drawer-top-handle');
  run('check', '#drawer-top-handle');
  click('#flow-review');
  run('wait', '--fn', 'document.getElementById("review-panel").checkVisibility()');
  inspect([
    'const hardware = document.getElementById("hardware-details");',
    'if (hardware.tagName !== "SECTION" || !hardware.checkVisibility()) throw new Error("Hardware must be visible without expanding a disclosure");',
    'const rows = [...hardware.querySelectorAll("tbody tr")];',
    'const sizes = rows.map(row => [row.cells[0].textContent.trim(), row.cells[1].textContent.trim()]);',
    'if (JSON.stringify(sizes) !== JSON.stringify([["M4 × 14 mm", "×4"], ["M6 × 50 mm", "×2"]])) throw new Error("S3 Grid handle hardware is incomplete: " + JSON.stringify(sizes));',
    'if (rows.some(row => !row.cells[2].textContent.trim() || !row.cells[2].querySelector("a"))) throw new Error("Hardware rows must explain their use and link to the source manual");',
    'const handle = ' + handleRow + ';',
    'if (!handle || handle.querySelector(".qty-tag").textContent.trim() !== "×1") throw new Error("Required files must include exactly one selected top handle");',
    'if (!document.getElementById("build-assembly-steps").checkVisibility() || !document.querySelector("#build-assembly-steps a")) throw new Error("Assembly guidance and source links must be immediately visible");',
    'if (document.getElementById("plan-add-count").value !== "1") throw new Error("The first plan addition must default to one module");'
  ].join('\n'));
  console.log('PASS: S3 Grid handle review visibly includes one STL, four facade bolts and two handle bolts');

  click('#plan-add-form button[type="submit"]');
  click('#tab-btn-plan');
  expect('workspaceStore.value.builds.length === 1 && workspaceStore.value.builds[0].count === 1 && workspaceStore.value.builds[0].configuration.topHandle === true', 'Adding the reviewed build must save one handle-equipped module');
  prepare('#build-0-count');
  run('fill', '#build-0-count', '3');
  run('press', 'Tab');
  inspect([
    'if (workspaceStore.value.builds[0].count !== 3) throw new Error("Edited batch count was not saved");',
    'const row = ' + planHandleRow + ';',
    'if (!row || row.querySelector(".qty-tag").textContent.trim() !== "×3") throw new Error("The plan must total three handle STLs");',
    'const hardware = [...document.querySelectorAll("#plan-hardware li")].map(row => [row.querySelector("strong").textContent.trim(), row.querySelector("span").textContent.trim()]);',
    'if (JSON.stringify(hardware) !== JSON.stringify([["M4 × 14 mm", "×12"], ["M6 × 50 mm", "×6"]])) throw new Error("Batch hardware totals must multiply with all selected handles");'
  ].join('\n'));
  evaluate([
    'window.assemblyCsv = null;',
    'document.addEventListener("click", event => {',
    '  const link = event.target.closest("a[download]");',
    '  if (!link || link.download !== "vault-print-plan.csv") return;',
    '  event.preventDefault();',
    '  fetch(link.href).then(response => response.text()).then(text => { window.assemblyCsv = text; });',
    '}, true);'
  ].join('\n'));
  click('#plan-export');
  run('wait', '--fn', 'typeof window.assemblyCsv === "string"');
  expect('window.assemblyCsv.includes(\'"hardware","M6 × 50 mm","6","pieces"\') && window.assemblyCsv.includes(\'"stl","' + handlePath + '","3","STL copies"\')', 'The exported CSV must include the same six handle bolts and three STL copies');
  console.log('PASS: changing the batch to three updates visible quantities and the actual CSV export');

  click('#plan-entries [data-action="restore"]');
  expect('document.getElementById("config-panel").checkVisibility() && document.getElementById("drawer-top-handle").checked', 'Loading the saved build must restore its visible handle selection');
  run('reload');
  run('wait', '--fn', '!!window.BuildPreparation && !!window.WorkbenchFlow');
  evaluate('VaultConnection.ready');
  expect('document.getElementById("drawer-top-handle").checked && savedConfigurations.drawers.topHandle === true && workspaceStore.value.builds[0].count === 3', 'The handle selection and saved plan must survive a page reload');
  click('#flow-browse');
  expect('document.getElementById("drawer-top-handle").checkVisibility() && document.getElementById("drawer-top-handle").checked', 'Continuing to browse after reload must show the restored handle option');
  console.log('PASS: loading a saved configuration and refreshing preserve the handle choice and batch');

  for (const roof of ['table', 'none']) {
    if (roof === 'none') click('#flow-edit');
    select('#drawer-roof', roof);
    expect('!document.getElementById("drawer-top-handle").checked && !document.getElementById("drawer-top-handle").checkVisibility()', 'An incompatible roof must clear and hide the handle choice');
    click('#flow-review');
    expect('!(' + handleRow + ') && !document.getElementById("hardware-spec").textContent.includes("M6 × 50 mm")', 'Unselected handles and their bolts must disappear from the current review');
    expect('workspaceStore.value.builds.length === 1 && workspaceStore.value.builds[0].configuration.topHandle === true && workspaceStore.value.builds[0].count === 3', 'Editing the current roof must not mutate the previously saved handle build');
  }
  click('#tab-btn-plan');
  expect('(' + planHandleRow + ').querySelector(".qty-tag").textContent.trim() === "×3"', 'The original saved plan must retain its handles after the current configuration changes');
  click('#plan-entries [data-action="restore"]');
  expect('document.getElementById("drawer-roof").value === "grid" && document.getElementById("drawer-top-handle").checked', 'The unchanged saved plan must still restore the complete Grid handle configuration');
  console.log('PASS: changing to another roof or no roof removes only the current handle selection');

  click('#system-sustainers');
  select('#width', 'S');
  select('#depth', '3');
  select('#height', '1F');
  click('#flow-review');
  inspect([
    'const rows = [...document.querySelectorAll("#size-files .file-card")];',
    'const pairs = rows.filter(row => /HINGES|RODS/i.test(row.querySelector(".file-path").textContent) && row.querySelector(".file-quantity small"));',
    'const pins = rows.find(row => row.querySelector(".file-path").textContent.includes("1 SET OF PINS"));',
    'if (pairs.length < 2 || pairs.some(row => !row.querySelector(".file-quantity small").checkVisibility() || !/2/.test(row.querySelector(".file-quantity small").textContent) || row.querySelector(".qty-tag").textContent.trim() !== "×1")) throw new Error("Paired hinges and rods must clearly explain that one STL contains two parts");',
    'if (!pins || !pins.querySelector(".file-quantity small")?.checkVisibility() || !/1/.test(pins.querySelector(".file-quantity small").textContent) || pins.querySelector(".qty-tag").textContent.trim() !== "×2") throw new Error("The latch pin set must explain its unit while retaining two required STL copies");',
    'if (document.getElementById("hardware-spec").textContent.includes("M6 × 50 mm")) throw new Error("Drawer handle bolts must not leak into sustainer hardware");'
  ].join('\n'));
  console.log('PASS: case pairs and pin sets explain their contents beside the actual STL quantities');
  assert.equal(run('errors').trim(), '', 'Browser reported JavaScript errors');
} finally {
  if (opened) run('close');
}
