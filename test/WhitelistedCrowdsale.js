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

contract('Whitelisted Crowdsale', function ([owner, admin, buyer, wallet, notAdded]) {

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


	it('should not allow anyone but the owner to define an admin', async function () {
		await crowdsale.setAdmin(admin, {from: buyer}).should.be.rejectedWith('revert');
		await crowdsale.setAdmin(admin, {from: wallet}).should.be.rejectedWith('revert');
		await crowdsale.setAdmin(admin, {from: admin}).should.be.rejectedWith('revert');
	});


	it('should not allow setting admin to a null account', async function () {
		await crowdsale.setAdmin(0x0, {from: owner}).should.be.rejectedWith('revert');
	});


	it('should allow the owner to define an admin', async function () {
		await crowdsale.setAdmin(admin).should.be.fulfilled;
	});


	it('should not allow anyone but the admin to add to whitelist', async function () {
		await crowdsale.addToWhitelist(buyer, {from: buyer}).should.be.rejectedWith('revert');
		await crowdsale.addToWhitelist(buyer, {from: wallet}).should.be.rejectedWith('revert');
		await crowdsale.addToWhitelist(wallet, {from: owner}).should.be.rejectedWith('revert');
	});


	it('should not allow a null address to be whitelisted', async function () {
		await crowdsale.addToWhitelist(0x0, {from: admin}).should.be.rejectedWith('revert');
	});


	it('should allow whitelisted buyers to purchase tokens', async function () {
		await crowdsale.addToWhitelist(buyer, {from: admin});
		(await crowdsale.isWhitelisted(buyer)).should.be.equal(true);

		await crowdsale.buyTokens(buyer, {from: buyer, value: ether(1)}).should.be.fulfilled;
	});


	it('should not allow adding the same user to the whitelist twice', async function () {
		await crowdsale.addToWhitelist(buyer, {from: admin}).should.be.rejectedWith('revert');
	});


	it('should not allow anyone but the admin to remove addresses from whitelist', async function () {
		await crowdsale.removeFromWhitelist(buyer, {from: buyer}).should.be.rejectedWith('revert');
		await crowdsale.removeFromWhitelist(buyer, {from: wallet}).should.be.rejectedWith('revert');
		await crowdsale.removeFromWhitelist(buyer, {from: owner}).should.be.rejectedWith('revert');
	});


	it('should allow admin to remove buyer from the whitelist', async function () {
		await crowdsale.removeFromWhitelist(buyer, {from: admin});
		(await crowdsale.isWhitelisted(buyer)).should.be.equal(false);

		await crowdsale.buyTokens(buyer, {from: buyer, value: ether(1)}).should.be.rejectedWith('revert');
	});


	it('should not allow removing the same address more than once', async function () {
		await crowdsale.removeFromWhitelist(0x0, {from: admin}).should.be.rejectedWith('revert');
	});


	it('should not allow removing a user that has not been added to the whitelist', async function () {
		await crowdsale.removeFromWhitelist(notAdded, {from: admin}).should.be.rejectedWith('revert');
	});

});