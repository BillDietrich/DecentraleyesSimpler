//-------------------------------------------------------------------------------------

function handleClick() {
  browser.runtime.openOptionsPage();
}



//-------------------------------------------------------------------------------------

"use strict";

var gnCacheMaxSecs;

var garrsURLPatterns;



//-------------------------------------------------------------------------------------

function loadConfigFromStorage() {
  console.log("loadConfigFromStorage: called");
  config = JSON.parse(localStorage.getItem('config'));	 
  gnCacheMaxSecs = config.nCacheMaxSecs;
  garrsURLPatterns = config.arrsURLPatterns;
  console.log("loadConfigFromStorage: return, gnCacheMaxSecs " + gnCacheMaxSecs + ", garrsURLPatterns " + garrsURLPatterns);
}

function createDefaultConfig() {
  console.log("createDefaultConfig: called");
  gnCacheMaxSecs = 30 * 24 * 60 * 60;  // 30 days
  garrsURLPatterns = [];
  //garrsURLPatterns.push("https://www.billdietrich.me/test1.txt");
  garrsURLPatterns.push("*://*.billdietrich.me/test1.txt");
  console.log("createDefaultConfig: return, gnCacheMaxSecs " + gnCacheMaxSecs + ", garrsURLPatterns " + garrsURLPatterns);
}

function doStartup() {
  console.log("doStartup: called");

  // if configuration exists
  if (localStorage.getItem('config')) {
    console.log("Saved config exists; load it");
    loadConfigFromStorage();	 
  }
  //else no config exists, create a default one
  else {
    console.log("No saved config; create default config");
    createDefaultConfig();
    // save configuration 
    config = {nCacheMaxSecs:gnCacheMaxSecs, arrsURLPatterns:garrsURLPatterns};
    localStorage.setItem("config",JSON.stringify(config));
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
    removeListeners();
    addListeners();
  }
}


//-------------------------------------------------------------------------------------

function gotRequestHeader(e) {
  console.log("gotRequestHeader: e.url " + e.url);
  for (let header of e.requestHeaders) {
    //console.log("gotRequestHeader: header.name " + header.name + ", header.value " + header.value);
  }
}


//-------------------------------------------------------------------------------------

function gotResponseHeader(e) {
  console.log("gotResponseHeader: called, e.url " + e.url);
  var newResponseHeaders = [];
  var bFoundCacheControl = false;
  //let sNewCacheControlValue = "must-revalidate,max-age=" + gnCacheMaxSecs;
  let sNewCacheControlValue = "max-age=" + gnCacheMaxSecs;
  for (let header of e.responseHeaders) {
    //console.log("gotResponseHeader: check header.name " + header.name + ", header.value " + header.value);
    if (header.name.toLowerCase() === "cache-control") {
      bFoundCacheControl = true;
      console.log("gotResponseHeader:  url " + e.url + ", modify header " + header.name + " from '" + header.value +  "' to '" + sNewCacheControlValue + "'");
      header.value = sNewCacheControlValue;
    }
    //console.log("gotResponseHeader:  push header " + header.name + " value '" + header.value + "'");
    newResponseHeaders.push(header);
  }
  if (!bFoundCacheControl) {
    var header = {name:"Cache-Control", value:sNewCacheControlValue};
    console.log("gotResponseHeader:  push header " + header.name + " value '" + header.value + "'");
    newResponseHeaders.push(header);
  }
  //console.log("gotResponseHeader: done, matched, newResponseHeaders " + newResponseHeaders);
  return {responseHeaders: newResponseHeaders};
}


//-------------------------------------------------------------------------------------

function addListeners() {
  console.log("addListeners: called");
  //let target="<all_urls>";

  // for filter argument urls component:
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns

  browser.webRequest.onBeforeSendHeaders.addListener(
                                          gotRequestHeader,
                                          //{urls: target},               // filter
                                          {urls: garrsURLPatterns},  // filter
                                          ["blocking", "requestHeaders"]  // extraInfoSpec
                                          );

  browser.webRequest.onHeadersReceived.addListener(
                                          gotResponseHeader,
                                          //{urls: target},               // filter
                                          {urls: garrsURLPatterns},  // filter
                                          ["blocking", "responseHeaders"] // extraInfoSpec
                                          );
}

function removeListeners() {
  console.log("removeListeners: called");
  browser.webRequest.onBeforeSendHeaders.removeListener(gotRequestHeader);
  browser.webRequest.onHeadersReceived.removeListener(gotResponseHeader);
}


//-------------------------------------------------------------------------------------

doStartup();


//-------------------------------------------------------------------------------------
