'use strict';

angular.module('Home')

.controller('TaskController', ['$http', '$rootScope', '$location', function($http, $rootScope, $location) {
  var taskController = this;
  this.tasks = [];
  this.createTaskFlag = false;
  this.newTask = {};
  this.categories = [];

  this.getCategories = function() {
    $http.get('http://127.0.0.1:8081/get_categories', {
      params: { username: $rootScope.globals.currentUser.username }
    })
    .success(function(response) {
      if(response !== "error") {
        taskController.categories = response;
      } else {
        console.log(response);
      }
    });
  };

  this.getTasks = function() {
    console.log("getting tasks");
    $http.get('http://127.0.0.1:8081/get_tasks', {
      params: { username: $rootScope.globals.currentUser.username }
    })
    .success(function(response) {
      if(response !== "error") {
        console.log(response);
        taskController.tasks = response;
      } else {
        console.log(response);
      }
    });
  };

  this.addTask = function() {
    taskController.newTask.id = taskController.tasks.length;
    taskController.newTask.due = (new Date(taskController.newTask.due)).getTime();
    console.log(taskController.newTask);

    $http.post('http://127.0.0.1:8081/new_task', {
      username: $rootScope.globals.currentUser.username,
      data: taskController.newTask
    })
    .success(function(response) {
      if(response !== "error") {

      } else {

      }
      taskController.createTaskFlag = false;
      taskController.getTasks();
    });
  };

  this.initForm = function() {
    this.newTask.desc = '';
    this.newTask.category = '';
    this.newTask.due = '';
    this.newTask.reminder = '';
    $('#dueDatePicker').data("DateTimePicker").clear();
  };

  $('#dueDatePicker').datetimepicker({
    sideBySide: true,
    allowInputToggle: true
  });
  $('#dueDatePicker').on('dp.change', function(e) {
    taskController.newTask.due = e.date._d;
  });

  this.getTasks();
}]);
