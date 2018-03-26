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
};





