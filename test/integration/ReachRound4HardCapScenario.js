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

contract('Akropolis Round 4 Hard Cap Reach Scenario', function ([owner, admin, wallet, buyer1, buyer2, buyer3, buyer4, investor1, investor2, investor3,
																						reserveFund, bountyFund, developmentFund, unknown]) {

	const ALLOCATED_VALUE = 100;
	const ALLOCATED_VESTING = 200;
	const VESTING_PERIOD = duration.days(100);

	const CONTRIBUTION_AMOUNT = ether(1);
	const MAX_AMOUNT = ether(16);

	let token, crowdsale, whitelist, config;
	let presaleAllocations, teamAllocations, advisorsAllocations;
	let startTime, endTime, afterEndTime;
	let tokenBuyerAmount, tokenBuyerAmountRound1, tokenBuyerAmountRound2, tokenBuyerAmountRound3;

	before(async function () {
		// Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
		await advanceBlock();

		startTime = latestTime() + duration.weeks(1);
		endTime = startTime + duration.days(4);
		afterEndTime = endTime + duration.seconds(1);
		token = await AkropolisToken.new();
		await token.pause();
		whitelist = await Whitelist.new();
		await whitelist.setAdmin(admin);
		await whitelist.addToWhitelist(buyer1, {from: admin});
		await whitelist.addToWhitelist(buyer2, {from: admin});
		await whitelist.addToWhitelist(buyer3, {from: admin});
		await whitelist.addToWhitelist(buyer4, {from: admin});

		presaleAllocations = await AllocationsManager.new();
		await presaleAllocations.setToken(token.address);
		await presaleAllocations.setAdmin(admin);

		teamAllocations = await AllocationsManager.new();
		await teamAllocations.setToken(token.address);
		await teamAllocations.setAdmin(admin);

		advisorsAllocations = await AllocationsManager.new();
		await advisorsAllocations.setToken(token.address);
		await advisorsAllocations.setAdmin(admin);

		//Register some investors
		await presaleAllocations.registerAllocation(investor1, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_PERIOD, {from: admin});
		await presaleAllocations.registerAllocation(investor2, (ALLOCATED_VALUE * 2), (ALLOCATED_VESTING * 10), (VESTING_PERIOD * 2), {from: admin});
		await presaleAllocations.registerAllocation(investor3, ALLOCATED_VALUE, 0, 0, {from: admin});
	});


	it('should deploy crowdsale and connect to token and allocations contracts', async function() {
		config = await SaleConfigurationMock.new().should.be.fulfilled;
		await config.setHARD_CAP(MAX_AMOUNT * 2).should.be.fulfilled;
		crowdsale = await AkropolisCrowdsale.new(startTime, endTime, wallet, whitelist.address, config.address).should.be.fulfilled;
		await crowdsale.setAdmin(admin);
		await token.transferOwnership(crowdsale.address).should.be.fulfilled;
		await crowdsale.setToken(token.address).should.be.fulfilled;
		await crowdsale.setBaseCap(CONTRIBUTION_AMOUNT, {from: owner}).should.be.fulfilled;
		await crowdsale.setMaxCap(MAX_AMOUNT, {from: owner}).should.be.fulfilled;
		await crowdsale.setRoundDuration(duration.days(1), {from: owner}).should.be.fulfilled;
	});


	it('should not finalize the sale before the start time', async function () {
		await crowdsale.finalize({from: owner}).should.be.rejectedWith('revert');
	});


	it('should not finalize the sale before the end of token sale or reach the hard cap', async function () {
		await crowdsale.finalize({from: owner}).should.be.rejectedWith('revert');
	});


	it('should sell tokens to whitelisted users during round 1', async function() {
		tokenBuyerAmount = (await config.AET_RATE()).mul(CONTRIBUTION_AMOUNT);
		await increaseTimeTo(startTime);
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(1);
		await crowdsale.buyTokens(buyer1, {from: buyer1, value: CONTRIBUTION_AMOUNT}).should.be.fulfilled;
		await crowdsale.buyTokens(buyer2, {from: buyer2, value: CONTRIBUTION_AMOUNT}).should.be.fulfilled;
		await crowdsale.buyTokens(buyer3, {from: buyer3, value: CONTRIBUTION_AMOUNT}).should.be.fulfilled;
		await crowdsale.buyTokens(buyer4, {from: buyer4, value: CONTRIBUTION_AMOUNT}).should.be.fulfilled;

		tokenBuyerAmountRound1 = tokenBuyerAmount.mul(1.2);
		(await token.balanceOf(buyer1)).should.be.bignumber.equal(tokenBuyerAmountRound1);
		(await token.balanceOf(buyer2)).should.be.bignumber.equal(tokenBuyerAmountRound1);
		(await token.balanceOf(buyer3)).should.be.bignumber.equal(tokenBuyerAmountRound1);
		(await token.balanceOf(buyer4)).should.be.bignumber.equal(tokenBuyerAmountRound1);
	});


	it('should sell tokens to whitelisted users during round 2', async function() {
		await increaseTimeTo(startTime + duration.days(1));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(2);
		await crowdsale.buyTokens(buyer1, {from: buyer1, value: CONTRIBUTION_AMOUNT}).should.be.fulfilled;
		await crowdsale.buyTokens(buyer2, {from: buyer2, value: CONTRIBUTION_AMOUNT}).should.be.fulfilled;
		await crowdsale.buyTokens(buyer3, {from: buyer3, value: CONTRIBUTION_AMOUNT}).should.be.fulfilled;
		await crowdsale.buyTokens(buyer4, {from: buyer4, value: CONTRIBUTION_AMOUNT}).should.be.fulfilled;

		tokenBuyerAmountRound2 = tokenBuyerAmount.mul(1.1).add(tokenBuyerAmountRound1);
		(await token.balanceOf(buyer1)).should.be.bignumber.equal(tokenBuyerAmountRound2);
		(await token.balanceOf(buyer2)).should.be.bignumber.equal(tokenBuyerAmountRound2);
		(await token.balanceOf(buyer3)).should.be.bignumber.equal(tokenBuyerAmountRound2);
		(await token.balanceOf(buyer4)).should.be.bignumber.equal(tokenBuyerAmountRound2);
	});

	it('should sell tokens to whitelisted users during round 3', async function() {
		await increaseTimeTo(startTime + duration.days(2));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(3);
		await crowdsale.buyTokens(buyer1, {from: buyer1, value: CONTRIBUTION_AMOUNT.mul(2)}).should.be.fulfilled;
		await crowdsale.buyTokens(buyer2, {from: buyer2, value: CONTRIBUTION_AMOUNT.mul(2)}).should.be.fulfilled;
		await crowdsale.buyTokens(buyer3, {from: buyer3, value: CONTRIBUTION_AMOUNT.mul(2)}).should.be.fulfilled;
		await crowdsale.buyTokens(buyer4, {from: buyer4, value: CONTRIBUTION_AMOUNT.mul(2)}).should.be.fulfilled;

		tokenBuyerAmountRound3 = tokenBuyerAmount.mul(1.05).mul(2).add(tokenBuyerAmountRound2);
		(await token.balanceOf(buyer1)).should.be.bignumber.equal(tokenBuyerAmountRound3);
		(await token.balanceOf(buyer2)).should.be.bignumber.equal(tokenBuyerAmountRound3);
		(await token.balanceOf(buyer3)).should.be.bignumber.equal(tokenBuyerAmountRound3);
		(await token.balanceOf(buyer4)).should.be.bignumber.equal(tokenBuyerAmountRound3);
	});


	it('should sell tokens to whitelisted users during round 4', async function() {
		await increaseTimeTo(startTime + duration.days(3));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(4);
		await crowdsale.buyTokens(buyer1, {from: buyer1, value: CONTRIBUTION_AMOUNT.mul(4)}).should.be.fulfilled;
		await crowdsale.buyTokens(buyer2, {from: buyer2, value: CONTRIBUTION_AMOUNT.mul(4)}).should.be.fulfilled;
		await crowdsale.buyTokens(buyer3, {from: buyer3, value: CONTRIBUTION_AMOUNT.mul(4)}).should.be.fulfilled;
		await crowdsale.buyTokens(buyer4, {from: buyer4, value: CONTRIBUTION_AMOUNT.mul(4)}).should.be.fulfilled;

		tokenBuyerAmountRound4 = tokenBuyerAmount.mul(4).add(tokenBuyerAmountRound3);
		(await token.balanceOf(buyer1)).should.be.bignumber.equal(tokenBuyerAmountRound4);
		(await token.balanceOf(buyer2)).should.be.bignumber.equal(tokenBuyerAmountRound4);
		(await token.balanceOf(buyer3)).should.be.bignumber.equal(tokenBuyerAmountRound4);
		(await token.balanceOf(buyer4)).should.be.bignumber.equal(tokenBuyerAmountRound4);
	});


	it('should finalize crowdsale after reaching hard cap', async function() {
		await advanceBlock();
		await crowdsale.setPresaleAllocations(presaleAllocations.address, {from: owner});
		await crowdsale.setTeamAllocations(teamAllocations.address, {from: owner});
		await crowdsale.setAdvisorsAllocations(advisorsAllocations.address, {from: owner});

		await crowdsale.setReserveFund(reserveFund, {from: owner});
		await crowdsale.setBountyFund(bountyFund, {from: owner});
		await crowdsale.setDevelopmentFund(developmentFund, {from: owner});

		await crowdsale.finalize({from: owner}).should.be.fulfilled;

		//Test reserve fund
		let sold = await crowdsale.tokensSold();
		let supply = await config.PUBLIC_SALE_SUPPLY();
		let unsold = supply.sub(sold);
		(await token.balanceOf(reserveFund)).should.be.bignumber.equal((await config.RESERVE_FUND_VALUE()).add(unsold));
	});


	it('should allow for transfer of tokens', async function () {
		await token.transfer(unknown, 1, {from: buyer1}).should.be.fulfilled;
		await token.approve(unknown, 1, {from: buyer1}).should.be.fulfilled;
		await token.transferFrom(buyer1, unknown, 1, {from: unknown}).should.be.fulfilled;
	})
});