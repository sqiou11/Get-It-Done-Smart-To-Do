module.exports = function(app, appEnv) {
  var express = require('express'),
		router = express.Router();

  var db = appEnv.db;

  router.get('/', function(req, res) {
    console.log('getting training data');
  	db.any('SELECT * FROM trainingdata.' + req.query['username'])
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
  	var table = 'trainingdata.' + req.body['username'];
  	db.none('CREATE TABLE IF NOT EXISTS ' + table +
  		'(categories text[] NOT NULL, urltopics text[] NOT NULL, distracting boolean NOT NULL, CONSTRAINT ' +
  		req.body['username'] + '_pkey PRIMARY KEY (categories, urltopics))')
  		.then(function() {
  			var params = req.body['data'];
  			db.none('INSERT INTO ' + table + '(categories, urltopics, distracting) VALUES (${categories}, ${urltopics}, ${distracting})', params)
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

  router.put('/', function(req, res) {
    var params = req.body['data'];
  	db.none('UPDATE trainingdata.' + req.body['username'] + ' SET distracting=${distracting} WHERE categories=${categories} AND urltopics=${urltopics}', params)
  		.then(function(data) {
  			res.send('success');
  		})
  		.catch(function(error) {
  			console.log(error);
  			res.send('error');
  		});
  });

  router.delete('/', function(req, res) {
  	var table = 'trainingData.' + req.query['username'];
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

  app.use('/training_data', router);
}
