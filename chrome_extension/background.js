// array used to keep track of tabId-url mappings, needed to remember url of closed tabs
var urls = [];
var currActiveTabId = -1;
var recordFlag = false;
/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getCurrentTabBaseUrl(callback) {
    // Query filter to be passed to chrome.tabs.query - see
    // https://developer.chrome.com/extensions/tabs#method-query
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, function(tabs) {
        console.log(tabs);
        // chrome.tabs.query invokes the callback with a list of tabs that match the
        // query. When the popup is opened, there is certainly a window and at least
        // one tab, so we can safely assume that |tabs| is a non-empty array.
        // A window can only have one active tab at a time, so the array consists of
        // exactly one tab.
        var tab = tabs[0];
        currActiveTabId = tab.id;  // set the global active tab ID tracker

        var url = tab.url;

        // tab.url is only available if the "activeTab" permission is declared.
        // If you want to see the URL of other tabs (e.g. after removing active:true
        // from |queryInfo|), then the "tabs" permission is required to see their
        // "url" properties.
        console.assert(typeof url == 'string', 'tab.url should be a string');
        var pathArray = url.split( '/' );
        var protocol = pathArray[0];
        var host = pathArray[2];
        var base_url = protocol + '//' + host + '/';

        urls[currActiveTabId] = base_url;

        callback(base_url);
    });
}

//getCurrentTabBaseUrl(function(url) {});


// execute function when tab gets updated (specifically when url changes)
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  // check to make sure the update is a url change, and this url change is for the active tab
  if(changeInfo.url != undefined && tabId == currActiveTabId) {
  	console.log("URL change in active tab: " + changeInfo.url);
    var prevURL = urls[tabId];  // grab the original url before we update the array
  	urls[tabId] = changeInfo.url;

    //var currDate = new Date();
    var timestamp = Date.now();
    var currentBaseUrl = getBaseURL(urls[tabId]);
    var prevBaseUrl = getBaseURL(prevURL);
    // if the old and new URLs have different bases and we're recording, then log the change
    if(currentBaseUrl != prevBaseUrl) {
      if(getSession() && currentBaseUrl.substring(0, 9) !== "chrome://") query(currentBaseUrl);
      if(recordFlag) {
        start_web_log(getSession(), currentBaseUrl, timestamp);
        end_web_log(getSession(), prevBaseUrl, timestamp);
      }
    }
  }
});

// execute function when a tab becomes activated
chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function(tab) {
  	urls[activeInfo.tabId] = tab.url;
    var prevActiveTabId = currActiveTabId;  // grab the original active tab id before we update it
    currActiveTabId = activeInfo.tabId;

    //var currDate = new Date();
    var timestamp = Date.now();
    var currentBaseUrl = getBaseURL(tab.url);
    var prevBaseUrl = getBaseURL(urls[prevActiveTabId] || '');
    if(currentBaseUrl != prevBaseUrl) {
      if(getSession() && currentBaseUrl.substring(0, 9) !== "chrome://") query(currentBaseUrl);
      if(recordFlag) {
        console.log("changed active tab: to " + currentBaseUrl + " from " + getBaseURL(urls[prevActiveTabId]));
        // start logging the new active tab's URL
        start_web_log(getSession(), currentBaseUrl, timestamp);
        if(prevActiveTabId > -1)    // if there was a previous active tab, end the logging for that one
          end_web_log(getSession(), prevBaseUrl, timestamp);
      }
    }
  });
});

// execute function when a tab gets closed
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
	console.log("tab closed: " + urls[tabId]);
});

// function to make POST request to server that adds a new web log into the DB table
function start_web_log(username, url, start_time) {
  if(url.substring(0, 9) === "chrome://") return;

  // Set up an asynchronous AJAX POST request
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://127.0.0.1:8081/web_log/start', true);

  var body = 'username=' + username +
              '&url=' + url +
              '&start_time=' + encodeURIComponent(start_time);
  body = body.replace(/%20/g, '+');

  console.log(body);
  xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

  // Handle request state change events
  xhr.onreadystatechange = function() {
    // If the request completed
    if (xhr.readyState == 4) {
      console.log('start_web_log POST request sent');
    }
  };
  xhr.send(body);
}

// function to make POST request to server that terminates a log
function end_web_log(username, url, end_time) {
  if(url.substring(0, 9) === "chrome://") return;

  // Set up an asynchronous AJAX POST request
  var xhr = new XMLHttpRequest();
  xhr.open('PUT', 'http://127.0.0.1:8081/web_log/end', true);

  var body = 'username=' + username +
              '&url=' + url +
              '&end_time=' + encodeURIComponent(end_time);
  body = body.replace(/%20/g, '+');

  //console.log(body);
  xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

  // Handle request state change events
  xhr.onreadystatechange = function() {
    // If the request completed
    if (xhr.readyState == 4) {
      console.log('end_web_log POST request sent');
    }
  };
  xhr.send(body);
}

function set_web_log_distracting(distracting) {
  if(!recordFlag) return;

  var xhr = new XMLHttpRequest();
  var data = { username: getSession(), data: { distracting: distracting } };
  xhr.open('PUT', 'http://127.0.0.1:8081/web_log/distracting', true);
  xhr.setRequestHeader('Content-type', 'application/json');
  xhr.send(JSON.stringify(data));
}

function startSession() {
    console.log('starting session');
    initTree();
    getCurrentTabBaseUrl(function(url) {
      if(url.substring(0, 9) !== "chrome://") query(url);
    });
}

function endSession() {
    // end the recording of the acive tab is user is currently recording
    if(recordFlag) {
        //var currDate = new Date();
        var timestamp = Date.now();
        end_web_log(getSession(), getBaseURL(urls[currActiveTabId]), timestamp);
    }

    // reset all global variables
    currActiveTabId = -1;
    recordFlag = false;
    urls = [];

    window.sessionStorage.removeItem('token');
    console.log('session ended');
}

function getSession() {
  console.log('session token requested');
  return localStorage.getItem('name');
}

function toggleRecord() {
    // end the recording of the acive tab is user is currently recording
    if(recordFlag) {
        //var currDate = new Date();
        var timestamp = Date.now();
        end_web_log(getSession(), getBaseURL(urls[currActiveTabId]), timestamp);
    } else {
        var timestamp = Date.now();
        getCurrentTabBaseUrl(function(baseURL) {
          console.log("current active tab = " + currActiveTabId);
            start_web_log(getSession(), baseURL, timestamp);
        });
    }

    recordFlag = !recordFlag;
}

function getRecordFlag() { return recordFlag; }

function getBaseURL(url) {
    var pathArray = url.split( '/' );
    var protocol = pathArray[0];
    var host = pathArray[2];
    return protocol + '//' + host + '/';
}
