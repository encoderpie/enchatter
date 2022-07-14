const { contextBridge } = require('electron');
const path = require('path');

contextBridge.exposeInMainWorld('path', {
  dir: () => path.join(__dirname, '.'),
});
