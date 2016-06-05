var pgp = require('pg-promise')();
var express = require('express'),
		app = express(),
		session = require('express-session');
var bodyParser = require('body-parser');
var nunjucks = require('nunjucks');

app.use(session({
	secret: 'super secret key whoo',
	resave: true,
	saveUninitialized: true,
	cookie: { maxAge: 60000 }	// set the maxAge to 1 minute
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var db = pgp("postgres://postgres:@localhost:5432/appDB");

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

// all chrome extension functions
app.post('/chrome_ext_login', function(req, res) {
	// console.log(req.body);
	// console.log('login attempt with username = ' + req.body['username'] + ' password = ' + req.body['password']);
	var params = {
		username: req.body['username'],
		password: req.body['password']
	};
	db.one('SELECT * FROM "Users" WHERE username=${username} AND password=${password}', params)
		.then(function(data) {
			res.send('login successful');
		})
		.catch(function(error) {
			res.send('login failure');
		});
});

// handle requests to start the log entry of a URL (add start time and set active to 'yes')
app.post('/start_web_log', function(req, res) {
	console.log('received POST request to start log for ' + req.body.url);
	var table = 'websites.' + req.body['username'];
	db.none('CREATE TABLE IF NOT EXISTS ' + table +
		'(url text NOT NULL, start_time text NOT NULL, end_time text, active boolean NOT NULL, CONSTRAINT ' +
		req.body['username'] + '_pkey PRIMARY KEY (url, start_time))')
		.then(function() {
			var params = {
				url: req.body['url'],
				start_time: req.body['start_time']
			};
			db.none('INSERT INTO ' + table + '(url, start_time, end_time, active) VALUES (${url}, ${start_time}, NULL, TRUE)', params)
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
});

// handle requests to end the log entry of a URL (add end time and change active from 'yes' to 'no')
app.post('/end_web_log', function(req, res) {
	console.log('received POST request to end log for ' + req.body.url);
	var table = 'websites.' + req.body['username'];
	var params = {
		url: req.body['url'],
		end_time: req.body['end_time']
	};
	db.none('UPDATE ' + table + ' SET end_time=${end_time}, active=FALSE WHERE url=${url}', params)
		.then(function() {
			res.send('success');
		})
		.catch(function(error) {
			console.log(error);
		});
});

// handle requests to retrieve log data between a start and end time, url is optional
app.get('/get_web_log', function(req, res) {
	var params = {
		user: req.query['username'],
		url: req.query['url'],
		start_time: req.query['start_time'],
		end_time: req.query['end_time']
	};
	db.many('SELECT * FROM websites.' + params['user'] + ' WHERE start_time>=${start_time} AND start_time<${end_time}', params)
		.then(function(data) {
			console.log(data);
			res.send(data);
		})
		.catch(function(error) {
			console.log(error);
			res.send('error');
		})
});

app.post('/desktop_login', function(req, res) {
	var params = {
		username: req.body['username'],
		password: req.body['password']
	};
	db.one('SELECT * FROM "Users" WHERE username=${username} AND password=${password}', params)
		.then(function(data) {
			req.session.user = params.username;
			res.send('login successful');
		})
		.catch(function(error) {
			res.send('login failure');
		});
});


// Authentication and Authorization Middleware
var auth = function(req, res, next) {
	console.log(req.session);
  if (req.session.user)
    return next();
  else
    return res.render(401);
};

// all web application functions
app.get('/', auth, function(req, res) {
	res.render('index.html');
});

app.post('/login', function(req, res) {
	var params = {
		username: req.body['username'],
		password: req.body['password']
	};
	db.one('SELECT * FROM "Users" WHERE username=${username} AND password=${password}', params)
		.then(function(data) {
			req.session.user = params.username;
			res.send('login successful');
		})
		.catch(function(error) {
			res.send('login failure');
		});
});

app.post('/register', function(req, res) {

});

app.listen(8081, function () {
	console.log('Server running at http://127.0.0.1:8081/');
})
