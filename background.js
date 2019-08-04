//-------------------------------------------------------------------------------------

function handleClick() {
  browser.runtime.openOptionsPage();
}

browser.browserAction.onClicked.addListener(handleClick);
addListeners();


//-------------------------------------------------------------------------------------

"use strict";

var gConfig;
var garrsURLsToCacheMore ;
var gnCacheMaxSecs ;



//-------------------------------------------------------------------------------------

function loadConfigFromStorage() {
  console.log("loadConfigFromStorage: called");
  gConfig = JSON.parse(localStorage.getItem('config'));	 
  gnCacheMaxSecs = gConfig.nCacheMaxSecs;
  console.log("loadConfigFromStorage: return, gConfig.arrsURLsToCacheMore " + gConfig.arrsURLsToCacheMore + ", gConfig.nCacheMaxSecs " + gConfig.nCacheMaxSecs);
}

function createDefaultConfig() {
  console.log("createDefaultConfig: called");
  garrsURLsToCacheMore = [];
  garrsURLsToCacheMore.push("https://www.billdietrich.me/index.html");
  gnCacheMaxSecs = 30 * 24 * 60 * 60;  // 30 days
  gConfig = {arrsURLsToCacheMore:garrsURLsToCacheMore , nCacheMaxSecs:gnCacheMaxSecs};
  console.log("createDefaultConfig: return, gConfig.arrsURLsToCacheMore " + gConfig.arrsURLsToCacheMore + ", gConfig.nCacheMaxSecs " + gConfig.nCacheMaxSecs);
}

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
  localStorage.setItem("config",JSON.stringify(gConfig));
}


//-------------------------------------------------------------------------------------

function gotRequestHeader(e) {
  for (let sURL of gConfig.arrsURLsToCacheMore) {
    if (e.url.includes(sURL)) {
      console.log("gotRequestHeader: e.url " + e.url);
      for (let header of e.requestHeaders) {
        console.log("gotRequestHeader: header.name " + header.name + ", header.value " + header.value);
      }
      return;
    }
  }
}


//-------------------------------------------------------------------------------------

function gotResponseHeader(e) {
  //console.log("gotResponseHeader: called, e.url " + e.url);
  for (let sURL of gConfig.arrsURLsToCacheMore) {
    if (e.url.includes(sURL)) {
      console.log("gotResponseHeader: e.url " + e.url + " matches pattern " + sURL);
      var newResponseHeaders = [];
      var bFoundCacheControl = false;
      //let sNewCacheControlValue = "must-revalidate,max-age=" + gnCacheMaxSecs;
      let sNewCacheControlValue = "max-age=" + gnCacheMaxSecs;
      for (let header of e.responseHeaders) {
        //console.log("gotResponseHeader: check header.name " + header.name + ", header.value " + header.value);
        if (header.name.toLowerCase() === "cache-control") {
          bFoundCacheControl = true;
          //console.log("gotResponseHeader:  url " + e.url + ", modify header " + header.name + " from '" + header.value +  "' to '" + sNewCacheControlValue + "'");
          header.value = sNewCacheControlValue;
        }
        console.log("gotResponseHeader:  push header " + header.name + " value '" + header.value + "'");
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
  }
  //console.log("gotResponseHeader: done, not matched, e.responseHeaders " + e.responseHeaders);
  return {responseHeaders: e.responseHeaders};
}


//-------------------------------------------------------------------------------------

function addListeners() {
  console.log("addListeners: called");
  //let target = gConfig.target_page;
  //if ((target==="*")||(target==="")||(target===" "))
  let target="<all_urls>";

  browser.webRequest.onBeforeSendHeaders.addListener(
                                          gotRequestHeader,
                                          {urls: target.split(";")},
                                          ["blocking", "requestHeaders"]
                                          );

  browser.webRequest.onHeadersReceived.addListener(
                                          gotResponseHeader,
                                          {urls: target.split(";")},
                                          ["blocking", "responseHeaders"]
                                          );
}

function removeListeners() {
  console.log("removeListeners: called");
  browser.webRequest.onBeforeSendHeaders.removeListener(gotRequestHeader);
  browser.webRequest.onHeadersReceived.removeListener(gotResponseHeader);
}


//-------------------------------------------------------------------------------------
