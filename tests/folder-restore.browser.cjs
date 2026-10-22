// Uses real directory handles and IndexedDB in an isolated browser profile.
// Only the native picker is replaced; files live in the browser's test storage.
const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const browser = process.argv[2] || 'agent-browser';
const session = 'vault-folder-' + process.pid;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-folder-'));
const run = (...args) => execFileSync(browser, ['--session', session, ...args], { encoding: 'utf8', timeout: 45000 });
const evaluate = code => execFileSync(browser, ['--session', session, 'eval', '--stdin'], { input: code, encoding: 'utf8', timeout: 30000 });
const project = path.resolve(__dirname, '..');
const server = spawn('python3', ['scripts/preview-server.py', '--no-browser', '--port', '0'], { cwd: project });
async function main() {
  let opened = false;
  try {
    const url = await new Promise((resolve, reject) => {
      let output = '';
      const timer = setTimeout(() => reject(new Error('Preview service startup timed out')), 10000);
      server.once('error', error => { clearTimeout(timer); reject(error); });
      server.once('exit', code => { clearTimeout(timer); reject(new Error('Preview service exited: ' + code)); });
      server.stdout.on('data', data => {
        output += data;
        const match = output.match(/http:\/\/127\.0\.0\.1:\d+\/index.html/);
        if (match) { clearTimeout(timer); resolve(match[0]); }
      });
    });
    run('--profile', profile, 'open', url); opened = true;
    run('set', 'media', 'light', 'reduced-motion');
    evaluate(`(async () => {
      await VaultConnection.ready;
      const root = await navigator.storage.getDirectory();
      const folder = await root.getDirectoryHandle('Vault fixture', {create:true});
      const models = await folder.getDirectoryHandle('01. DRAWERS', {create:true});
      const file = await models.getFileHandle('Refresh test.stl', {create:true});
      const writer = await file.createWritable(); await writer.write('model fixture'); await writer.close();
      window.showDirectoryPicker = async () => folder;
      document.getElementById('vault-choose').scrollIntoView({behavior:'instant',block:'center'});
    })()`);
    run('snapshot', '-i');
    run('click', '#vault-choose');
    run('wait', '--fn', 'VaultResources.connected && document.getElementById("vault-connection").getAttribute("aria-busy") === "false"');
    evaluate(`(async () => { if ((await VaultFolder.load())?.name !== 'Vault fixture') throw new Error('Directory handle was not saved'); })()`);
    run('reload');
    evaluate(`(async () => {
      await VaultConnection.ready;
      if (!VaultResources.connected || VaultResources.index.name !== 'Vault fixture') throw new Error('Folder connection lost after reload');
      const url = VaultResources.getURL('01. DRAWERS/Refresh test.stl');
      if (await (await fetch(url)).text() !== 'model fixture') throw new Error('Restored file is not readable');
    })()`);
    console.log('PASS: selected folder and readable files survive a real reload');
    evaluate(`(async () => {
      window.showDirectoryPicker = async () => { throw new DOMException('Cancelled', 'AbortError'); };
      await VaultConnection.choose();
      if (!VaultResources.connected || (await VaultFolder.load())?.name !== 'Vault fixture') throw new Error('Cancelled picker lost the saved folder');
      const root = await navigator.storage.getDirectory();
      const invalid = await root.getDirectoryHandle('Unrelated fixture', {create:true});
      window.showDirectoryPicker = async () => invalid;
      await VaultConnection.choose();
      if (!VaultResources.connected || (await VaultFolder.load())?.name !== 'Vault fixture') throw new Error('Invalid selection replaced the saved folder');
      const folder = await VaultFolder.load();
      const models = await folder.getDirectoryHandle('01. DRAWERS');
      const file = await models.getFileHandle('New file.STL', {create:true});
      const writer = await file.createWritable(); await writer.write('new file'); await writer.close();
      if (document.getElementById('flow-folder-toggle').getAttribute('aria-expanded') !== 'true') document.getElementById('flow-folder-toggle').click();
      document.getElementById('vault-rescan').scrollIntoView({behavior:'instant',block:'center'});
    })()`);
    run('click', '#vault-rescan');
    run('wait', '--fn', '!!VaultResources.getFile("01. DRAWERS/New file.STL")');
    console.log('PASS: cancel and invalid selection preserve the folder; rescan picks up new files');
    evaluate(`if (document.getElementById('flow-folder-toggle').getAttribute('aria-expanded') !== 'true') document.getElementById('flow-folder-toggle').click();`);
    run('snapshot', '-i');
    run('click', '#vault-disconnect');
    run('wait', '--fn', '!VaultResources.connected && document.getElementById("vault-connection").getAttribute("aria-busy") === "false"');
    run('reload');
    evaluate(`(async () => { await VaultConnection.ready; if (VaultResources.connected || await VaultFolder.load()) throw new Error('Disconnected folder returned after reload'); })()`);
    console.log('PASS: explicit disconnect is remembered across reloads');
    assert.equal(run('errors').trim(), '', 'Browser reported JavaScript errors');
  } finally {
    if (opened) run('close');
    server.kill('SIGINT');
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
