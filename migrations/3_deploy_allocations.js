const Allocations = artifacts.require('./AllocationsManager.sol');

module.exports = async function(deployer, network, accounts) {
	await deployer.deploy(Allocations);
	let presaleAllocations = await Allocations.deployed();
	await presaleAllocations.setAdmin(accounts[0]);

	await deployer.deploy(Allocations);
	let teamAllocations = await Allocations.deployed();
	await teamAllocations.setAdmin(accounts[0]);

	await deployer.deploy(Allocations);
	let advisorsAllocations = await Allocations.deployed();
	await advisorsAllocations.setAdmin(accounts[0]);

};





