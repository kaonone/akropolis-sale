import { advanceBlock } from '.././tools/advanceToBlock';
import { increaseTimeTo, duration } from '.././tools/increaseTime';
import latestTime from '.././tools/latestTime';

const AkropolisToken = artifacts.require('./AkropolisToken.sol');
const AkropolisCrowdsale = artifacts.require('./AkropolisCrowdsale.sol');
const Whitelist = artifacts.require('./Whitelist.sol');
const SaleConfiguration = artifacts.require('./SaleConfiguration.sol');
const AllocationsManager = artifacts.require('./AllocationsManager.sol');

const BigNumber = web3.BigNumber;

const should = require('chai')
	.use(require('chai-as-promised'))
	.use(require('chai-bignumber')(BigNumber))
	.should();

function ether (n) {
	return new web3.BigNumber(web3.toWei(n, 'ether'));
}

contract('Akropolis TGE Scenario', function ([owner, admin, wallet, buyer1, buyer2, buyer3, investor1, investor2, investor3,
																						presaleAllocations, teamAllocations, advisorsAllocations,
																						reserveFund, bountyFund, developmentFund]) {

	const ALLOCATED_VALUE = 100;
	const ALLOCATED_VESTING = 200;
	const VESTING_PERIOD = 1000;

	const CONTRIBUTION_AMOUNT = ether(1);

	let token, crowdsale, whitelist, config, allocations;
	let startTime, endTime, afterEndTime;

	before(async function () {
		// Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
		await advanceBlock();

		startTime = latestTime() + duration.weeks(1);
		endTime = startTime + duration.weeks(1);
		afterEndTime = endTime + duration.seconds(1);
	});

	it('should deploy AET token', async function () {
		token = await AkropolisToken.new().should.be.fulfilled;
		await token.pause().should.be.fulfilled;
	});


	it('should deploy Whitelist', async function () {
		whitelist = await Whitelist.new().should.be.fulfilled;
	});


	it('should register 3 users to the whitelist', async function () {
		await whitelist.setAdmin(admin);
		await whitelist.addToWhitelist(buyer1, {from: admin}).should.be.fulfilled;
		await whitelist.addToWhitelist(buyer2, {from: admin}).should.be.fulfilled;
		await whitelist.addToWhitelist(buyer3, {from: admin}).should.be.fulfilled;
	});


	it('should deploy pre-sale allocations', async function() {
		allocations = await AllocationsManager.new().should.be.fulfilled;
	});


	it('should register 3 investors', async function() {
		await allocations.setAdmin(admin);

		await allocations.registerAllocation(investor1, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_PERIOD, {from: admin}).should.be.fulfilled;
		await allocations.registerAllocation(investor2, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_PERIOD, {from: admin}).should.be.fulfilled;
		await allocations.registerAllocation(investor3, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_PERIOD, {from: admin}).should.be.fulfilled;
	});


	it('should deploy Config', async function () {
		config = await SaleConfiguration.new().should.be.fulfilled;
	});


	it('should deploy crowdsale and connect to token and allocations contracts', async function() {
		crowdsale = await AkropolisCrowdsale.new(startTime, endTime, wallet, whitelist.address, config.address).should.be.fulfilled;
		await crowdsale.setAdmin(admin);
		await token.transferOwnership(crowdsale.address).should.be.fulfilled;
		await crowdsale.setToken(token.address).should.be.fulfilled;
		await crowdsale.setBaseCap(ether(3), {from: owner}).should.be.fulfilled;
		await crowdsale.setMaxCap(ether(10), {from: owner}).should.be.fulfilled;
		await crowdsale.setRoundDuration(duration.days(1), {from: owner}).should.be.fulfilled;
	});


	it('should sell tokens to whitelisted users', async function() {
		await increaseTimeTo(startTime + duration.days(1));
		await crowdsale.buyTokens(buyer1, {from: buyer1, value: CONTRIBUTION_AMOUNT}).should.be.fulfilled;
		await crowdsale.buyTokens(buyer2, {from: buyer2, value: CONTRIBUTION_AMOUNT}).should.be.fulfilled;
		await crowdsale.buyTokens(buyer3, {from: buyer3, value: CONTRIBUTION_AMOUNT}).should.be.fulfilled;
	});


	it('should finalize crowdsale', async function() {

		await increaseTimeTo(endTime + 1);

		await crowdsale.setPresaleAllocations(presaleAllocations, {from: owner});
		await crowdsale.setTeamAllocations(teamAllocations, {from: owner});
		await crowdsale.setAdvisorsAllocations(advisorsAllocations, {from: owner});
		await crowdsale.setReserveFund(reserveFund, {from: owner});
		await crowdsale.setBountyFund(bountyFund, {from: owner});
		await crowdsale.setDevelopmentFund(developmentFund, {from: owner});

		await crowdsale.finalize({from: owner}).should.be.fulfilled;
	});


	it('should distribute tokens among pre-sale users', async function() {

	});

});