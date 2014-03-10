var async = require("async");
var bcrypt = require("bcrypt");
var USERS = "Users";

function createUser(req, res, callback) {
	var userAccount = {
		"Email": req.body.Email,
		"First_Name": req.body.First_Name,
		"Last_Name": req.body.Last_Name,
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
			res.send(res.statusCode, {"Error": err});
			throw err;
		} else {
			console.log(user);
			res.send(201, {"userKey": user[0]._id});
			if (callback) {
				callback();
			}
		}
	});
};

function checkExists(db, account, callback) {
	async.waterfall([
		function (next) {
			db.collection(USERS).findOne({"Email": account.Email}, next);
		},
		function (user, next) {
			if (user) {
				next("Email already exists!");
			} else {
				db.collection(USERS).findOne({"Username": account.Username}, next);
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
	console.log(password);
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