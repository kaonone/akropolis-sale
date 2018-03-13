var mysql = require('mysql');
var express = require('express');
var cors = require('cors');
var bodyParser = require("body-parser"); // Body parser for fetch posted data
var credentials = require('./credentials');
var connection = mysql.createConnection({
	host: credentials.host,
	user: credentials.user,
	password: credentials.password,
	database: credentials.database
});

var app = module.exports= express();
//Setup a config
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

connection.query('USE akropoli_db1', function (err) {
	if (err) throw err;
});

app.get('/kycReadyUsers', cors(), function (req, res) {
	var data = {
		"Data":""
	};
	connection.query('select * from whitelist WHERE AddedToSmartContract IS NULL and CommflagWhitelistResult = 1', function (err, rows, fields) {
		if (err) throw err;
		if(rows.length != 0) {
			console.log(data["Data"]);
			res.json(rows);
		}else {
			data["Data"] = 'No data found';
			res.json(data);
		}
	});
});

app.listen(3000);
