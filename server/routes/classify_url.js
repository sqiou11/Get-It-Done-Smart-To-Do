module.exports = function(app, appEnv) {
  var express = require('express'),
	 router = express.Router();

  var db = appEnv.db;

  router.get('/', function(req, res) {
    console.log('getting training data');
    var params = { url: req.query.url };
  	db.any('SELECT categories FROM public.website_labels WHERE url=${url}', params)
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
  	var table = 'public.website_labels';
  	db.none('CREATE TABLE IF NOT EXISTS ' + table +
  		'(url text NOT NULL, categories text[] NOT NULL, CONSTRAINT ' +
  		'website_labels_pkey PRIMARY KEY (url))')
  		.then(function() {
  			var params = req.body['data'];
  			db.none('INSERT INTO public.website_labels(url, categories) VALUES (${url}, ${categories})', params)
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

  app.use('/classify_url', router);
}
