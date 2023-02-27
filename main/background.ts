import { app, dialog } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';
import { autoUpdater } from 'electron-updater'
import ProgressBar from 'electron-progressbar'
 
const isProd: boolean = process.env.NODE_ENV === 'production';

autoUpdater.autoDownload = false;

if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

(async () => {
  await app.whenReady();

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
  });

  if (isProd) {
    await mainWindow.loadURL('app://./home.html');
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }

  autoUpdater.checkForUpdates();

  autoUpdater.on('update-available', () => {
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Update available',
        message:
          'A new version of Project is available. Do you want to update now?',
        buttons: ['Update', 'Later'],
      })
      .then((result) => {
        const buttonIndex = result.response;

        if (buttonIndex === 0) autoUpdater.downloadUpdate();
      });
  })

  let progressBar: any;

  autoUpdater.once('download-progress', (progress) => {
    console.log(progress.percent)
    progressBar = new ProgressBar({
      text: 'Downloading...',
      detail: 'Downloading...',
    });

    progressBar
      .on('completed', function () {
        console.info(`completed...`);
        progressBar.detail = 'Task completed. Exiting...';
      })
      .on('aborted', function () {
        console.info(`aborted...`);
      });
  })

  autoUpdater.on('update-downloaded', () => {
    console.log('update-downloaded')

    progressBar.setCompleted();
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Update ready',
        message: 'Install & restart now?',
        buttons: ['Restart', 'Later'],
      })
      .then((result) => {
        const buttonIndex = result.response;

        if (buttonIndex === 0) autoUpdater.quitAndInstall(false, true);
      });
  })

  
})();

app.on('window-all-closed', () => {
  app.quit();
});
