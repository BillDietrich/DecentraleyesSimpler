
//-------------------------------------------------------------------------------------


var gnCacheMaxSecs;

var garrsURLPatterns;

var garrsResourceTypes;



//-------------------------------------------------------------------------------------

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
    console.log(`onChangedDownload: export finished; exported ${garrsURLPatterns.length} URL patterns`);
    giveNotification("Export finished", `Exported ${garrsURLPatterns.length} URL patterns`);
  }
}

function saveToFile() {
  console.log(`saveToFile: called`);
      
  loadConfig();
  console.log(`saveToFile: gnCacheMaxSecs == ${gnCacheMaxSecs}, garrsURLPatterns == ${garrsURLPatterns}, garrsResourceTypes == ${garrsResourceTypes}`);

  config = {nCacheMaxSecs:gnCacheMaxSecs, arrsURLPatterns:garrsURLPatterns, arrsResourceTypes:garrsResourceTypes};
  var objectToSave = new Blob(new String(JSON.stringify(config, null, 1).replace(/^ +/mg, spaces => spaces.replace(/ /g, "\t"))));

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
 
      let config = JSON.parse(evt.target.result);
      gnCacheMaxSecs = config.nCacheMaxSecs;
      garrsURLPatterns = config.arrsURLPatterns;
      garrsResourceTypes = config.arrsResourceTypes;

      localStorage.setItem("config",JSON.stringify(config));

      updateInfoMsg();
      giveNotification("Import finished", `Imported ${garrsURLPatterns.length} URL patterns`);

      console.log(`readFromFile: done; imported ${garrsURLPatterns.length} URL patterns`);

      // clear the browser cache
      var removeCachePromise = browser.browsingData.removeCache({});

      // send message to background file
      browser.runtime.sendMessage({type:'configChanged'}).then(onCacheRemoved, onCacheRemovedError);

    };

    gFileReader.readAsText(gFile);
    console.log(`readFromFile: did readAsText`);
  }
    
  console.log(`readFromFile: return`);
}

function onCacheRemoved() {
  console.log("onCacheRemoved: called");
}

function onCacheRemovedError(error) {
  console.log("onCacheRemovedError: called");
  console.error(error);
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

  var sMsg = "Cache max age for matching items is set to ";
  
  let hour = 60 * 60;
  let day = 24 * hour;
  let week = 7 * day;
  let month = 30 * day;
  let year = 365 * day;
  if (gnCacheMaxSecs < hour)
    sMsg += (gnCacheMaxSecs + " seconds.");
  else if (gnCacheMaxSecs < day)
    sMsg += ((gnCacheMaxSecs/hour).toFixed(1) + " hours.");
  else if (gnCacheMaxSecs < week)
    sMsg += ((gnCacheMaxSecs/day).toFixed(1) + " days.");
  else if (gnCacheMaxSecs < month)
    sMsg += ((gnCacheMaxSecs/week).toFixed(1) + " weeks.");
  else if (gnCacheMaxSecs < year)
    sMsg += ((gnCacheMaxSecs/month).toFixed(1) + " months.");
  else
    sMsg += ((gnCacheMaxSecs/year).toFixed(1) + " years.");
 
  sMsg += "<br /><br />"
  sMsg += `${garrsURLPatterns.length} URL patterns defined.`;
  sMsg += "<br /><br />"
  sMsg += "Modify matching items of types: ";
  sMsg += garrsResourceTypes;
 
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
  let config = JSON.parse(localStorage.getItem('config'));
  gnCacheMaxSecs = config.nCacheMaxSecs;
  garrsURLPatterns = config.arrsURLPatterns;
  garrsResourceTypes = config.arrsResourceTypes;
}

function loadOptionsPage(evt){
  var getting = browser.browserSettings.cacheEnabled.get({});
  getting.then((got) => {
    console.log(`loadOptionsPage: browserSettings.cacheEnabled: Value: ${got.value}`);
    console.log(`loadOptionsPage: browserSettings.cacheEnabled: Control: ${got.levelOfControl}`);
  });

/*
  var gettingSelf = browser.management.getSelf();
  gettingSelf.then((got) => {
    console.log(`loadOptionsPage: management.getSelf: id: ${got.id}`);
    console.log(`loadOptionsPage: management.getSelf: name: ${got.name}`);
  });

  var manifest = browser.runtime.getManifest();
  console.log(`loadOptionsPage: management.getSelf: manifest.name: ${manifest.name}`);
  console.log(`loadOptionsPage: management.getSelf: manifest.extra: ${manifest.extra}`);

  let sPath = browser.runtime.getURL("defaultconfig.json");
  console.log(`loadOptionsPage: sPath ${sPath}`);
  document.getElementById("filelink").href = sPath;
*/

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

function doReset(evt){
  console.log(``);
  console.log(`doReset: evt ${evt}`);

/*
  let sPath = browser.runtime.getURL("defaultconfig.json");
  console.log(`doReset: sPath ${sPath}`);

  const request = new Request(sPath);

  fetch(request)
  .then(response => {
    console.log(`doReset: response ${response}`);
    gFile = response.blob();
    console.log(`doReset: gFile ${gFile}`);
    readFromFile();
  });

  //gFile = new Document(sPath);

  //gFile = new File.createObjectURL();
  //gFile.name = "defaultconfig.json"
  //gFile.webkitRelativePath = sPath;
*/

  // send message to background file
  browser.runtime.sendMessage({type:'resetToDefaultConfig'});

  giveNotification("Reset settings done", "");

  // don't submit the form
  evt.preventDefault();

  console.log(`doReset: return`);
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
document.querySelector("#exportform").addEventListener("submit", doExport);
document.querySelector("#resetform").addEventListener("submit", doReset);
document.querySelector('#importfile').addEventListener('change', handleFileSelect);
document.querySelector("#importform").addEventListener("submit", doImport);


//-------------------------------------------------------------------------------------
