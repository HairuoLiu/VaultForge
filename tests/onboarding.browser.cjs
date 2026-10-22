// Run with: node tests/onboarding.browser.cjs /path/to/agent-browser
// Uses an isolated temporary profile and never connects a personal resource folder.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const browser = process.argv[2] || 'agent-browser';
const session = 'vault-onboarding-' + process.pid;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-onboarding-'));
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
const visible = id => 'document.getElementById(' + JSON.stringify(id) + ').checkVisibility()';
const sameConfiguration = 'JSON.stringify(readConfiguration()) === window.onboardingConfiguration';
const failUnless = (condition, message) => check('if (!(' + condition + ')) throw new Error(' + JSON.stringify(message) + ');');

let opened = false;
try {
  run('--profile', profile, 'open', pathToFileURL(path.resolve(__dirname, '../index.html')).href);
  opened = true;
  run('set', 'media', 'light', 'reduced-motion');
  run('set', 'viewport', '1280', '900');
  run('wait', '--fn', '!!window.WorkbenchFlow && !!window.FileDetails && !!document.getElementById("flow-browse")');
  evaluate('VaultConnection.ready');
  failUnless('!VaultResources.connected && workspaceStore.value.builds.length === 0', 'The isolated session must begin without a folder connection or saved builds');
  failUnless(visible('flow-start') + ' && !' + visible('config-panel') + ' && !' + visible('review-panel'), 'A first visit must show the folder step before configuration and files');
  click('#flow-browse');
  failUnless(visible('config-panel') + ' && !' + visible('flow-start') + ' && !' + visible('review-panel'), 'Browsing without files must open only the configuration step');
  failUnless('!VaultResources.connected', 'Browsing specifications must not claim that a folder is connected');
  console.log('PASS: a first visit offers a clear folder step and permits browsing without resources');

  select('#width', 'M');
  select('#depth', '6');
  select('#height', '2F');
  select('#drawer-placement', 'top');
  failUnless('document.getElementById("drawer-roof").value === "grid" && ' + visible('drawer-roof'), 'Choosing the top tier must suggest a grid roof and expose the roof choice');
  select('#drawer-placement', 'lower');
  failUnless('document.getElementById("drawer-roof").value === "none" && !' + visible('drawer-roof'), 'Choosing a lower tier must remove its roof and hide the roof choice');
  select('#drawer-placement', 'top');
  evaluate('window.onboardingConfiguration = JSON.stringify(readConfiguration());');
  click('#flow-review');
  failUnless(visible('review-panel') + ' && !' + visible('config-panel'), 'Review must show required files and hide the configuration form');
  check([
    'const parts = BuildPlan.resolve(currentSystem, readConfiguration()).parts;',
    'const rows = [...document.querySelectorAll("#size-files .file-card")];',
    'if (rows.length !== parts.length) throw new Error("Review omits required parts or includes unrelated accessories");',
    'const expected = parts.map(part => part.path).sort();',
    'const actual = rows.map(row => row.querySelector(".file-path").textContent.trim()).sort();',
    'if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error("Required paths do not match the configured build");',
    'for (const part of parts) {',
    '  const row = rows.find(item => item.querySelector(".file-path").textContent.trim() === part.path);',
    '  if (part.qty !== null && row.querySelector(".qty-tag").textContent.trim() !== "×" + part.qty) throw new Error("Review has a wrong print quantity: " + part.path);',
    '}',
    'if (document.getElementById("optional-accessories").open) throw new Error("Optional accessories must start collapsed");',
    'for (const warning of document.querySelectorAll(".accessory-group .is-warning")) {',
    '  if (warning.closest(".accessory-group").open) throw new Error("Unverified accessories must not expand automatically");',
    '}',
    'if (document.getElementById("plan-customize").open) throw new Error("Optional plan naming and batch fields must start collapsed");',
    'if (document.getElementById("plan-add-count").value !== "1") throw new Error("A first build must default to one module");'
  ].join('\n'));
  console.log('PASS: top-tier guidance selects the roof and review lists every required file once');

  evaluate([
    'window.onboardingAccidentalActions = 0;',
    'window.onboardingActionGuard = event => {',
    '  if (event.target.closest("a.file-name, .stl-download-link, .stl-preview-button")) {',
    '    window.onboardingAccidentalActions++;',
    '    event.preventDefault();',
    '    event.stopImmediatePropagation();',
    '  }',
    '};',
    'document.addEventListener("click", window.onboardingActionGuard, true);'
  ].join('\n'));
  click('#size-files .file-details > summary');
  failUnless('document.querySelector("#size-files .file-details").open && window.onboardingAccidentalActions === 0 && !document.getElementById("stl-dialog").open', 'Opening notes must not download a file or launch its preview');
  failUnless('document.querySelector("#size-files .file-details .file-path").checkVisibility()', 'The expanded details must reveal the complete file path');
  evaluate('document.removeEventListener("click", window.onboardingActionGuard, true);');
  console.log('PASS: file details expand independently of download and preview actions');

  evaluate('window.onboardingLanguage = document.documentElement.lang;');
  click('#lang-toggle');
  failUnless('document.documentElement.lang !== window.onboardingLanguage && ' + sameConfiguration + ' && ' + visible('review-panel'), 'Changing language must preserve the current configuration and review step');
  failUnless('document.querySelector("#size-files .file-details > summary").textContent.trim() === (currentLang === "zh" ? "备注与路径" : "Notes & path")', 'File details must use the chosen language');
  click('#lang-toggle');
  failUnless('document.documentElement.lang === window.onboardingLanguage && ' + sameConfiguration, 'Changing language back must preserve the configuration');
  console.log('PASS: both languages preserve the chosen build and current step');

  click('#plan-add-form button[type="submit"]');
  check([
    'const builds = workspaceStore.value.builds;',
    'if (builds.length !== 1 || builds[0].count !== 1) throw new Error("The first add must save exactly one module");',
    'if (JSON.stringify(builds[0].configuration) !== window.onboardingConfiguration) throw new Error("The saved build differs from the reviewed configuration");',
    'const expected = BuildPlan.resolve(builds[0].system, builds[0].configuration).parts.map(part => part.path).sort();',
    'const actual = BuildPlan.summarize(builds).files.map(file => file.path).sort();',
    'if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error("Browsing optional accessories added unselected files to the plan");',
    'if (Object.values(builds[0].layout).some(qty => qty !== null)) throw new Error("The new plan guessed an unknown layout quantity");'
  ].join('\n'));
  click('#flow-edit');
  failUnless(visible('config-panel') + ' && !' + visible('review-panel') + ' && ' + sameConfiguration, 'Returning to configuration must preserve every choice');
  console.log('PASS: one click saves one configured module and editing preserves its choices');

  click('#system-sustainers');
  select('#width', 'M');
  select('#depth', '6');
  select('#height', '2F');
  select('#interior', 'dividers');
  click('#flow-review');
  click('#plan-add-form button[type="submit"]');
  check([
    'const builds = workspaceStore.value.builds;',
    'if (builds.length !== 2 || builds[1].count !== 1 || builds[1].system !== "sustainers") throw new Error("Adding the divided case must save one new module");',
    'const unknown = BuildPlan.resolve("sustainers", builds[1].configuration).parts.filter(part => part.qty === null);',
    'if (!unknown.length) throw new Error("The divider scenario must include unknown layout quantities");',
    'if (unknown.some(part => builds[1].layout[part.path] !== null)) throw new Error("Divider quantities must stay unfilled until explicitly chosen");',
    'if (!BuildPlan.summarize(builds).unresolved || !document.getElementById("plan-export").disabled) throw new Error("Export must wait for explicit divider quantities");'
  ].join('\n'));
  console.log('PASS: divided cases keep layout quantities unfilled and prevent premature CSV export');
  assert.equal(run('errors').trim(), '', 'Browser reported JavaScript errors');
} finally {
  if (opened) run('close');
}
