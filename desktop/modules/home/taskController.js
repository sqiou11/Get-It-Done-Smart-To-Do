'use strict';

angular.module('Home')

.controller('TaskController', ['$http', '$rootScope', '$scope', function($http, $rootScope, $scope) {
  var taskController = this;
  this.tasks = [];
  this.sortedTasks = {};
  this.numTasks = 0;
  this.createTaskFlag = false;
  this.newTask = {};
  this.categories = [];
  this.viewMode = 'dueDate';
  this.mousedOverTask = {};
  this.createTaskFlag = {};

  this.setCreateTask = function(key, value) {
    if(value === true) {
      for(var k in this.createTaskFlag) {
        if(k === key)
          this.createTaskFlag[k] = true;
        else
          this.createTaskFlag[k] = false;
      }
      this.initForm(key);
    }
    else {
      this.createTaskFlag[key] = false;
    }
  };

  this.isCreatingTask = function(key) {
    if(this.createTaskFlag[key] === undefined)
      this.createTaskFlag[key] = false;

    return this.createTaskFlag[key] === true;
  };

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
        taskController.numTasks = response.length;
        taskController.sort(response, 'dueDate');
        taskController.mousedOverTask = {};
        for(var i = 0; i < response.length; i++)
          taskController.mousedOverTask[response[i].id] = false;
        console.log(taskController.mousedOverTask);
      } else {
        console.log(response);
      }
    });
  };

  this.addTask = function() {
    //taskController.newTask.id = taskController.numTasks;
    //taskController.newTask.due = (new Date(taskController.newTask.due)).getTime();
    console.log(taskController.newTask);

    $http.post('http://127.0.0.1:8081/new_task', {
      username: $rootScope.globals.currentUser.username,
      data: taskController.newTask
    })
    .success(function(response) {
      if(response !== "error") {

      } else {

      }
      taskController.getTasks();
    });
  };

  this.deleteTask = function(id) {
    var deleteId = 0;
    for(var i = 0; i < taskController.numTasks; i++) {
      if(taskController.tasks[i].id == id) {
        deleteId = taskController.tasks[i].id;
        break;
      }
    }

    $http.delete('http://127.0.0.1:8081/delete_task', {
      params: {
        username: $rootScope.globals.currentUser.username,
        id: deleteId
      }
    })
    .success(function(response) {
      if(response !== "error") {

      } else {

      }
      taskController.getTasks();
    });
  };

  this.initForm = function(key) {
    this.newTask.desc = '';
    this.newTask.category = '';
    this.newTask.due = '';
    this.newTask.reminder = '';
    this.getCategories();

    var dueDateElement = '#dueDatePicker-' + key;
    if($(dueDateElement).data("DateTimePicker") !== undefined) {
      console.log($(dueDateElement));
      $(dueDateElement).data("DateTimePicker").clear();
    }
    else {
      $(dueDateElement).datetimepicker({
        sideBySide: true,
        allowInputToggle: true
      });
      $(dueDateElement).on('dp.change', function(e) {
        taskController.newTask.due = e.date._d;
      });
    }
  };

  this.sort = function(data, sort_param='dueDate') {
    this.sortedTasks = {
      //overdue: [],
      today: [],
      tomorrow: [],
      week: [],
      later: []
    };
    var today = moment();
    var tomorrow = moment().add(1, 'days');
    var weekFromToday = moment().add(7, 'days');
    console.log(today);
    for(var i = 0; i < data.length; i++) {
      var dueDate = moment(data[i].due);
      //console.log(dueDate.isSame(today, 'day'));
      //if(dueDate.isBefore(today, 'day')) this.sortedTasks.overdue.push(data[i]);
      if(dueDate.isSame(today, 'day')) this.sortedTasks.today.push(data[i]);
      else if(dueDate.isSame(tomorrow, 'day')) this.sortedTasks.tomorrow.push(data[i]);
      else if(dueDate.isSame(today, 'week')) this.sortedTasks.week.push(data[i]);
      else this.sortedTasks.later.push(data[i]);
    }
  };

  $scope.$on('getTasks', function(e) {
    console.log('getTasks broadcast');
    taskController.getTasks();
  });

  this.getTasks();
}]);
