var mysql = require('mysql');

module.exports= {
	buyerArrays : function () {

		var buyersAddresses = [];
		var buyersTiers = [];

		var con = mysql.createConnection({
			host: "akropoliswhitelist-cluster-1.cluster-c0fjtlecu7ih.eu-west-2.rds.amazonaws.com",
			user: "akropoli_db1",
			password: "Anonymous",
			database: "akropoli_db1"
		});

		con.connect(function(err) {
			if (err) throw err;
			con.query("select * from whitelist WHERE AddedToSmartContract IS NULL and CommflagWhitelistResult = 1", function (err, result, fields) {
				if (err) throw err;
				console.log(result);

				for(var i =0; i<result.length; i++)
				{
					buyersAddresses.push(result[i].EthAddress);
					buyersTiers.push(result[i].Tier);
				}
		});
		});
		return {
			buyerAddressing : buyersAddresses,
			buyerTierAssignment : buyersTiers
		};
	}
};

