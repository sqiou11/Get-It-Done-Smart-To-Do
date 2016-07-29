'use strict';

angular.module('app')

.controller('HomeController', ['$scope', 'auth', 'store', '$location', function ($scope, auth, store, $location) {
  var self = this;
  this.recordFlag = false;
  this.categories = [];
  $scope.decision;
  $scope.auth = auth;

  $scope.user = store.get('name');

  $scope.logout = function() {
    console.log('logging out');
    store.remove('profile');
    store.remove('token');
    store.remove('name');
    auth.signout();
    $location.url('/login');
  }

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
