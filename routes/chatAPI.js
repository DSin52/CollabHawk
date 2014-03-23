var ObjectID = require('mongodb').ObjectID;
var async = require("async");
var USERS = "Users";

function postMessage(db, data, callback) {
	async.waterfall([
		function (next) {
			db.collection(USERS).findOne({"_id": ObjectID(data.userKey)}, next)
		},
		function (account, next) {
			if (account) {
				var Message = {
					"Username": account.Username, 
					"Message": data.Message
				};
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
				callback(err);
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