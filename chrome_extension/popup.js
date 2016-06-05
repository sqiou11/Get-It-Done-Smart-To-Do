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
            /*getCurrentTabBaseUrl(function(url) {
                var date = new Date();
                document.getElementById('status').innerHTML = date.toLocaleString() + ": " + url;
            });*/
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
