const Allocations = artifacts.require('./AllocationsManager.sol');

module.exports = function(deployer, network, accounts) {
	//Deploy Presale Allocations	
	deployer.deploy(Allocations);
	deployer.then(function() {
		return Allocations.deployed();
	}).then(function(instance) {
		process.deployment.PresaleAllocations = instance.address;
		return instance.setAdmin(accounts[1]);
	});

	//Deploy Team Allocations
	deployer.deploy(Allocations);
	deployer.then(function() {
		return Allocations.deployed();
	}).then(function(instance) {
		process.deployment.TeamAllocations = instance.address;
		return instance.setAdmin(accounts[1]);
	});

	//Deploy Advisors Allocations
	deployer.deploy(Allocations);
	deployer.then(function() {
		return Allocations.deployed();
	}).then(function(instance) {
		process.deployment.AdvisorsAllocations = instance.address;
		return instance.setAdmin(accounts[1]);
	});
};





