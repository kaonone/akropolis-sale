var mysql = require('mysql');
var express = require('express');
var cors = require('cors');
var bodyParser = require("body-parser"); // Body parser for fetch posted data
var connection = mysql.createConnection({
	host: "akropoliswhitelist-cluster-1.cluster-c0fjtlecu7ih.eu-west-2.rds.amazonaws.com",
	user: "akropoli_db1",
	password: "Anonymous",
	database: "akropoli_db1"
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
			data["Data"] = rows;
			console.log(data["Data"]);
			res.json(data);
		}else {
			data["Data"] = 'No data found';
			res.json(data);
		}
	});
});

app.listen(3000);
