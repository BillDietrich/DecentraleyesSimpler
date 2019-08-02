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
  let garrsURLsToCacheMore = [];
  garrsURLsToCacheMore.push("https://www.test.com");
  gnCacheMaxSecs = 7 * 24 * 60 * 60;  // 1 week
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

/*
* Got a request header
*
*/
function gotRequestHeader(e) {
  console.log("gotRequestHeader: e.url " + e.url);
  
  return {requestHeaders: e.requestHeaders};
}


//-------------------------------------------------------------------------------------

/*
* Got a response header
*
*/
function gotResponseHeader(e) {
  console.log("gotResponseHeader: called, e.url " + e.url);
  for (let sURL of gConfig.arrsURLsToCacheMore) {
    if (e.url.includes(sURL)) {
      //console.log("gotResponseHeader: e.url " + e.url + " matches pattern " + sURL);
      for (let header of e.responseHeaders) {
        //console.log("gotResponseHeader: check header.name " + header.name + ", header.value " + header.value);
        if (header.name.toLowerCase() === "cache-control") {
          let sNewValue = "must-revalidate,max-age=" + gnCacheMaxSecs;
          console.log("gotResponseHeader: Modify response header :  name = " + header.name + ", old value = " + header.value +  ", new value = " + sNewValue  + " for url " + e.url);
          header.value = sNewValue;
        }
      }
    }
  }
  console.log("gotResponseHeader: done, e.responseHeaders " + e.responseHeaders);
  return {responseHeaders: e.responseHeaders};
}


//-------------------------------------------------------------------------------------

/*
* Add gotRequestHeader as a listener to onBeforeSendHeaders, only for the target pages.
* Add gotResponseHeader as a listener to onHeadersReceived, only for the target pages.
* Make it "blocking" so we can modify the headers.
*/
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


/*
* Remove the two listeners
*
*/
function removeListeners() {
  console.log("removeListeners: called");
  browser.webRequest.onBeforeSendHeaders.removeListener(gotRequestHeader);
  browser.webRequest.onHeadersReceived.removeListener(gotResponseHeader);
}


//-------------------------------------------------------------------------------------
