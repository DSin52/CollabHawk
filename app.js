
/**
 * Module dependencies.
 */

var express = require('express.io');
var http = require('http');
var path = require('path');
var userAPI = require("./routes/userAPI.js");
var chatAPI = require("./routes/chatAPI.js");
var MongoClient = require("mongodb").MongoClient;

var _db;
app = require('express.io')()
app.http().io()

// all environments
app.set('port', process.env.PORT || 3000);
app.use(function (req, res, next) {
	MongoClient.connect("mongodb://127.0.0.1:27017/CollabHawk", function (err, db) {
		if (err) {
			throw err;
		}

		req.db = db;
		_db = db;
		next();
	});
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.bodyParser());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Send client html.
app.get('/', function(req, res) {
    res.render("index");
});

app.post("/user/create", function (req, res) {
	userAPI.createUser(req, res);
});

app.post("/user/login", function (req, res) {
	userAPI.findUser(req, res);
});

app.post("/chat/join/:room", function (req, res) {
	chatAPI.getAllMessages(_db, function (err, results) {
		if (err) {
			res.send(500);
			throw err;
		} else {
			res.send(200, results);
		}
	});
});

app.post("/chat/message/:room", function (req, res) {
	chatAPI.postMessage(req, res);
});

app.get("/test", function (req, res) {
	chatAPI.getAllMessages(_db, "Rust Library", function (err, result) {
		res.send(result);
	});
})

app.io.route("join_room", function (req) {
	console.log(req.data);
	req.io.join(req.data);
	app.io.room(req.data).broadcast("num_clients", {
		"clients": app.io.sockets.clients(req.data).length,
	});
	chatAPI.getAllMessages(_db, req.data, function (err, results) {
		console.log(results);
			req.io.emit("joined_room", {"Username": req.data.Username, "messages": results});
	});
});

app.io.route("add_message", function (req) {
	//was app before
	req.io.room(req.data.room).broadcast("new_message", {
		"Username": req.data.Username,
		"Message": req.data.Message
	});
	chatAPI.postMessage(_db, req.data, function () {
		req.io.emit("added_message", {"Username": req.data.Username, "Message": req.data.Message});
	});
});

app.io.route("leave_room", function (req) {
	req.io.leave(req.data);
	app.io.room(req.data).broadcast("num_clients", {
		"message": app.io.sockets.clients(req.data).length
	});
});

app.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
