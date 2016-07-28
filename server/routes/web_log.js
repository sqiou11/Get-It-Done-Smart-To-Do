module.exports = function(app, appEnv) {
  var express = require('express'),
		router = express.Router();

  var db = appEnv.db;

  // handle requests to start the log entry of a URL (add start time and set active to 'yes')
  router.post('/start', function(req, res) {
  	console.log('received POST request to start log for ' + req.body.url);
  	var table = 'websites.' + req.body['username'];
  	db.none('CREATE TABLE IF NOT EXISTS ' + table +
  		'(url text NOT NULL, start_time text NOT NULL, end_time text, active boolean NOT NULL, CONSTRAINT ' +
  		req.body['username'] + '_pkey PRIMARY KEY (url, start_time))')
  		.then(function() {
  			var params = {
  				url: req.body['url'],
  				start_time: req.body['start_time']
  			};
  			db.none('INSERT INTO ' + table + '(url, start_time, end_time, active) VALUES (${url}, ${start_time}, NULL, TRUE)', params)
  				.then(function(data) {
  					res.send('success');
  				})
  				.catch(function(error) {
  					console.log(error);
  				});
  		})
  		.catch(function(error) {
  			console.log(error);
  		});
  });

  // handle requests to end the log entry of a URL (add end time and change active from 'yes' to 'no')
  router.put('/end', function(req, res) {
  	console.log('received PUT request to end log for ' + req.body.url);
  	var table = 'websites.' + req.body['username'];
  	var params = {
  		url: req.body['url'],
  		end_time: req.body['end_time']
  	};
  	db.none('UPDATE ' + table + ' SET end_time=${end_time}, active=FALSE WHERE url=${url} AND active=TRUE', params)
  		.then(function() {
  			res.send('success');
  		})
  		.catch(function(error) {
  			console.log(error);
  		});
  });

  router.put('/distracting', function(req, res) {
  	console.log('received PUT request to set distracting field');
  	var table = 'websites.' + req.body['username'];
  	var params = req.body['data'];
  	db.none('UPDATE ' + table + ' SET distracting=${distracting} WHERE active=TRUE', params)
  		.then(function() {
  			res.send('success');
  		})
  		.catch(function(error) {
  			console.log(error);
  		});
  });

  // handle requests to retrieve log data between a start and end time, url is optional
  router.get('/', function(req, res) {
  	var params = {
  		user: req.query['username'],
  		start_time: req.query['start_time'],
  		end_time: req.query['end_time']
  	};
  	db.many('SELECT * FROM websites.' + params['user'] + ' WHERE start_time>=${start_time} AND start_time<${end_time}', params)
  		.then(function(data) {
  			//console.log(data);
  			res.send(data);
  		})
  		.catch(function(error) {
  			console.log(error);
  			res.send('error');
  		})
  });

  app.use('/web_log', router);
}
