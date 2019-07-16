
//-------------------------------------------------------------------------------------


var gArrSettingObjects = null;    // array of objects to save/import

var gArrIdentities = null;
var gArrCookies = null;

var gnContainersDone = 0;
var gnCookiesDone = 0;

var gArrFoundExtensionNames = null;
var gArrFoundExtensionIds = null;

const gArrKnownContainerExtensionNames = [
              "Firefox Multi-Account Containers",
              "Facebook Container",
              "Google Container",
              "Reddit Container",
              "Amazon Container"
              ];


//-------------------------------------------------------------------------------------

function checkIdentitiesEnabled() {
  console.log(`checkIdentitiesEnabled: called`);

  var bIdentitiesEnabled = true;

  if (browser.contextualIdentities === undefined) {

    bIdentitiesEnabled = false;
    let sMsg = "browser.contextualIdentities not available. Check that the privacy.userContext.enabled pref is set to true, and reload the add-on.";
    console.log(`checkIdentitiesEnabled: ${sMsg}`);
    //alert(sMsg);
    giveNotification("Browser.contextualIdentities not available", "Check that the privacy.userContext.enabled pref is set to true, and reload the add-on.");

  }

  console.log(`checkIdentitiesEnabled: return bIdentitiesEnabled ${bIdentitiesEnabled}`);
  return bIdentitiesEnabled;
}


//-------------------------------------------------------------------------------------

function readExtensionsFromBrowser() {
  console.log(`readIdentitiesFromBrowser: called`);
  
  var promiseGetExtensions = browser.management.getAll();

  promiseGetExtensions.then((extensions) => {

    console.log(`readExtensionsFromBrowser: retrieved ${extensions.length} extensions`);
    gArrFoundExtensionNames = [];
    gArrFoundExtensionIds = [];
    for (let extension of extensions) {
      console.log(`readExtensionsFromBrowser: extension.name ${extension.name}, extension.type ${extension.type}, extension.id ${extension.id}`);
      if (extension.type == "extension") {
        if (gArrKnownContainerExtensionNames.indexOf(extension.name) >= 0) {
          console.log(`readExtensionsFromBrowser: it's a container extension`);
          gArrFoundExtensionNames.push(new String(extension.name));
          gArrFoundExtensionIds.push(new String(extension.id));
        }
      }
    }
    console.log(`readExtensionsFromBrowser: done, gArrFoundExtensionNames.length ${gArrFoundExtensionNames.length}`);

  }).catch(error => {
    console.error(`readExtensionsFromBrowser: error ${error}`);
	});

  console.log(`readExtensionsFromBrowser: return, promiseGetExtensions ${promiseGetExtensions}`);
  return promiseGetExtensions;
}


//-------------------------------------------------------------------------------------

function readIdentitiesFromBrowser() {
  console.log(`readIdentitiesFromBrowser: called`);

  gArrSettingObjects = new Array();

  gnContainersDone = 0;
  
  var promiseGetContexts = browser.contextualIdentities.query({});

  promiseGetContexts.then((identities) => {

    console.log(`readIdentitiesFromBrowser: retrieved ${identities.length} identities`);
    gArrIdentities = new Array();
    for (let identity of identities)
      gArrIdentities.push(identity);
    console.log(`readIdentitiesFromBrowser: gArrIdentities.length ${gArrIdentities.length}`);
    gnContainersDone = gArrIdentities.length;
    console.log(`readIdentitiesFromBrowser: done, gnContainersDone ${gnContainersDone}`);

  }).catch(error => {
    console.error(`readIdentitiesFromBrowser: error ${error}`);
	});

  console.log(`readIdentitiesFromBrowser: return, promiseGetContexts ${promiseGetContexts}`);
  return promiseGetContexts;
}

