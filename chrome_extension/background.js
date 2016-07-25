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


// execute function when tab gets updated (specifically when url changes)
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  // check to make sure the update is a url change, and this url change is for the active tab
  if(changeInfo.url != undefined && tabId == currActiveTabId) {
  	console.log("URL change in active tab: " + changeInfo.url);
    var prevURL = urls[tabId];  // grab the original url before we update the array
  	urls[tabId] = changeInfo.url;

    //var currDate = new Date();
    var timestamp = Date.now();

    // if the old and new URLs have different bases and we're recording, then log the change
    if(recordFlag && getBaseURL(urls[tabId]) != getBaseURL(prevURL)) {
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

    //var currDate = new Date();
    var timestamp = Date.now();
    if(recordFlag && getBaseURL(tab.url) != getBaseURL(urls[prevActiveTabId])) {
      console.log("changed active tab: to " + getBaseURL(tab.url) + " from " + getBaseURL(urls[prevActiveTabId]));
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
  xhr.open('POST', 'http://127.0.0.1:8081/web_log/end', true);

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
  console.log('session token requested');
  return window.sessionStorage.getItem('token');
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

var decisionTree, randomForest, test, decisionTreePrediction, randomForestPrediction, testId;
var data = [
  {categories: ['math', 'computer science'], url: 'https://www.facebook.com/', distracting: true},
  {categories: ['computer science'], url: 'http://stackoverflow.com/', distracting: false},
  {categories: ['math'], url: 'http://stackoverflow.com/', distracting: true},
  {categories: ['math'], url: 'https://www.khanacademy.org/', distracting: false},
];
function initTree(categories, obj, callback) {
  console.log('creating tree');
  // Configuration
  var config = {
      trainingSet: data,
      categoryAttr: 'distracting',
      ignoredAttributes: []
  };

  // Building Decision Tree
  decisionTree = new dt.DecisionTree(config);

  // Building Random Forest
  var numberOfTrees = 3;
  randomForest = new dt.RandomForest(config, numberOfTrees);

  // Testing Decision Tree and Random Forest
  getCurrentTabBaseUrl(function(url) {
    console.log('getting current url');
    test = { categories: [] };
    for(var i = 0; i < categories.length; i++)
      test.categories.push(categories[i]["category"]);
    test.url = url;
    //console.log('predicting ' + JSON.stringify(test));
    decisionTreePrediction = decisionTree.predict(test);
    randomForestPrediction = randomForest.predict(test);
    test.distracting = decisionTreePrediction == "true";
    testId = getTestId();

    updateDisplay(test, obj, callback);
  });
}

function getTestId() {
  for(var i = 0; i < data.length; i++) {
    if(isEquivalent(test, data[i])) return i;
  }
  return -1;
}

function isEquivalent(a, b) {
  // Create arrays of property names
  var aProps = Object.getOwnPropertyNames(a);
  var bProps = Object.getOwnPropertyNames(b);

  // If number of properties is different,
  // objects are not equivalent
  if (aProps.length != bProps.length) return false;

  for (var i = 0; i < aProps.length; i++) {
    var propName = aProps[i];
    console.log('a['+propName+'] = ' + a[propName] + ', b['+propName+'] = ' + b[propName]);

    // If values of same property are not equal,
    // objects are not equivalent
    if (a[propName] !== b[propName] && propName !== 'distracting') return false;
  }

  return true;
}

function modifyTestCase(value) {
  if(test.distracting === value) return;
  console.log('modifying test case from ' + test.distracting + ' to ' + value);
  console.log('test case index = ' + testId);

  // if our current test case doesn't already exist in our training data
  if(testId === -1) {
    test.distracting = value;
    data.push(test);
    testId = data.length-1;
    console.log(data);
  }
  else {
    data[testId].distracting = value;
    console.log(data);
  }
}

function updateDisplay(test, obj, callback) {
  var testingItem = obj.elements[0];
  var randForestPrediction = obj.elements[1];
  var displayTree = obj.elements[2];
  //var dTreePrediction = obj.decisions;

  testingItem.innerHTML = JSON.stringify(test, null, 0);
  obj.decisions[0] = JSON.stringify(decisionTreePrediction, null, 0);
  randForestPrediction.innerHTML = JSON.stringify(randomForestPrediction, null, 0);
  displayTree.innerHTML = treeToHtml(decisionTree.root);

  console.log('background: dTreePrediction = ' + obj.decisions[0]);
  console.log(obj);
  callback();
}

// Recursive (DFS) function for displaying inner structure of decision tree
function treeToHtml(tree) {
    // only leafs containing category
    if (tree.category) {
        return  ['<ul>',
                    '<li>',
                        '<a href="#">',
                            '<b>', tree.category, '</b>',
                        '</a>',
                    '</li>',
                 '</ul>'].join('');
    }

    return  ['<ul>',
                '<li>',
                    '<a href="#">',
                        '<b>', tree.attribute, ' ', tree.predicateName, ' ', tree.pivot, ' ?</b>',
                    '</a>',
                    '<ul>',
                        '<li>',
                            '<a href="#">yes</a>',
                            treeToHtml(tree.match),
                        '</li>',
                        '<li>',
                            '<a href="#">no</a>',
                            treeToHtml(tree.notMatch),
                        '</li>',
                    '</ul>',
                '</li>',
             '</ul>'].join('');
}
