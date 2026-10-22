const fs = require('node:fs');
const path = require('node:path');

const folders = ['01. DRAWERS', '02. SUSTAINERS', '03. MODIFICATIONS'];
const supplied = process.env.VAULT_RESOURCE_ROOT;
const candidates = supplied ? [path.resolve(supplied)] : [path.resolve(__dirname, '..'), path.resolve(__dirname, '../..')];
const root = candidates.find(candidate => folders.every(folder => fs.existsSync(path.join(candidate, folder))));
if (supplied && !root) throw new Error('VAULT_RESOURCE_ROOT must contain all three Vault component folders: ' + supplied);
module.exports = { root, options: { skip: root ? false : 'Original Vault resources unavailable; set VAULT_RESOURCE_ROOT to run archive checks.' } };
