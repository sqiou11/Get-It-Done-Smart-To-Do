'use strict';

angular.module('Home')

.controller('WebMonitorController', ['$scope', '$rootScope', '$http', function($scope, $rootScope, $http) {
  var webMonController = this;
  this.preferences = [];
  this.addNewFlag = false;
  this.newPreference = { url: '' };

  this.getWebPreferences = function() {
    $http.get('http://127.0.0.1:8081/web_preferences', {
      params: { username: $rootScope.globals.currentUser.username }
    })
    .success(function(response) {
      if(response !== "error") {
        console.log(response);
        webMonController.preferences = response;
      } else {
        console.log(response);
      }
    });
  };

  this.addWebPreference = function() {
    //this.preferences.push();
    this.addNewFlag = false;

    $http.post('http://127.0.0.1:8081/web_preferences', {
      username: $rootScope.globals.currentUser.username,
      data: webMonController.newPreference
    })
    .success(function(response) {
      if(response !== "error") {

      } else {

      }
      webMonController.getWebPreferences();
    });
  };

  this.deleteWebPreference = function() {
    $http.delete('http://127.0.0.1:8081/tasks', {
      params: {
        username: $rootScope.globals.currentUser.username,
        id: deleteId
      }
    })
    .success(function(response) {
      if(response !== "error") {

      } else {

      }
      webMonController.getWebPreferences();
    });
  };

  this.initForm = function() {
    this.addNewFlag = true;
    this.newPreference = '';
  };

  this.getWebPreferences();

}])
