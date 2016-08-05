angular.module('app')

.controller('ProductivityDisplayController', ['ProductivityDisplay', function(ProductivityDisplay) {
  var self = this;
  this.display = new ProductivityDisplay($('#productivity-pie-container'), $('#productivity-line-container'), 'day');

  this.updateGraph = function(displayParam) {
    this.display.setRange(displayParam);
  }

  var refreshFunc = function() {
    console.log('updating productivity display');
    self.updateGraph(self.display.getDisplayParam());
  }

  setInterval(refreshFunc, 5*60*1000);

  $('#productivity-datePicker').datetimepicker({
    format: 'MM/DD/YYYY',
    allowInputToggle: true
  });
  $('#productivity-datePicker').on('dp.change', function(e) {
    console.log(e.date);
    self.display.setChosenTime(e.date);
    self.display.setRange(self.display.getDisplayParam());
  });
}])
