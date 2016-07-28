'use strict';

angular.module('Home')

.controller('HomeController', ['$scope', '$rootScope', '$http', function ($scope, $rootScope, $http) {
  var self = this;
  this.recordFlag = false;
  this.categories = [];
  $scope.decision;

  $scope.user = $rootScope.globals.currentUser.username;

  chrome.runtime.getBackgroundPage(function(bgPage) {
    bgPage.updateDisplay();
  });

  this.toggleRecord = function() {
    chrome.runtime.getBackgroundPage(function(bgPage) {
      bgPage.toggleRecord();
      self.recordFlag = bgPage.getRecordFlag();
    });
  }

  this.modifyTestCase = function(value) {
    chrome.runtime.getBackgroundPage(function(bgPage) {
      bgPage.modifyTestCase(value);
    });
  }
}]);

function getPopupElement(id) { return document.getElementById(id) };
