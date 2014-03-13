var ObjectID = require('mongodb').ObjectID;
var async = require("async");

// function postMessage(req, res, callback) {
// 	async.waterfall([
// 		function (next) {
// 			req.db.collection("Users").findOne({"_id": ObjectID(req.query.userKey)}, next)
// 		},
// 		function (account, next) {
// 			if (account) {
// 				var Message = {
// 					"Username": account.Username, 
// 					"Message": req.body.Message
// 				};
// 				next(null, Message);
// 			} else {
// 				next("User not found!");
// 			}
// 		},
// 		function (message, next) {
// 			req.db.collection(req.params.room).insert({"Username": message.Username, "said": message.Message}, next);
// 		}
// 	],
// 		function (err, results) {
// 			if (err) {
// 				if (err === "User not found!") {
// 					res.send(404, {Error: err});
// 				} else {
// 					res.send(res.statusCode, {Error: err});
// 					throw err;
// 				}
// 			} else {
// 				res.send(201);
// 				if (callback) {
// 					callback();
// 				}
// 			}
// 	});
// };

function postMessage(db, data, callback) {
	async.waterfall([
		function (next) {
			db.collection("Users").findOne({"_id": ObjectID(data.userKey)}, next)
		},
		function (account, next) {
			if (account) {
				var Message = {
					"Username": account.Username, 
					"Message": data.Message
				};
				console.log("Userkey is: " + data.userKey);
				next(null, Message);
			} else {
				next("User not found!");
			}
		},
		function (message, next) {
			db.collection(data.room).insert({"Username": message.Username, "said": message.Message}, next);
		}
	],
		function (err, results) {
			if (err) {
				console.log(err);
			} else {
				callback();
			}
	});
};

function getAllMessages(db, room, callback) {
	db.collection(room).find({}, 
			{
				"Username": 1,
				"said": 1,
				"_id": 0
			}).toArray(callback);
};

module.exports.postMessage = postMessage;
module.exports.getAllMessages = getAllMessages;