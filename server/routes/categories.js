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
				var params = req.body['data'];
				db.none('INSERT INTO ' + table + '(name,monitor) VALUES (${name},${monitor})', params)
					.then(function() {
						res.send('success');
					})
					.catch(function(error) {
						console.log('could not insert into categories table');
						console.log(error);
					});
  		})
  		.catch(function(error) {
  			console.log('could not create categories table');
  			console.log(error);
  		});
  });

  router.put('/', function(req, res) {
    var table = 'categories.' + req.body['username'];
		var params = req.body['data'];
		db.none('UPDATE ' + table + ' SET name=${name},monitor=${monitor} WHERE id=${id}', params)
			.then(function() {
				res.send('success');
			})
			.catch(function(error) {
				console.log('could not update categories table');
				console.log(error);
			});
  });

  router.delete('/', function(req, res) {
    var table = 'categories.' + req.query['username'];
		var params = req.query;
		db.none('DELETE FROM ' + table + ' WHERE id=${id}', params)
			.then(function() {
				res.send('success');
			})
			.catch(function(error) {
				console.log('could not update categories table');
				console.log(error);
			});
  });

  app.use('/categories', router);
}
