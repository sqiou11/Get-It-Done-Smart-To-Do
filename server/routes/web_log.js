module.exports = function(app, appEnv) {
  var express = require('express'),
		router = express.Router();

  var db = appEnv.db;

  // handle requests to start the log entry of a URL (add start time and set active to 'yes')
  router.post('/start', function(req, res) {
  	console.log('received POST request to start log for ' + req.body.url + ' table = websites.\"' + req.body.username + '\"');
  	db.none('CREATE TABLE IF NOT EXISTS websites.\"' + req.body.username + '\"' +
  		'(url text NOT NULL, start_time bigint NOT NULL, end_time bigint, active boolean NOT NULL, distracting boolean, CONSTRAINT \"' +
  		req.body['username'] + '_pkey\" PRIMARY KEY (url, start_time))')
  		.then(function() {
  			var params = {
  				url: req.body['url'],
  				start_time: req.body['start_time']
  			};
  			db.none('INSERT INTO websites.\"' + req.body['username'] + '\"(url, start_time, end_time, active, distracting) VALUES (${url}, ${start_time}, NULL, TRUE, NULL)', params)
  				.then(function(data) {
  					res.send('success');
  				})
  				.catch(function(error) {
            console.log('error during table insertion');
  					console.log(error);
  				});
  		})
  		.catch(function(error) {
        console.log('error during table creation');
  			console.log(error);
  		});
  });

  // handle requests to end the log entry of a URL (add end time and change active from 'yes' to 'no')
  router.put('/end', function(req, res) {
  	console.log('received PUT request to end log for ' + req.body.url);
  	var params = {
  		url: req.body['url'],
  		end_time: req.body['end_time']
  	};
  	db.none('UPDATE websites.\"' + req.body['username'] + '\" SET end_time=${end_time}, active=FALSE WHERE url=${url} AND active=TRUE', params)
  		.then(function() {
  			res.send('success');
  		})
  		.catch(function(error) {
  			console.log(error);
  		});
  });

  router.put('/distracting', function(req, res) {
  	console.log('received PUT request to set distracting field');
  	var params = req.body['data'];
  	db.none('UPDATE websites.\"' + req.body['username'] + '\" SET distracting=${distracting} WHERE active=TRUE', params)
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
  		start_time: req.query['start_time'],
  		end_time: req.query['end_time']
  	};

    db.many('SELECT * FROM websites.\"' + req.query['username'] + '\" WHERE (start_time>=${start_time} AND start_time<${end_time}) OR (end_time>=${start_time} AND end_time<${end_time})', params)
  		.then(function(data) {
  			//console.log(data);
  			res.send(data);
  		})
  		.catch(function(error) {
  			console.log(error);
  			res.send('error');
  		})
  });

  router.get('/current_totals', function(req, res) {
  	var params = {
  		start_time: req.query['start_time'],
  		end_time: req.query['end_time']
  	};
    db.none('CREATE OR REPLACE VIEW current_totals AS ' +
      'SELECT url, active, distracting, start_time, CASE WHEN active=TRUE THEN cast(extract(epoch from now()) * 1000 as bigint) ELSE end_time END FROM ' +
      ' websites.\"' + req.query['username'] + '\" ' +
      'WHERE (start_time>=${start_time} AND start_time<${end_time}) OR (end_time>${start_time} AND end_time<=${end_time}) OR (start_time<${start_time} AND end_time>${end_time})', params)
  	  .then(function() {
        db.many('SELECT url, distracting, SUM(end_time-start_time) as total_time FROM current_totals GROUP BY url, distracting')
      		.then(function(data) {
      			//console.log(data);
      			res.send(data);
      		})
      		.catch(function(error) {
      			console.log(error);
      			res.send('error');
      		});
      })
      .catch(function(error) {
        console.log('error creating view');
        console.log(error);
        res.send('error');
      });
  });

  app.use('/web_log', router);
}
