const AkropolisToken = artifacts.require('./AkropolisToken.sol');

module.exports = async function(deployer, network, accounts) {
	await deployer.deploy(AkropolisToken);
	let token = await AkropolisToken.deployed();
	await token.pause();
};
