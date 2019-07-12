
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
  console.log(``);
  console.log(`readContainersFromBrowser: called`);

  if (browser.contextualIdentities === undefined) {

    let sMsg = "browser.contextualIdentities not available. Check that the privacy.userContext.enabled pref is set to true, and reload the add-on.";
    console.log(`${sMsg}`);
    alert(sMsg);

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
        alert("No containers to export");
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
                alert("Export finished");
                console.log(`readContainersFromBrowser: Save done`);
              });
      });

    });
  }

  // don't submit the form
  e.preventDefault();

  console.log(`readContainersFromBrowser: return`);
}


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
  gArrSettingObjects = null;
  gnDownloadID = 0;
  browser.downloads.onChanged.removeListener(onChangedDownload);
}

function onChangedDownload(downloadDelta) {
  console.log(`onChangedDownload: called, id ${downloadDelta.id}, state.current ${downloadDelta.state.current}`);

  if (downloadDelta.state && (downloadDelta.state.current === "complete") && (downloadDelta.id == gnDownloadID)) {
    console.log(`onChangedDownload: Download ${downloadDelta.id} has completed.`);
    URL.revokeObjectURL(gObjectURL);
    gObjectURL = null;
    gArrSettingObjects = null;
    gnDownloadID = 0;
    browser.downloads.onChanged.removeListener(onChangedDownload);
  }
}

function saveToFile() {
  console.log(`saveToFile: called, gArrSettingObjects == ${gArrSettingObjects}`);
      
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
var gArrCookieStoreIDs = null;


function deleteAllContainers() {
  console.log(`deleteAllContainers: called`);

  var promiseGetContexts = browser.contextualIdentities.query({});

  promiseGetContexts.then((identities) => {
    console.log(`Retrieved ${identities.length} identities`);

    var ArrPromises = new Array();
    gArrCookieStoreIDs = new Array();

    for (let identity of identities) {
      console.log(`deleteAllContainers: identity == cookieStoreId ${identity.cookieStoreId}, color ${identity.color}, colorCode ${identity.colorCode}, icon ${identity.icon}, iconUrl ${identity.iconUrl}, name ${identity.name}`);
      var promiseRemoveContext = browser.contextualIdentities.remove(identity.cookieStoreId);
      ArrPromises.push(promiseRemoveContext);
      gArrCookieStoreIDs.push(identity.cookieStoreId);
    }
        
    var allPromises = Promise.all(ArrPromises);

    allPromises.then(() => {
      console.log(`deleteAllContainers: Finished all containers`);

      ArrPromises = new Array();
      for (let cookieStoreId of gArrCookieStoreIDs) {
        var promiseGettingAllCookies = browser.cookies.getAll({
          storeId: cookieStoreId,
          firstPartyDomain: null
        }).then((cookies) => {
          // random is there to make add-on debugger show all msgs
          console.log(`deleteAllContainers: Retrieved ${cookies.length} cookies ${Math.random()}`);
          for (let cookie of cookies) {
            console.log(`deleteAllContainers: Cookie: domain ${cookie.domain}, name ${cookie.name}, value ${cookie.value}`);
            var promiseRemoveCookie = cookie.remove({
              name: cookie.name,
              url: cookie.url
            });
            ArrPromises.push(promiseRemoveCookie);
          }
        });
        ArrPromises.push(promiseGettingAllCookies);
        console.log(`deleteAllContainers: ArrPromises.length ${ArrPromises.length}`);
      }
        
      var allPromises = Promise.all(ArrPromises);

      allPromises.then(() => {
        console.log(`deleteAllContainers: Finished all cookies`);
        //ArrPromises = null;
      });

    });
  });
}

function writeContainers() {
  console.log(`writeContainers: called`);

  console.log(`writeContainers: gArrSettingObjects.length ${gArrSettingObjects.length}`);
  for (let obj of gArrSettingObjects) {
    if ( obj.hasOwnProperty('color') ) {
      // it's a container (contextual identity)
      // random is there to make add-on debugger show all msgs
      console.log(`writeContainers: it's a container ${Math.random()}`);
      var identity = obj;
      console.log(`writeContainers: identity == cookieStoreId ${identity.cookieStoreId}, color ${identity.color}, colorCode ${identity.colorCode}, icon ${identity.icon}, iconUrl ${identity.iconUrl}, name ${identity.name}`);

      // TO-DO: create it
    }
    else if ( obj.hasOwnProperty('hostOnly') ) {
      // it's a cookie
      // random is there to make add-on debugger show all msgs
      console.log(`writeContainers: it's a cookie ${Math.random()}`);
      var cookie = obj;
      console.log(`writeContainers: Cookie: domain ${cookie.domain}, name ${cookie.name}, value ${cookie.value}`);

      // TO-DO: create it
    }
    else {
      // random is there to make add-on debugger show all msgs
      console.log(`writeContainers: unknown object type ${Math.random()}`);
    }
  }

  console.log(`writeContainers: return`);
}

function readFromFile(e) {
  console.log(``);
  console.log(`readFromFile: called`);

  if (gFile) {

    var bDeleteAllExisting = document.querySelector('#deleteallexisting').checked;
    console.log(`readFromFile: bDeleteAllExisting ${bDeleteAllExisting}`);

    gFileReader = new FileReader();
    gFileReader.onload = function(evt) {
      console.log(`readFromFile: readAsText result ${evt.target.result}`);
 
      gArrSettingObjects = JSON.parse(evt.target.result);

      if (bDeleteAllExisting)
        deleteAllContainers();

      writeContainers();

      alert("Import finished");

      console.log(`readFromFile: done`);
    };

    gFileReader.readAsText(gFile);
    console.log(`readFromFile: did readAsText`);
  }
    
  // don't submit the form
  e.preventDefault();
  console.log(`readFromFile: return`);
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


 

//-------------------------------------------------------------------------------------

document.querySelector('#importfile').addEventListener('change', handleFileSelect, false);
document.querySelector("#form2").addEventListener("submit", readFromFile);
document.querySelector("#form3").addEventListener("submit", readContainersFromBrowser);

//-------------------------------------------------------------------------------------

