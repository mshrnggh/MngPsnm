const {registMongo}=require('./postIPC.cjs');
const {getAllThreadsIPC}=require('./getIPC.cjs');
const {getResearchIPC}=require('./searchIPC.cjs');
const {updateDataIPC}=require('./patchIPC.cjs');
const path = require("path");
const {deleteDataIPC, exchangeDataIPC }=require('./delchanIPC.cjs');
const {startUp} = require(path.join(__dirname, './startup.cjs'));
const {getStartupWindow,getSubConfigWindow}=require('./startup.cjs'); 
const {ipcMain}=require("electron");
const url=require('url');const dotenv=require("dotenv");dotenv.config();
const express=require("express");const appExpr=express();appExpr.use(express.json());
const mongoose=require("mongoose");let boardWindow;
let mongodbUriValue="";let wm=false;let ol=false;

async function startServer(mongodbUriValue,wm,ol){
if(wm===true) {
  let startupWindow=getStartupWindow();let subConfigWindow=getSubConfigWindow();
  if(mongodbUriValue){await useMongoDB(mongodbUriValue, ol, wm);

  }else if(!mongodbUriValue){
    if(subConfigWindow !== null && !subConfigWindow.isDestroyed() && startupWindow.isDestroyed()){
      await ipcMain.removeAllListeners('mongodb-uri-empty');
      await subConfigWindow.webContents.send('mongodb-uri-empty');
      await new Promise((resolve)=>{ipcMain.removeAllListeners('mongodb-uri-empty-reply');
        ipcMain.on('mongodb-uri-empty-reply',async()=>{await startUp();resolve();});});
 
    }else if(subConfigWindow === null && !startupWindow.isDestroyed()){
      await startupWindow.webContents.send('mongodb-uri-empty');
      await new Promise((resolve)=>{ipcMain.removeAllListeners('mongodb-uri-empty-reply');
      ipcMain.on('mongodb-uri-empty-reply', async()=>{await startUp();resolve();});});

    }else if(subConfigWindow.isDestroyed() && !startupWindow.isDestroyed()){
      await startupWindow.webContents.send('mongodb-uri-empty');
      await new Promise((resolve)=>{ipcMain.removeAllListeners('mongodb-uri-empty-reply');
        ipcMain.on('mongodb-uri-empty-reply', async()=>{await startUp();resolve();});});
    };
  };

}else if(ol===true){let startupWindow=getStartupWindow();
  await startupWindow.webContents.send('nousemongodb'); 
  await new Promise((resolve)=>{ipcMain.removeAllListeners('nousemongodb-reply');
    ipcMain.on('nousemongodb-reply',()=>{resolve();});});
  await createBoard(ol,wm);};};
  
