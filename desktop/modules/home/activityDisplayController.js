'use strict';

angular.module('Home')

.controller('ActivityDisplayController', ['$http', '$rootScope', 'ActivityDisplayService', function($http, $rootScope, ActivityDisplayService) {
  var adController = this;
  ActivityDisplayService.setGraphElement($('#container'));
  ActivityDisplayService.setRange('day');

  this.updateGraph = function(displayParam) {
    ActivityDisplayService.setRange(displayParam);
  }

  $('#datePicker').datetimepicker({
    format: 'MM/DD/YYYY',
    allowInputToggle: true
  });
  $('#datePicker').on('dp.change', function(e) {
    console.log(e.date);
    ActivityDisplayService.setChosenTime(e.date);
    ActivityDisplayService.setRange(ActivityDisplayService.getDisplayParam());
  });
}]);
