const { app, BrowserWindow } = require('electron');
const path = require('path');
<<<<<<< HEAD
const isDev = require('electron-is-dev');
=======
const fs = require('fs');
>>>>>>> e1a70b1 (Falta só ajuste da logo após recarregar)

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
<<<<<<< HEAD
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Em desenvolvimento usa localhost, em produção usa o arquivo local
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;

  console.log('Tentando carregar:', startUrl);
  mainWindow.loadURL(startUrl);
  mainWindow.webContents.openDevTools();
=======
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  // Ajustando o caminho para a pasta build
  const indexPath = path.join(__dirname, '..', 'build', 'index.html');
  console.log('Carregando arquivo:', indexPath);

  // Verificar se o arquivo existe
  if (fs.existsSync(indexPath)) {
    console.log('Arquivo index.html encontrado');
    mainWindow.loadFile(indexPath);
  } else {
    console.error('Arquivo não encontrado:', indexPath);
    console.log('Diretório atual:', __dirname);
    console.log('Arquivos na pasta:', fs.readdirSync(path.join(__dirname, '..')));
  }

  mainWindow.webContents.openDevTools();

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Carregamento concluído');
    mainWindow.webContents.executeJavaScript(`
      console.log('Scripts carregados:', Array.from(document.scripts).map(s => s.src));
      console.log('CSS carregados:', Array.from(document.styleSheets).map(s => s.href));
    `);
  });
>>>>>>> e1a70b1 (Falta só ajuste da logo após recarregar)
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});