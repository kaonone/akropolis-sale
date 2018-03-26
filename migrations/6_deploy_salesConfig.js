const SalesConfiguration = artifacts.require('./SaleConfiguration.sol');

module.exports = function(deployer, network, accounts) {
	deployer.deploy(SalesConfiguration);
	deployer.then(function() {
		return SalesConfiguration.deployed();
	}).then(function(instance) {
		process.deployment.SalesConfiguration = instance.address;
	});
};
