
//-------------------------------------------------------------------------------------

var config;

var gObjectURL = null;
var gnDownloadID = 0;



 
function onStartedDownload(id) {
  console.log(`onStartedDownload: called, id == ${id}`);
  gnDownloadID = id;
}

function onFailedDownload(error) {
  console.log(`onFailedDownload: called, ${error}`);
  URL.revokeObjectURL(gObjectURL);
  gObjectURL = null;
  gnDownloadID = 0;
  browser.downloads.onChanged.removeListener(onChangedDownload);
}

function onChangedDownload(downloadDelta) {
  console.log(`onChangedDownload: called, id ${downloadDelta.id}, state.current ${downloadDelta.state.current}`);

  if (downloadDelta.state && (downloadDelta.state.current === "complete") && (downloadDelta.id == gnDownloadID)) {
    console.log(`onChangedDownload: Download ${downloadDelta.id} has completed.`);
    URL.revokeObjectURL(gObjectURL);
    gObjectURL = null;
    gnDownloadID = 0;
    browser.downloads.onChanged.removeListener(onChangedDownload);
    console.log(`onChangedDownload: export finished; exported ${config.arrsURLsToCacheMore.length} URLs`);
    giveNotification("Export finished", `Exported ${config.arrsURLsToCacheMore.length} URLs`);
  }
}

function saveToFile() {
  console.log(`saveToFile: called`);
      
  loadConfig();
  console.log(`saveToFile: config == ${config}`);

  var objectToSave = new Blob(new String(JSON.stringify(config, null, 2)));

  gObjectURL = URL.createObjectURL(objectToSave);
  
  var promiseDownloading = browser.downloads.download({
    url: gObjectURL,
    saveAs: true,
    conflictAction : 'overwrite',
    filename: 'decentraleyessimpler.json'
  });
  
  browser.downloads.onChanged.addListener(onChangedDownload);
  promiseDownloading.then(onStartedDownload, onFailedDownload).catch(error => {
    console.error(`saveToFile: error ${error}`);
	});

  console.log(`saveToFile: return`);
  return promiseDownloading;
}


//-------------------------------------------------------------------------------------

function readFromFile() {
  console.log(``);
  console.log(`readFromFile: called`);

  if (gFile) {

    gFileReader = new FileReader();
    gFileReader.onload = function(evt) {
      console.log(`readFromFile: readAsText result ${evt.target.result}`);
 
      config = JSON.parse(evt.target.result);

      updateInfoMsg();
      giveNotification("Import finished", `Imported ${config.arrsURLsToCacheMore.length} URLs`);

      console.log(`readFromFile: done; imported ${config.arrsURLsToCacheMore.length} URLs`);

    };

    gFileReader.readAsText(gFile);
    console.log(`readFromFile: did readAsText`);
  }
    
  console.log(`readFromFile: return`);
}



//-------------------------------------------------------------------------------------


function giveNotification(sTitle, sMessage){
  console.log(`giveNotification: called, sTitle ${sTitle}, sMessage ${sMessage}`);
  browser.notifications.create({
    "type": "basic",
    "iconUrl": browser.runtime.getURL("icon60.png"),
    "title": sTitle,
    "message": sMessage
  });
  console.log(`giveNotification: giveNotification`);
}


//-------------------------------------------------------------------------------------
// Things related to the HTML page

function updateInfoMsg(){
  console.log(`updateInfoMsg: called`);

  var sMsg = `The add-on has ${config.arrsURLsToCacheMore.length} URLs defined.`;
  sMsg += "<br /><br />"
  sMsg += "Cache time is set to " + config.nCacheTime;

  document.querySelector('#infodiv').innerHTML = sMsg;
  console.log(`updateInfoMsg: return`);
}

function handleFileSelect(evt){
  console.log(``);
  console.log(`handleFileSelect: evt ${evt}`);
  console.log(`handleFileSelect: evt.target.files.length ${evt.target.files.length}`);
  console.log(`handleFileSelect: evt.target.files[0].name ${evt.target.files[0].name}`);
  console.log(`handleFileSelect: evt.target.files[0].webkitRelativePath ${evt.target.files[0].webkitRelativePath}`);

  gFile = evt.target.files[0];

  console.log(`handleFileSelect: return`);
}

function loadConfig(){
  config = JSON.parse(localStorage.getItem('config'));
}

function loadOptionsPage(evt){
  loadConfig();
  updateInfoMsg();
}

function doExport(evt){
  console.log(``);
  console.log(`doExport: evt ${evt}`);


  saveToFile().then(() => {

    updateInfoMsg();
    console.log(`doExport: done`);

  });

  // don't submit the form
  evt.preventDefault();

  console.log(`doExport: return`);
}

function doImport(evt){
  console.log(``);
  console.log(`doImport: evt ${evt}`);

  readFromFile();

  // don't submit the form
  evt.preventDefault();

  console.log(`doImport: return`);
}


window.addEventListener('load', loadOptionsPage);
document.querySelector('#importfile').addEventListener('change', handleFileSelect);
document.querySelector("#importform").addEventListener("submit", doImport);
document.querySelector("#exportform").addEventListener("submit", doExport);

//-------------------------------------------------------------------------------------
