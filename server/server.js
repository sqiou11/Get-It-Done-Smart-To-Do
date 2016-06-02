/*var http = require("http");

http.createServer(function (request, response) {
	console.log('Handling request');
	response.writeHead(200, {'Content-Type': 'text/plain'});
	response.end('Hello World\n');
}).listen(8081);

console.log('Server running at http://127.0.0.1:8081/');*/

var pgp = require('pg-promise')();
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var db = pgp("postgres://postgres:@localhost:5432/appDB");

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



// all web application functions
app.get('/', function(req, res) {
	res.send('hello world');
});

app.get('/login', function(req, res) {
	console.log(req.query);
	console.log('login attempt with username = ' + req.query['username'] + ' password = ' + req.query['password']);
	var query = client.query('SELECT * FROM "Users" WHERE username=$1 AND password=$2', [req.query['username'], req.query['password']]);

	query.on('error', function(error) {
		console.log(error);
		res.send('login error');
	});
	query.on('row', function(row, result) {
		result.addRow(row);
	});
	query.on('end', function(result) {
		if(result.rows.length > 0)
			res.send('login successful');
		else
			res.send('login failure');
	});
});

app.post('/register', function(req, res) {

});

app.listen(8081, function () {
	console.log('Server running at http://127.0.0.1:8081/');
})