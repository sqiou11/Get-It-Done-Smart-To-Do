/*var http = require("http");

http.createServer(function (request, response) {
	console.log('Handling request');
	response.writeHead(200, {'Content-Type': 'text/plain'});
	response.end('Hello World\n');
}).listen(8081);

console.log('Server running at http://127.0.0.1:8081/');*/

var pg = require('pg');
var express = require('express');
var app = express();

var connString = "postgres://postgres:@localhost:5432/appDB";
var client = new pg.Client(connString);
client.connect();

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

app.get('/chrome_ext_login', function(req, res) {
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