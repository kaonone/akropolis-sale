const SaleConfiguration = artifacts.require('./SaleConfiguration.sol');

module.exports = function(deployer) {
	deployer.deploy(SaleConfiguration);

	deployer.then(function() {
		return process.deployment.SaleConfiguration = SaleConfiguration.address;
	});
};
