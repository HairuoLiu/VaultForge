// Run with: node tests/resource-library.browser.cjs /path/to/agent-browser
// Uses synthetic PDF Files in an isolated profile; no personal folder is read.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const browser = process.argv[2] || 'agent-browser';
const session = 'vault-library-' + process.pid;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-library-'));
const run = (...args) => execFileSync(browser, ['--session', session, ...args], { encoding: 'utf8', timeout: 45000 });
const evaluate = code => execFileSync(browser, ['--session', session, 'eval', '--stdin'], { input: code, encoding: 'utf8', timeout: 15000 });
const check = code => evaluate('(() => { ' + code + ' })()');
const scrollTo = selector => evaluate('document.querySelector(' + JSON.stringify(selector) + ').scrollIntoView({behavior:"instant",block:"center"});');
const click = selector => {
  scrollTo(selector);
  run('snapshot', '-i');
  run('click', selector);
};
const select = (selector, value) => {
  scrollTo(selector);
  run('snapshot', '-i');
  run('select', selector, value);
};
const requireCondition = (condition, message) => check('if (!(' + condition + ')) throw new Error(' + JSON.stringify(message) + ');');
const noOverflow = () => requireCondition('document.documentElement.scrollWidth <= window.innerWidth + 1', 'The page overflows the mobile viewport');
const assertReader = (id, fallback) => check(`
  const id = ${JSON.stringify(id)};
  const manual = VaultResources.manual(id, currentLang);
  const selected = document.getElementById('mbtn-' + id);
  const frame = document.getElementById('pdf-frame');
  const state = selected.querySelector('.manual-state');
  if (currentManual !== id || !selected.classList.contains('active-doc') || selected.getAttribute('aria-pressed') !== 'true') throw new Error('The selected card disagrees with the reader');
  if (document.querySelectorAll('#manual-catalog [aria-pressed="true"]').length !== 1) throw new Error('Multiple manuals are selected');
  if (document.getElementById('manual-title').textContent !== selected.querySelector('strong').textContent) throw new Error('The reader title does not match its card');
  if (!manual) {
    if (state.dataset.state !== 'missing' || !frame.hidden || frame.hasAttribute('src')) throw new Error('A missing manual must clear the previous preview');
    for (const link of document.querySelectorAll('#manual-open, #manual-download')) if (link.hasAttribute('href') || link.getAttribute('aria-disabled') !== 'true') throw new Error('A missing manual retains a stale download or reader URL');
    if (document.getElementById('manual-status').hidden || !document.getElementById('manual-filename').hidden) throw new Error('Missing manual feedback is incorrect');
  } else {
    const url = VaultResources.getURL(manual.path);
    if (manual.fallback !== ${Boolean(fallback)}) throw new Error('Unexpected manual language fallback');
    if (state.dataset.state !== 'ready' || !frame.checkVisibility() || !frame.getAttribute('src').startsWith(url + '#')) throw new Error('The reader does not show the selected local PDF');
    if (document.getElementById('manual-filename').textContent !== manual.file.name) throw new Error('The PDF filename does not match the selected manual');
    if (document.getElementById('manual-open').getAttribute('href') !== url || document.getElementById('manual-download').getAttribute('href') !== url) throw new Error('Manual actions do not point to the selected PDF');
    if (document.getElementById('manual-download').download !== manual.file.name) throw new Error('Download keeps another manual filename');
    if (document.getElementById('manual-status').hidden === manual.fallback) throw new Error('Fallback language feedback does not match the selected PDF');
    if (manual.fallback && !state.textContent.includes(currentLang === 'zh' ? '备用语言' : 'Other language')) throw new Error('The card does not disclose fallback language');
    if (document.getElementById('manual-language').textContent !== (manual.language === 'zh' ? '中文 PDF' : 'English PDF')) throw new Error('The reader language badge is incorrect');
  }
`);

