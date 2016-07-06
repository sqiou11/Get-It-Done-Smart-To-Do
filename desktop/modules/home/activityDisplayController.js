'use strict';

angular.module('Home')

.controller('WebActivityDisplayController', ['$http', '$rootScope', 'ActivityDisplay', function($http, $rootScope, ActivityDisplay) {
  var self = this;
  this.display = new ActivityDisplay($('#web-graph-container'), 'day');

  this.updateGraph = function(displayParam) {
    this.display.setRange(displayParam);
  }

  $('#web-datePicker').datetimepicker({
    format: 'MM/DD/YYYY',
    allowInputToggle: true
  });
  $('#web-datePicker').on('dp.change', function(e) {
    console.log(e.date);
    self.display.setChosenTime(e.date);
    self.display.setRange(self.display.getDisplayParam());
  });
}])

.controller('AppActivityDisplayController', ['$http', '$rootScope', 'ActivityDisplay', function($http, $rootScope, ActivityDisplay) {
  var self = this;
  this.display = new ActivityDisplay($('#app-graph-container'), 'day');

  this.updateGraph = function(displayParam) {
    this.display.setRange(displayParam);
  }

  $('#app-datePicker').datetimepicker({
    format: 'MM/DD/YYYY',
    allowInputToggle: true
  });
  $('#app-datePicker').on('dp.change', function(e) {
    console.log(e.date);
    self.display.setChosenTime(e.date);
    self.display.setRange(self.display.getDisplayParam());
  });
}])
