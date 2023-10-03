const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('subConfigAPI', {
  subConfig: (configData) => {
    console.log('subConfigAPI sending configData: ', configData)
    return new Promise((resolve, reject) => {
      console.log('before send sub-config-data', configData);
      ipcRenderer.send('sub-config-data', configData)
      .then(() => {console.log('sub-config data sent successfully');
       resolve();})
      .catch((err) => {
         console.error('Error sending sub-config data:', err);
         reject(err);
       });
    });
  },
  on: (channel, callback) => {
    const allowedChannels = ['mongodb-uri-incorrect-reply', 'connecttomongodb', 'serveron', 'correct-localport','nouseMongodb'];
    if (allowedChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  }
});