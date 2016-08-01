module.exports = function(app, appEnv) {
  var express = require('express'),
		router = express.Router();

  var db = appEnv.db;

  router.get('/', function(req, res) {
  	db.any('SELECT * FROM preferences.\"' + req.query['username'] + '\"')
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
  	db.none('CREATE TABLE IF NOT EXISTS preferences.\"' + req.body['username'] + '\"' +
  		'(url text NOT NULL, CONSTRAINT ' +
  		req.body['username'] + '_pkey PRIMARY KEY (url))')
  		.then(function() {
  			var params = req.body['data'];
  			db.none('INSERT INTO preferences.\"' + req.body['username'] + '\"(url) VALUES (${url})', params)
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
  	var params = req.query;
  	console.log(params);
  	db.none('DELETE FROM preferences.\"' + req.query['username'] + '\" WHERE url=${url}', params)
  		.then(function() {
  			res.send('success');
  		})
  		.catch(function(error) {
  			console.log(error);
  			res.send('error');
  		});
  });

  app.use('/web_preferences', router);
}
