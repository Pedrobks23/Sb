const { contextBridge } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM carregado');
});

contextBridge.exposeInMainWorld('electronAPI', {
  getDomReady: () => console.log('Electron API disponível'),
});
