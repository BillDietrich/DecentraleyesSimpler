
//-------------------------------------------------------------------------------------
// unused

function onGotContext(context) {
  if (!context) {
    console.error("onGotContext: Context not found");
  } else {
    console.log(`onGotContext: Got context for name: ${context.name}`);
  }
}

function onContextError(e) {
  console.error(e);
}



//-------------------------------------------------------------------------------------


var gArrSettingObjects = null;    // array of objects to save/import


function readContainersFromBrowser(e) {
    console.log('containersexportimport.readContainersFromBrowser: called');
    if (browser.contextualIdentities === undefined) {
      console.log('browser.contextualIdentities not available. Check that the privacy.userContext.enabled pref is set to true, and reload the add-on.');
    } else {

        gArrSettingObjects = new Array();
        var ArrPromises = new Array();
        
        /*
        gArrSettingObjects.push(new String("test here"));
        gArrSettingObjects.push(new Array("abc", "def"));
        gArrSettingObjects.push(new String("test2 here"));
        */

      var promiseGetContexts = browser.contextualIdentities.query({});

      promiseGetContexts.then((identities) => {
          console.log(`Retrieved ${identities.length} identities`);
          if (!identities.length) {
            return;
          }

         for (let identity of identities) {
           console.log(`readContainersFromBrowser: identity == cookieStoreId ${identity.cookieStoreId}, color ${identity.color}, colorCode ${identity.colorCode}, icon ${identity.icon}, iconUrl ${identity.iconUrl}, name ${identity.name}`);
           
           gArrSettingObjects.push(identity);

           //var promiseContext = browser.contextualIdentities.get(identity.cookieStoreId).then(onGotContext, onContextError);
           
            var promiseGettingAllCookies = browser.cookies.getAll({
              storeId: identity.cookieStoreId,
              firstPartyDomain: null
            }).then((cookies) => {
              // random is there to make add-on debugger show all msgs
              console.log(`readContainersFromBrowser: Retrieved ${cookies.length} cookies ${Math.random()}`);
              for (let cookie of cookies) {
                console.log(`readContainersFromBrowser: Cookie: domain ${cookie.domain}, name ${cookie.name}, value ${cookie.value}`);
                gArrSettingObjects.push(cookie);
              }
            });
           ArrPromises.push(promiseGettingAllCookies);
           console.log(`readContainersFromBrowser: ArrPromises.length ${ArrPromises.length}`);
           
         }
         
         var allPromises = Promise.all(ArrPromises);

         allPromises.then(() => {
            console.log(`readContainersFromBrowser: Finished all cookies`);
            //ArrPromises = null;
            var promiseSave = saveToFile();
              promiseSave.then(() => {
                    console.log(`readContainersFromBrowser: Save done`);
                  });
          });
      });
    }

    // don't submit the form
    e.preventDefault();

    console.log('containersexportimport.readContainersFromBrowser: return');
}


var gObjectURL = null;

var gnDownloadID = 0;


 
function onStartedDownload(id) {
  console.log(`containersexportimport.onStartedDownload: called, id == ${id}`);
  gnDownloadID = id;
}

function onFailedDownload(error) {
  console.log(`containersexportimport.onFailedDownload: called, ${error}`);
  URL.revokeObjectURL(gObjectURL);
  gObjectURL = null;
  gArrSettingObjects = null;
  gnDownloadID = 0;
  browser.downloads.onChanged.removeListener(onChangedDownload);
}

function onChangedDownload(downloadDelta) {
  console.log(`containersexportimport.onChangedDownload: called, id ${downloadDelta.id}, state.current ${downloadDelta.state.current}`);

  if (downloadDelta.state && (downloadDelta.state.current === "complete") && (downloadDelta.id == gnDownloadID)) {
    console.log(`containersexportimport.onChangedDownload: Download ${downloadDelta.id} has completed.`);
    URL.revokeObjectURL(gObjectURL);
    gObjectURL = null;
    gArrSettingObjects = null;
    gnDownloadID = 0;
    browser.downloads.onChanged.removeListener(onChangedDownload);
  }
}

function saveToFile() {
  console.log(`containersexportimport.saveToFile: called, gArrSettingObjects == ${gArrSettingObjects}`);
      
  var objectToSave = new Blob(new String(JSON.stringify(gArrSettingObjects, null, 2)));

  gObjectURL = URL.createObjectURL(objectToSave);
  
  var promiseDownloading = browser.downloads.download({
    url: gObjectURL,
    saveAs: true,
    conflictAction : 'overwrite',
    filename: 'containers.json'
  });
  
  browser.downloads.onChanged.addListener(onChangedDownload);
  promiseDownloading.then(onStartedDownload, onFailedDownload);

  return promiseDownloading;
}

//-------------------------------------------------------------------------------------

var gFileReader = null;
var gFile = null;


function writeContainers() {
    console.log('containersexportimport.writeContainers: called');
}

function readFromFile(e) {
  console.log('containersexportimport.readFromFile: called');

  if (gFile) {

    gFileReader = new FileReader();
    gFileReader.onload = function(evt) {
      console.log(`containersexportimport.readFromFile: result ${evt.target.result}`);
 
      gArrSettingObjects = JSON.parse(evt.target.result);

      writeContainers();
    };

    gFileReader.readAsText(gFile);
    console.log('containersexportimport.readFromFile: did readAsText');
  }
    
  // don't submit the form
  e.preventDefault();
  console.log(`containersexportimport.readFromFile: return`);
}

function handleFileSelect(evt){
  console.log(`containersexportimport.handleFileSelect: evt ${evt}`);
  console.log(`containersexportimport.handleFileSelect: evt.target.files.length ${evt.target.files.length}`);
  console.log(`containersexportimport.handleFileSelect: evt.target.files[0].name ${evt.target.files[0].name}`);
  console.log(`containersexportimport.handleFileSelect: evt.target.files[0].webkitRelativePath ${evt.target.files[0].webkitRelativePath}`);

  gFile = evt.target.files[0];

  console.log(`containersexportimport.handleFileSelect: return`);
}


 

//-------------------------------------------------------------------------------------

document.querySelector('#importfile').addEventListener('change', handleFileSelect, false);
document.querySelector("#form2").addEventListener("submit", readFromFile);
document.querySelector("#form3").addEventListener("submit", readContainersFromBrowser);

//-------------------------------------------------------------------------------------

