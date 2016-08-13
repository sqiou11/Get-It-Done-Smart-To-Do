'use strict';

angular.module('app')

.controller('WebMonitorController', ['$scope', 'store', '$http', function($scope, store, $http) {
  var self = this;
  this.preferences = [];
  this.addNewFlag = false;
  this.newPreference = { url: '' };
  this.baseUrl = 'http://ec2-52-36-92-222.us-west-2.compute.amazonaws.com/';

  this.getWebPreferences = function() {
    $http.get(self.baseUrl + 'web_preferences', {
      params: { username: store.get('id') }
    })
    .success(function(response) {
      if(response !== "error") {
        console.log(response);
        self.preferences = response;
      } else {
        console.log(response);
      }
    });
  };

  this.addWebPreference = function() {
    this.addNewFlag = false;
    if(this.newPreference[this.newPreference.length-1] !== '/')
      this.newPreference += '/';

    $http.post(self.baseUrl + 'web_preferences', {
      username: store.get('id'),
      data: self.newPreference
    })
    .success(function(response) {
      self.getWebPreferences();
    });
  };

  this.deleteWebPreference = function() {
    $http.delete(self.baseUrl + 'tasks', {
      params: {
        username: store.get('id'),
        id: deleteId
      }
    })
    .success(function(response) {
      self.getWebPreferences();
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
