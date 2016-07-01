'use strict';

angular.module('Home')

.controller('ActivityDisplayController', ['$http', '$rootScope', function($http, $rootScope) {
  var adController = this;
  this.preferences = [];
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
        adController.data = response;
        adController.getWebPreferences(function() {
          var r = adController.createGraphData(adController.data);
          console.log(r);
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
        });
      } else {
        document.getElementById('container').innerHTML = "No data for " + adController.start_time.toDateString();
      }
    });
  };

  this.createGraphData = function(data) {
    var r = {
      series: [ { name: "other websites", data: [] } ],
      urls: [ "other websites" ]
    }
    var urlIndex = { "other websites": 0 };
    var currIndex = 1;
    var timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;

    for(var i = 0; i < data.length; i++) {
      console.log(data[i].url);
      var newIndex = urlIndex[data[i].url];
      var newURL = data[i].url;
      if(newIndex === undefined) {  // if the current url has no mapped index
        for(var j = 0; j < adController.preferences.length; j++) {
          if(adController.preferences[j].url === data[i].url) { // if the unknown url is one of our preferences, create new series for it
            urlIndex[data[i].url] = currIndex;  // map new url to current index
            r.urls[currIndex] = data[i].url;
            r.series.push({ name: data[i].url, data: [] }); // push a new object into the newly created series
            currIndex += 1;

            newIndex = urlIndex[data[i].url]; // update newIndex to the newly created index
            break;
          }
        }
        if(newIndex === undefined) {  // otherwise just put it into the "other" series
          newIndex = 0;
          newURL = "other websites"
        }
      }
      // if the end of the last entry === the beginning of the new entry, just change the end time for the last entry to the end time of the new one
      var seriesEnd = r.series[newIndex].data.length-1;
      if(seriesEnd >= 0 && r.series[newIndex].data[seriesEnd][2] === parseInt(data[i].start_time) - timezoneOffset) {
        if(data[i].active) data[i].end_time = Date.now();
        r.series[newIndex].data[seriesEnd][2] = parseInt(data[i].end_time) - timezoneOffset;
      }
      else {  // otherwise add a new entry to the series
        var newData = [];
        newData.push(newIndex); // set the index of the corresponding url
        newData.push(parseInt(data[i].start_time) - timezoneOffset);  // add start and end of interval
        if(data[i].active) data[i].end_time = Date.now();
        newData.push(parseInt(data[i].end_time) - timezoneOffset);
        r.series[newIndex].data.push(newData);
      }
    }
    return r;
  };

  this.getWebPreferences = function(callback) {
    $http.get('http://127.0.0.1:8081/web_preferences', {
      params: { username: $rootScope.globals.currentUser.username }
    })
    .success(function(response) {
      if(response !== "error") {
        console.log(response);
        adController.preferences = response;
        callback();
      } else {
        console.log(response);
      }
    });
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
