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

var appEnv = {
	db: db
};

routes = require('./routes')(app, appEnv);

/*nunjucks.configure('views', {
  autoescape: true,
  express: app
});*/

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
	//res.render('index.html');
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
