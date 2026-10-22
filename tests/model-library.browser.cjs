// Run with: node tests/model-library.browser.cjs /path/to/agent-browser
// Uses synthetic STL Files and an isolated profile; no personal folder is read.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const browser = process.argv[2] || 'agent-browser';
const session = 'vault-models-' + process.pid;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-models-'));
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
const search = query => {
  prepare('#model-query');
  run('fill', '#model-query', query);
  run('press', 'Enter');
  run('wait', '--fn', 'ModelLibrary.selection().query === ' + JSON.stringify(query));
};
const results = '[...document.querySelectorAll("#model-results > .model-file")].map(row => row.dataset.modelPath)';
const resultIs = expected => expect('JSON.stringify((' + results + ').sort()) === ' + JSON.stringify(JSON.stringify([...expected].sort())), 'Search returned incorrect file paths for ' + expected.join(', '));
const noOverflow = () => expect('document.documentElement.scrollWidth <= innerWidth + 1', 'The model library overflows the viewport');

const fixture = {
  box: '01. DRAWERS/01. S Families/S3/Boxes/S3 Box 1F.stl',
  roof: '01. DRAWERS/01. S Families/S3/Roofs/S3 Grid Roof.stl',
  guide: '01. DRAWERS/07. Universal/Runners/x3 Runner Guide.stl',
  slide: '01. DRAWERS/07. Universal/Runners/x3 Runner Slide.stl',
  rails: '01. DRAWERS/07. Universal/Geared Rails/S Rails.stl',
  xlRoof: '01. DRAWERS/05. XL Families/XL3/Roofs/XL3 Grid Roof.stl',
  xlGuide: '01. DRAWERS/07. Universal/Runners/XL Runners/x3 Runner Guide XL.stl',
  xlRails: '01. DRAWERS/07. Universal/Geared Rails/XL Rails.stl',
  handle: '01. DRAWERS/07. Universal/Top Handle (Turn On Supports).stl',
  sustainer: '02. SUSTAINERS/01. S Families/S3/Modules/S3 1F Module.stl',
  base: '03. MODIFICATIONS/Base/S/S3 Base.stl',
  stationaryHandle: '03. MODIFICATIONS/Stationary Handle/S Stationary Handle.stl',
  rootFile: 'Prototype.stl',
  duplicateA: 'Extras/Prototype A/Shared component.stl',
  duplicateB: 'Extras/Prototype B/Shared component.stl'
};
const paths = [...Object.values(fixture), ...Array.from({ length: 54 }, (_, index) => 'Extras/Custom components/Long directory for additional unclassified printable components/Unclassified piece ' + String(index + 1).padStart(2, '0') + '.stl')];
const connectFixture = () => evaluate(`(() => {
  const paths = ${JSON.stringify(paths)};
  const duplicateB = ${JSON.stringify(fixture.duplicateB)};
  const stl = width => {
    const a = '0 0 0', b = width + ' 0 0', c = '0 7 0', d = '0 0 4';
    return 'solid fixture\\n' + [[a,c,b],[a,b,d],[a,d,c],[b,c,d]].map(face => 'facet normal 0 0 0\\nouter loop\\n' + face.map(vertex => 'vertex ' + vertex).join('\\n') + '\\nendloop\\nendfacet\\n').join('') + 'endsolid fixture';
  };
  const files = paths.map(relative => {
    const file = new File([stl(relative === duplicateB ? 22 : 11)], relative.split('/').at(-1), { type: 'model/stl' });
    Object.defineProperty(file, 'webkitRelativePath', { value: 'Isolated Vault/' + relative });
    return file;
  });
  VaultResources.connect(files);
})()`);

