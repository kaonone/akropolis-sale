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

//This integration test seeks to explore reaching the hard cap for ether sent in exchange for tokens
//This test affirms that if we can finalize the public sale if we reach the ether sales limit
//In this test we reach the public token cap sales limit in Round 3
contract('Akropolis Round 3 Public Sale Cap Reach Scenario', function ([owner, admin, wallet, buyer1, buyer2, buyer3, buyer4, investor1, investor2, investor3,
																						reserveFund, developmentFund, unknown]) {

	const ALLOCATED_VALUE = 100;
	const ALLOCATED_VESTING = 200;
	const VESTING_PERIOD = duration.days(100);
	const VESTING_CLIFF = duration.days(25);


	let token, crowdsale, whitelist, config;
	let presaleAllocations, teamAllocations, advisorsAllocations;
	let startTime, endTime, afterEndTime;

	before(async function () {
		// Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
		await advanceBlock();

		startTime = latestTime() + duration.weeks(1);
		endTime = startTime + duration.days(9);
		afterEndTime = endTime + duration.seconds(1);

		whitelist = await Whitelist.new();
		await whitelist.setAdmin(admin);
		await whitelist.addToWhitelist(buyer1, 1, {from: admin});
		await whitelist.addToWhitelist(buyer2, 1, {from: admin});
		await whitelist.addToWhitelist(buyer3, 2, {from: admin});
		await whitelist.addToWhitelist(buyer4, 3, {from: admin});
	});


	it('should deploy crowdsale and connect to token and allocations contracts', async function() {
		config = await SaleConfigurationMock.new().should.be.fulfilled;
		await config.setPUBLIC_SALE_SUPPLY(ether(280)).should.be.fulfilled;
		await config.setTOTAL_SUPPLY(ether(90280)).should.be.fulfilled;
		crowdsale = await AkropolisCrowdsale.new(startTime, endTime, wallet, whitelist.address, config.address).should.be.fulfilled;
		token = await AkropolisToken.at(await crowdsale.token());
	});


	it('should register allocations', async function () {
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
		await presaleAllocations.registerAllocation(investor1, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_CLIFF, VESTING_PERIOD, {from: admin});
		await presaleAllocations.registerAllocation(investor2, (ALLOCATED_VALUE * 2), (ALLOCATED_VESTING * 10), VESTING_CLIFF, (VESTING_PERIOD * 2), {from: admin});
		await presaleAllocations.registerAllocation(investor3, ALLOCATED_VALUE, 0, 0, 0, {from: admin});
	});


	it('should not finalize the sale before the start time', async function () {
		await crowdsale.finalize({from: owner}).should.be.rejectedWith('revert');
	});


	it('should not finalize the sale before the end of token sale or reach the hard cap', async function () {
		await crowdsale.finalize({from: owner}).should.be.rejectedWith('revert');
	});


	it('should sell tokens to whitelisted users during round 1', async function() {
		let tokenBuyerAmountRound1 = (await config.AET_RATE()).mul(ether(10));
		await increaseTimeTo(startTime);
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(1);
		await crowdsale.buyTokens(buyer1, {from: buyer1, value: ether(10)}).should.be.fulfilled;
		await crowdsale.buyTokens(buyer2, {from: buyer2, value: ether(10)}).should.be.fulfilled;

		(await token.balanceOf(buyer1)).should.be.bignumber.equal(tokenBuyerAmountRound1);
		(await token.balanceOf(buyer2)).should.be.bignumber.equal(tokenBuyerAmountRound1);
	});


	it('should sell tokens to whitelisted users during round 2', async function() {
		let tokenBuyerAmountRound2 = (await config.AET_RATE()).mul(ether(5));
		await increaseTimeTo(startTime+ duration.days(3));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(2);
		await crowdsale.buyTokens(buyer3, {from: buyer3, value: ether(5)}).should.be.fulfilled;

		(await token.balanceOf(buyer3)).should.be.bignumber.equal(tokenBuyerAmountRound2);
	});


	it('should sell tokens to whitelisted users during round 3', async function() {
		let tokenBuyerAmountRound3 = (await config.AET_RATE()).mul(ether(3));
		await increaseTimeTo(startTime+ duration.days(6));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(3);
		await crowdsale.buyTokens(buyer4, {from: buyer4, value: ether(3)}).should.be.fulfilled;

		(await token.balanceOf(buyer4)).should.be.bignumber.equal(tokenBuyerAmountRound3);
	});


	it('should finalize crowdsale after reaching public sale cap', async function() {
		await advanceBlock();
		await crowdsale.setPresaleAllocations(presaleAllocations.address, {from: owner});
		await crowdsale.setTeamAllocations(teamAllocations.address, {from: owner});
		await crowdsale.setAdvisorsAllocations(advisorsAllocations.address, {from: owner});

		await crowdsale.setReserveFund(reserveFund, {from: owner});
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