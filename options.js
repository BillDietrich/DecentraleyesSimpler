
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


var gArrObjectsToSave = null;    // array of objects to save


function logCookies(cookies) {
    console.log(`logCookies: Retrieved ${cookies.length} cookies`);
  for (let cookie of cookies) {
    console.log(`Cookie: domain ${cookie.domain}, name ${cookie.name}, value ${cookie.value}`);
    gArrObjectsToSave.push(cookie);
  }
}




function readContainersFromBrowser(e) {
    console.log('containersexportimport.readContainersFromBrowser: called');
    if (browser.contextualIdentities === undefined) {
      console.log('browser.contextualIdentities not available. Check that the privacy.userContext.enabled pref is set to true, and reload the add-on.');
    } else {

        gArrObjectsToSave = new Array();
        
        /*
        gArrObjectsToSave.push(new String("test here"));
        gArrObjectsToSave.push(new Array("abc", "def"));
        gArrObjectsToSave.push(new String("test2 here"));
        */

      var promiseGetContexts = browser.contextualIdentities.query({})
        .then((identities) => {
            console.log(`Retrieved ${identities.length} identities`);
          if (!identities.length) {
            return;
          }

         for (let identity of identities) {
           console.log(`readContainersFromBrowser: identity == cookieStoreId ${identity.cookieStoreId}, color ${identity.color}, colorCode ${identity.colorCode}, icon ${identity.icon}, iconUrl ${identity.iconUrl}, name ${identity.name}`);
           
           gArrObjectsToSave.push(identity);

           //var promiseContext = browser.contextualIdentities.get(identity.cookieStoreId).then(onGotContext, onContextError);
           
            var promiseGettingAllCookies = browser.cookies.getAll({
              storeId: identity.cookieStoreId
            });
            promiseGettingAllCookies.then(logCookies);
           
         }
         
         saveToFile();
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
    gArrObjectsToSave = null;
    gnDownloadID = 0;
    browser.downloads.onChanged.removeListener(onChangedDownload);
}

function onChangedDownload(downloadDelta) {
  console.log(`containersexportimport.onChangedDownload: called, id ${downloadDelta.id}, state.current ${downloadDelta.state.current}`);

  if (downloadDelta.state && (downloadDelta.state.current === "complete") && (downloadDelta.id == gnDownloadID)) {
    console.log(`containersexportimport.onChangedDownload: Download ${downloadDelta.id} has completed.`);
    URL.revokeObjectURL(gObjectURL);
    gObjectURL = null;
    gArrObjectsToSave = null;
    gnDownloadID = 0;
    browser.downloads.onChanged.removeListener(onChangedDownload);
  }
}

function saveToFile() {
    console.log(`containersexportimport.saveToFile: called, gArrObjectsToSave == ${gArrObjectsToSave}`);
        
    //var objectToSave = new Blob(gArrObjectsToSave);
    var objectToSave = new Blob(new String(JSON.stringify(gArrObjectsToSave, null, 2)));
    //var objectToSave = new Blob(gArrObjectsToSave.toJSON());

    gObjectURL = URL.createObjectURL(objectToSave);
    
    var promiseDownloading = browser.downloads.download({
        //url: 'https://billdietrich.me/index.html',
      url: gObjectURL,
      //body : 'this is a test',
      saveAs: true,
      conflictAction : 'overwrite',
      filename: 'containers.json'
    });
    
    browser.downloads.onChanged.addListener(onChangedDownload);
    promiseDownloading.then(onStartedDownload, onFailedDownload);
}

//-------------------------------------------------------------------------------------

function readFromFile(e) {
    console.log('containersexportimport.readFromFile: called');
    
    // JSON.parse(sString);
    
  // don't submit the form
  e.preventDefault();
}

//-------------------------------------------------------------------------------------

document.querySelector("#form2").addEventListener("submit", readFromFile);
document.querySelector("#form3").addEventListener("submit", readContainersFromBrowser);

//-------------------------------------------------------------------------------------

