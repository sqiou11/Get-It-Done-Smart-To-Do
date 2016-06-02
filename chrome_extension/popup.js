// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

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

function loginFunction() {
    // Cancel the form submit
    event.preventDefault();

    var username = encodeURIComponent(document.getElementById('usernameField').value);
    var password = encodeURIComponent(document.getElementById('passwordField').value);
    var params = 'username=' + username + '&password=' + password;

    // Set up an asynchronous AJAX POST request
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://127.0.0.1:8081/chrome_ext_login', true);

    // Replace any instances of the URLEncoded space char with +
    params = params.replace(/%20/g, '+');

    // Set correct header for form data 
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    // Handle request state change events
    xhr.onreadystatechange = function() { 
        // If the request completed
        if (xhr.readyState == 4) {
            if(xhr.responseText == 'login successful') {
                chrome.runtime.getBackgroundPage(function(bgPage) {
                    bgPage.startSession(username);
                    renderDisplay();
                });
            }
            // document.getElementById('status').innerHTML = xhr.responseText;
        }
    };

    // Send the request and set status
    xhr.send(params);
}

function logoutFunction() {
    chrome.runtime.getBackgroundPage(function(bgPage) {
        bgPage.endSession();
        renderDisplay();
    });
}

function recordFunction() {
    chrome.runtime.getBackgroundPage(function(bgPage) {
        bgPage.toggleRecord();
        renderDisplay();
    });
}

function renderDisplay() {
    chrome.runtime.getBackgroundPage(function(bgPage) {
        if(bgPage.getSession() == undefined) {
            document.getElementById('login').style.display = "block";
            document.getElementById('body').innerHTML = '';
            document.getElementById('status').innerHTML = '';
            document.getElementById('logged_in').style.display = "none";
        }
        else {
            document.getElementById('login').style.display = "none";
            document.getElementById('body').innerHTML = "<h2>Hello " + bgPage.getSession() + "</h2>";
            getCurrentTabBaseUrl(function(url) {
                var date = new Date();
                document.getElementById('status').innerHTML = date.toLocaleString() + ": " + url;
            });
            document.getElementById('logged_in').style.display = "block";
        }

        if(bgPage.getRecordFlag()) {
            document.getElementById('record').className = "btn btn-danger";
            document.getElementById('record').innerHTML = "Recording"
        }
        else {
            document.getElementById('record').className = "btn btn-primary"
            document.getElementById('record').innerHTML = "Record"
        }
    })
}


// When the popup HTML has loaded
window.addEventListener('load', function(evt) {
    renderDisplay();
    document.getElementById('login').addEventListener('submit', loginFunction);
    document.getElementById('logout').addEventListener('click', logoutFunction);
    document.getElementById('record').addEventListener('click', recordFunction);
});
