// Run with: node tests/workspace.browser.cjs /path/to/agent-browser
// Uses an isolated temporary browser profile; never touches personal sessions.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const browser = process.argv[2] || 'agent-browser';
const session = 'vault-regression-' + process.pid;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-regression-'));
const run = (...args) => execFileSync(browser, ['--session', session, ...args], { encoding: 'utf8', timeout: 45000 });
const evaluate = code => execFileSync(browser, ['--session', session, 'eval', '--stdin'], { input: code, encoding: 'utf8', timeout: 15000 });
try {
  run('--profile', profile, 'open', pathToFileURL(path.resolve(__dirname, '../index.html')).href);
  run('set', 'media', 'light', 'reduced-motion');
  evaluate(`document.getElementById('plan-add-name').value = 'Original'; document.getElementById('plan-add-form').requestSubmit(); document.getElementById('tab-btn-plan').click();`);
  evaluate(`document.querySelector('[data-action="restore"]').scrollIntoView({behavior:'instant',block:'center'});`);
  run('snapshot', '-i');
  run('fill', '#build-0-name', 'Renamed build');
  run('click', '[data-action="restore"]');
  evaluate(`if (currentTab !== 'finder' || workspaceStore.value.builds[0].name !== 'Renamed build') throw new Error('Editing a name swallowed the following Load configuration click: ' + JSON.stringify({currentTab, name: workspaceStore.value.builds[0].name}));`);
  console.log('PASS: editing a name does not swallow the next action');
  evaluate(`document.getElementById('tab-btn-plan').click();`);
  evaluate(`document.querySelector('[data-action="restore"]').scrollIntoView({behavior:'instant',block:'center'});`);
  run('fill', '#build-0-count', '3');
  run('click', '#build-0-name');
  evaluate(`if (document.activeElement.id !== 'build-0-name' || workspaceStore.value.builds[0].count !== 3) throw new Error('Editing count interrupted focus or quantity persistence: '+JSON.stringify({active:document.activeElement.id, count:workspaceStore.value.builds[0].count, input:document.getElementById('build-0-count').value, tab:currentTab}));`);
  console.log('PASS: editing a count preserves the next input focus');
  run('fill', '#build-0-count', '0');
  run('fill', '#build-0-name', 'Keep invalid draft');
  run('press', 'Tab');
  evaluate(`if (document.getElementById('build-0-count').value !== '0' || document.getElementById('build-0-count').checkValidity()) throw new Error('An unrelated change discarded an invalid quantity draft');`);
  run('fill', '#build-0-count', '3');
  run('press', 'Tab');
  run('reload');
  evaluate(`if (currentTab !== 'plan' || workspaceStore.value.builds[0].count !== 3 || workspaceStore.value.builds[0].name !== 'Keep invalid draft') throw new Error('Plan did not survive reload');`);
  console.log('PASS: invalid quantity drafts remain visible; valid changes survive reload');
  evaluate(`document.querySelector('[data-action="remove"]').scrollIntoView({behavior:'instant',block:'center'});`);
  run('fill', '#build-0-name', 'Remove after rename');
  run('click', '[data-action="remove"]');
  evaluate(`if (workspaceStore.value.builds.length || document.getElementById('plan-empty').hidden) throw new Error('Editing a name swallowed the following Remove click');`);
  console.log('PASS: remove works with one click after editing');
  assert.equal(run('errors').trim(), '', 'Browser reported JavaScript errors');
} finally {
  run('close');
}
