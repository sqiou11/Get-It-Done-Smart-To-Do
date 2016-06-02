// array used to keep track of tabId-url mappings, needed to remember url of closed tabs
var urls = [];
var currActiveTabId = -1;

var recordFlag = false;

// execute function when tab gets updated (specifically when url changes)
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if(recordFlag && changeInfo.url != undefined && changeInfo.url.substring(0, 9) != "chrome://" && tabId == currActiveTabId) {
    	console.log("URL change in active tab: " + changeInfo.url);
        var prevURL = urls[tabId];  // grab the original url before we update the array
    	urls[tabId] = changeInfo.url;

        var currDate = new Date();
        var timestamp = currDate.toLocaleString();

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
    	if(recordFlag && tab.url.substring(0, 9) != "chrome://") {
        	urls[activeInfo.tabId] = tab.url;
            var prevActiveTabId = currActiveTabId;  // grab the original active tab id before we update it
            currActiveTabId = activeInfo.tabId;
            console.log("changed active tab: to " + tab.url + " from " + urls[prevActiveTabId]);

            var currDate = new Date();
            var timestamp = currDate.toLocaleString();

            // start logging the new active tab's URL
            start_web_log(getSession(), getBaseURL(tab.url), timestamp);
            if(prevActiveTabId > -1)    // if there was a previous active tab, end the logging for that one
                end_web_log(getSession(), getBaseURL(urls[prevActiveTabId]), timestamp);
    	}
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
        var currDate = new Date();
        var timestamp = currDate.toLocaleString();
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
        var currDate = new Date();
        var timestamp = currDate.toLocaleString();
        end_web_log(getSession(), getBaseURL(urls[currActiveTabId]), timestamp);
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