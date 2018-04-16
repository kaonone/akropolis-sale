const config = require('../deployment-config.json');
const Allocations = artifacts.require('./AllocationsManager.sol');
const fs = require('fs');

module.exports = function(deployer, network, accounts) {
	deployer.deploy(Allocations);

	deployer.then(function() {
		process.deployment.AdvisorsAllocations = Allocations.address;
		return Allocations.deployed();
	}).then(function(instance) {
		return instance.setAdmin(config.adminAccount);
	}).then(function() {
		console.log(process.deployment);
		fs.writeFile('../migrations-sale/before-sale-deployment.json', JSON.stringify(process.deployment), 'utf8', function(err) {
			if (err) console.log("Error while writing deployment addresses: " + err);
		});
	});
};
