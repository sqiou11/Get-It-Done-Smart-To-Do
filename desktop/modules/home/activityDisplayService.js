'use strict';

angular.module('Home')

.service('ActivityDisplayService', function($http, $rootScope) {
  var chartParams = {};
  var displayParam = '';
  var preferences = [];
  var chosen_time = moment();
  var start_time = undefined;
  var end_time = undefined;
  var graphElement = undefined;

  this.getDisplayParam = function() {
    return displayParam;
  }

  this.setGraphElement = function(element) {
    graphElement = element;
  }

  this.setChosenTime = function(time) {
    chosen_time = time;
  }

  this.setRange = function(d) {
    displayParam = d;
    var startCopy = moment(chosen_time);
    var endCopy = moment(chosen_time);
    if(displayParam === 'day') {
      start_time = startCopy.hours(0).minutes(0).seconds(0).milliseconds(0);
      end_time = endCopy.hours(0).minutes(0).seconds(0).milliseconds(0).date(start_time.date()+1);
    }
    else if(displayParam === 'week') {
      start_time = startCopy.day(0).hours(0).minutes(0).seconds(0).milliseconds(0);
      end_time = endCopy.day(7).hours(0).minutes(0).seconds(0).milliseconds(0);
    }
    else if(displayParam === 'month') {
      start_time = startCopy.date(1).hours(0).minutes(0).seconds(0).milliseconds(0);
      end_time = endCopy.month(start_time.month()+1).date(1).hours(0).minutes(0).seconds(0).milliseconds(0);
    }
    drawChart();
  }

  var drawChart = function() {
    // get the users web preferences, with the callback function to be called aftwards
    getWebPreferences(function() {
      createGraphData();
    });
  }

  var getWebPreferences = function(callback) {
    $http.get('http://127.0.0.1:8081/web_preferences', {
      params: { username: $rootScope.globals.currentUser.username }
    })
    .success(function(response) {
      if(response !== "error") {
        console.log(response);
        preferences = response;
        callback();
      } else {
        console.log(response);
      }
    });
  };

  /**
   * recursive async function that iterates through each day of the specified time range and grabs web log activity for that day
   * processes that data into the chartParams object based on the displayParam value (which dictates what type of graph to display)
   * and after all that calls the appropriate function to generate the actual graph
   * @param start - beginning of our time range
   * @param end - end of our time range
   * @param urlIndex - url-index map to keep track of where our URLs are in our chartParams object
   * @param currIndex - counter to keep track of the where to add a new URL
   * @param initPoints - array of zeroed coordinate pairs that's updated at each iteration, used only when generating a time series graph
   * @param iteratioin - counter to keep track of the number of iterations
   */
  var getWebData = function(start, end, urlIndex, currIndex, initPoints, iteration) {
    if(!start.isBefore(end)) {
      if(displayParam === 'day') drawColumnRange();
      else drawTimeSeries();
      return;
    }
    var oneDayLater = moment(start).add(1, 'day');
    var timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;

    initPoints.push([start.valueOf() - timezoneOffset, 0.0]);
    if(displayParam !== 'day')
      for(var i = 0; i < chartParams.series.length; i++)
        chartParams.series[i].data.push([start.valueOf() - timezoneOffset, 0]);

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
            for(var j = 0; j < preferences.length; j++) {
              if(preferences[j].url === data[i].url) { // if the unknown url is one of our preferences, create new series for it
                urlIndex[data[i].url] = currIndex;  // map new url to current index
                chartParams.urls[currIndex] = data[i].url;
                chartParams.series.push({ name: data[i].url, data: [] }); // push a new object into the newly created series
                if(displayParam !== 'day') {
                  var newZeroArray = $.extend(true, [], initPoints);
                  chartParams.series[currIndex].data = newZeroArray;
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
          if(displayParam === 'day') {
            // if the end of the last entry === the beginning of the new entry, just change the end time for the last entry to the end time of the new one
            var seriesEnd = chartParams.series[newIndex].data.length-1;
            if(seriesEnd >= 0 && chartParams.series[newIndex].data[seriesEnd][2] === parseInt(data[i].start_time) - timezoneOffset) {
              if(data[i].active) data[i].end_time = Date.now();
              chartParams.series[newIndex].data[seriesEnd][2] = parseInt(data[i].end_time) - timezoneOffset;
            }
            else {  // otherwise add a new entry to the series
              var newData = [];
              newData.push(newIndex); // set the index of the corresponding url
              newData.push(parseInt(data[i].start_time) - timezoneOffset);  // add start and end of interval
              if(data[i].active) data[i].end_time = Date.now();
              newData.push(parseInt(data[i].end_time) - timezoneOffset);
              chartParams.series[newIndex].data.push(newData);
            }
          }
          else {
            if(data[i].active) data[i].end_time = Date.now();
            var add = parseInt(data[i].end_time) - parseInt(data[i].start_time);
            chartParams.series[newIndex].data[iteration][1] += add/3600000;
          }
        }
      } else {
        console.log('Error: ' + data);
        //document.getElementById('container').innerHTML = "No data for " + adController.start_time.toDateString();
      }
      getWebData(start.add(1, 'day'), end, urlIndex, currIndex, initPoints, iteration+1);
    });
  }

  var createGraphData = function() {
    chartParams = {
      series: [ { name: "other websites", data: [] } ],
      urls: [ "other websites" ]
    };
    var urlIndex = { "other websites": 0 };
    var currIndex = 1;

    getWebData(moment(start_time), moment(end_time), urlIndex, currIndex, [], 0);
  }

  var drawColumnRange = function() {
    console.log('drawing chart');
    graphElement.highcharts({
      chart: {
          type: 'columnrange',
          zoomType: "y",
          inverted: true
      },
      title: { text: "Your Activity for " + start_time.format('dddd, MMMM Do')},
      exporting: { enabled: false },
      xAxis: { categories: chartParams.urls },
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
      series: chartParams.series
    });
  }

  var drawTimeSeries = function() {
    //console.log(adController.chartParams);
    graphElement.highcharts({
      chart: {
          zoomType: "x",
      },
      title: { text: "Your Activity from " + start_time.format('dddd, MMMM Do') + " to " + end_time.format('dddd, MMMM Do')},
      exporting: { enabled: false },
      xAxis: { type: 'datetime' },
      yAxis: {
        title: { text: 'Hours' }
      },
      tooltip: {
        formatter: function() {
          if(this.point.y === 0) return 'Did not visit ' + this.series.name;

          var d = moment.duration(this.point.y * 3600000, 'milliseconds');
          var tooltipStr = 'Visited ' + this.series.name + ' for ';
          if(d.hours()) tooltipStr += d.hours() + ' hours ';
          if(d.minutes()) tooltipStr += d.minutes() + ' minutes ';
          if(d.seconds()) tooltipStr += d.seconds() + ' seconds';
          return tooltipStr;
        }
      },
      series: chartParams.series
    });
  }
})