async function useMongoDB(mongodbUriValue, ol, wm){ 
  //return new Promise(async (resolve) => {.then/catch}では、mongo.connect自体が
  //エラー時にエラーをスローしてしまい、.catchは実行されない。Promise化しても、.then/catchを使用しない
  //方がエラー時にはcatch{}が実行される。これはmongoose.connectは基本的に非同期で、
  //.then.catchが利用できるが、今回は利用し無い方が良い。
  let connection; let startupWindow = getStartupWindow();let subConfigWindow=getSubConfigWindow();		
    if(subConfigWindow===null&&!startupWindow.isDestroyed()){				
      try{await mongoose.connect(mongodbUriValue,{useNewUrlParser:true,useUnifiedTopology:true});
      await startupWindow.webContents.send('connecttomongodb'); 		
      await new Promise((resolve)=>{ipcMain.removeAllListeners('connecttomongodb-reply');
        ipcMain.on('connecttomongodb-reply',async()=>{ 		
          await createBoard(ol,wm);await resolve();});});
      }catch(error){let startupWindow=getStartupWindow();		
      await startupWindow.webContents.send('mongodb-uri-incorrect');
      await new Promise((resolve)=>{ipcMain.removeAllListeners('mongodb-uri-incorrect-reply');		
        ipcMain.on('mongodb-uri-incorrect-reply',async()=>{await closeMongoDB(connection);
           await resolve();});});await startUp();}		
		
    } else if(subConfigWindow!==null&&subConfigWindow.isDestroyed()&&!startupWindow.isDestroyed()){		
      try{await mongoose.connect(mongodbUriValue,{useNewUrlParser:true,useUnifiedTopology:true});
      await startupWindow.webContents.send('connecttomongodb'); 		
      await new Promise((resolve)=>{ipcMain.removeAllListeners('connecttomongodb-reply');
      ipcMain.on('connecttomongodb-reply',async()=>{ 		
        await createBoard(ol,wm);await resolve();});});
      }catch(error){let startupWindow=getStartupWindow();		
        await startupWindow.webContents.send('mongodb-uri-incorrect');
        await new Promise((resolve)=>{ipcMain.removeAllListeners('mongodb-uri-incorrect-reply');		
          ipcMain.on('mongodb-uri-incorrect-reply',async()=>{await closeMongoDB(connection); 
            await resolve();});});await startUp();};		
		
    } else if(subConfigWindow!==null&&!subConfigWindow.isDestroyed()&&startupWindow.isDestroyed()){		 	
      try{await mongoose.connect(mongodbUriValue,{useNewUrlParser:true,useUnifiedTopology:true});		
      await subConfigWindow.webContents.send('connecttomongodb');
      await new Promise((resolve)=>{ipcMain.removeAllListeners('connecttomongodb-reply');		
        ipcMain.on('connecttomongodb-reply',async()=>{await createBoard(ol,wm);await resolve();});});		
      }catch(error){await subConfigWindow.webContents.send('mongodb-uri-incorrect');
      await new Promise((resolve)=>{ipcMain.removeAllListeners('mongodb-uri-incorrect-reply');		
        ipcMain.on('mongodb-uri-incorrect-reply',async()=>{
          await closeMongoDB(connection);await resolve();});});await startUp();};};
};		

async function closeMongoDB(connection){if(connection){await connection.close();};};

