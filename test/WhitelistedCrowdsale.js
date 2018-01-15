import { advanceBlock } from './tools/advanceToBlock';
import { increaseTimeTo, duration } from './tools/increaseTime';
import latestTime from './tools/latestTime';

const AkropolisToken = artifacts.require('./AkropolisToken.sol');
const WhitelistedCrowdsale = artifacts.require('./WhitelistedCrowdsale.sol');

const BigNumber = web3.BigNumber;

const should = require('chai')
	.use(require('chai-as-promised'))
	.use(require('chai-bignumber')(BigNumber))
	.should();

function ether (n) {
	return new web3.BigNumber(web3.toWei(n, 'ether'));
}

contract('Whitelisted Crowdsale', function ([owner, admin, buyer, wallet]) {

	let token, crowdsale;

	before(async function () {
		// Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
		await advanceBlock();

		var startTime = latestTime() + duration.weeks(1);
		var endTime = startTime + duration.weeks(1);
		var rate = 10;

		crowdsale = await WhitelistedCrowdsale.new(startTime, endTime, rate, wallet);
		token = AkropolisToken.at(await crowdsale.token());
		await increaseTimeTo(startTime);
	});


	it('should not allow non-whitelisted buyer to purchase tokens', async function () {
		await crowdsale.buyTokens(buyer, {from: buyer, value: ether(1)}).should.be.rejectedWith('revert');
	});


	it('should allow the owner to define an admin', async function () {
		await crowdsale.setAdmin(admin).should.be.fulfilled;
	});


	it('should allow whitelisted buyers to purchase tokens', async function () {
		await crowdsale.addToWhitelist(buyer, {from: admin});
		(await crowdsale.isWhitelisted(buyer)).should.be.equal(true);

		await crowdsale.buyTokens(buyer, {from: buyer, value: ether(1)}).should.be.fulfilled;
	});


	it('should allow admin to remove buyer from the whitelist', async function () {
		await crowdsale.removeFromWhitelist(buyer, {from: admin});
		(await crowdsale.isWhitelisted(buyer)).should.be.equal(false);

		await crowdsale.buyTokens(buyer, {from: buyer, value: ether(1)}).should.be.rejectedWith('revert');
	});

});