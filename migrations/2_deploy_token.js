const AkropolisToken = artifacts.require('./AkropolisToken.sol')

module.exports = function(deployer) {
	deployer.deploy(AkropolisToken);

	deployer.then(function() {
		process.deployment = {"AkropolisToken" : AkropolisToken.address};
	});
};
