'use strict';

angular.module('app')

// filter used to convert duration in milliseconds to hour-min-seconds
.filter('durationFormat', function() {
  return function(x) {
    var durationTxt = '';
    var d = moment.duration(x, 'milliseconds');

    if(d.hours()) {
      durationTxt += d.hours();
      if(d.hours() > 1) durationTxt += ' hours ';
      else durationTxt += ' hour ';
    }
    if(d.minutes()) {
       durationTxt += d.minutes();
       if(d.minutes() > 1) durationTxt += ' minutes ';
       else durationTxt += ' minute ';
    }
    if(d.seconds()) {
      durationTxt += d.seconds();
      if(d.seconds() > 1) durationTxt += ' seconds';
      else durationTxt += ' second';
    }
    return durationTxt;
  };
})

.controller('WebActivityHourDisplayController', ['$http', '$rootScope', 'ActivityDisplay', function($http, $rootScope, ActivityDisplay) {
  var self = this;
  this.display = new ActivityDisplay($('#web-graph-container'), 'hour', 'web_log');

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

.controller('WebActivityDisplayController', ['$http', '$rootScope', 'ActivityDisplay', function($http, $rootScope, ActivityDisplay) {
  var self = this;
  this.display = new ActivityDisplay($('#web-graph-container'), 'day', 'web_log');

  this.updateGraph = function(displayParam) {
    this.display.setRange(displayParam);
  }

  var refreshFunc = function() {
    console.log('updating web display');
    self.updateGraph(self.display.getDisplayParam());
  }

  setInterval(refreshFunc, 5*60*1000);

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
  this.display = new ActivityDisplay($('#app-graph-container'), 'day', 'app_log');

  this.updateGraph = function(displayParam) {
    this.display.setRange(displayParam);
  }

  var refreshFunc = function() {
    console.log('updating web display');
    self.updateGraph(self.display.getDisplayParam());
  }

  setInterval(refreshFunc, 5*60*1000);

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
