module.exports = function(app, appEnv) {
  var express = require('express'),
		router = express.Router();

  var db = appEnv.db;

  // handle requests to start the log entry of a URL (add start time and set active to 'yes')
  router.post('/start', function(req, res) {
  	console.log('received POST request to start log for ' + req.body.name);
  	var table = 'applications.' + req.body['username'];
  	db.none('CREATE TABLE IF NOT EXISTS ' + table +
  		'(name text NOT NULL, start_time text NOT NULL, end_time text, active boolean NOT NULL, machine text NOT NULL, CONSTRAINT ' +
  		req.body['username'] + '_pkey PRIMARY KEY (name, start_time, machine))')
  		.then(function() {
  			var params = {
  				name: req.body['name'],
  				start_time: req.body['start_time'],
          machine: req.body['machine']
  			};
  			db.none('INSERT INTO ' + table + '(name, start_time, end_time, active, machine) VALUES (${name}, ${start_time}, NULL, TRUE, ${machine})', params)
  				.then(function(data) {
  					console.log(data);
  					res.send('success');
  				})
  				.catch(function(error) {
  					console.log(error);
  				});
  		})
  		.catch(function(error) {
  			console.log(error);
  		});
      res.send('success');
  });

  // handle requests to end the log entry of a URL (add end time and change active from 'yes' to 'no')
  router.post('/end', function(req, res) {
  	console.log('received POST request to end log for ' + req.body.name);
  	var table = 'applications.' + req.body['username'];
  	var params = {
  		name: req.body['name'],
  		end_time: req.body['end_time'],
      machine: req.body['machine']
  	};
  	db.none('UPDATE ' + table + ' SET end_time=${end_time}, active=FALSE WHERE name=${name} AND active=TRUE AND machine=${machine}', params)
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
  	db.many('SELECT * FROM applications.' + params['user'] + ' WHERE start_time>=${start_time} AND start_time<${end_time} ORDER BY machine', params)
  		.then(function(data) {
  			console.log(data);
  			res.send(data);
  		})
  		.catch(function(error) {
  			console.log(error);
  			res.send('error');
  		})
  });

  app.use('/app_log', router);
}
