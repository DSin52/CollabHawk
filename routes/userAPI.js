var async = require("async");
var bcrypt = require("bcrypt");
var USERS = "Users";

function createUser(req, res, callback) {
	var userAccount = {
		"Username": req.body.Username,
		"Password": req.body.Password
	};

	async.waterfall([
		function (next) {
			checkExists(req.db, userAccount, next);
		},
		function (next) {
			hashPassword(userAccount.Password, next);
		},
		function (hashedPw, next) {
			userAccount["Password"] = hashedPw;
			next(null, userAccount);
		},
		function (user, next) {
			req.db.collection(USERS).insert(user, next);
		}
	],
	function (err, user) {
		if (err) {
			return res.send(res.statusCode, {"Error": err});
			console.log(err);
		} else {
			return res.send(201, {"userKey": user[0]._id});
		}
	});
};

function findUser(req, res, callback) {
	var userAccount = {
		"Username": req.body.Username,
		"Password": req.body.Password
	};

	async.waterfall([
		function (next) {
			req.db.collection(USERS).findOne({"Username": userAccount.Username}, function (err, result) {
				if (!result) {
					next("Account with this username does not exist");
				} else {
					bcrypt.compare(userAccount.Password, result.Password, function (err, res) {
						next(err, res, result);
					});
				}
			});
		}
	],
		function (err, response, account) {
			if (err) {
				res.send(200, {"Error": err});
			} else if (!response) {
				res.send(404, {"Error": "User not found"});
			} else {
				var curAccount = {
					"Username": account.Username,
					"id": account._id
				};
				res.send(200, curAccount);
			}
		});
};

function checkExists(db, account, callback) {
	async.waterfall([
		function (next) {
			db.collection(USERS).findOne({"Username": account.Username}, next);
		},
		function (user, next) {
			if (user) {
				next("Username already exists!");
			} else {
				callback();
			}
		}
	],
	function (err, account) {
		if (err) {
			callback(err);
		} else if (account) {
			callback("Username already exists!");
		} else {
			callback();
		}
	});
};

function hashPassword(password, callback) {
	async.waterfall([
		function (next) {
			bcrypt.genSalt(3, next);
		},
		function (salt, next) {
			bcrypt.hash(password, salt, next);
		}
	], function (err, results) {
		if (err) {
			callback(new Error("Error in hashing password"));
		} else {
			callback(null, results);
		}
	});
};

module.exports.createUser = createUser;
module.exports.findUser = findUser;