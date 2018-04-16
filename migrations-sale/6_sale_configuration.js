const SaleConfiguration = artifacts.require('./SaleConfiguration.sol');
const before_sale_deployment = require('./before-sale-deployment.json');

module.exports = function(deployer) {
	deployer.deploy(SaleConfiguration);

	deployer.then(function() {
		process.deployment = before_sale_deployment;
		return process.deployment.SaleConfiguration = SaleConfiguration.address;
	});
};
