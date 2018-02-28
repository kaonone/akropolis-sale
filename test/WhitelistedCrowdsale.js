import { advanceBlock } from './tools/advanceToBlock';
import { increaseTimeTo, duration } from './tools/increaseTime';
import latestTime from './tools/latestTime';

const AkropolisToken = artifacts.require('./AkropolisToken.sol');
const WhitelistedCrowdsale = artifacts.require('./WhitelistedCrowdsale.sol');
const Whitelist = artifacts.require('./Whitelist.sol');
const SaleConfigurationMock = artifacts.require('./SaleConfigurationMock.sol');

const BigNumber = web3.BigNumber;

const should = require('chai')
	.use(require('chai-as-promised'))
	.use(require('chai-bignumber')(BigNumber))
	.should();

function ether (n) {
	return new web3.BigNumber(web3.toWei(n, 'ether'));
}

contract('Whitelisted Crowdsale', function ([owner, admin, buyer1, buyer2, buyer3, wallet, notAdded]) {

	let whitelist, crowdsale, config, startTime, endTime, roundDuration;
	let minTier1, minTier2, minTier3, maxTier1, maxTier2, maxTier3;

	before(async function () {
		// Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
		await advanceBlock();

		startTime = latestTime() + duration.weeks(1);
		endTime = startTime + duration.weeks(2);

		config = await SaleConfigurationMock.new();
		roundDuration = parseInt(await config.ROUND_DURATION());
		whitelist = await Whitelist.new();
		crowdsale = await WhitelistedCrowdsale.new(startTime, endTime, whitelist.address, config.address);

		minTier1 = (await config.MIN_TIER_1());
		minTier2 = (await config.MIN_TIER_2());
		minTier3 = (await config.MIN_TIER_3());
		maxTier1 = (await config.MAX_TIER_1());
		maxTier2 = (await config.MAX_TIER_2());
		maxTier3 = (await config.MAX_TIER_3());

		await increaseTimeTo(startTime);
	});

	it('should define correct round end times', async function () {
		(await crowdsale.startTime()).should.be.bignumber.equal(startTime);
		(await crowdsale.round1EndTime()).should.be.bignumber.equal(startTime + roundDuration);
		(await crowdsale.round2EndTime()).should.be.bignumber.equal(startTime + roundDuration + roundDuration);
		(await crowdsale.endTime()).should.be.bignumber.equal(endTime);
	});


	it('should allow the owner to define an admin', async function () {
		await whitelist.setAdmin(admin).should.be.fulfilled;
	});


	it('should allow adding buyers with different tiers', async function () {
		await whitelist.addToWhitelist(buyer1, 1, {from: admin});
		await whitelist.addToWhitelist(buyer2, 2, {from: admin});
		await whitelist.addToWhitelist(buyer3, 3, {from: admin});
	});


	it('should have correct caps and admissions in round 1', async function () {
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(1);

		(await crowdsale.isBuyerAdmitted(buyer1)).should.be.equal(true);
		(await crowdsale.isBuyerAdmitted(buyer2)).should.be.equal(false);
		(await crowdsale.isBuyerAdmitted(buyer3)).should.be.equal(false);

		(await crowdsale.getMin(buyer1)).should.be.bignumber.equal(minTier1);
		(await crowdsale.getCap(buyer1)).should.be.bignumber.equal(maxTier1);
	});

	it('should have correct caps and admissions in round 2', async function () {
		await increaseTimeTo(startTime + duration.days(3));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(2);

		(await crowdsale.isBuyerAdmitted(buyer1)).should.be.equal(true);
		(await crowdsale.isBuyerAdmitted(buyer2)).should.be.equal(true);
		(await crowdsale.isBuyerAdmitted(buyer3)).should.be.equal(false);

		(await crowdsale.getMin(buyer1)).should.be.bignumber.equal(minTier1);
		(await crowdsale.getCap(buyer1)).should.be.bignumber.equal(maxTier1);
		(await crowdsale.getMin(buyer2)).should.be.bignumber.equal(minTier2);
		(await crowdsale.getCap(buyer2)).should.be.bignumber.equal(maxTier2);
	});

	it('should be able to modify round 1 end time', async function () {
		(await crowdsale.setRound1EndTime(startTime + duration.days(4)));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(1);
	});

	it('should have correct caps and admissions in round 3', async function () {
		await increaseTimeTo(startTime + duration.days(6));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(3);

		(await crowdsale.isBuyerAdmitted(buyer1)).should.be.equal(true);
		(await crowdsale.isBuyerAdmitted(buyer2)).should.be.equal(true);
		(await crowdsale.isBuyerAdmitted(buyer3)).should.be.equal(true);

		(await crowdsale.getMin(buyer1)).should.be.bignumber.equal(0);
		(await crowdsale.getCap(buyer1)).should.be.bignumber.equal(maxTier1);
		(await crowdsale.getMin(buyer2)).should.be.bignumber.equal(0);
		(await crowdsale.getCap(buyer2)).should.be.bignumber.equal(maxTier2);
		(await crowdsale.getMin(buyer3)).should.be.bignumber.equal(0);
		(await crowdsale.getCap(buyer3)).should.be.bignumber.equal(maxTier3);
	});

	it('should be able to modify round 2 end time', async function () {
		(await crowdsale.setRound2EndTime(startTime + duration.days(7)));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(2);
	});

});