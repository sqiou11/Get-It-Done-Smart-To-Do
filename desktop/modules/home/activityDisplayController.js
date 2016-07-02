'use strict';

angular.module('Home')

.controller('ActivityDisplayController', ['$http', '$rootScope', function($http, $rootScope) {
  var adController = this;
  this.preferences = [];

  this.chartParams = {};
  this.displayParam = 'day';
  this.chosen_time = moment();

  this.setRange = function(displayParam) {
    this.displayParam = displayParam;
    var startCopy = moment(this.chosen_time);
    var endCopy = moment(this.chosen_time);
    if(displayParam === 'day') {
      this.start_time = startCopy.hours(0).minutes(0).seconds(0).milliseconds(0);
      this.end_time = endCopy.hours(0).minutes(0).seconds(0).milliseconds(0).date(this.start_time.date()+1);
      this.drawChart();
    }
    else if(displayParam === 'week') {
      this.start_time = startCopy.day(0).hours(0).minutes(0).seconds(0).milliseconds(0);
      this.end_time = endCopy.day(7).hours(0).minutes(0).seconds(0).milliseconds(0);
      this.drawChart();
    }
    else if(displayParam === 'month') {
      this.start_time = startCopy.date(1).hours(0).minutes(0).seconds(0).milliseconds(0);
      this.end_time = endCopy.month(this.start_time.month()+1).date(1).hours(0).minutes(0).seconds(0).milliseconds(0);
      this.drawChart();
    }
  }

  this.drawChart = function() {
    adController.getWebPreferences(function() {
      adController.createGraphData();
    });
  };

  this.getWebData = function(start, end, urlIndex, currIndex, initPoints, iteration) {
    if(!start.isBefore(end)) {
      if(adController.displayParam === 'day') adController.drawColumnRange();
      else adController.drawTimeSeries();
      return;
    }
    var oneDayLater = moment(start).add(1, 'day');
    var timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;

    initPoints.push([start.valueOf() - timezoneOffset, 0.0]);
    if(adController.displayParam !== 'day')
      for(var i = 0; i < adController.chartParams.series.length; i++)
        adController.chartParams.series[i].data.push([start.valueOf() - timezoneOffset, 0]);

    $http.get('http://127.0.0.1:8081/web_log', {
      params: {
        username: $rootScope.globals.currentUser.username,
        start_time: start.valueOf(),
        end_time: oneDayLater.valueOf()
      }
    })
    .success(function (data) {
      if(data !== "error") {
        for(var i = 0; i < data.length; i++) {
          var newIndex = urlIndex[data[i].url];
          var newURL = data[i].url;
          if(newIndex === undefined) {  // if the current url has no mapped index
            for(var j = 0; j < adController.preferences.length; j++) {
              if(adController.preferences[j].url === data[i].url) { // if the unknown url is one of our preferences, create new series for it
                urlIndex[data[i].url] = currIndex;  // map new url to current index
                adController.chartParams.urls[currIndex] = data[i].url;
                adController.chartParams.series.push({ name: data[i].url, data: [] }); // push a new object into the newly created series
                if(adController.displayParam !== 'day') {
                  var newZeroArray = $.extend(true, [], initPoints);
                  adController.chartParams.series[currIndex].data = newZeroArray;
                }

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
          if(adController.displayParam === 'day') {
            // if the end of the last entry === the beginning of the new entry, just change the end time for the last entry to the end time of the new one
            var seriesEnd = adController.chartParams.series[newIndex].data.length-1;
            if(seriesEnd >= 0 && adController.chartParams.series[newIndex].data[seriesEnd][2] === parseInt(data[i].start_time) - timezoneOffset) {
              if(data[i].active) data[i].end_time = Date.now();
              adController.chartParams.series[newIndex].data[seriesEnd][2] = parseInt(data[i].end_time) - timezoneOffset;
            }
            else {  // otherwise add a new entry to the series
              var newData = [];
              newData.push(newIndex); // set the index of the corresponding url
              newData.push(parseInt(data[i].start_time) - timezoneOffset);  // add start and end of interval
              if(data[i].active) data[i].end_time = Date.now();
              newData.push(parseInt(data[i].end_time) - timezoneOffset);
              adController.chartParams.series[newIndex].data.push(newData);
            }
          }
          else {
            var add = parseInt(data[i].end_time) - parseInt(data[i].start_time);
            adController.chartParams.series[newIndex].data[iteration][1] += add/(60*60*1000);
          }
        }
      } else {
        console.log('Error: ' + data);
        //document.getElementById('container').innerHTML = "No data for " + adController.start_time.toDateString();
      }
      adController.getWebData(start.add(1, 'day'), end, urlIndex, currIndex, initPoints, iteration+1);
    });
  };

  this.createGraphData = function() {
    this.chartParams = {
      series: [ { name: "other websites", data: [] } ],
      urls: [ "other websites" ]
    };
    var urlIndex = { "other websites": 0 };
    var currIndex = 1;

    this.getWebData(moment(this.start_time), moment(this.end_time), urlIndex, currIndex, [], 0);
  };

  this.drawColumnRange = function() {
    console.log('drawing chart');
    $('#container').highcharts({
      chart: {
          type: 'columnrange',
          zoomType: "y",
          inverted: true
      },
      title: { text: "Your Activity for " + adController.start_time.format('dddd, MMMM Do')},
      exporting: { enabled: false },
      xAxis: { categories: adController.chartParams.urls },
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
      series: adController.chartParams.series
    });
  };

  this.drawTimeSeries = function() {
    //console.log(adController.chartParams);
    $('#container').highcharts({
      chart: {
          zoomType: "x",
      },
      title: { text: "Your Activity from " + adController.start_time.format('dddd, MMMM Do') + " to " + adController.end_time.format('dddd, MMMM Do')},
      exporting: { enabled: false },
      xAxis: { type: 'datetime' },
      yAxis: {
        title: { text: 'Hours' }
      },
      series: adController.chartParams.series
    });
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
    console.log(e.date);
    adController.chosen_time = e.date;
    adController.setRange(adController.displayParam);
  });

  this.setRange('day');
}]);
