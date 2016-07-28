'use strict';

angular.module('Home')

.controller('HomeController', ['$scope', '$rootScope', '$http', function ($scope, $rootScope, $http) {
  var self = this;
  this.recordFlag = false;
  this.categories = [];
  this.decision;

  $scope.user = $rootScope.globals.currentUser.username;


  chrome.runtime.getBackgroundPage(function(bgPage) {
    var obj = { elements: [document.getElementById('testingItem'),
                    document.getElementById('randomForestPrediction'),
                    document.getElementById('displayTree')],
                decisions: []
              };
    bgPage.updateDisplay(obj, function() {
      // changes made in this callback aren't registered by angularjs
      // so we need to explicitly call the $scope.$apply() function
      $scope.$apply(function() {
        self.decision = obj.decisions[0] === "\"true\"";
      });
    });
  });

  this.toggleRecord = function() {
    chrome.runtime.getBackgroundPage(function(bgPage) {
      bgPage.toggleRecord();
      self.recordFlag = bgPage.getRecordFlag();
    });
  }

  this.modifyTestCase = function(value) {
    chrome.runtime.getBackgroundPage(function(bgPage) {
      var obj = { elements: [document.getElementById('testingItem'),
                      document.getElementById('randomForestPrediction'),
                      document.getElementById('displayTree')],
                  decisions: []
                };
      bgPage.modifyTestCase(value, function() {
        bgPage.updateDisplay(obj, function() {
          // changes made in this callback aren't registered by angularjs
          // so we need to explicitly call the $scope.$apply() function
          $scope.$apply(function() {
            self.decision = obj.decisions[0] === "\"true\"";
          });
        });
      });
    });
  }
}]);
