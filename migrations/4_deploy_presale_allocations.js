const Allocations = artifacts.require('./AllocationsManager.sol');

module.exports = function(deployer, network, accounts) {
	deployer.deploy(Allocations);

	deployer.then(function() {
		process.deployment.PresaleAllocations = Allocations.address;
		return Allocations.deployed();
	}).then(function(instance) {
		return instance.setAdmin(accounts[1]);
	});
};





