const Allocations = artifacts.require('./AllocationsManager.sol');

module.exports = async function(deployer, network, accounts) {
	await deployer.deploy(Allocations);
	let allocations = await Allocations.deployed();
	await allocations.setAdmin(accounts[0]);
};