let opened = false;
try {
  run('--profile', profile, 'open', pathToFileURL(path.resolve(__dirname, '../index.html')).href);
  opened = true;
  run('set', 'media', 'light', 'reduced-motion');
  run('set', 'viewport', '1280', '960');
  run('wait', '--fn', '!!window.ModelLibrary && !!window.ModelIndex');
  evaluate('VaultConnection.ready');
  click('#tab-btn-models');
  expect('currentTab === "models" && document.getElementById("tab-models").checkVisibility()', 'The model entry must open its own panel');
  expect('!VaultResources.connected && document.querySelectorAll("#model-results > .model-file").length === 0 && document.getElementById("model-connect").checkVisibility()', 'Disconnected browsing must offer folder selection without inventing available local files');
  connectFixture();
  expect('VaultResources.connected && VaultResources.index.counts.stl === ' + paths.length, 'The isolated fixture did not connect all STL paths');
  expect('document.querySelectorAll("#model-results > .model-file").length === 50 && !document.getElementById("model-next").disabled', 'The first page must show 50 files and allow another page');
  evaluate('window.modelFirstPage = ' + results);
  click('#model-next');
  expect('(' + results + ').length === ' + (paths.length - 50) + ' && (' + results + ').every(path => !window.modelFirstPage.includes(path)) && document.getElementById("model-next").disabled', 'The second page must contain only the remaining distinct files');
  click('#model-prev');
  expect('JSON.stringify(' + results + ') === JSON.stringify(window.modelFirstPage)', 'Returning to the first page changes its stable ordering');
  console.log('PASS: disconnected state is honest; the real folder inventory includes unknown models and paginates without duplicates');

  // Dispatch both events in one task to exercise the pending 140 ms search timer.
  evaluate(`(() => {
    const input = document.getElementById('model-query');
    input.value = 'Unclassified';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('model-next').click();
  })()`);
  expect('ModelLibrary.selection().query === "Unclassified" && ModelLibrary.selection().page === 1', 'Pagination during a pending search must commit the current query and restart at page one');
  resultIs(paths.slice(-54, -4));
  click('#model-next');
  resultIs(paths.slice(-4));
  click('#model-reset');
  console.log('PASS: clicking pagination before search debounce finishes commits the new query and resets its page');

  search('S3 导轨');
  resultIs([fixture.guide, fixture.slide, fixture.rails]);
  search('S3 runner');
  resultIs([fixture.guide, fixture.slide, fixture.rails]);
  search('S3 grid 顶盖');
  resultIs([fixture.roof, fixture.handle]);
  search('提手');
  resultIs([fixture.handle, fixture.stationaryHandle]);
  search('handle');
  resultIs([fixture.handle, fixture.stationaryHandle]);
  prepare('#model-query');
  run('fill', '#model-query', 'hadnle');
  run('wait', '--fn', 'ModelLibrary.selection().query === "hadnle" && document.querySelectorAll("#model-results > .model-file").length === 2');
  resultIs([fixture.handle, fixture.stationaryHandle]);
  expect('currentLang === "en"', 'The bilingual regression must begin in the default English interface');
  click('#lang-toggle');
  expect('currentLang === "zh"', 'The language toggle did not switch the interface');
  search('S3 roof');
  resultIs([fixture.roof, fixture.handle]);
  search('S3 顶盖');
  resultIs([fixture.roof, fixture.handle]);
  click('[data-model-example="handle"]');
  resultIs([fixture.handle, fixture.stationaryHandle]);
  expect('[...document.querySelectorAll("#model-results [data-model-copy-path]")].length === 2 && [...document.querySelectorAll("#model-results [data-model-copy-path]")].every(button => button.textContent.trim())', 'Example searches must preserve visible copy-button labels after updating the search controls');
  console.log('PASS: English and Chinese queries work in either interface language; S3 includes compatible universal rails and excludes XL');

  search('');
  click('[data-model-system="sustainers"]');
  resultIs([fixture.sustainer]);
  click('[data-model-system="modifications"]');
  resultIs([fixture.base, fixture.stationaryHandle]);
  click('[data-model-system="drawers"]');
  if (evaluate('document.getElementById("model-more").open').trim() !== 'true') click('#model-more > summary');
  select('#model-type', 'roof');
  select('#model-width', 'S');
  select('#model-depth', '3');
  search('grid');
  resultIs([fixture.roof]);
  run('reload');
  run('wait', '--fn', '!!window.ModelLibrary');
  evaluate('VaultConnection.ready');
  expect('currentTab === "models" && ModelLibrary.selection().query === "grid" && ModelLibrary.selection().system === "drawers" && ModelLibrary.selection().type === "roof" && ModelLibrary.selection().width === "S" && ModelLibrary.selection().depth === "3"', 'Refreshing must preserve the selected model tab, query and filters');
  expect('!VaultResources.connected && document.querySelectorAll("#model-results > .model-file").length === 0', 'A synthetic non-persisted folder must not leave stale model results after reload');
  connectFixture();
  resultIs([fixture.roof]);
  click('#model-reset');
  expect('ModelLibrary.selection().query === "" && ModelLibrary.selection().system === "all" && ModelLibrary.selection().type === "all" && ModelLibrary.selection().width === "all" && ModelLibrary.selection().depth === "all" && document.querySelectorAll("#model-results > .model-file").length === 50', 'Clear all must reset search, system and detailed filters together');
  console.log('PASS: system and dimension filters combine correctly, survive refresh and reconnect, and clear together');

  search('Prototype.stl');
  expect('document.querySelector(\'[data-model-path="Prototype.stl"] .model-directory\').textContent === VaultResources.index.name', 'A root-level file must show the connected folder name instead of a truncated filename as its directory');
  search('Shared component');
  resultIs([fixture.duplicateA, fixture.duplicateB]);
  const secondRow = '[data-model-path=' + JSON.stringify(fixture.duplicateB) + ']';
  evaluate('window.modelCopied = null; Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async value => { window.modelCopied = value; } } });');
  click(secondRow + ' [data-model-copy-path]');
  expect('window.modelCopied === ' + JSON.stringify(fixture.duplicateB), 'Copying a duplicate filename must preserve its full relative directory');
  expect('[...document.querySelectorAll("#model-results [data-model-locate]")].every(button => !button.checkVisibility())', 'File mode must not offer an unavailable local file-manager action');
  click(secondRow + ' .stl-preview-button');
  run('wait', '--fn', 'document.getElementById("stl-dialog").dataset.state === "ready"');
  expect('document.getElementById("stl-dialog").open && document.getElementById("stl-download").dataset.localStl === ' + JSON.stringify(fixture.duplicateB) + ' && document.getElementById("stl-dimensions").textContent.includes("22")', 'Preview must load the selected duplicate path and its actual distinct geometry');
  expect('!document.getElementById("stl-reveal-local").checkVisibility()', 'File mode must also hide the preview file-manager action');
  click('#stl-close');
  expect('document.activeElement.matches(' + JSON.stringify(secondRow + ' .stl-preview-button') + ')', 'Closing the preview must return keyboard focus to the chosen file');
  console.log('PASS: same-name files remain distinct; native copy and 3D preview actions use the selected path and geometry');

  run('set', 'viewport', '390', '844');
  for (const language of ['zh', 'en']) {
    expect('currentLang === ' + JSON.stringify(language), 'Unexpected language in the mobile sequence');
    click('#model-reset');
    noOverflow();
    search('Unclassified piece 54');
    resultIs([paths.at(-1)]);
    noOverflow();
    expect('document.activeElement.id === "model-query"', 'Submitting a keyboard search must retain input focus');
    search('no-such-isolated-model');
    expect('document.querySelectorAll("#model-results > .model-file").length === 0 && document.getElementById("model-empty").checkVisibility()', 'An unmatched search needs a visible empty result state');
    noOverflow();
    if (language === 'zh') click('#lang-toggle');
  }
  search('Shared component');
  evaluate('VaultResources.disconnect()');
  expect('document.querySelectorAll("#model-results > .model-file").length === 0 && document.getElementById("model-connect").checkVisibility()', 'Disconnecting must remove all stale file actions and show reconnection');
  noOverflow();
  console.log('PASS: keyboard searches, empty feedback and both languages fit 390 px; disconnect removes stale files');
  assert.equal(run('errors').trim(), '', 'Browser reported JavaScript errors');
} finally {
  if (opened) run('close');
}
