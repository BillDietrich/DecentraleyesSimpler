//-------------------------------------------------------------------------------------

function handleClick() {
  browser.runtime.openOptionsPage();
}



//-------------------------------------------------------------------------------------

"use strict";

var gnCacheMaxSecs;

var garrsURLPatterns;         // MDN's filter format, e.g. "*://code.jquery.com/*"

var garrsExcludeURLPrefixes;  // "start of URL" format, e.g. "https://code.jquery.com/"

// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/ResourceType
var garrsResourceTypes;




//-------------------------------------------------------------------------------------

let defaultConfig =

{
  "nCacheMaxSecs": 2592000,
  "arrsURLPatterns": [
    "*://ajax.googleapis.com/ajax/libs/*",
    "*://fonts.googleapis.com/*",
    "*://*.gstatic.com/*",
    "*://ajax.aspnetcdn.com/ajax/*",
    "*://ajax.microsoft.com/ajax/*",
    "*://cdnjs.cloudflare.com/ajax/libs/*",
    "*://code.jquery.com/*",
    "*://cdn.jsdelivr.net/*",
    "*://api.fastly.com/*",
    "*://*.kxcdn.com/css/*",
    "*://*.kxcdn.com/js/*",
    "*://secure.metacdn.com/api/*",
    "*://rws.maxcdn.com/*",
    "*://api.stackpath.com/*",
    "*://api.leasewebcdn.com/*",
    "*://*.awsstatic.com/*",
    "*://*.yastatic.net/*",
    "*://*.yandex.st/*",
    "*://apps.bdimg.com/libs/*",
    "*://libs.baidu.com/*",
    "*://lib.sinaapp.com/js/*",
    "*://upcdn.b0.upaiyun.com/libs/*",
    "*://cdn.bootcss.com/*",
    "*://sdn.geekzu.org/ajax/ajax/libs/*",
    "*://ajax.proxy.ustclug.org/*",
    "*://*.typekit.net/*",
    "*://*.indexww.com/*",
    "*://*.oath.com/*",
    "*://*.akamaized.net/*",
    "*://cdn.ampproject.org/*",
    "*://cdn.datatables.net/*"
  ],
  "arrsExcludeURLPrefixes": [
  ],
  "arrsResourceTypes": [
    "font",
    "image",
    "script",
    "stylesheet"
  ]
}
;

// I really wanted this to live in a JSON file packaged with the add-on,
// via "web_accessible_resources": ["defaultconfig.json"] in manifest.json,
// but add-on API does not support even read-only access to such a file.
// Would have to do headstands to have the user open the file and feed
// it back into the add-on, after installation, and that's crazy.


//-------------------------------------------------------------------------------------

function loadConfigFromStorage() {
  console.log("loadConfigFromStorage: called");
  var config = JSON.parse(localStorage.getItem('config'));	 
  gnCacheMaxSecs = config.nCacheMaxSecs;
  garrsURLPatterns = config.arrsURLPatterns;
  garrsExcludeURLPrefixes = config.arrsExcludeURLPrefixes;
  garrsResourceTypes = config.arrsResourceTypes;
  console.log("loadConfigFromStorage: return, gnCacheMaxSecs " + gnCacheMaxSecs + ", garrsURLPatterns " + garrsURLPatterns + ", garrsExcludeURLPrefixes " + garrsExcludeURLPrefixes + ", garrsResourceTypes " + garrsResourceTypes);
}

function doStartup() {
  console.log("doStartup: called");

  // if configuration exists
  if (localStorage.getItem('config')) {
    console.log("Saved config exists; load it");
    loadConfigFromStorage();
  }
  //else no config exists, load default one
  else {
    console.log("No saved config; load default config");
    localStorage.setItem("config",JSON.stringify(defaultConfig));
    loadConfigFromStorage();
  }

  // connection to make options page appear
  browser.browserAction.onClicked.addListener(handleClick);

  // listeners to handle HTTP requests and responses
  addListeners();

  // connection to let options page tell this page that the config has changed
  browser.runtime.onMessage.addListener(receiveConfigChangedMessage);

  console.log("doStartup: return");
}

