module.exports = function(app, appEnv) {
  var express = require('express'),
		router = express.Router();

  var db = appEnv.db;

  router.get('/', function(req, res) {
  	var table = 'categories.' + req.query['username'];
  	db.none('CREATE TABLE IF NOT EXISTS ' + table +
  		'(id SERIAL, name text NOT NULL, monitor boolean NOT NULL, CONSTRAINT ' +
  		req.query['username'] + '_pkey PRIMARY KEY (id))')
  		.then(function() {
  			db.any('SELECT * FROM categories.' + req.query['username'])
  				.then(function(data) {
  					res.send(data);
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

  router.post('/', function(req, res) {
  	console.log(req.body['username']);
  	var table = 'categories.' + req.body['username'];
  	db.none('CREATE TABLE IF NOT EXISTS ' + table +
  		'(id SERIAL, name text NOT NULL, monitor boolean NOT NULL, CONSTRAINT ' +
  		req.body['username'] + '_pkey PRIMARY KEY (id))')
  		.then(function() {
  			for(var i = 0; i < req.body['data'].length; i++) {
  				var params = req.body['data'][i];
  				db.none('INSERT INTO ' + table + '(id,name,monitor) VALUES (${id},${name},${monitor}) ' +
  				'ON CONFLICT (id) ' +
  				'DO UPDATE SET name=${name},monitor=${monitor}', params)
  					.then(function() {
  						res.send('success');
  					})
  					.catch(function(error) {
  						console.log('could not update categories table');
  						console.log(error);
  					});
  				}
  		})
  		.catch(function(error) {
  			console.log('could not create categories table');
  			console.log(error);
  		});
  });

  app.use('/categories', router);
}
