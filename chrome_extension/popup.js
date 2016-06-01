// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
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

        callback(url);
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

    // The URL to POST our data to
    var loginUrl = 'http://127.0.0.1:8081/chrome_ext_login?';

    var username = encodeURIComponent(document.getElementById('usernameField').value);
    var password = encodeURIComponent(document.getElementById('passwordField').value);
    var params = 'username=' + username + '&password=' + password;

    // Set up an asynchronous AJAX POST request
    var xhr = new XMLHttpRequest();
    xhr.open('GET', loginUrl + params, true);

    // Replace any instances of the URLEncoded space char with +
    // params = params.replace(/%20/g, '+');

    // Set correct header for form data 
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    // Handle request state change events
    xhr.onreadystatechange = function() { 
        // If the request completed
        if (xhr.readyState == 4) {
            if(xhr.responseText == 'login successful') {
              window.localStorage.setItem('token', username);
              // document.getElementById('status').innerHTML = xhr.responseText;
              renderDisplay();
            }
        }
    };

    // Send the request and set status
    xhr.send();
}

function logoutFunction() {
    localStorage.removeItem('token');
    renderDisplay();
}

function renderDisplay() {
    if(window.localStorage.getItem('token') == undefined) {
        document.getElementById('login').style.display = "block";
        document.getElementById('body').innerHTML = '';
        document.getElementById('status').innerHTML = '';
        document.getElementById('logout').style.display = "none";
    }
    else {
        document.getElementById('login').style.display = "none";
        document.getElementById('body').innerHTML = "<h2>Hello " + window.localStorage.getItem('token') + "</h2>";
        getCurrentTabUrl(function(url) {
            var date = new Date();
            document.getElementById('status').innerHTML = date.toLocaleString() + ": " + url;
        })
        document.getElementById('logout').style.display = "block";
    }
}

// When the popup HTML has loaded
window.addEventListener('load', function(evt) {
    document.getElementById('login').addEventListener('submit', loginFunction);
    document.getElementById('logout').addEventListener('click', logoutFunction);
    renderDisplay();
});
