'use strict';

angular.module('Home')

.controller('CategoryController', ['$http', '$rootScope', function($http, $rootScope) {
  var catController = this;
  this.categories = [];
  this.newCategory = { name: '', monitor: false };
  this.createCatFlag = false;
  this.createCatError = false;
  this.edit = {};

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
    //newCat.id = this.categories.length;
    //this.categories.push(newCat);

    $http.post('http://127.0.0.1:8081/categories', {
      username: $rootScope.globals.currentUser.username,
      data: catController.newCategory
    })
    .success(function(response) {
      catController.setCreateCat(false);
      catController.getCategories();
    });
  };

  this.editCategory = function(index) {
    console.log("editCategory()");
    console.log(this.edit);
    this.edit.id = this.categories[index].id; // grab the table ID of the category that was modified
    //this.categories[index] = editObj;

    $http.put('http://127.0.0.1:8081/categories', {
      username: $rootScope.globals.currentUser.username,
      data: catController.edit
    })
    .success(function(response) {
      this.edit = {};
      this.getCategories();
    });
  };

  this.getCategories = function() {
    console.log("getCategories()");
    $http.get('http://127.0.0.1:8081/categories', {
      params: { username: $rootScope.globals.currentUser.username }
    })
    .success(function(response) {
      if(response !== "error") {
        catController.categories = response;
        console.log(response);
      } else {
        console.log(response);
      }
    });
  };

  this.deleteCategory = function(deleteId) {
    $http.delete('http://127.0.0.1:8081/categories', {
      params: {
        username: $rootScope.globals.currentUser.username,
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
        data: catController.categories
    })
    .success(function(response) {

    });
  };*/

  this.getCategories();
}])