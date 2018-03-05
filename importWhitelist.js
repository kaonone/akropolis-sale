var mysql = require('mysql');

var con = mysql.createConnection({
	host: "akropoliswhitelist-cluster-1.cluster-c0fjtlecu7ih.eu-west-2.rds.amazonaws.com",
	user: "akropoli_db1",
	password: "Our password!",
	database: "akropoli_db1"
});

con.connect(function(err) {
	if (err) throw err;
	con.query("select * from whitelist WHERE AddedToSmartContract IS NULL and CommflagWhitelistResult = 1", function (err, result, fields) {
		if (err) throw err;
		console.log(result);

		for(var i =0; i<result.length; i++)
		{
			var ID = result[i].ID;
			var EthAddress = result[i].EthAddress;
			var Tier = result[i].Tier;
			console.log("The result is: "+ ID + " Has address: " + EthAddress + " And Tier: " + Tier);

			//From here we will want to call whitelist. Need to make decision if we will have bundled whitelist adding to reduce transaction times.
		}


	});
});