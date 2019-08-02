//-------------------------------------------------------------------------------------

function handleClick() {
  browser.runtime.openOptionsPage();
}

browser.browserAction.onClicked.addListener(handleClick);
addListeners();


//-------------------------------------------------------------------------------------

"use strict";

var config ;
var garrsURLsToCacheMore ;
var gnCacheTime ;
let sResponseHeaderCacheTime = "cachetime";



//-------------------------------------------------------------------------------------

function loadConfigFromStorage() {
  console.log("loadConfigFromStorage: called");
  config = JSON.parse(localStorage.getItem('config'));	 
  console.log("loadConfigFromStorage: return, config.arrsURLsToCacheMore " + config.arrsURLsToCacheMore + ", config.nCacheTime " + config.nCacheTime);
}

function createDefaultConfig() {
  console.log("createDefaultConfig: called");
  let garrsURLsToCacheMore = [];
  garrsURLsToCacheMore.push("https://www.test.com");
  gnCacheTime = 9999999;
  config = {arrsURLsToCacheMore:garrsURLsToCacheMore , nCacheTime:gnCacheTime};
  console.log("createDefaultConfig: return, config.arrsURLsToCacheMore " + config.arrsURLsToCacheMore + ", config.nCacheTime " + config.nCacheTime);
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
  localStorage.setItem("config",JSON.stringify(config));
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
  for (let sURL of config.garrsURLsToCacheMore) {
    if (e.url.includes(sURL)) {
      for (let header of e.responseHeaders) {
        if (header.name.toLowerCase() === sResponseHeaderCacheTime) {
          console.log("gotResponseHeader: Modify response header :  name = " + header.name + ",old value=" + header.value +  ",new value=" + gnCacheTime  + " for url " + e.url);
          header.value = gnCacheTime;
        }
      }
    }
  }
  console.log("gotResponseHeader: done, e.url " + e.url);
  return {responseHeaders: e.responseHeaders};
}


//-------------------------------------------------------------------------------------

/*
* Add gotRequestHeader as a listener to onBeforeSendHeaders, only for the target pages.
* Add gotResponseHeader as a listener to onHeadersReceived, only for the target pages.
* Make it "blocking" so we can modify the headers.
*/
function addListeners() {
  //let target = config.target_page;
  //if ((target==="*")||(target==="")||(target===" "))
    let target="<all_urls>";
  browser.webRequest.onBeforeSendHeaders.addListener(gotRequestHeader,
                                          {urls: target.split(";")},
                                          ["blocking", "requestHeaders"]);

  browser.webRequest.onHeadersReceived.addListener(gotResponseHeader,
                                          {urls: target.split(";")},
                                          ["blocking", "responseHeaders"]);
}


/*
* Remove the two listeners
*
*/
function removeListeners() {
  browser.webRequest.onBeforeSendHeaders.removeListener(gotRequestHeader);
  browser.webRequest.onHeadersReceived.removeListener(gotResponseHeader);
}


//-------------------------------------------------------------------------------------