function readCookiesFromBrowser() {
  console.log(`readCookiesFromBrowser: called`);

  var ArrPromises = new Array();

  gnCookiesDone = 0;
  
  for (let identity of gArrIdentities) {
    console.log(`readCookiesFromBrowser: identity == name ${identity.name}, cookieStoreId ${identity.cookieStoreId}, color ${identity.color}, colorCode ${identity.colorCode}, icon ${identity.icon}, iconUrl ${identity.iconUrl}`);

    gArrSettingObjects.push(identity);

    var promiseGettingAllCookies = browser.cookies.getAll({
      storeId: identity.cookieStoreId
      //firstPartyDomain: null
    }).then((cookies) => {

      // random is there to make add-on debugger show all msgs
      console.log(`readCookiesFromBrowser: Retrieved ${cookies.length} cookies ${Math.random()}`);
      for (let cookie of cookies) {
        console.log(`readCookiesFromBrowser: Cookie: name ${cookie.name}, domain ${cookie.domain}, value ${cookie.value}, storeId ${cookie.storeId}`);
        gArrSettingObjects.push(cookie);
        gnCookiesDone++;
      }
      console.log(`readCookiesFromBrowser: done`);

    }).catch(error => {
    console.error(`readCookiesFromBrowser: error ${error}`);
	  });

    ArrPromises.push(promiseGettingAllCookies);
    console.log(`readCookiesFromBrowser: ArrPromises.length ${ArrPromises.length}`);
    
  }
  
  var promiseAll = Promise.all(ArrPromises);

  console.log(`readCookiesFromBrowser: return, promiseAll ${promiseAll}`);
  return promiseAll;
}


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
    console.log(`onChangedDownload: export finished; exported ${gnContainersDone} containers and ${gnCookiesDone} cookies`);
    //alert(`Export finished; exported ${gnContainersDone} containers and ${gnCookiesDone} cookies`);
    giveNotification("Export finished", `Exported ${gnContainersDone} containers and ${gnCookiesDone} cookies`);
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
  promiseDownloading.then(onStartedDownload, onFailedDownload).catch(error => {
    console.error(`saveToFile: error ${error}`);
	});

  console.log(`saveToFile: return`);
  return promiseDownloading;
}

//-------------------------------------------------------------------------------------

var gFileReader = null;
var gFile = null;
var gArrCookieStoreIDs = null;


function myDeleteAllIdentities() {
  console.log(`myDeleteAllIdentities: called`);

  var promiseGetContexts = browser.contextualIdentities.query({});

  promiseGetContexts.then((identities) => {
    console.log(`myDeleteAllIdentities: Retrieved ${identities.length} identities`);

    var ArrPromises = new Array();
    gArrCookieStoreIDs = new Array();

    for (let identity of identities) {
      console.log(`myDeleteAllIdentities: identity == name ${identity.name}, cookieStoreId ${identity.cookieStoreId}, color ${identity.color}, colorCode ${identity.colorCode}, icon ${identity.icon}, iconUrl ${identity.iconUrl}`);
      var promiseRemoveContext = browser.contextualIdentities.remove(identity.cookieStoreId);
      ArrPromises.push(promiseRemoveContext);
      gArrCookieStoreIDs.push(identity.cookieStoreId);
    }
        
    var allPromises = Promise.all(ArrPromises);

    console.log(`myDeleteAllIdentities: return1`);
    return allPromises;
  }).catch(error => {
    console.error(`myDeleteAllIdentities: error ${error}`);
	});

  console.log(`myDeleteAllIdentities: return2`);
  return promiseGetContexts;
}


function myDeleteCookieStores() {
  console.log(`myDeleteCookieStores: called`);

  ArrPromises = new Array();
  for (let cookieStoreId of gArrCookieStoreIDs) {
    var promiseGettingAllCookies = browser.cookies.getAll({
      storeId: cookieStoreId,
      firstPartyDomain: null
    }).then((cookies) => {
      // random is there to make add-on debugger show all msgs
      console.log(`myDeleteCookieStores: retrieved ${cookies.length} cookies ${Math.random()}`);
      for (let cookie of cookies) {
        console.log(`myDeleteCookieStores: cookie: name ${cookie.name}, domain ${cookie.domain}, value ${cookie.value}`);
        var promiseRemoveCookie = cookie.remove({
          name: cookie.name,
          url: cookie.url
        });
        ArrPromises.push(promiseRemoveCookie);
      }
    }).catch(error => {
      console.error(`myDeleteCookieStores: error ${error}`);
	  });
    ArrPromises.push(promiseGettingAllCookies);
    console.log(`myDeleteCookieStores: ArrPromises.length ${ArrPromises.length}`);
  }
    
  var allPromises = Promise.all(ArrPromises);

  console.log(`myDeleteCookieStores: return`);
  return allPromises;
}


