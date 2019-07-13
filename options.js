
//-------------------------------------------------------------------------------------


var gArrSettingObjects = null;    // array of objects to save/import

var gArrIdentities = null;
var gArrCookies = null;

var gnContainersDone = 0;
var gnCookiesDone = 0;


//-------------------------------------------------------------------------------------

function checkIdentitiesEnabled() {
  console.log(`checkIdentitiesEnabled: called`);

  var bIdentitiesEnabled = true;

  if (browser.contextualIdentities === undefined) {

    bIdentitiesEnabled = false;
    let sMsg = "browser.contextualIdentities not available. Check that the privacy.userContext.enabled pref is set to true, and reload the add-on.";
    console.log(`${sMsg}`);
    alert(sMsg);

  }

  console.log(`checkIdentitiesEnabled: return bIdentitiesEnabled ${bIdentitiesEnabled}`);
  return bIdentitiesEnabled;
}

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
    console.log(`readIdentitiesFromBrowser: gnContainersDone ${gnContainersDone}`);

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
        console.log(`readCookiesFromBrowser: Cookie: name ${cookie.name}, domain ${cookie.domain}, value ${cookie.value}`);
        gArrSettingObjects.push(cookie);
        gnCookiesDone++;
      }

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
    alert(`Export finished; exported ${gnContainersDone} containers and ${gnCookiesDone} cookies`);
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

    return allPromises;
  });

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
    });
    ArrPromises.push(promiseGettingAllCookies);
    console.log(`myDeleteCookieStores: ArrPromises.length ${ArrPromises.length}`);
  }
    
  var allPromises = Promise.all(ArrPromises);

  console.log(`myDeleteCookieStores: return`);
  return allPromises;
}


//-------------------------------------------------------------------------------------

function onIdentityCreated(identity) {
  console.log(`onIdentityCreated: identity == name ${identity.name}, cookieStoreId ${identity.cookieStoreId}, color ${identity.color}, colorCode ${identity.colorCode}, icon ${identity.icon}, iconUrl ${identity.iconUrl}`);
  gnContainersDone++;
}

function onIdentityCreationError(e) {
  console.error(`onIdentityCreationError: ${e} ${Math.random()}`);
}

function onCookieCreated(cookie) {
  console.log(`onCookieCreated: name ${cookie.name}, domain ${cookie.domain}, value ${cookie.value}, storeId ${cookie.storeId} ${Math.random()}`);
  gnCookiesDone++;
}

function onCookieCreationError(e) {
  console.error(`onCookieCreationError: ${e} ${Math.random()}`);
}

function writeContainersToBrowser() {
  console.log(`writeContainersToBrowser: called`);

  var ArrPromises = new Array();

  gnContainersDone = 0;
  gnCookiesDone = 0;

  console.log(`writeContainersToBrowser: gArrSettingObjects.length ${gArrSettingObjects.length}`);
  for (let obj of gArrSettingObjects) {

    if ( obj.hasOwnProperty('color') ) {
      // it's a container (contextual identity)
      // random is there to make add-on debugger show all msgs
      console.log(`writeContainersToBrowser: it's a container ${Math.random()}`);
      var identity = obj;
      console.log(`writeContainersToBrowser: identity == name ${identity.name}, cookieStoreId ${identity.cookieStoreId}, color ${identity.color}, colorCode ${identity.colorCode}, icon ${identity.icon}, iconUrl ${identity.iconUrl}`);

      var promiseCreateIdentity = browser.contextualIdentities.create({
            name: identity.name,
            color: identity.color,
            icon: identity.icon
      }).then(onIdentityCreated, onIdentityCreationError);
      ArrPromises.push(promiseCreateIdentity);
    }

    else if ( obj.hasOwnProperty('hostOnly') ) {
      // it's a cookie
      // random is there to make add-on debugger show all msgs
      console.log(`writeContainersToBrowser: it's a cookie ${Math.random()}`);
      var cookie = obj;
      console.log(`writeContainersToBrowser: Cookie: name ${cookie.name}, domain ${cookie.domain}, value ${cookie.value}`);

      if (cookie.domain[0] == '.')
        cookie.domain = cookie.domain.substr(1);

      var promiseCreateCookie = browser.cookies.set({
            name: cookie.name,
            url: "https://" + cookie.domain,
            value: cookie.value,
            domain: cookie.domain,
            path: null,
        secure: null,
        httpOnly: null,
        expirationDate: null,
        storeId: null
      }).then(onCookieCreated, onCookieCreationError);
      ArrPromises.push(promiseCreateCookie);
    }

    else {
      // random is there to make add-on debugger show all msgs
      console.log(`writeContainersToBrowser: unknown object type ${Math.random()}`);
    }

  }

  var allPromises = Promise.all(ArrPromises);

  console.log(`writeContainersToBrowser: return`);
  return allPromises;
}

function readFromFile() {
  console.log(``);
  console.log(`readFromFile: called`);

  if (gFile) {

    gFileReader = new FileReader();
    gFileReader.onload = function(evt) {
      console.log(`readFromFile: readAsText result ${evt.target.result}`);
 
      gArrSettingObjects = JSON.parse(evt.target.result);

      writeContainersToBrowser().then(() => {
        updateInfoMsg();
        alert(`Import finished; imported ${gnContainersDone} containers and ${gnCookiesDone} cookies`);

        console.log(`readFromFile: done; imported ${gnContainersDone} containers and ${gnCookiesDone} cookies`);
      });

    };

    gFileReader.readAsText(gFile);
    console.log(`readFromFile: did readAsText`);
  }
    
  console.log(`readFromFile: return`);
}


//-------------------------------------------------------------------------------------
// things related to the HTML page

function updateInfoMsg(){
  console.log(`updateInfoMsg: called`);
  document.querySelector('#infodiv').innerHTML = `The browser has ${gnContainersDone} containers with ${gnCookiesDone} cookies in them.`;
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

  var bIdentitiesEnabled = checkIdentitiesEnabled();

  if (bIdentitiesEnabled) {

    readIdentitiesFromBrowser().then(() => {
      readCookiesFromBrowser().then(() => {
        updateInfoMsg();
      });
    });
  
  }

  console.log(`updateInfo: return`);
}

function doExport(evt){
  console.log(``);
  console.log(`doExport: evt ${evt}`);

  var bIdentitiesEnabled = checkIdentitiesEnabled();

  if (bIdentitiesEnabled) {

    readIdentitiesFromBrowser().then(() => {

      if (gnContainersDone == 0) {

        alert("No containers to export");

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
