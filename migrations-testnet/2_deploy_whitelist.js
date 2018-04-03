const Whitelist = artifacts.require('./Whitelist.sol');

module.exports = function(deployer, network, accounts) {
	deployer.deploy(Whitelist);

	deployer.then(function() {
		process.deployment = {"Whitelist" : Whitelist.address};
		return Whitelist.deployed();
	}).then(function(instance) {
		return instance.setAdmin(accounts[1]);
	});
};