//-------------------------------------------------------------------------------------

var gArrIdentityNames = null;
var gArrOldStoreIds = null;
var gArrNewStoreIds = null;


function onIdentityCreated(identity) {
  console.log(`onIdentityCreated: identity == name ${identity.name}, cookieStoreId ${identity.cookieStoreId}, color ${identity.color}, colorCode ${identity.colorCode}, icon ${identity.icon}, iconUrl ${identity.iconUrl}`);

  var i = gArrIdentityNames.indexOf(identity.name);
  console.log(`onIdentityCreated:  oldStoreId ${gArrOldStoreIds[i]}`);
  gArrNewStoreIds[i] = identity.cookieStoreId;

  gnContainersDone++;
}

function onIdentityCreationError(e) {
  console.error(`onIdentityCreationError: ${e} ${Math.random()}`);
}

function writeIdentitiesToBrowser() {
  console.log(`writeIdentitiesToBrowser: called`);

  gArrIdentityNames = new Array();
  gArrOldStoreIds = new Array();
  gArrNewStoreIds = new Array();

  var ArrPromises = new Array();

  gnContainersDone = 0;

  console.log(`writeIdentitiesToBrowser: gArrSettingObjects.length ${gArrSettingObjects.length}`);
  for (let obj of gArrSettingObjects) {

    if ( obj.hasOwnProperty('color') ) {
      // it's a container (contextual identity)
      // random is there to make add-on debugger show all msgs
      console.log(`writeIdentitiesToBrowser: it's a container ${Math.random()}`);
      var identity = obj;
      console.log(`writeIdentitiesToBrowser: identity == name ${identity.name}, cookieStoreId ${identity.cookieStoreId}, color ${identity.color}, colorCode ${identity.colorCode}, icon ${identity.icon}, iconUrl ${identity.iconUrl}`);

      gArrIdentityNames.push(identity.name);
      gArrOldStoreIds.push(identity.cookieStoreId);
      gArrNewStoreIds.push("");

      var promiseCreateIdentity = browser.contextualIdentities.create({
            name: identity.name,
            color: identity.color,
            icon: identity.icon
      }).then(onIdentityCreated, onIdentityCreationError).catch(error => {
        console.error(`writeIdentitiesToBrowser: error ${error}`);
	    });
      ArrPromises.push(promiseCreateIdentity);
    }

  }

  var allPromises = Promise.all(ArrPromises);

  console.log(`writeIdentitiesToBrowser: return`);
  return allPromises;
}


//-------------------------------------------------------------------------------------

function onCookieCreated(cookie) {
  console.log(`onCookieCreated: name ${cookie.name}, domain ${cookie.domain}, value ${cookie.value}, storeId ${cookie.storeId} ${Math.random()}`);
  gnCookiesDone++;
}

function onCookieCreationError(e) {
  console.error(`onCookieCreationError: ${e} ${Math.random()}`);
}

function writeCookiesToBrowser() {
  console.log(`writeCookiesToBrowser: called`);

  var ArrPromises = new Array();

  gnCookiesDone = 0;

  console.log(`writeCookiesToBrowser: gArrSettingObjects.length ${gArrSettingObjects.length}`);
  for (let obj of gArrSettingObjects) {

    if ( obj.hasOwnProperty('hostOnly') ) {
      // it's a cookie
      // random is there to make add-on debugger show all msgs
      console.log(`writeCookiesToBrowser: it's a cookie ${Math.random()}`);
      var cookie = obj;
      console.log(`writeCookiesToBrowser: Cookie: name ${cookie.name}, domain ${cookie.domain}, value ${cookie.value}, storeId ${cookie.storeId}`);

      if (cookie.domain[0] == '.')
        cookie.domain = cookie.domain.substr(1);

      var i = gArrOldStoreIds.indexOf(cookie.storeId);
      console.log(`writeCookiesToBrowser:  newStoreId ${gArrNewStoreIds[i]}`);

      var promiseCreateCookie = browser.cookies.set({
            name: cookie.name,
            url: "https://" + cookie.domain,
            value: cookie.value,
            domain: cookie.domain,
            path: null,
            secure: null,
            httpOnly: null,
            expirationDate: null,
            storeId: gArrNewStoreIds[i]
      }).then(onCookieCreated, onCookieCreationError).catch(error => {
        console.error(`writeCookiesToBrowser: error ${error}`);
	    });

      ArrPromises.push(promiseCreateCookie);
    }

  }

  var allPromises = Promise.all(ArrPromises);

  console.log(`writeCookiesToBrowser: return`);
  return allPromises;
}


