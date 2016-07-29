var decisionTree, randomForest, test, decisionTreePrediction, randomForestPrediction, testId;
var data = undefined;
var upcomingTaskCategories = undefined;

var secret = "r3jtGOeST4zPObzu3eXj";
var access_key = "NUoucRoXtS1LfpxZkUBZ";

function initTree() {
  console.log('creating tree');
  // Configuration
  if(data === undefined) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        data = JSON.parse(xmlHttp.responseText);
        configTree();
      }
    }
    xmlHttp.open("GET", 'http://127.0.0.1:8081/training_data?username=' + localStorage.getItem('name'), true); // true for asynchronous
    xmlHttp.send(null);
  }
  else configTree();
}

function classify(url, callback) {
  // check our cache
  var cache = JSON.parse(localStorage.getItem('classifyCache')) || {};
  if(cache[url]) {
    console.log('returning labels from cache');
    test.urltopics = cache[url];
    callback();
  }
  else {  // consult the database
    console.log('reading labels from database');
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        console.log('database returned ' + xmlHttp.responseText);
        var lookup = JSON.parse(xmlHttp.responseText);
        if(lookup.length > 0) {
          test.urltopics = lookup[0].categories;
          cache[url] = lookup[0].categories; // update our cache
          localStorage.setItem('classifyCache', JSON.stringify(cache));
          callback();
        }
        else {  // if the database doesn't have it, use the api call
          console.log('making api call for url ' + url);
          var encodedUrl = window.btoa(url);
          var request = 'categories/v2/' + encodedUrl + '?key=' + access_key;
          var hash = md5(secret + ':' + request);
          var apiQuery = 'https://api.webshrinker.com/' + request + '&hash=' + hash;

          test.urltopics = ['uncategorized'];
          callback();

          /* TEMPORARY, just to save api calls
          var apiRequest = new XMLHttpRequest();
          apiRequest.onreadystatechange = function() {
            if (apiRequest.readyState == 4 && apiRequest.status == 200) {
              console.log('api response = ' + apiRequest.responseText);
              var response = JSON.parse(apiRequest.responseText);
              //console.log(response.data[0].categories);
              test.urltopics = response.data[0].categories;
              cache[url] = response.data[0].categories;
              localStorage.setItem('classifyCache', JSON.stringify(cache));

              var dbUpdate = new XMLHttpRequest();
              dbUpdate.open("POST", 'http://127.0.0.1:8081/classify_url', true); // true for asynchronous
              dbUpdate.setRequestHeader('Content-Type', 'application/json');
              dbUpdate.send(JSON.stringify({ data: { url: url, categories: test.urltopics } }));
              callback();
            }
          }
          apiRequest.open("GET", apiQuery, true); // true for asynchronous
          apiRequest.send(null); */
        }
      }
    }
    xmlHttp.open("GET", 'http://127.0.0.1:8081/classify_url?url=' + url, true); // true for asynchronous
    xmlHttp.send(null);
  }
}

function configTree() {
  var config = {
      trainingSet: data,
      categoryAttr: 'distracting',
      ignoredAttributes: ['url']
  };

  // Building Decision Tree
  decisionTree = new dt.DecisionTree(config);

  // Building Random Forest
  var numberOfTrees = 3;
  randomForest = new dt.RandomForest(config, numberOfTrees);
}

function query(url) {
  // get upcoming task categories
  var upcomingCategoriesRequestUrl = 'http://127.0.0.1:8081/tasks/categories/upcoming';
  upcomingCategoriesRequestUrl += '?username=' + getSession() + '&due=' + Date.now();

  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
      upcomingTaskCategories = JSON.parse(xmlHttp.responseText);
      // Testing Decision Tree and Random Forest
      test = { categories: [] };
      for(var i = 0; i < upcomingTaskCategories.length; i++)
        test.categories.push(upcomingTaskCategories[i]["category"]);
      //console.log('predicting ' + JSON.stringify(test));
      classify(url, function() {
        decisionTreePrediction = decisionTree.predict(test);
        randomForestPrediction = randomForest.predict(test);
        test.distracting = decisionTreePrediction == "true";
        testId = getTestId();
        if(recordFlag) set_web_log_distracting(test.distracting);

        updateDisplay();
      });
    }
  }
  xmlHttp.open("GET", upcomingCategoriesRequestUrl , true); // true for asynchronous
  xmlHttp.send(null);
}

function getTestId() {
  for(var x = 0; x < data.length; x++)
    if(isEquivalent(test, data[x])) return x;
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
    //console.log('a['+propName+'] = ' + JSON.stringify(a[propName]) + ', b['+propName+'] = ' + JSON.stringify(b[propName]));
    if(Array.isArray(a[propName]) && Array.isArray(b[propName])) {
      if(a[propName].sort().toString() !== b[propName].sort().toString()) return false;
    }
    else if(a[propName] !== b[propName] && propName !== 'distracting') return false;
  }

  return true;
}

function modifyTestCase(value) {
  if(test.distracting === value) return;
  console.log('modifying test case from ' + test.distracting + ' to ' + value);
  console.log('test case index = ' + testId);

  var postData = { username: getSession() };
  // if our current test case doesn't already exist in our training data
  if(testId === -1) {
    test.distracting = value;
    data.push(test);
    testId = data.length-1;
    console.log(data);

    postData.data = data[testId];
    var xmlHttp = new XMLHttpRequest();
    // no need to set the onreadystatechange function of our request, since we don't care to wait for a response
    /*xmlHttp.onreadystatechange = function() {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        data = JSON.parse(xmlHttp.responseText);
        configTree();
      }
    }*/
    xmlHttp.open("POST", 'http://127.0.0.1:8081/training_data', true); // true for asynchronous
    xmlHttp.setRequestHeader('Content-Type', 'application/json');
    xmlHttp.send(JSON.stringify(postData));
  }
  else {
    data[testId].distracting = value;
    console.log(data);

    postData.data = data[testId];
    var xmlHttp = new XMLHttpRequest();
    /*xmlHttp.onreadystatechange = function() {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        data = JSON.parse(xmlHttp.responseText);
        configTree();
      }
    }*/
    xmlHttp.open("PUT", 'http://127.0.0.1:8081/training_data', true); // true for asynchronous
    xmlHttp.setRequestHeader('Content-Type', 'application/json');
    xmlHttp.send(JSON.stringify(postData));
  }

  initTree();
  query(getBaseURL(urls[currActiveTabId]));
}

function updateDisplay() {
  console.log('updating display');
  var views = chrome.extension.getViews();
  var testingItem, home, randForestPrediction, displayTree;
  for(var i = 0; i < views.length; i++) {
    if(views[i].location.pathname === "/popup.html") {
      testingItem = views[i].getPopupElement('testingItem');
      home = views[i].getPopupElement('home');
      randForestPrediction = views[i].getPopupElement('randomForestPrediction');
      displayTree = views[i].getPopupElement('displayTree');

      testingItem.innerHTML = JSON.stringify(test, null, 0);
      randForestPrediction.innerHTML = JSON.stringify(randomForestPrediction, null, 0);
      displayTree.innerHTML = treeToHtml(decisionTree.root);

      var scope = views[i].angular.element(home).scope();
      scope.$apply(function() {
        scope.decision = JSON.stringify(decisionTreePrediction, null, 0) == "\"true\"";
      })
    }
  }
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
