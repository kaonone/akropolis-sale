const SalesConfiguration = artifacts.require('./SaleConfiguration.sol');

module.exports = async function(deployer, network, accounts) {
	await deployer.deploy(SalesConfiguration);
	process.deployment.SalesConfiguration = SalesConfiguration.address;
};