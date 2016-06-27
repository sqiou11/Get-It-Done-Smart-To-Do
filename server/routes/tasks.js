module.exports = function(app, appEnv) {
  var express = require('express'),
		router = express.Router();

  var db = appEnv.db;

  router.get('/', function(req, res) {
  	db.any('SELECT * FROM tasks.' + req.query['username'])
  		.then(function(data) {
  			if(data === undefined) data = {};
  			res.send(data);
  		})
  		.catch(function(error) {
  			console.log(error);
  			res.send('error');
  		});
  });

  router.post('/', function(req, res) {
  	var table = 'tasks.' + req.body['username'];
  	db.none('CREATE TABLE IF NOT EXISTS ' + table +
  		'(id SERIAL, description text NOT NULL, category text, due text, reminder text, done boolean NOT NULL, CONSTRAINT ' +
  		req.body['username'] + '_pkey PRIMARY KEY (id))')
  		.then(function() {
  			var params = req.body['data'];
  			db.none('INSERT INTO ' + table + '(description, category, due, reminder, done) VALUES (${desc}, ${category}, ${due}, ${reminder}, NULL)', params)
  				.then(function() {
  					res.send('success');
  				})
  				.catch(function(error) {
  					console.log(error);
  					res.send('error');
  				});
  		})
  		.catch(function(error) {
  			console.log(error);
  		});
  });

  router.delete('/', function(req, res) {
  	var table = 'tasks.' + req.query['username'];
  	var params = req.query;
  	console.log(params);
  	db.none('DELETE FROM ' + table + ' WHERE id=${id}', params)
  		.then(function() {
  			res.send('success');
  		})
  		.catch(function(error) {
  			console.log(error);
  			res.send('error');
  		});
  });

  app.use('/tasks', router);
}
