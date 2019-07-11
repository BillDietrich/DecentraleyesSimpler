

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



function logCookies(cookies) {
    console.log(`logCookies: Retrieved ${cookies.length} cookies`);
  for (let cookie of cookies) {
    console.log(`Cookie: domain ${cookie.domain}, name ${cookie.name}, value ${cookie.value}`);
  }
}




function readContainersFromBrowser(e) {
    console.log('containersexportimport.readContainersFromBrowser: called');
    if (browser.contextualIdentities === undefined) {
      console.log('browser.contextualIdentities not available. Check that the privacy.userContext.enabled pref is set to true, and reload the add-on.');
    } else {
      browser.contextualIdentities.query({})
        .then((identities) => {
            console.log(`Retrieved ${identities.length} identities`);
          if (!identities.length) {
            return;
          }

         for (let identity of identities) {
           //let row = document.createElement('div');
           //let span = document.createElement('span');
           //span.className = 'identity';
           //span.innerText = identity.name;
           //span.style = `color: ${identity.color}`;
           console.log(`readContainersFromBrowser: identity == cookieStoreId ${identity.cookieStoreId}, color ${identity.color}, colorCode ${identity.colorCode}, icon ${identity.icon}, iconUrl ${identity.iconUrl}, name ${identity.name}`);
           //row.appendChild(span);
           //createOptions(row, identity);
           //div.appendChild(row);
           
           //var promiseContext = browser.contextualIdentities.get(identity.cookieStoreId).then(onGotContext, onContextError);
           
            var gettingAll = browser.cookies.getAll({
              storeId: identity.cookieStoreId
            });
            gettingAll.then(logCookies);
           
         }

        var obj = new String("test here");
        objectToSave = new Blob(obj);
        //objectToSave = new Blob(JSON.stringify(obj));
        //objectToSave = new Blob(obj.toJSON());
         
         saveToFile();
      });
    }

  // don't submit the form
  e.preventDefault();

    console.log('containersexportimport.readContainersFromBrowser: return');
 }

var objectToSave = null;
 
 function onStartedDownload(id) {
  console.log(`containersexportimport.onStartedDownload: called, id == ${id}`);
}

function onFailed(error) {
  console.log(`containersexportimport.onFailed: called, ${error}`);
    URL.revokeObjectURL(objectToSave);
    objectToSave = null;
}

function saveToFile() {
    console.log('containersexportimport.saveToFile: called');
    objectURL = URL.createObjectURL(objectToSave);
    var downloading = browser.downloads.download({
        //url: 'https://billdietrich.me/index.html',
      url: objectURL,
      //body : 'this is a test',
      saveAs: true,
      conflictAction : 'overwrite',
      filename: 'containers.json'
    });
    
    downloading.then(onStartedDownload, onFailed);
}

function readFromFile(e) {
    console.log('containersexportimport.readFromFile: called');
    
    // JSON.parse(sString);
    
  // don't submit the form
  e.preventDefault();
}

document.querySelector("#form2").addEventListener("submit", readFromFile);
document.querySelector("#form3").addEventListener("submit", readContainersFromBrowser);

