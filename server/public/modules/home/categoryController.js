'use strict';

angular.module('app')

.controller('CategoryController', ['$http', 'store', function($http, store) {
  var self = this;
  this.categories = [];
  this.newCategory = { name: '', monitor: false };
  this.createCatFlag = false;
  this.createCatError = false;
  this.edit = {};
  this.requestUrl = 'http://ec2-52-36-92-222.us-west-2.compute.amazonaws.com/categories';

  this.setCreateCat = function(val) {
    this.createCatFlag = val;
    if(!val) {  // if disabling the form for creating a category, clear data and error flag
      this.newCategory.name = '';
      this.newCategory.monitor = false;
      this.createCatError = false;
    }
  };

  this.isCreatingCat = function() { return this.createCatFlag; };

  this.addCategory = function() {
    console.log("addCategory()");
    console.log(this.newCategory);
    for(var i = 0; i < this.categories.length; i++) {
      if(this.categories[i].name === this.newCategory.name) {
        this.createCatError = true;
        console.log("found duplicate");
        return;
      }
    }

    $http.post(self.requestUrl, {
      username: store.get('id'),
      data: self.newCategory
    })
    .success(function(response) {
      self.setCreateCat(false);
      self.getCategories();
    });
  };

  this.editCategory = function(index) {
    console.log("editCategory()");
    console.log(this.edit);
    this.edit.id = this.categories[index].id; // grab the table ID of the category that was modified

    $http.put(self.requestUrl, {
      username: store.get('id'),
      data: self.edit
    })
    .success(function(response) {
      self.edit = {};
      self.getCategories();
    });
  };

  this.getCategories = function() {
    console.log("getCategories()");
    $http.get(self.requestUrl, {
      params: { username: store.get('id') }
    })
    .success(function(response) {
      if(response !== "error") {
        self.categories = response;
        console.log(response);
      } else {
        console.log(response);
      }
    });
  };

  this.deleteCategory = function(deleteId) {
    $http.delete(self.requestUrl, {
      params: {
        username: store.get('id'),
        id: deleteId
      }
    })
    .success(function(response) {
      if(response !== "error") {

      } else {
        console.log(response);
      }
      this.getCategories();
    });
  }

  /*this.submitCatChanges = function() {
    console.log(this.categories);
    $http.post('http://127.0.0.1:8081/categories', {
        username: $rootScope.globals.currentUser.username,
        data: self.categories
    })
    .success(function(response) {

    });
  };*/

  this.getCategories();
}])
