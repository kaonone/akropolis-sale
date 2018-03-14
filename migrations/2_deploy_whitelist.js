const Whitelist = artifacts.require('./Whitelist.sol');

module.exports = async function(deployer, network, accounts) {
	await deployer.deploy(Whitelist);
	let whitelist = await Whitelist.deployed();
	await whitelist.setAdmin(accounts[1]);
	process.deployment = {"Whitelist" : whitelist.address};
};
