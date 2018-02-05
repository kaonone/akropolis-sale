import { advanceBlock } from '.././tools/advanceToBlock';
import { increaseTimeTo, duration } from '.././tools/increaseTime';
import latestTime from '.././tools/latestTime';

const AkropolisToken = artifacts.require('./AkropolisToken.sol');
const AkropolisCrowdsale = artifacts.require('./AkropolisCrowdsale.sol');
const Whitelist = artifacts.require('./Whitelist.sol');
const SaleConfigurationMock = artifacts.require('./SaleConfigurationMock.sol');
const AllocationsManager = artifacts.require('./AllocationsManager.sol');
const LinearTokenVesting = artifacts.require('./LinearTokenVesting.sol');

const BigNumber = web3.BigNumber;

const should = require('chai')
	.use(require('chai-as-promised'))
	.use(require('chai-bignumber')(BigNumber))
	.should();

function ether (n) {
	return new web3.BigNumber(web3.toWei(n, 'ether'));
}

contract('Akropolis Reach Hard cap Scenario', function ([owner, admin, wallet, buyer1, buyer2, investor1, investor2, investor3,
																						reserveFund, bountyFund, developmentFund, unknown]) {

	const ALLOCATED_VALUE = 100;
	const ALLOCATED_VESTING = 200;
	const VESTING_PERIOD = duration.days(100);

	const CONTRIBUTION_AMOUNT = ether(1);

	let tokenRound1Hardcap, tokenRound2Hardcap, tokenRound3Hardcap, tokenRound4Hardcap;
	let crowdsaleRound1Hardcap, crowdsaleRound2Hardcap, crowdsaleRound3Hardcap, crowdsaleRound4Hardcap;
	let whitelist, config;
	let presaleAllocations, teamAllocations, advisorsAllocations;
	let startTime, endTime, afterEndTime;
	let tokenBuyerAmount;

	before(async function () {
		// Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
		await advanceBlock();

		startTime = latestTime() + duration.weeks(1);
		endTime = startTime + duration.days(4);
		afterEndTime = endTime + duration.seconds(1);
		tokenRound1Hardcap = await AkropolisToken.new();
		await tokenRound1Hardcap.pause();
		tokenRound2Hardcap = await AkropolisToken.new();
		await tokenRound2Hardcap.pause();
		tokenRound3Hardcap = await AkropolisToken.new();
		await tokenRound3Hardcap.pause();
		tokenRound4Hardcap = await AkropolisToken.new();
		await tokenRound4Hardcap.pause();
		whitelist = await Whitelist.new();
		await whitelist.setAdmin(admin);
		await whitelist.addToWhitelist(buyer1, {from: admin});
		await whitelist.addToWhitelist(buyer2, {from: admin});

		presaleAllocations = await AllocationsManager.new();
		await presaleAllocations.setToken(tokenRound1Hardcap.address);
		await presaleAllocations.setAdmin(admin);

		teamAllocations = await AllocationsManager.new();
		await teamAllocations.setToken(tokenRound1Hardcap.address);
		await teamAllocations.setAdmin(admin);

		advisorsAllocations = await AllocationsManager.new();
		await advisorsAllocations.setToken(tokenRound1Hardcap.address);
		await advisorsAllocations.setAdmin(admin);

		//Register some investors
		await presaleAllocations.registerAllocation(investor1, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_PERIOD, {from: admin});
		await presaleAllocations.registerAllocation(investor2, (ALLOCATED_VALUE * 2), (ALLOCATED_VESTING * 10), (VESTING_PERIOD * 2), {from: admin});
		await presaleAllocations.registerAllocation(investor3, ALLOCATED_VALUE, 0, 0, {from: admin});
	});


	it('should deploy crowdsale and connect to token and allocations contracts', async function() {
		config = await SaleConfigurationMock.new().should.be.fulfilled;
		await config.setHARD_CAP(CONTRIBUTION_AMOUNT).should.be.fulfilled;

		//Setup round 1 test
		crowdsaleRound1Hardcap = await AkropolisCrowdsale.new(startTime, endTime, wallet, whitelist.address, config.address).should.be.fulfilled;
		await crowdsaleRound1Hardcap.setAdmin(admin);
		await tokenRound1Hardcap.transferOwnership(crowdsaleRound1Hardcap.address).should.be.fulfilled;
		await crowdsaleRound1Hardcap.setToken(tokenRound1Hardcap.address).should.be.fulfilled;
		await crowdsaleRound1Hardcap.setBaseCap(CONTRIBUTION_AMOUNT, {from: owner}).should.be.fulfilled;
		await crowdsaleRound1Hardcap.setMaxCap(CONTRIBUTION_AMOUNT.mul(2), {from: owner}).should.be.fulfilled;
		await crowdsaleRound1Hardcap.setRoundDuration(duration.days(1), {from: owner}).should.be.fulfilled;

		//Setup round 2 test
		crowdsaleRound2Hardcap = await AkropolisCrowdsale.new(startTime, endTime, wallet, whitelist.address, config.address).should.be.fulfilled;
		await crowdsaleRound2Hardcap.setAdmin(admin);
		await tokenRound2Hardcap.transferOwnership(crowdsaleRound2Hardcap.address).should.be.fulfilled;
		await crowdsaleRound2Hardcap.setToken(tokenRound2Hardcap.address).should.be.fulfilled;
		await crowdsaleRound2Hardcap.setBaseCap(CONTRIBUTION_AMOUNT, {from: owner}).should.be.fulfilled;
		await crowdsaleRound2Hardcap.setMaxCap(CONTRIBUTION_AMOUNT.mul(2), {from: owner}).should.be.fulfilled;
		await crowdsaleRound2Hardcap.setRoundDuration(duration.days(1), {from: owner}).should.be.fulfilled;

		//Setup round 3 test
		crowdsaleRound3Hardcap = await AkropolisCrowdsale.new(startTime, endTime, wallet, whitelist.address, config.address).should.be.fulfilled;
		await crowdsaleRound3Hardcap.setAdmin(admin);
		await tokenRound3Hardcap.transferOwnership(crowdsaleRound3Hardcap.address).should.be.fulfilled;
		await crowdsaleRound3Hardcap.setToken(tokenRound3Hardcap.address).should.be.fulfilled;
		await crowdsaleRound3Hardcap.setBaseCap(CONTRIBUTION_AMOUNT, {from: owner}).should.be.fulfilled;
		await crowdsaleRound3Hardcap.setMaxCap(CONTRIBUTION_AMOUNT.mul(2), {from: owner}).should.be.fulfilled;
		await crowdsaleRound3Hardcap.setRoundDuration(duration.days(1), {from: owner}).should.be.fulfilled;

		//Setup round 4 test
		crowdsaleRound4Hardcap = await AkropolisCrowdsale.new(startTime, endTime, wallet, whitelist.address, config.address).should.be.fulfilled;
		await crowdsaleRound4Hardcap.setAdmin(admin);
		await tokenRound4Hardcap.transferOwnership(crowdsaleRound4Hardcap.address).should.be.fulfilled;
		await crowdsaleRound4Hardcap.setToken(tokenRound4Hardcap.address).should.be.fulfilled;
		await crowdsaleRound4Hardcap.setBaseCap(CONTRIBUTION_AMOUNT, {from: owner}).should.be.fulfilled;
		await crowdsaleRound4Hardcap.setMaxCap(CONTRIBUTION_AMOUNT.mul(2), {from: owner}).should.be.fulfilled;
		await crowdsaleRound4Hardcap.setRoundDuration(duration.days(1), {from: owner}).should.be.fulfilled;
	});


	it('should not finalize the sale before the start time', async function () {
		await crowdsaleRound1Hardcap.finalize({from: owner}).should.be.rejectedWith('revert');
		await crowdsaleRound2Hardcap.finalize({from: owner}).should.be.rejectedWith('revert');
		await crowdsaleRound3Hardcap.finalize({from: owner}).should.be.rejectedWith('revert');
		await crowdsaleRound4Hardcap.finalize({from: owner}).should.be.rejectedWith('revert');
	});


	it('should sell tokens to whitelisted users during round 1', async function() {
		tokenBuyerAmount = (await config.AET_RATE()).mul(CONTRIBUTION_AMOUNT);
		await increaseTimeTo(startTime);
		(await crowdsaleRound1Hardcap.getCurrentRound()).should.be.bignumber.equal(1);
		await crowdsaleRound1Hardcap.buyTokens(buyer1, {from: buyer1, value: CONTRIBUTION_AMOUNT}).should.be.fulfilled;
		await crowdsaleRound1Hardcap.buyTokens(buyer2, {from: buyer2, value: CONTRIBUTION_AMOUNT}).should.be.fulfilled;

		let tokenBuyerAmountRound1 = tokenBuyerAmount.mul(1.2);
		(await token.balanceOf(buyer1)).should.be.bignumber.equal(tokenBuyerAmountRound1);
		(await token.balanceOf(buyer2)).should.be.bignumber.equal(tokenBuyerAmountRound1);
	});


	it('should finalize the sale in round 1 reaching hardcap', async function () {
		await crowdsaleRound1Hardcap.setPresaleAllocations(presaleAllocations.address, {from: owner});
		await crowdsaleRound1Hardcap.setTeamAllocations(teamAllocations.address, {from: owner});
		await crowdsaleRound1Hardcap.setAdvisorsAllocations(advisorsAllocations.address, {from: owner});

		await crowdsaleRound1Hardcap.setReserveFund(reserveFund, {from: owner});
		await crowdsaleRound1Hardcap.setBountyFund(bountyFund, {from: owner});
		await crowdsaleRound1Hardcap.setDevelopmentFund(developmentFund, {from: owner});

		await crowdsaleRound1Hardcap.finalize({from: owner}).should.be.fulfilled;
	});


	it('should allow for transfer of tokens if reach hard cap in round 1 ', async function () {
		await tokenRound1Hardcap.transfer(unknown, 1, {from: buyer1}).should.be.fulfilled;
		await tokenRound1Hardcap.approve(unknown, 1, {from: buyer1}).should.be.fulfilled;
		await tokenRound1Hardcap.transferFrom(buyer1, unknown, 1, {from: unknown}).should.be.fulfilled;
	});


	it('should sell tokens to whitelisted users during round 2', async function() {
		tokenBuyerAmount = (await config.AET_RATE()).mul(CONTRIBUTION_AMOUNT);
		await increaseTimeTo(startTime+ duration.days(1));
		(await crowdsaleRound2Hardcap.getCurrentRound()).should.be.bignumber.equal(2);
		await crowdsaleRound2Hardcap.buyTokens(buyer1, {from: buyer1, value: CONTRIBUTION_AMOUNT}).should.be.fulfilled;
		await crowdsaleRound2Hardcap.buyTokens(buyer2, {from: buyer2, value: CONTRIBUTION_AMOUNT}).should.be.fulfilled;

		let tokenBuyerAmountRound2 = tokenBuyerAmount.mul(1.1);
		(await token.balanceOf(buyer1)).should.be.bignumber.equal(tokenBuyerAmountRound2);
		(await token.balanceOf(buyer2)).should.be.bignumber.equal(tokenBuyerAmountRound2);
	});


	it('should finalize the sale in round 2 reaching hardcap', async function () {
		await presaleAllocations.setToken(tokenRound2Hardcap.address);
		await teamAllocations.setToken(tokenRound2Hardcap.address);
		await advisorsAllocations.setToken(tokenRound2Hardcap.address);

		await crowdsaleRound2Hardcap.setPresaleAllocations(presaleAllocations.address, {from: owner});
		await crowdsaleRound2Hardcap.setTeamAllocations(teamAllocations.address, {from: owner});
		await crowdsaleRound2Hardcap.setAdvisorsAllocations(advisorsAllocations.address, {from: owner});

		await crowdsaleRound2Hardcap.setReserveFund(reserveFund, {from: owner});
		await crowdsaleRound2Hardcap.setBountyFund(bountyFund, {from: owner});
		await crowdsaleRound2Hardcap.setDevelopmentFund(developmentFund, {from: owner});

		await crowdsaleRound2Hardcap.finalize({from: owner}).should.be.fulfilled;
	});


	it('should allow for transfer of tokens if reach hard cap in round 2 ', async function () {
		await tokenRound2Hardcap.transfer(unknown, 1, {from: buyer1}).should.be.fulfilled;
		await tokenRound2Hardcap.approve(unknown, 1, {from: buyer1}).should.be.fulfilled;
		await tokenRound2Hardcap.transferFrom(buyer1, unknown, 1, {from: unknown}).should.be.fulfilled;
	});


	it('should sell tokens to whitelisted users during round 3', async function() {
		tokenBuyerAmount = (await config.AET_RATE()).mul(CONTRIBUTION_AMOUNT);
		await increaseTimeTo(startTime + duration.days(2));
		(await crowdsaleRound3Hardcap.getCurrentRound()).should.be.bignumber.equal(3);
		await crowdsaleRound3Hardcap.buyTokens(buyer1, {from: buyer1, value: CONTRIBUTION_AMOUNT}).should.be.fulfilled;
		await crowdsaleRound3Hardcap.buyTokens(buyer2, {from: buyer2, value: CONTRIBUTION_AMOUNT}).should.be.fulfilled;

		let tokenBuyerAmountRound3 = tokenBuyerAmount.mul(1.05);
		(await token.balanceOf(buyer1)).should.be.bignumber.equal(tokenBuyerAmountRound3);
		(await token.balanceOf(buyer2)).should.be.bignumber.equal(tokenBuyerAmountRound3);
	});


	it('should finalize the sale in round 3 reaching hardcap', async function () {
		await presaleAllocations.setToken(tokenRound3Hardcap.address);
		await teamAllocations.setToken(tokenRound3Hardcap.address);
		await advisorsAllocations.setToken(tokenRound3Hardcap.address);

		await crowdsaleRound3Hardcap.setPresaleAllocations(presaleAllocations.address, {from: owner});
		await crowdsaleRound3Hardcap.setTeamAllocations(teamAllocations.address, {from: owner});
		await crowdsaleRound3Hardcap.setAdvisorsAllocations(advisorsAllocations.address, {from: owner});

		await crowdsaleRound3Hardcap.setReserveFund(reserveFund, {from: owner});
		await crowdsaleRound3Hardcap.setBountyFund(bountyFund, {from: owner});
		await crowdsaleRound3Hardcap.setDevelopmentFund(developmentFund, {from: owner});

		await crowdsaleRound3Hardcap.finalize({from: owner}).should.be.fulfilled;
	});


	it('should allow for transfer of tokens if reach hard cap in round 3 ', async function () {
		await tokenRound3Hardcap.transfer(unknown, 1, {from: buyer1}).should.be.fulfilled;
		await tokenRound3Hardcap.approve(unknown, 1, {from: buyer1}).should.be.fulfilled;
		await tokenRound3Hardcap.transferFrom(buyer1, unknown, 1, {from: unknown}).should.be.fulfilled;
	});


	it('should sell tokens to whitelisted users during round 4', async function() {
		tokenBuyerAmount = (await config.AET_RATE()).mul(CONTRIBUTION_AMOUNT);
		await increaseTimeTo(startTime + duration.days(3));
		(await crowdsaleRound4Hardcap.getCurrentRound()).should.be.bignumber.equal(4);
		await crowdsaleRound4Hardcap.buyTokens(buyer1, {from: buyer1, value: CONTRIBUTION_AMOUNT}).should.be.fulfilled;
		await crowdsaleRound4Hardcap.buyTokens(buyer2, {from: buyer2, value: CONTRIBUTION_AMOUNT}).should.be.fulfilled;

		let tokenBuyerAmountRound4 = tokenBuyerAmount.mul(1.0);
		(await token.balanceOf(buyer1)).should.be.bignumber.equal(tokenBuyerAmountRound4);
		(await token.balanceOf(buyer2)).should.be.bignumber.equal(tokenBuyerAmountRound4);
	});


	it('should finalize the sale in round 4 reaching hardcap', async function () {
		await presaleAllocations.setToken(tokenRound4Hardcap.address);
		await teamAllocations.setToken(tokenRound4Hardcap.address);
		await advisorsAllocations.setToken(tokenRound4Hardcap.address);

		await crowdsaleRound4Hardcap.setPresaleAllocations(presaleAllocations.address, {from: owner});
		await crowdsaleRound4Hardcap.setTeamAllocations(teamAllocations.address, {from: owner});
		await crowdsaleRound4Hardcap.setAdvisorsAllocations(advisorsAllocations.address, {from: owner});

		await crowdsaleRound4Hardcap.setReserveFund(reserveFund, {from: owner});
		await crowdsaleRound4Hardcap.setBountyFund(bountyFund, {from: owner});
		await crowdsaleRound4Hardcap.setDevelopmentFund(developmentFund, {from: owner});

		await crowdsaleRound4Hardcap.finalize({from: owner}).should.be.fulfilled;
	});


	it('should allow for transfer of tokens if reach hard cap in round 4 ', async function () {
		await tokenRound4Hardcap.transfer(unknown, 1, {from: buyer1}).should.be.fulfilled;
		await tokenRound4Hardcap.approve(unknown, 1, {from: buyer1}).should.be.fulfilled;
		await tokenRound4Hardcap.transferFrom(buyer1, unknown, 1, {from: unknown}).should.be.fulfilled;
	});
});