//-------------------------------------------------------------------------------------

function readFromFile() {
  console.log(``);
  console.log(`readFromFile: called`);

  if (gFile) {

    gFileReader = new FileReader();
    gFileReader.onload = function(evt) {
      console.log(`readFromFile: readAsText result ${evt.target.result}`);
 
      gArrSettingObjects = JSON.parse(evt.target.result);

      writeIdentitiesToBrowser().then(() => {
        writeCookiesToBrowser().then(() => {
          updateInfoMsg();
          //alert(`Import finished; imported ${gnContainersDone} containers and ${gnCookiesDone} cookies`);
          giveNotification("Import finished", `Imported ${gnContainersDone} containers and ${gnCookiesDone} cookies`);

          console.log(`readFromFile: done; imported ${gnContainersDone} containers and ${gnCookiesDone} cookies`);
        });
      });

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

  var sMsg = `The browser has ${gnContainersDone} containers, with a total of ${gnCookiesDone} cookies in them.`;
  sMsg += "<br /><br />";
  sMsg += `There are ${gArrFoundExtensionNames.length} container-handling extensions installed`;

  console.log(`updateInfoMsg: gArrFoundExtensionNames.length ${gArrFoundExtensionNames.length}`);
  if (gArrFoundExtensionNames.length == 0)
    sMsg += ".";
  else {
    sMsg += ":";
    for (i=0 ; i<gArrFoundExtensionNames.length ; i++) {
      console.log(`updateInfoMsg: gArrFoundExtensionNames[i] ${gArrFoundExtensionNames[i]}`);
      sMsg += "&nbsp;&nbsp;";
      sMsg += gArrFoundExtensionNames[i];
      if (i < gArrFoundExtensionNames.length-1)
        sMsg += ",";
    }
  }

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

function updateInfo(evt){
  console.log(``);
  console.log(`updateInfo: evt ${evt}`);

  readExtensionsFromBrowser().then(() => {

    var bIdentitiesEnabled = checkIdentitiesEnabled();

    if (bIdentitiesEnabled) {

      readIdentitiesFromBrowser().then(() => {
        readCookiesFromBrowser().then(() => {
          updateInfoMsg();
        });
      });
    
    }
  });

  console.log(`updateInfo: return`);
}

function doExport(evt){
  console.log(``);
  console.log(`doExport: evt ${evt}`);

  var bIdentitiesEnabled = checkIdentitiesEnabled();

  if (bIdentitiesEnabled) {

    readIdentitiesFromBrowser().then(() => {

      if (gnContainersDone == 0) {

        //alert("No containers to export");
        giveNotification("No containers to export", ``);

      } else {

        readCookiesFromBrowser().then(() => {

          saveToFile().then(() => {

            updateInfoMsg();
            console.log(`doExport: done`);

          });

        });

      }
    });

  }

  // don't submit the form
  evt.preventDefault();

  console.log(`doExport: return`);
}

function doImport(evt){
  console.log(``);
  console.log(`doImport: evt ${evt}`);

  var bDeleteAllExisting = document.querySelector('#deleteallexisting').checked;
  console.log(`doImport: bDeleteAllExisting ${bDeleteAllExisting}`);

  var bIdentitiesEnabled = checkIdentitiesEnabled();

  if (bIdentitiesEnabled) {

    if (bDeleteAllExisting) {

      myDeleteAllIdentities().then(() => {
        myDeleteCookieStores().then(() => {
          readFromFile();
        });
      });

    } else {

      readFromFile();

    }
  }

  // don't submit the form
  evt.preventDefault();

  console.log(`doImport: return`);
}


window.addEventListener('load', updateInfo);
document.querySelector('#importfile').addEventListener('change', handleFileSelect);
document.querySelector("#importform").addEventListener("submit", doImport);
document.querySelector("#exportform").addEventListener("submit", doExport);


//-------------------------------------------------------------------------------------
