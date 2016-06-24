'use strict';

angular.module('Home')

.controller('PanelController', ['$scope', function($scope) {
  this.tab;

  this.selectTab = function(setTab) {
    console.log('selectTab() ' + setTab);
    this.tab = setTab;
    if(this.tab === 1) {
      console.log('sending broadcast');
      $scope.$broadcast('getTasks');
    }
    else if(this.tab === 2 && $('#container').highcharts())
      $('#container').highcharts().reflow();
  };

  this.isSelected = function(checkTab) {
    return this.tab === checkTab;
  };
}])
