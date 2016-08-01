module.exports = function(app, appEnv) {
  var express = require('express'),
		router = express.Router();

  var db = appEnv.db;

  router.get('/', function(req, res) {
    console.log('tasks.' + req.query.username);
  	db.any('SELECT * FROM tasks.\"' + req.query.username + '\"')
  		.then(function(data) {
  			if(data === undefined) data = {};
  			res.send(data);
  		})
  		.catch(function(error) {
  			console.log(error);
  			res.send('error');
  		});
  });

  router.get('/categories/upcoming', function(req, res) {
    var params = {
      due: req.query['due']
    };
  	db.any('SELECT DISTINCT category FROM tasks.\"' + req.query.username + '\" WHERE due > ${due}', params)
  		.then(function(data) {
        console.log(data);
  			if(data === undefined) data = {};
  			res.send(data);
  		})
  		.catch(function(error) {
  			console.log(error);
  			res.send('error');
  		});
  });

  router.post('/', function(req, res) {
  	db.none('CREATE TABLE IF NOT EXISTS tasks.\"' + req.body['username'] + '\"' +
  		'(id SERIAL, description text NOT NULL, category text, due text, reminder text, done boolean, CONSTRAINT ' +
  		req.body['username'] + '_pkey PRIMARY KEY (id))')
  		.then(function() {
  			var params = req.body['data'];
  			db.none('INSERT INTO tasks.\"' + req.body['username'] + '\"(description, category, due, reminder, done) VALUES (${desc}, ${category}, ${due}, ${reminder}, NULL)', params)
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
  	db.none('UPDATE tasks.\"' + req.body['username'] + '\" SET description=${description},category=${category},due=${due},reminder=${reminder},done=${done} WHERE id=${id}', params)
  		.then(function(data) {
  			res.send('success');
  		})
  		.catch(function(error) {
  			console.log(error);
  			res.send('error');
  		});
  });

  router.delete('/', function(req, res) {
  	var table = 'tasks.\"' + req.query['username'] + '\"';
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
