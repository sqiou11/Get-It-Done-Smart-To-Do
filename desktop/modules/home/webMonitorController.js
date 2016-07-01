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
    this.addNewFlag = false;
    if(this.newPreference[this.newPreference.length-1] !== '/')
      this.newPreference += '/';

    $http.post('http://127.0.0.1:8081/web_preferences', {
      username: $rootScope.globals.currentUser.username,
      data: webMonController.newPreference
    })
    .success(function(response) {
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
      webMonController.getWebPreferences();
    });
  };

  this.initForm = function() {
    this.addNewFlag = true;
    this.newPreference = '';
  };

  this.validateUrl = function() {
    var pattern = RegExp()
  }

  this.getWebPreferences();

}])
