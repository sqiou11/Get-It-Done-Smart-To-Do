'use strict';

angular.module('Home')

.controller('ActivityDisplayController', ['$http', '$rootScope', function($http, $rootScope) {
  var adController = this;
  this.start_time = new Date();
  this.start_time.setHours(0);
  this.start_time.setMinutes(0);
  this.start_time.setSeconds(0);
  this.start_time.setMilliseconds(0);

  this.end_time = new Date();
  this.end_time.setHours(0);
  this.end_time.setMinutes(0);
  this.end_time.setSeconds(0);
  this.end_time.setMilliseconds(0);
  this.end_time.setDate(this.start_time.getDate() + 1);

  this.drawChart = function() {
    $http.get('http://127.0.0.1:8081/web_log', {
      params: {
        username: $rootScope.globals.currentUser.username,
        start_time: this.start_time.getTime(),
        end_time: this.end_time.getTime()
      }
    })
    .success(function (response) {
      if(response !== "error") {
        //adController.data = response;
        var r = adController.createGraphData(response);
        console.log(r);
        //console.log(adController.data);
        $('#container').highcharts({
          chart: {
              type: 'columnrange',
              zoomType: "y",
              inverted: true
          },
          title: { text: "Your Activity for " + adController.start_time.toDateString()},
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
              columnrange: { grouping:false },
              column: {colorByPoint: true}
          },
          tooltip: {
            formatter: function() {
              return 'Visited ' + this.x + ' from ' + Highcharts.dateFormat('%l:%M:%S %p', this.point.low) + ' to ' + Highcharts.dateFormat('%l:%M:%S %p', this.point.high);
            }
          },
          series: r.series
        });
      } else {
        document.getElementById('container').innerHTML = "No data for " + adController.start_time.toDateString();
      }
    });
  };

  this.createGraphData = function(data) {
    var r = {
      series: [],
      urls: []
    }
    var urlIndex = {};
    var currIndex = 0;
    var timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;

    for(var i = 0; i < data.length; i++) {
      if(urlIndex[data[i].url] === undefined) {
        urlIndex[data[i].url] = currIndex;  // map new url to current index
        r.urls[currIndex] = data[i].url;
        r.series.push({ name: data[i].url, data: [] });
        currIndex += 1;
      }
      var newData = [];
      newData.push(urlIndex[data[i].url]); // set the index of the corresponding url
      newData.push(parseInt(data[i].start_time) - timezoneOffset);  // add start and end of interval
      if(data[i].active) data[i].end_time = Date.now();
      newData.push(parseInt(data[i].end_time) - timezoneOffset);
      r.series[urlIndex[data[i].url]].data.push(newData);
    }
    return r;
  };

  $('#datePicker').datetimepicker({
    format: 'MM/DD/YYYY',
    allowInputToggle: true
  });
  $('#datePicker').on('dp.change', function(e) {
    adController.start_time = new Date(e.date._d);
    adController.end_time = new Date(e.date._d);
    adController.end_time.setDate(adController.end_time.getDate() + 1);
    adController.drawChart();
  });

  this.drawChart();
}]);
