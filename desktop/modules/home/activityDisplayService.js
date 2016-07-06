'use strict';

angular.module('Home')

.factory('ActivityDisplay', function($http, $rootScope) {
  var chartParams = {};
  var displayParam = '';
  var preferences = [];
  var chosen_time = moment();
  var start_time = undefined;
  var end_time = undefined;
  var graphElement = undefined;

  var ActivityDisplay = function(graph, dParam) {
    this.graphElement = undefined;
    this.start_time = undefined;
    this.end_time = undefined;
    this.chosen_time = moment();
    this.displayParam = '';
    this.chartParams = {};
    this.preferences = [];

    this.initialize = function() {
      console.log('ActivityDisplay obj initialized')
      this.graphElement = graph;
      this.displayParam = dParam;
      this.setRange(this.displayParam);
    }
    this.getDisplayParam = function() {
      return this.displayParam;
    }
    this.setChosenTime = function(time) {
      this.chosen_time = time;
    }
    this.setRange = function(d) {
      this.displayParam = d;
      var startCopy = moment(this.chosen_time);
      var endCopy = moment(this.chosen_time);
      if(this.displayParam === 'day') {
        this.start_time = startCopy.hours(0).minutes(0).seconds(0).milliseconds(0);
        this.end_time = endCopy.hours(0).minutes(0).seconds(0).milliseconds(0).date(this.start_time.date()+1);
      }
      else if(this.displayParam === 'week') {
        this.start_time = startCopy.day(0).hours(0).minutes(0).seconds(0).milliseconds(0);
        this.end_time = endCopy.day(7).hours(0).minutes(0).seconds(0).milliseconds(0);
      }
      else if(this.displayParam === 'month') {
        this.start_time = startCopy.date(1).hours(0).minutes(0).seconds(0).milliseconds(0);
        this.end_time = endCopy.month(this.start_time.month()+1).date(1).hours(0).minutes(0).seconds(0).milliseconds(0);
      }
      this.drawChart();
    }

    this.drawChart = function() {
      var self = this;
      // get the users web preferences, with the callback function to be called aftwards
      this.getWebPreferences(function() {
        self.createGraphData();
      });
    }

    this.getWebPreferences = function(callback) {
      var self = this;
      $http.get('http://127.0.0.1:8081/web_preferences', {
        params: { username: $rootScope.globals.currentUser.username }
      })
      .success(function(response) {
        if(response !== "error") {
          //console.log(response);
          self.preferences = response;
          callback();
        } else {
          //console.log(response);
        }
      });
    }

    this.createGraphData = function() {
      this.chartParams = {
        series: [ { name: "other websites", data: [] } ],
        urls: [ "other websites" ]
      };
      var urlIndex = { "other websites": 0 };
      var currIndex = 1;

      this.getWebData(moment(this.start_time), moment(this.end_time), urlIndex, currIndex, [], 0);
    }

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
    this.getWebData = function(start, end, urlIndex, currIndex, initPoints, iteration) {
      var self = this;
      if(!start.isBefore(end)) {
        console.log(this.chartParams);
        if(this.displayParam === 'day') this.drawColumnRange();
        else this.drawTimeSeries();
        return;
      }
      var oneDayLater = moment(start).add(1, 'day');
      var timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;

      initPoints.push([start.valueOf() - timezoneOffset, 0.0]);
      if(this.displayParam !== 'day')
        for(var i = 0; i < this.chartParams.series.length; i++)
          this.chartParams.series[i].data.push([start.valueOf() - timezoneOffset, 0]);

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
              for(var j = 0; j < self.preferences.length; j++) {
                if(self.preferences[j].url === data[i].url) { // if the unknown url is one of our preferences, create new series for it
                  urlIndex[data[i].url] = currIndex;  // map new url to current index
                  self.chartParams.urls[currIndex] = data[i].url;
                  self.chartParams.series.push({ name: data[i].url, data: [] }); // push a new object into the newly created series
                  if(self.displayParam !== 'day') {
                    var newZeroArray = $.extend(true, [], initPoints);
                    self.chartParams.series[currIndex].data = newZeroArray;
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
            if(self.displayParam === 'day') {
              // if the end of the last entry === the beginning of the new entry, just change the end time for the last entry to the end time of the new one
              var seriesEnd = self.chartParams.series[newIndex].data.length-1;
              if(seriesEnd >= 0 && self.chartParams.series[newIndex].data[seriesEnd][2] === parseInt(data[i].start_time) - timezoneOffset) {
                if(data[i].active) data[i].end_time = Date.now();
                self.chartParams.series[newIndex].data[seriesEnd][2] = parseInt(data[i].end_time) - timezoneOffset;
              }
              else {  // otherwise add a new entry to the series
                var newData = [];
                newData.push(newIndex); // set the index of the corresponding url
                newData.push(parseInt(data[i].start_time) - timezoneOffset);  // add start and end of interval
                if(data[i].active) data[i].end_time = Date.now();
                newData.push(parseInt(data[i].end_time) - timezoneOffset);
                self.chartParams.series[newIndex].data.push(newData);
              }
            }
            else {
              if(data[i].active) data[i].end_time = Date.now();
              var add = parseInt(data[i].end_time) - parseInt(data[i].start_time);
              self.chartParams.series[newIndex].data[iteration][1] += add/3600000;
            }
          }
        } else {
          console.log('Error: ' + data);
          //document.getElementById('container').innerHTML = "No data for " + adController.start_time.toDateString();
        }
        self.getWebData(start.add(1, 'day'), end, urlIndex, currIndex, initPoints, iteration+1);
      });
    }

    this.drawColumnRange = function() {
      var self = this;
      console.log(this.graphElement);
      this.graphElement.highcharts({
        chart: {
            type: 'columnrange',
            zoomType: "y",
            inverted: true
        },
        title: { text: "Your Activity for " + self.start_time.format('dddd, MMMM Do')},
        exporting: { enabled: false },
        xAxis: { categories: self.chartParams.urls },
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
        series: self.chartParams.series
      });
    }

    this.drawTimeSeries = function() {
      var self = this;
      //console.log(adController.chartParams);
      this.graphElement.highcharts({
        chart: {
            zoomType: "x",
        },
        title: { text: "Your Activity from " + self.start_time.format('dddd, MMMM Do') + " to " + self.end_time.format('dddd, MMMM Do')},
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
        series: self.chartParams.series
      });
    }

    this.initialize();
  }

  return ActivityDisplay;
})
