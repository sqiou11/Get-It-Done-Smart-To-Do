'use strict';

angular.module('Home')

.controller('CategoryController', ['$http', '$rootScope', function($http, $rootScope) {
  var catController = this;
  this.categories = [];
  this.newCategory = {};
  this.createCatFlag = false;
  this.createCatError = false;
  this.edit = {};

  this.setCreateCat = function(val) {
    this.createCatFlag = val;
    if(!val) {  // if disabling the form for creating a category, clear data and error flag
      this.newCategory = {};
      this.createCatError = false;
    }
  };

  this.isCreatingCat = function() { return this.createCatFlag; };

  this.addCategory = function(newCat) {
    for(var i = 0; i < this.categories.length; i++) {
      if(this.categories[i].name === newCat.name) {
        this.createCatError = true;
        console.log("found duplicate");
        return;
      }
    }
    this.setCreateCat(false);
    newCat.id = this.categories.length;
    this.categories.push(newCat);
  };

  this.editCategory = function(index, editObj) {
    editObj.id = index;
    this.categories[index] = editObj;
    this.edit = {};
  };

  this.getCategories = function() {
    $http.get('http://127.0.0.1:8081/categories', {
      params: { username: $rootScope.globals.currentUser.username }
    })
    .success(function(response) {
      if(response !== "error") {
        catController.categories = response;
      } else {
        console.log(response);
      }
    });
  };

  this.submitCatChanges = function() {
    console.log(this.categories);
    $http.post('http://127.0.0.1:8081/categories', {
        username: $rootScope.globals.currentUser.username,
        data: catController.categories
    })
    .success(function(response) {
      if(response !== "error") {

      } else {

      }
    });
  };

  this.getCategories();
}])
