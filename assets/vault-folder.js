(function (root) {
  'use strict';

  function storedHandle(mode, action) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('vault-workbench-folders', 1);
      let blocked = false;
      request.onupgradeneeded = () => request.result.createObjectStore('handles');
      request.onerror = () => reject(request.error);
      request.onblocked = () => { blocked = true; reject(new Error('Folder storage is blocked')); };
      request.onsuccess = () => {
        const db = request.result;
        if (blocked) { db.close(); return; }
        let transaction;
        try {
          transaction = db.transaction('handles', mode);
          const result = action(transaction.objectStore('handles'));
          transaction.oncomplete = () => { db.close(); resolve(result.result); };
          transaction.onabort = () => { db.close(); reject(transaction.error); };
          transaction.onerror = () => { db.close(); reject(transaction.error); };
        } catch (error) { db.close(); reject(error); }
      };
    });
  }

  async function files(handle) {
    const result = [];
    async function visit(directory, prefix) {
      for await (const entry of directory.values()) {
        if (entry.name.startsWith('.')) continue;
        const path = prefix + '/' + entry.name;
        if (entry.kind === 'directory') await visit(entry, path);
        else if (/\.(stl|pdf|png|jpe?g|webp|gif)$/i.test(entry.name)) {
          const file = await entry.getFile();
          Object.defineProperty(file, 'webkitRelativePath', { value: path });
          result.push(file);
        }
      }
    }
    await visit(handle, handle.name);
    return result;
  }

  root.VaultFolder = {
    get supported() { return typeof root.showDirectoryPicker === 'function' && !!root.indexedDB; },
    load: () => storedHandle('readonly', store => store.get('selected')),
    save: handle => storedHandle('readwrite', store => store.put(handle, 'selected')),
    clear: () => storedHandle('readwrite', store => store.delete('selected')),
    files
  };
})(globalThis);
