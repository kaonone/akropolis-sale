import { advanceBlock } from './tools/advanceToBlock';
import { increaseTimeTo, duration } from './tools/increaseTime';
import latestTime from './tools/latestTime';

const AkropolisToken = artifacts.require('./AkropolisToken.sol');
const AkropolisCrowdsale = artifacts.require('./AkropolisCrowdsale.sol');

const BigNumber = web3.BigNumber;

const should = require('chai')
	.use(require('chai-as-promised'))
	.use(require('chai-bignumber')(BigNumber))
	.should();

function ether (n) {
	return new web3.BigNumber(web3.toWei(n, 'ether'));
}

contract('Akropolis Crowdsale', function ([owner, admin, buyer, wallet]) {

	let token, crowdsale;
	let startTime, endTime, afterEndTime;

	before(async function () {
		// Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
		await advanceBlock();

		startTime = latestTime() + duration.weeks(1);
		endTime = startTime + duration.weeks(1);
		afterEndTime = endTime + duration.seconds(1);

		crowdsale = await AkropolisCrowdsale.new(startTime, endTime, wallet);
		token = AkropolisToken.at(await crowdsale.token());
	});


	it('should create the sale with the correct parameters', async function () {
		(await crowdsale.startTime()).should.be.bignumber.equal(startTime);
		(await crowdsale.endTime()).should.be.bignumber.equal(endTime);
		(await crowdsale.wallet()).should.be.equal(wallet);
	});


	it('should not accept money before the start', async function() {
		await crowdsale.buyTokens(buyer, {from: buyer, value: ether(1)}).should.be.rejectedWith('revert');
	});


	it('should not accept non-whitelisted users after the start', async function() {
		await increaseTimeTo(startTime);
		await crowdsale.buyTokens(buyer, {from: buyer, value: ether(1)}).should.be.rejectedWith('revert');
	});


	it('should not allow for invalid wallet change address', async function() {
		await crowdsale.changeWallet(0x0, {from: owner}).should.be.rejectedWith('revert');
	});


	it('should not allow wallet change by anyone but owner', async function() {
		await crowdsale.changeWallet(wallet, {from: wallet}).should.be.rejectedWith('revert');
		await crowdsale.changeWallet(wallet, {from: buyer}).should.be.rejectedWith('revert');
	});


	it('should not allow releasing token by anyone but owner', async function() {
		await crowdsale.releaseToken(wallet, {from: wallet}).should.be.rejectedWith('revert');
		await crowdsale.releaseToken(wallet, {from: buyer}).should.be.rejectedWith('revert');
	});


	it('should allow owner to change wallet', async function() {
		await crowdsale.changeWallet(buyer, {from: owner}).should.be.fulfilled;
		(await crowdsale.wallet()).should.be.equal(buyer);
		await crowdsale.changeWallet(wallet, {from: owner}).should.be.fulfilled;
		(await crowdsale.wallet()).should.be.equal(wallet);
	});


	it('should set up increasing cap', async function() {
		await crowdsale.setBaseCap(ether(3), {from: owner}).should.be.fulfilled;
		await crowdsale.setMaxCap(ether(10), {from: owner}).should.be.fulfilled;
		await crowdsale.setRoundDuration(duration.days(1), {from: owner}).should.be.fulfilled;

		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(1);
		(await crowdsale.getCurrentCap()).should.be.bignumber.equal(ether(3));
		(await crowdsale.getAvailableCap(buyer)).should.be.bignumber.equal(ether(3));
	});


	it('should accept whitelisted users and update available cap', async function() {
		await crowdsale.setAdmin(admin);
		await crowdsale.addToWhitelist(buyer, {from: admin});

		await crowdsale.buyTokens(buyer, {from: buyer, value: ether(1)}).should.be.fulfilled;

		(await crowdsale.getAvailableCap(buyer)).should.be.bignumber.equal(ether(2));
	});


	it('should not allow exceeding the available cap', async function() {
		await crowdsale.buyTokens(buyer, {from: buyer, value: ether(2.01)}).should.be.rejectedWith('revert');
	});

});