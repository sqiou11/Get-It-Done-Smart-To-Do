'use strict';

angular.module('Home')

.controller('HomeController', ['$scope', '$rootScope', '$http', function ($scope, $rootScope, $http) {
  $scope.user = $rootScope.globals.currentUser.username;
}])

.controller('ActivityDisplayController', ['$http', '$rootScope', function($http, $rootScope) {
  var store = this;
  var start_time = Date.parse("June 5, 2016");
  var end_time = Date.parse("June 6, 2016");
  $http.get('http://127.0.0.1:8081/get_web_log', {
      params: {
        username: $rootScope.globals.currentUser.username,
        start_time: start_time,
        end_time: end_time
      }
    })
    .success(function (response) {
      store.data = response;
      var r = createGraphData(response);
      console.log(store.data);
      $('#container').highcharts({
        chart: {
            type: 'columnrange',
            inverted: true
        },
        title: { text: "Your Activity for Today" },
        exporting: { enabled: false },
        xAxis: { categories: r.urls },
        yAxis: {
          type: 'datetime',
          dateTimeLabelFormats: {
          	second: '%l:%M:%S %p',
            minute: '%l:%M:%S %p',
            hour: '%l:%M:%S %p'
          },
          title: { text: null }
        },
        plotOptions: {
            columnrange: {
                grouping:false,
                /*dataLabels: {
                    enabled: true,
                    formatter: function () {
                        return this.y + '°C';
                    }
                }*/
            },
            column: {colorByPoint: true}
        },
        series: r.series
      });
    });
}]);

function createGraphData(data) {
  var r = {
    series: [],
    urls: []
  }
  var urlIndex = {};
  var currIndex = 0;

  for(var i = 0; i < data.length; i++) {
    if(urlIndex[data[i].url] === undefined) {
      urlIndex[data[i].url] = currIndex;  // map new url to current index
      r.urls[currIndex] = data[i].url;
      r.series.push({ name: data[i].url, data: [] });
      currIndex += 1;
    }
    var newData = [];
    newData.push(urlIndex[data[i].url]); // set the index of the corresponding url
    newData.push(parseInt(data[i].start_time));  // add start and end of interval
    newData.push(parseInt(data[i].end_time));
    r.series[urlIndex[data[i].url]].data.push(newData);
  }
  return r;
}
