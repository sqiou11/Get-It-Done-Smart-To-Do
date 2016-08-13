'use strict';

angular.module('app')

.controller('TaskController', ['$http', '$scope', 'store', function($http, $scope, store) {
  var self = this;
  this.tasks = [];
  this.sortedTasks = {};
  this.numTasks = 0;
  this.numPrevious = 0;
  this.numUpcoming = 0;
  this.newTask = {};
  this.categories = [];
  this.viewMode = 'dueDate';
  this.mousedOverTask = {};
  this.createTaskFlag = {};
  this.editTaskFlag = {};
  this.currEditId = -1;
  this.edit = {};
  this.archiveTasks = true;
  this.baseUrl = 'http://ec2-52-36-92-222.us-west-2.compute.amazonaws.com/';

  this.setCreateTask = function(key, value) {
    if(value === true) {
      for(var k in this.createTaskFlag) {
        if(k === key) this.createTaskFlag[k] = true;
        else this.createTaskFlag[k] = false;
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

    $http.put(self.baseUrl + 'tasks', {
      username: store.get('id'),
      data: self.tasks[updateId]
    })
    .success(function(response) {
      self.getTasks();
    });
  };

  this.getCategories = function() {
    $http.get(self.baseUrl + 'categories', {
      params: { username: store.get('id') }
    })
    .success(function(response) {
      if(response !== "error") {
        self.categories = response;
      } else {
        console.log(response);
      }
    });
  };

  this.editTask = function(task, value) {
    this.editTaskFlag[task.id] = value;
    if(this.editTaskFlag[task.id] && task.id !== this.currEditId) {
      this.editTaskFlag[this.currEditId] = false;
      this.currEditId = task.id;
    }
    this.edit.id = task.id;
    this.edit.description = task.description;
    this.edit.due = task.due;
    this.edit.category = task.category;
    this.edit.reminder = task.reminder;
    this.edit.done = task.done;

    var dueDateElement = '#dueDatePicker-' + task.id;
    $(dueDateElement).datetimepicker({
      sideBySide: true,
      allowInputToggle: true,
    });
    $(dueDateElement).on('dp.change', function(e) {
      console.log(e.date.valueOf());
      self.edit.due = e.date.valueOf();
    });
    $(dueDateElement).data("DateTimePicker").defaultDate(moment(task.due));
  };

  this.getTasks = function() {
    console.log("getting tasks");
    $http.get(self.baseUrl + 'tasks', {
      params: { username: store.get('id') }
    })
    .success(function(response) {
      if(response !== "error") {
        console.log(response);
        self.tasks = response;
        self.numTasks = response.length;
        self.sort(response);
        self.mousedOverTask = {};
        for(var i = 0; i < response.length; i++)
          self.mousedOverTask[response[i].id] = false;
        console.log(self.mousedOverTask);
      } else {
        console.log(response);
      }
    });
  };

  this.addTask = function() {
    $http.post(self.baseUrl + 'tasks', {
      username: store.get('id'),
      data: self.newTask
    })
    .success(function(response) {
      self.getTasks();
    });
  };

  this.updateTask = function(task) {
    this.edit.id = task.id;
    $http.put(self.baseUrl + 'tasks', {
      username: store.get('id'),
      data: self.edit
    })
    .success(function(response) {
      self.editTask(task, false);
      self.getTasks();
    });
  };

  this.deleteTask = function(deleteId) {
    $http.delete(self.baseUrl + 'tasks', {
      params: {
        username: store.get('id'),
        id: deleteId
      }
    })
    .success(function(response) {
      self.getTasks();
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
        self.newTask.due = e.date.valueOf();
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
        var dueDate = moment(parseInt(data[i].due));
        console.log(dueDate);

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
  var refreshFunc = function() {
    console.log('updating tasks display');
    self.getTasks();
  }

  setInterval(refreshFunc, 5*60*1000);
}]);
