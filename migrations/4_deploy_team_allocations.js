const Allocations = artifacts.require('./AllocationsManager.sol');

module.exports = function(deployer, network, accounts) {
	//Deploy Team Allocations
	deployer.deploy(Allocations);
	deployer.then(function() {
		return Allocations.deployed();
	}).then(function(instance) {
		process.deployment.TeamAllocations = instance.address;
		return instance.setAdmin(accounts[1]);
	});
};





