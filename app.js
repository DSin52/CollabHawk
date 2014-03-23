
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

app.use(express.bodyParser());

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

/*
 * API Endpoints
 * ===============================================================================
 */
app.post("/user/create", userAPI.createUser);

app.post("/user/login", userAPI.findUser);

app.post("/chat/join/:room", function (req, res) {
	chatAPI.getAllMessages(_db, function (err, results) {
		if (err) {
			res.send(500, err);
		} else {
			res.send(200, results);
		}
	});
});

app.get("/chat/:room", function (req, res) {
	var numClients = app.io.sockets.clients(req.params.room).length;
	console.log("Clients: " + numClients);
	res.send(200, {"num_clients": numClients});
});

app.post("/chat/message/:room", chatAPI.postMessage);

/*
 * Socket Endpoints
 * ===============================================================================
 */
app.io.route("join_room", function (req) {
	req.io.join(req.data);
	// app.io.room(req.data).broadcast("num_clients", {
	// 	"clients": app.io.sockets.clients(req.data).length,
	// });
	console.log("Number connected: " + app.io.sockets.clients(req.data).length);
	chatAPI.getAllMessages(_db, req.data, function (err, results) {
			req.io.emit("joined_room", {"Username": req.data.Username, "messages": results});
	});
});

app.io.route("add_message", function (req) {
	req.io.room(req.data.room).broadcast("new_message", {
		"Username": req.data.Username,
		"Message": req.data.Message
	});
	console.log("Username: " + req.data.Username + " said: " + req.data.Message);
	chatAPI.postMessage(_db, req.data, function (err) { 
		if (err) {
			console.log(err);
		} else {
			req.io.emit("added_message", {"Username": req.data.Username, "Message": req.data.Message});
		}
	});
});

app.io.route("leave_room", function (req) {
	req.io.leave(req.data);
	console.log("User left room");
	app.io.room(req.data).broadcast("num_clients", {
		"message": app.io.sockets.clients(req.data).length
	});
});

app.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