let opened = false;
try {
  run('--profile', profile, 'open', pathToFileURL(path.resolve(__dirname, '../index.html')).href);
  opened = true;
  run('set', 'media', 'light', 'reduced-motion');
  run('set', 'viewport', '1280', '900');
  run('wait', '--fn', '!!window.ResourceLibrary && !!window.WorkbenchFlow');
  evaluate('VaultConnection.ready');
  requireCondition('!VaultResources.connected && workspaceStore.value.builds.length === 0', 'The test profile must begin without personal resources or builds');
  requireCondition('document.querySelectorAll("#workspace-sections > button").length === 4 && [...document.querySelectorAll("#workspace-sections > button")].every(button => button.checkVisibility() && button.querySelector("strong").textContent.trim())', 'The four workspace entry points must be visible and labelled');
  click('[data-workspace-section="modifications"]');
  requireCondition('currentTab === "modifications" && document.getElementById("mod-category-cards").checkVisibility()', 'The modification entry does not open its visible purpose categories');
  click('[data-workspace-section="manuals"]');
  check(`
    if (currentTab !== 'manuals' || document.querySelectorAll('#manual-catalog > button').length !== 5) throw new Error('The library must show all five manuals');
    for (const card of document.querySelectorAll('#manual-catalog > button')) {
      if (!card.checkVisibility() || !card.querySelector('strong').textContent || !card.querySelector('.manual-card-description').textContent) throw new Error('A manual purpose card is blank or hidden');
      if (card.querySelector('.manual-state').dataset.state !== 'disconnected') throw new Error('An unconnected manual claims availability');
    }
    if (!document.querySelector('#mbtn-02 .manual-recommended')) throw new Error('The drawer configuration does not recommend its assembly guide');
    if (!document.getElementById('manual-connect').checkVisibility() || !document.getElementById('pdf-frame').hidden) throw new Error('The disconnected reader needs a connection action');
  `);
  click('#mbtn-05');
  requireCondition('currentManual === "05" && document.getElementById("manual-status").checkVisibility() && !document.getElementById("manual-open").hasAttribute("href")', 'Selecting an unavailable manual must retain useful disconnected feedback');
  console.log('PASS: four entry points and five purpose cards work before connecting resources');

  click('[data-workspace-section="build"]');
  click('#flow-browse');
  select('#drawer-placement', 'top');
  click('#drawer-top-handle');
  click('#configuration-more > summary');
  click('#drawer-geared-rails');
  requireCondition('readConfiguration().topHandle === true && readConfiguration().gearedRails === false', 'The configuration fixture must explicitly include its handle and exclude optional geared rails');
  evaluate('window.libraryConfiguration = JSON.stringify(readConfiguration());');
  click('[data-workspace-section="manuals"]');
  evaluate(String.raw`(() => {
    const bodies = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Count 1 /Kids [3 0 R] >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Resources << >> /Contents 4 0 R >>',
      '<< /Length 0 >>\nstream\n\nendstream'
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [];
    bodies.forEach((body, index) => { offsets.push(pdf.length); pdf += (index + 1) + ' 0 obj\n' + body + '\nendobj\n'; });
    const xref = pdf.length;
    pdf += 'xref\n0 5\n0000000000 65535 f \n' + offsets.map(offset => String(offset).padStart(10, '0') + ' 00000 n \n').join('');
    pdf += 'trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';
    const fixture = [['01', 'en'], ['01', 'zh'], ['02', 'zh'], ['03', 'en'], ['05', 'en'], ['05', 'zh']];
    VaultResources.connect(fixture.map(([id, lang]) => new File([pdf], VaultResources.manuals[id][lang], { type: 'application/pdf' })));
  })()`);
  requireCondition('VaultResources.connected && VaultResources.index.counts.pdf === 6 && document.getElementById("manual-connect").hidden', 'The isolated PDF fixture failed to connect');

  for (const language of ['en', 'zh']) {
    requireCondition('currentLang === ' + JSON.stringify(language), 'The language sequence is wrong');
    for (const id of ['01', '02', '03', '04', '05']) {
      click('#mbtn-' + id);
      assertReader(id, language === 'en' ? id === '02' : id === '03');
    }
    if (language === 'en') click('#lang-toggle');
  }
  console.log('PASS: each manual card matches the reader, available language, fallback and missing-file state in both languages');

  evaluate("openManualAt('01', 1)");
  evaluate("openManualAt('01', 18)");
  check(`
    const url = VaultResources.getURL(VaultResources.manual('01', 'zh').path);
    if (currentManual !== '01' || currentManualPage !== 18 || currentTab !== 'manuals') throw new Error('The source link lost its requested manual or page');
    if (document.getElementById('pdf-frame').getAttribute('src') !== url + '#page=18&view=FitH&toolbar=1') throw new Error('The embedded reader lost the source page');
    if (document.getElementById('manual-open').getAttribute('href') !== url + '#page=18') throw new Error('Open in new tab lost the source page');
    if (document.getElementById('manual-download').getAttribute('href') !== url) throw new Error('The download must still refer to the full PDF');
  `);
  click('#lang-toggle');
  requireCondition('currentLang === "en" && currentManualPage === 18 && document.getElementById("pdf-frame").getAttribute("src").includes("#page=18&") && document.getElementById("manual-open").getAttribute("href").endsWith("#page=18")', 'Switching to an available language lost the selected source page');
  evaluate("openManualAt('02', 6)");
  check(`
    const manual = VaultResources.manual('02', currentLang);
    const url = VaultResources.getURL(manual.path);
    if (!manual.fallback || currentManualPage !== 6) throw new Error('The fallback source scenario was not reached');
    if (document.getElementById('pdf-frame').getAttribute('src').includes('page=') || document.getElementById('manual-open').getAttribute('href') !== url) throw new Error('Fallback language incorrectly reuses a cross-language page number');
    if (!document.getElementById('manual-status').textContent.includes('opened at page one')) throw new Error('Fallback page behavior must be explained');
  `);
  click('#lang-toggle');
  requireCondition('currentLang === "zh" && !VaultResources.manual("02", currentLang).fallback && document.getElementById("pdf-frame").getAttribute("src").includes("#page=6&") && document.getElementById("manual-open").getAttribute("href").endsWith("#page=6")', 'Returning to the matching language did not restore the requested page');
  console.log('PASS: source-page links preserve page numbers while language fallback starts at page one');

  click('[data-workspace-section="build"]');
  click('#tab-btn-finder');
  requireCondition('JSON.stringify(readConfiguration()) === window.libraryConfiguration && document.getElementById("drawer-top-handle").checked && !document.getElementById("drawer-geared-rails").checked', 'Returning from manuals changed the handle or geared-rail choices');
  click('#system-sustainers');
  click('[data-workspace-section="manuals"]');
  requireCondition('document.querySelectorAll(".manual-recommended").length === 1 && !!document.querySelector("#mbtn-03 .manual-recommended")', 'A sustainer configuration must recommend its own assembly guide');
  click('[data-workspace-section="build"]');
  click('#tab-btn-finder');
  click('#system-drawers');
  requireCondition('JSON.stringify(readConfiguration()) === window.libraryConfiguration', 'Switching systems around the manual library lost the saved drawer choices');
  console.log('PASS: recommendations follow the component system and navigation preserves optional build choices');

  run('set', 'viewport', '390', '844');
  for (const language of ['zh', 'en']) {
    requireCondition('currentLang === ' + JSON.stringify(language), 'The mobile language sequence is wrong');
    for (const section of ['build', 'modifications', 'manuals']) {
      click('[data-workspace-section="' + section + '"]');
      noOverflow();
    }
    for (const id of ['01', '02', '03', '04', '05']) {
      click('#mbtn-' + id);
      noOverflow();
    }
    if (language === 'zh') click('#lang-toggle');
  }
  console.log('PASS: all three sections and five manual cards fit a 390 px viewport in both languages');
  assert.equal(run('errors').trim(), '', 'Browser reported JavaScript errors');
} finally {
  if (opened) run('close');
}
