module.exports = function(app, appEnv) {
  var express = require('express'),
		router = express.Router();

  var db = appEnv.db;

  router.get('/', function(req, res) {
		db.any('SELECT * FROM categories.\"' + req.query['username'] + '\"')
			.then(function(data) {
				res.send(data);
			})
			.catch(function(error) {
				console.log(error);
				res.send('error');
			});
  });

  router.post('/', function(req, res) {
  	db.none('CREATE TABLE IF NOT EXISTS categories.\"' + req.body['username'] + '\"' +
  		'(id SERIAL, name text NOT NULL, monitor boolean NOT NULL, CONSTRAINT \"' +
  		req.body['username'] + '_pkey\" PRIMARY KEY (id))')
  		.then(function() {
				var params = req.body['data'];
				db.none('INSERT INTO categories.\"' + req.body['username'] + '\"(name,monitor) VALUES (${name},${monitor})', params)
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
		var params = req.body['data'];
		db.none('UPDATE categories.\"' + req.body['username'] + '\" SET name=${name},monitor=${monitor} WHERE id=${id}', params)
			.then(function() {
				res.send('success');
			})
			.catch(function(error) {
				console.log('could not update categories table');
				console.log(error);
			});
  });

  router.delete('/', function(req, res) {
		var params = req.query;
		db.none('DELETE FROM categories.\"' + req.query['username'] + '\" WHERE id=${id}', params)
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
