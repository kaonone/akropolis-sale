const Allocations = artifacts.require('./AllocationsManager.sol');

module.exports = function(deployer, network, accounts) {
	deployer.deploy(Allocations);
	deployer.then(function(){
		return Allocations.deployed();
	}).then(function(instance){
		instance.setAdmin(accounts[1]);
		process.deployment.PresaleAllocations = instance.address;
	});

	deployer.deploy(Allocations);
	deployer.then(function(){
		return Allocations.deployed();
	}).then(function(instance){
		instance.setAdmin(accounts[1]);
		process.deployment.TeamAllocations = instance.address;
	});

	deployer.deploy(Allocations);
	deployer.then(function(){
		return Allocations.deployed();
	}).then(function(instance){
		instance.setAdmin(accounts[1]);
		process.deployment.AdvisorsAllocations = instance.address;
	});
};





