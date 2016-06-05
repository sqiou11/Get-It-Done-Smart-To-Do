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
        // chrome.tabs.query invokes the callback with a list of tabs that match the
        // query. When the popup is opened, there is certainly a window and at least
        // one tab, so we can safely assume that |tabs| is a non-empty array.
        // A window can only have one active tab at a time, so the array consists of
        // exactly one tab.
        var tab = tabs[0];
        currActiveTabId = tab.id;  // set the global active tab ID tracker

        // A tab is a plain object that provides information about the tab.
        // See https://developer.chrome.com/extensions/tabs#type-Tab
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

    // Most methods of the Chrome extension APIs are asynchronous. This means that
    // you CANNOT do something like this:
    //
    // var url;
    // chrome.tabs.query(queryInfo, function(tabs) {
    //   url = tabs[0].url;
    // });
    // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}


// execute function when tab gets updated (specifically when url changes)
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if(recordFlag && changeInfo.url != undefined && changeInfo.url.substring(0, 9) != "chrome://" && tabId == currActiveTabId) {
    	console.log("URL change in active tab: " + changeInfo.url);
      var prevURL = urls[tabId];  // grab the original url before we update the array
    	urls[tabId] = changeInfo.url;

      //var currDate = new Date();
      var timestamp = Date.now();

      // if the old and new URLs have different bases, then log the change
      if(getBaseURL(urls[tabId]) != getBaseURL(prevURL)) {
        start_web_log(getSession(), getBaseURL(urls[tabId]), timestamp);
        end_web_log(getSession(), getBaseURL(prevURL), timestamp);
      }
    }
});

// execute function when a tab becomes activated
chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function(tab) {
        	urls[activeInfo.tabId] = tab.url;
          var prevActiveTabId = currActiveTabId;  // grab the original active tab id before we update it
          currActiveTabId = activeInfo.tabId;
          console.log("changed active tab: to " + tab.url + " from " + urls[prevActiveTabId]);

          //var currDate = new Date();
          var timestamp = Date.now();
          if(recordFlag && tab.url.substring(0, 9) != "chrome://") {
            // start logging the new active tab's URL
            start_web_log(getSession(), getBaseURL(tab.url), timestamp);
          }
          if(prevActiveTabId > -1)    // if there was a previous active tab, end the logging for that one
              end_web_log(getSession(), getBaseURL(urls[prevActiveTabId]), timestamp);
    });
});

// execute function when a tab gets closed
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
	console.log("tab closed: " + urls[tabId]);
});

// function to make POST request to server that adds a new web log into the DB table
function start_web_log(username, url, start_time) {
    // Set up an asynchronous AJAX POST request
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://127.0.0.1:8081/start_web_log', true);

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
    // Set up an asynchronous AJAX POST request
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://127.0.0.1:8081/end_web_log', true);

    var body = 'username=' + username +
                '&url=' + url +
                '&end_time=' + encodeURIComponent(end_time);
    body = body.replace(/%20/g, '+');

    console.log(body);
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

function startSession(token) {
    window.sessionStorage.setItem('token', token);
    console.log('session created with token = ' + token);
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
    return window.sessionStorage.getItem('token');
    console.log('session token requested');
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

function getRecordFlag() {
    return recordFlag;
}

function getBaseURL(url) {
    var pathArray = url.split( '/' );
    var protocol = pathArray[0];
    var host = pathArray[2];
    return protocol + '//' + host + '/';
}
