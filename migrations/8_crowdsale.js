const AkropolisCrowdsale = artifacts.require('./AkropolisCrowdsale.sol');
const fs = require('fs');

const duration = {
	seconds: function (val) { return val; },
	minutes: function (val) { return val * this.seconds(60); },
	hours: function (val) { return val * this.minutes(60); },
	days: function (val) { return val * this.hours(24); }
};

module.exports = function(deployer, network, accounts) {
	//TODO: Put real data before the production deployment
	var startTime = Math.floor(Date.now() / 1000) + duration.minutes(5);
	var endTime = startTime + duration.days(7);
	var wallet = accounts[2];

	deployer.deploy(AkropolisCrowdsale, startTime, endTime, wallet, process.deployment.Whitelist, process.deployment.SaleConfiguration, {gas: 7000000});
	deployer.then(function() {
		return process.deployment.AkropolisCrowdsale = AkropolisCrowdsale.address;
	}).then(function() {
		console.log(process.deployment);
		fs.writeFile('build/deployment.json', JSON.stringify(process.deployment), 'utf8', function(err) {
			if (err) console.log("Error while writing deployment addresses: " + err);
		});
	})
};
