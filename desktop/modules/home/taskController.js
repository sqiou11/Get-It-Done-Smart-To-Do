'use strict';

angular.module('Home')

.controller('TaskController', ['$http', '$rootScope', '$scope', function($http, $rootScope, $scope) {
  var taskController = this;
  this.tasks = [];
  this.sortedTasks = {};
  this.numTasks = 0;
  this.numPrevious = 0;
  this.numUpcoming = 0;
  this.createTaskFlag = false;
  this.newTask = {};
  this.categories = [];
  this.viewMode = 'dueDate';
  this.mousedOverTask = {};
  this.createTaskFlag = {};
  this.archiveTasks = true;

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
    else
      this.createTaskFlag[key] = false;
  };

  this.isCreatingTask = function(key) {
    if(this.createTaskFlag[key] === undefined)
      this.createTaskFlag[key] = false;

    return this.createTaskFlag[key] === true;
  };

  this.toggleFinish = function(taskId) {
    var updateId = 0;
    for(var i = 0; i < this.numTasks; i++) {
      if(this.tasks[i].id === taskId) {
        this.tasks[i].done = moment();
        updateId = i;
      }
    }

    $http.put('http://127.0.0.1:8081/tasks', {
      username: $rootScope.globals.currentUser.username,
      data: taskController.tasks[updateId]
    })
    .success(function(response) {
      taskController.getTasks();
    });
  };

  this.getCategories = function() {
    $http.get('http://127.0.0.1:8081/categories', {
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
    $http.get('http://127.0.0.1:8081/tasks', {
      params: { username: $rootScope.globals.currentUser.username }
    })
    .success(function(response) {
      if(response !== "error") {
        console.log(response);
        taskController.tasks = response;
        taskController.numTasks = response.length;
        taskController.sort(response);
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
    $http.post('http://127.0.0.1:8081/tasks', {
      username: $rootScope.globals.currentUser.username,
      data: taskController.newTask
    })
    .success(function(response) {
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

    $http.delete('http://127.0.0.1:8081/tasks', {
      params: {
        username: $rootScope.globals.currentUser.username,
        id: deleteId
      }
    })
    .success(function(response) {
      taskController.getTasks();
    });
  };

  this.initForm = function(key) {
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

    this.newTask.desc = '';
    this.newTask.reminder = '';

    if(this.viewMode === 'dueDate') {
      this.newTask.category = '';
      this.newTask.due = this.sortedTasks.upcoming[key].date;
      $(dueDateElement).data("DateTimePicker").defaultDate(this.sortedTasks.upcoming[key].date);
    } else {
      this.newTask.category = key;
      this.newTask.due = '';
      $(dueDateElement).data("DateTimePicker").defaultDate(moment());
    }
    this.getCategories();
  };

  this.sort = function(data) {
    if(this.viewMode === 'dueDate') {
      this.sortedTasks = {
        past: {
          overdue: [],
          completed: []
        },
        upcoming: {
          today: {
            date: moment(),
            tasks: []
          },
          tomorrow: {
            date: moment().add(1, 'days'),
            tasks: []
          },
          week: {
            date: moment().add(2, 'days'),
            tasks: []
          },
          later: {
            date: moment().add(8, 'days'),
            tasks: []
          }
        }
      };
      this.filledLists = 0;
      this.numPrevious = 0;
      this.numUpcoming = 0;

      var today = moment();
      var tomorrow = moment().add(1, 'days');
      var weekFromToday = moment().add(7, 'days');
      for(var i = 0; i < data.length; i++) {
        var dueDate = moment(data[i].due);

        if(dueDate.isBefore(today, 'day')) {
          console.log('past task');
          console.log(data[i]);
          if(data[i].done)
            this.sortedTasks.past.completed.push(data[i]);
          else
            this.sortedTasks.past.overdue.push(data[i]);
          this.numPrevious++;
        }
        else if(dueDate.isSame(today, 'day')) {
          console.log('today task');
          console.log(data[i]);
          if(this.sortedTasks.upcoming.today.tasks.length === 0)
            this.filledLists++;
          this.sortedTasks.upcoming.today.tasks.push(data[i]);
          this.numUpcoming++;
        }
        else if(dueDate.isSame(tomorrow, 'day')) {
          console.log('tomorrow task');
          console.log(data[i]);
          if(this.sortedTasks.upcoming.tomorrow.tasks.length === 0)
            this.filledLists++;
          this.sortedTasks.upcoming.tomorrow.tasks.push(data[i]);
          this.numUpcoming++;
        }
        else if(dueDate.isSame(today, 'week')) {
          if(this.sortedTasks.upcoming.week.date === undefined)
            this.sortedTasks.upcoming.week.date = dueDate;

          if(this.sortedTasks.upcoming.week.tasks.length === 0)
            this.filledLists++;
          this.sortedTasks.upcoming.week.tasks.push(data[i]);
          this.numUpcoming++;
        }
        else {
          if(this.sortedTasks.upcoming.later.date === undefined)
            this.sortedTasks.upcoming.later.date = dueDate;

          if(this.sortedTasks.upcoming.later.tasks.length === 0)
            this.filledLists++;
          this.sortedTasks.upcoming.later.tasks.push(data[i]);
          this.numUpcoming++;
        }
      }
    } else if(this.viewMode === 'category') {
      console.log(this.viewMode);
      this.sortedTasks = {};
      this.filledLists = 0;

      for(var i = 0; i < data.length; i++) {
        //console.log(data[i]);
        if(this.sortedTasks[data[i].category] === undefined) {
          console.log('creating new task list for category ' + data[i].category);
          this.sortedTasks[data[i].category] = { tasks: [] };
        }
        var addDue = moment(data[i].due);
        var flag = false;
        console.log(this.sortedTasks[data[i].category].tasks.length);
        for(var j = 0; j < this.sortedTasks[data[i].category].tasks.length; j++) {
          var currDue = moment(this.sortedTasks[data[i].category].tasks[j].due);
          if(addDue.isBefore(currDue) && j < this.sortedTasks[data[i].category].tasks.length) {
            this.sortedTasks[data[i].category].tasks.splice(j, 0, data[i]);
            flag = true;
            break;
          }
          console.log(this.sortedTasks[data[i].category].tasks);
        }
        if(!flag) {
          this.sortedTasks[data[i].category].tasks.push(data[i]);
        }
      }
    } else {
      console.log('bad viewMode');
    }
  };

  this.getTasks();
}]);
