const Whitelist = artifacts.require('./Whitelist.sol');

module.exports = function(deployer, network, accounts) {
	deployer.deploy(Whitelist);
	deployer.then(function(){
		return Whitelist.deployed();
	}).then(function(instance){
		instance.setAdmin(accounts[1]);
		process.deployment = {"Whitelist" : instance.address};
	});
};
