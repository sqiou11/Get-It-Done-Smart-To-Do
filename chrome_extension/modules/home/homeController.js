'use strict';

angular.module('Home')

.controller('HomeController', ['$scope', '$rootScope', '$http', function ($scope, $rootScope, $http) {
  var self = this;
  this.recordFlag = false;

  $scope.user = $rootScope.globals.currentUser.username;

  $http.get('http://127.0.0.1:8081/tasks/categories/upcoming', {
    params: {
      username: $scope.user,
      due: Date.now()
    }
  })
  .success(function(data) {
    console.log(data);
    $scope.categories = data;
  });

  this.toggleRecord = function() {
    chrome.runtime.getBackgroundPage(function(bgPage) {
      bgPage.toggleRecord();
      self.recordFlag = bgPage.getRecordFlag();
    });
  }

  console.log('creating tree');
  var data = [
    {'math': true, 'computer science': true, url: 'www.facebook.com', distracting: true},
    {'math': true, 'computer science': true, url: 'www.stackoverflow.com', distracting: false},
    {'math': true, 'computer science': false, url: 'www.stackoverflow.com', distracting: true},
  ];

  // Configuration
  var config = {
      trainingSet: data,
      categoryAttr: 'distracting',
      ignoredAttributes: []
  };

  // Building Decision Tree
  var decisionTree = new dt.DecisionTree(config);

  // Building Random Forest
  var numberOfTrees = 3;
  var randomForest = new dt.RandomForest(config, numberOfTrees);

  // Testing Decision Tree and Random Forest
  var comic = {'math': true, 'computer science': false, url: 'www.youtube.com'};

  var decisionTreePrediction = decisionTree.predict(comic);
  var randomForestPrediction = randomForest.predict(comic);

  // Displaying predictions
  document.getElementById('testingItem').innerHTML = JSON.stringify(comic, null, 0);
  document.getElementById('decisionTreePrediction').innerHTML = JSON.stringify(decisionTreePrediction, null, 0);
  document.getElementById('randomForestPrediction').innerHTML = JSON.stringify(randomForestPrediction, null, 0);

  // Displaying Decision Tree
  document.getElementById('displayTree').innerHTML = treeToHtml(decisionTree.root);


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
}]);
