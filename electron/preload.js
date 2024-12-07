<<<<<<< HEAD
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM carregado');
=======
const { contextBridge } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM carregado');
});

contextBridge.exposeInMainWorld('electronAPI', {
  // Aqui você pode expor funções para o renderer process
  getDomReady: () => console.log('Electron API disponível')
>>>>>>> e1a70b1 (Falta só ajuste da logo após recarregar)
});