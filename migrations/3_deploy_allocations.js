const Allocations = artifacts.require('./AllocationsManager.sol');

module.exports = async function(deployer, network, accounts) {
	await deployer.deploy(Allocations);
	let presaleAllocations = await Allocations.deployed();
	await presaleAllocations.setAdmin(accounts[0]);
	process.deployment.PresaleAllocations = presaleAllocations.address;

	await deployer.deploy(Allocations);
	let teamAllocations = await Allocations.deployed();
	await teamAllocations.setAdmin(accounts[0]);
	process.deployment.TeamAllocations = teamAllocations.address;

	await deployer.deploy(Allocations);
	let advisorsAllocations = await Allocations.deployed();
	await advisorsAllocations.setAdmin(accounts[0]);
	process.deployment.AdvisorsAllocations = advisorsAllocations.address;
};





