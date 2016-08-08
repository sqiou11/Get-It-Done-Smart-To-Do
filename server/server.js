var pgp = require('pg-promise')();
var express = require('express'),
		app = express()
var bodyParser = require('body-parser');

app.use(express.static(__dirname + '/public'));
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



// Authentication and Authorization Middleware
var auth = function(req, res, next) {
	console.log(req.session);
  if (req.session.user)
    return next();
  else
    return res.render(401);
};

// all web application functions
app.get('*', function(req, res) {
	var options = {
    root: __dirname + '/public/',
  };
	res.sendFile('index.html', options, function (err) {
    if (err) {
      console.log(err);
      res.status(err.status).end();
    }
    else {
      console.log('Sent');
    }
	});
});


app.listen(8081, function () {
	console.log('Server running at http://127.0.0.1:8081/');
})
