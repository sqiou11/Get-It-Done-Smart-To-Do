'use strict';

angular.module('app')

.factory('ProductivityDisplay', function($http, store) {

  var ActivityDisplay = function(pieGraph, lineGraph, dParam) {
    this.graphElement = undefined;
    this.start_time = undefined;
    this.end_time = undefined;
    this.chosen_time = moment();
    this.displayParam = '';
    this.colors = Highcharts.getOptions().colors;
    this.productivityData = [];
    this.breakdownData = [];
    this.urlArrays = [];
    this.url = '';
    this.timeseriesArray = [];

    this.initialize = function() {
      this.pieGraphElement = pieGraph;
      this.lineGraphElement = lineGraph;
      this.displayParam = dParam;
      this.url = 'http://127.0.0.1:8081/web_log/current_totals';
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
      if(this.displayParam === 'hour') {
        this.start_time = moment().hours(moment().hours()-1);
        this.end_time = moment();
      }
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
      this.createGraphData();
    }

    this.createGraphData = function() {
      this.productivityData = [ {
        name: 'Productive',
        y: 0,
        color: '#38C938'
      }, {
        name: 'Distracting',
        y: 0,
        color: '#BF131C'
      }];
      this.breakdownData = [];
      this.urlArrays = [ { urls: [], values: [] }, { urls: [], values: [] }];
      this.timeseriesData = { name: 'Productivity', data: [] };

      this.getWebData(moment(this.start_time), moment(this.end_time));
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
    this.getWebData = function(start, end) {
      var self = this;
      var productiveIdx = 0, distractingIdx = 1;
      var timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;

      if(!start.isBefore(end)) {
        var totalTime = this.productivityData[0].y + this.productivityData[1].y;

        // use completely urlArrays to create breakdownData
        for(var i = 0; i < this.urlArrays.length; i++) {
          this.productivityData[i].y = parseFloat(((this.productivityData[i].y / totalTime) * 100).toFixed(2));
          for(var j = 0; j < this.urlArrays[i].values.length; j++) {
            var brightness = 0.2 - (j / this.urlArrays[i].values.length) / 5;
            this.breakdownData.push({
              name: this.urlArrays[i].urls[j],
              y: parseFloat(((this.urlArrays[i].values[j] / totalTime) * 100).toFixed(2)),
              color: Highcharts.Color(this.productivityData[i].color).brighten(brightness).get()
            });
          }
        }
        this.drawPieChart();
        if(this.displayParam !== 'day') this.drawTimeSeries();
        return;
      }
      var oneDayLater = moment(start).add(1, 'day');

      $http.get(self.url, {
        params: {
          username: store.get('id'),
          start_time: start.valueOf(),
          end_time: oneDayLater.valueOf()
        }
      })
      .success(function (data) {
        if(data !== "error") {
          console.log(data);
          var tmpProductivity = 0, tmpTotal = 0;
          for(var i = 0; i < data.length; i++) {
            var idx, total_time = parseInt(data[i].total_time);
            // update the category totals
            if(data[i].distracting) {
              self.productivityData[distractingIdx].y += total_time;
              idx = distractingIdx;
            }
            else {
              self.productivityData[productiveIdx].y += total_time;
              tmpProductivity += total_time;
              idx = productiveIdx;
            }
            tmpTotal += total_time;

            // update the individual url's total
            for(var j = 0; j < self.urlArrays[idx].values.length; j++)
              if(self.urlArrays[idx].urls[j] === data[i].url) {
                self.urlArrays[idx].values[j] += total_time;
                continue;
              }
            self.urlArrays[idx].urls.push(data[i].url);
            self.urlArrays[idx].values.push(total_time);
          }
          self.timeseriesData.data.push([start.valueOf() - timezoneOffset, parseFloat(((tmpProductivity / tmpTotal) * 100).toFixed(2))]);
        } else {
          console.log('Error: ' + data);
          self.timeseriesData.data.push([start.valueOf() - timezoneOffset, 0]);
        }
        self.getWebData(start.add(1, 'day'), end);
      });
    }

    this.drawPieChart = function() {
      var self = this;
      this.pieGraphElement.highcharts({
        chart: {
            type: 'pie'
        },
        exporting: { enabled: false },
        title: {
            text: 'Overall productivity from ' + (self.displayParam === 'day' ? self.start_time.format('dddd, MMMM Do') : self.start_time.format('dddd, MMMM Do') + ' to ' + self.end_time.format('dddd, MMMM Do'))
        },
        yAxis: {
            title: {
                text: 'Percentage of time'
            }
        },
        plotOptions: {
            pie: {
                shadow: false,
                center: ['50%', '50%']
            }
        },
        tooltip: {
            valueSuffix: '%'
        },
        series: [{
            name: 'Activity',
            data: self.productivityData,
            size: '60%',
            dataLabels: {
                formatter: function () {
                    return this.y > 5 ? this.point.name : null;
                },
                color: '#ffffff',
                distance: -30
            }
        }, {
            name: 'Websites',
            data: self.breakdownData,
            size: '80%',
            innerSize: '60%',
            dataLabels: {
                formatter: function () {
                    // display only if larger than 1
                    return '<b>' + this.point.name + ':</b> ' + this.y + '%';
                }
            }
        }]
      });
    }

    this.drawTimeSeries = function() {
      var self = this;
      this.lineGraphElement.highcharts({
        chart: {
            zoomType: "x",
        },
        title: { text: "Productivity trend from " + self.start_time.format('dddd, MMMM Do') + " to " + self.end_time.format('dddd, MMMM Do')},
        exporting: { enabled: false },
        xAxis: { type: 'datetime' },
        yAxis: {
          title: { text: 'Productivity' }
        },
        series: [self.timeseriesData]
      });
    }

    this.initialize();
  }

  return ActivityDisplay;
});