function receiveConfigChangedMessage(message,sender,sendResponse) {
  console.log("receiveConfigChangedMessage: called");
  if (message.type === "configChanged") {
    console.log("receiveConfigChangedMessage: config changed");
    loadConfigFromStorage();
    config = {nCacheMaxSecs:gnCacheMaxSecs, arrsURLPatterns:garrsURLPatterns, arrsExcludeURLPrefixes:garrsExcludeURLPrefixes, arrsResourceTypes:garrsResourceTypes};
    console.log(`receiveConfigChangedMessage: new config is ${JSON.stringify(config)}`);
    removeListeners();
    addListeners();
  } else if (message.type === "resetToDefaultConfig") {
    console.log("receiveConfigChangedMessage: resetToDefaultConfig");
    localStorage.setItem("config",JSON.stringify(defaultConfig));
    loadConfigFromStorage();
    removeListeners();
    addListeners();
  } else {
    console.log("receiveConfigChangedMessage: unexpected message");
  }
}


//-------------------------------------------------------------------------------------

function gotRequestHeader(e) {
  //console.log("gotRequestHeader: called, " + e.url + ", e.type " + e.type);
  //for (let header of e.requestHeaders) {
    //console.log("gotRequestHeader: header.name " + header.name + ", header.value " + header.value);
  //}
}


//-------------------------------------------------------------------------------------

function gotResponseHeader(e) {
  //console.log("gotResponseHeader: called, " + e.url + ", e.type " + e.type);

  // implement URL exclusions
  //console.log("gotResponseHeader: garrsExcludeURLPrefixes.length " + garrsExcludeURLPrefixes.length);
  for (let sURLPrefix of garrsExcludeURLPrefixes) {
    //console.log("gotResponseHeader: check exclusion " + sURLPrefix);
    if (e.url.startsWith(sURLPrefix)) {
      //console.log(`gotResponseHeader: url matches exclusion ${sURLPrefix}`);
      return;
    }
  }

  var newResponseHeaders = [];
  var bFoundCacheControl = false;
  //let sNewCacheControlValue = "must-revalidate,max-age=" + gnCacheMaxSecs;
  let sNewCacheControlValue = "max-age=" + gnCacheMaxSecs;
  for (let header of e.responseHeaders) {
    //console.log("gotResponseHeader: check header.name " + header.name + ", header.value " + header.value);
    if (header.name.toLowerCase() === "cache-control") {
      if (header.value === sNewCacheControlValue) {
        return;
      }
      bFoundCacheControl = true;
      //console.log("gotResponseHeader:  url " + e.url + ", modify header " + header.name + " from '" + header.value +  "' to '" + sNewCacheControlValue + "'");
      header.value = sNewCacheControlValue;
    }
    //console.log("gotResponseHeader:  push header " + header.name + " value '" + header.value + "'");
    newResponseHeaders.push(header);
  }
  if (!bFoundCacheControl) {
    var header = {name:"Cache-Control", value:sNewCacheControlValue};
    //console.log("gotResponseHeader:  push new header " + header.name + " value '" + header.value + "'");
    newResponseHeaders.push(header);
  }
  //console.log("gotResponseHeader: done, matched, newResponseHeaders " + newResponseHeaders);
  return {responseHeaders: newResponseHeaders};
}


//-------------------------------------------------------------------------------------

function addListeners() {
  console.log("addListeners: called");

  // For filter argument "urls" component:
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns

  // Filter argument "types" component is a little strange.
  // If you load an address such as domain.com/test.js, the request
  // and response for test.js will have type "main_frame", not "script".
  // If you load an address such as domain.com/page.html which then loads test.js, the request
  // and response for test.js will have type script".

  if (false) {
  browser.webRequest.onBeforeSendHeaders.addListener(
                                          gotRequestHeader,
                                          // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/RequestFilter
                                          //{urls: "<all_urls>"},    // filter
                                          //{urls: garrsURLPatterns},  // filter
                                          {urls: garrsURLPatterns, types: garrsResourceTypes},  // filter
                                          ["blocking", "requestHeaders"]  // extraInfoSpec
                                          );
  }

  browser.webRequest.onHeadersReceived.addListener(
                                          gotResponseHeader,
                                          // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/RequestFilter
                                          //{urls: "<all_urls>"},    // filter
                                          //{urls: garrsURLPatterns},  // filter
                                          {urls: garrsURLPatterns, types: garrsResourceTypes},  // filter
                                          ["blocking", "responseHeaders"] // extraInfoSpec
                                          );
}

function removeListeners() {
  console.log("removeListeners: called");
  //browser.webRequest.onBeforeSendHeaders.removeListener(gotRequestHeader);
  browser.webRequest.onHeadersReceived.removeListener(gotResponseHeader);
}


//-------------------------------------------------------------------------------------


doStartup();


//-------------------------------------------------------------------------------------
