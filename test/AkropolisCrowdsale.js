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

contract('Akropolis Crowdsale', function ([owner, investor, wallet]) {

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
		await crowdsale.send(ether(1), {from: investor}).should.be.rejectedWith('revert');
	});

	it('should buy tokens after the start', async function() {
		await await increaseTimeTo(startTime);
		await crowdsale.send(ether(1), {from: investor}).should.be.fulfilled;
	});

});