async function createBoard(ol,wm) {
  const {BrowserWindow,app}=require("electron");let Thread=''; let allThreads=[];
  await import('../mngSchema.mjs').then(module=>{Thread=module.Thread;});
  await app.commandLine.appendSwitch('disable-gpu');
  await app.commandLine.appendSwitch('disable-features','RendererCodeIntegrity');
  await app.commandLine.appendSwitch('enable-software-rasterizer');
  boardWindow = await new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      nodeIntegration: true, contextIsolation: true,
      worldSafeExecuteJavaScript: true, useAngle:false,
      enableRemoteModule: false, 
      preload: path.join(__dirname, '../preload/preload_board.cjs'),    
      webSecurity: true, allowRunningInsecureContent: false, 
      contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' file:; style-src 'self' 'unsafe-inline';",
      chromeWebviewVersion: '118.0.5993.32'
  
    },});
  boardWindow.loadURL(url.format({pathname: path.join(__dirname, '../render/index.html'),
    protocol:'file:',slashes: true
  }));
   
  if (ipcMain.eventNames().includes('get-DBdata') && ipcMain.listenerCount('get-DBdata') >= 1) {
    ipcMain.removeAllListeners('get-DBdata');
    ipcMain.on('get-DBdata', async (event) => { 
      allThreads = await getAllThreadsIPC(ol, wm, boardWindow);
      if( typeof allTheads === JSON ) {allThreads = JSON.parse((allThreads));}
      else if( typeof allThreads !== JSON ) {allThreads = JSON.parse(JSON.stringify(allThreads));}
        event.reply('get-DBdata', allThreads, ol, wm);}); 
  } else { ipcMain.on('get-DBdata', async (event) => {
    allThreads = await getAllThreadsIPC(ol, wm, boardWindow);
    if(typeof allTheads===JSON ) {allThreads = JSON.parse((allThreads));}
    else if(typeof allThreads !== JSON ) {allThreads=JSON.parse(JSON.stringify(allThreads));}
    event.reply('get-DBdata', allThreads, ol, wm);});
  };

  if (ipcMain.eventNames().includes('add-to-mongodb')&&ipcMain.listenerCount('add-to-mongodb')>=1){
    ipcMain.removeAllListeners('add-to-mongodb');
    ipcMain.on('add-to-mongodb', async (event, data) => { 
      const newData=await registMongo(ol,wm,event,data,boardWindow);
      const serializedData=JSON.parse(JSON.stringify(newData));
      event.reply('add-to-mongodb-reply', serializedData);});
  } else {
    ipcMain.on('add-to-mongodb', async (event, data) => { 
      const newData = await registMongo(ol,wm,event,data);
      const serializedData = JSON.parse(JSON.stringify(newData));
      event.reply('add-to-mongodb-reply', serializedData);});
  };
    
  if (ipcMain.eventNames().includes('get-Research') && ipcMain.listenerCount('get-Research') >= 1) {
    ipcMain.removeAllListeners('get-Research');
    ipcMain.on('get-Research', async (event, ol, wm, keywords) => { 
      const newData = await getResearchIPC(ol, wm, keywords, boardWindow); 
      const serializedData = JSON.parse(JSON.stringify(newData));
      event.reply('get-Research-reply', serializedData);
    });
  } else {
    ipcMain.on('get-Research', async (event, ol, wm, keywords) => {
      const newData = await getResearchIPC(ol, wm, keywords, boardWindow);
      const serializedData = JSON.parse(JSON.stringify(newData));
      event.reply('get-Research-reply', serializedData);});
  };   
  
  if (ipcMain.eventNames().includes('update-DBdata') && ipcMain.listenerCount('update-DBdata') >= 1) {
    ipcMain.removeAllListeners('update-DBdata');
    ipcMain.on('update-DBdata', async (event, ...args) => {
      const renewData = args[0]; ol = args[1];wm= args[2];
      await updateDataIPC(renewData,ol,wm,boardWindow); 
      const renewAllData = await getAllThreadsIPC(ol, wm,boardWindow);
      if( typeof renewAllData !== JSON ) {const serializedData = JSON.parse(JSON.stringify(renewAllData));
        event.reply('update-DBdata-reply', serializedData);}
      else if (typeof renewAllData === JSON){ const serializedData = JSON.parse(renewAllData);
        event.reply('update-DBdata-reply', serializedData);};
    });
  } else {
    ipcMain.on('update-DBdata', async (event, ...args) => {
      const renewData = args[0]; ol = args[1];wm= args[2];
      await updateDataIPC(renewData,ol,wm,boardWindow);
      const renewAllData = await getAllThreadsIPC(ol, wm,boardWindow);
      if( typeof renewAllData !== JSON ) {const serializedData = JSON.parse(JSON.stringify(renewAllData));
        event.reply('update-DBdata-reply', serializedData);}
      else if (typeof renewAllData === JSON){ const serializedData = JSON.parse(renewAllData);
        event.reply('update-DBdata-reply', serializedData);};
  });};

  if (ipcMain.eventNames().includes('delete-thread') && ipcMain.listenerCount('delete-thread') >= 1) {
    ipcMain.removeAllListeners('delete-thread');
    ipcMain.on('delete-thread', async (event, ...args) => {
      const delData = args[0]; ol = args[1];wm= args[2];
      const renewAllData = await deleteDataIPC(delData,ol,wm,boardWindow); 
      const serializedData = JSON.parse(JSON.stringify(renewAllData));
      event.reply('delete-thread-reply', serializedData);
    });
  } else {
    ipcMain.on('delete-thread', async (event, ...args) => {
      const renewData = args[0]; ol = args[1];wm= args[2]; 
      const renewAllData = await deleteDataIPC(renewData,ol,wm,boardWindow);
      const serializedData = JSON.parse(JSON.stringify(renewAllData));
      event.reply('delete-thread-reply', serializedData);});
  };   
  
  if (ipcMain.eventNames().includes('thread-exchange') && ipcMain.listenerCount('thread-exchange') >= 1) {
    ipcMain.removeAllListeners('thread-exchange');
    ipcMain.on('thread-exchange', async (event, ...args) => {
      const exchData = args[0]; ol = args[1];wm= args[2];
      const renewAllData = await exchangeDataIPC(exchData,ol,wm,boardWindow); 
      const serializedData = JSON.parse(JSON.stringify(renewAllData));
          event.reply('thread-exchange-reply', serializedData);
    });
  } else {
    ipcMain.on('thread-exchange', async (event, ...args) => {
      const exchData = args[0]; ol = args[1];wm= args[2];
      const renewAllData = await exchangeDataIPC(exchData,ol,wm,boardWindow);
      const serializedData = JSON.parse(JSON.stringify(renewAllData));
      event.reply('thread-exchange-reply', serializedData);});
  };   
};
module.exports = {startServer, getBoardWindow: () => boardWindow};