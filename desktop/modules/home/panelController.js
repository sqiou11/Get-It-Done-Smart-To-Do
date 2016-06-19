'use strict';

angular.module('Home')

.controller('PanelController', function() {
  this.tab = 1;
  this.selectTab = function(setTab) {
    this.tab = setTab;
  };
  this.isSelected = function(checkTab) {
    if(checkTab === 2 && $('#container').highcharts())
      $('#container').highcharts().reflow();
    return this.tab === checkTab;
  }
})
