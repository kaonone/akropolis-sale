import { advanceBlock } from '.././tools/advanceToBlock';
import { increaseTimeTo, duration } from '.././tools/increaseTime';
import latestTime from '.././tools/latestTime';

const AkropolisToken = artifacts.require('./AkropolisToken.sol');
const AkropolisCrowdsale = artifacts.require('./AkropolisCrowdsale.sol');
const Whitelist = artifacts.require('./Whitelist.sol');
const SaleConfiguration = artifacts.require('./SaleConfiguration.sol');
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

//This integration test seeks to push the contract by selling tokens to allocated addresses also on the whitelist
//Test will whitelist investor 1 and 2. They buy every round of the crowdsale along with buyer 1 and 2
//At the completion of the crowdsale the investors also receive the allocated and vested value without issues
contract('Akropolis Investors Buy Public Crowdsale Scenario', function ([owner, admin, wallet, buyer1, buyer2, investor1, investor2, investor3,
																						reserveFund, developmentFund, unknown]) {

	const ALLOCATED_VALUE = 100;
	const ALLOCATED_VESTING = 200;
	const VESTING_PERIOD = duration.days(100);
	const VESTING_CLIFF = duration.days(25);

	const BUYER_AMOUNT = ether(2);

	let token, crowdsale, whitelist, config;
	let presaleAllocations, teamAllocations, advisorsAllocations;
	let startTime, endTime, afterEndTime;
	let tokenBuyerAmount;
	let investor1Crowdsale, investor2Crowdsale;

	before(async function () {
		// Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
		await advanceBlock();

		startTime = latestTime() + duration.weeks(1);
		endTime = startTime + duration.days(9);
		afterEndTime = endTime + duration.seconds(1);

		whitelist = await Whitelist.new();
		await whitelist.setAdmin(admin);
		await whitelist.addToWhitelist(buyer1, 1, {from: admin});
		await whitelist.addToWhitelist(buyer2, 2, {from: admin});
		await whitelist.addToWhitelist(investor1, 1, {from: admin});
		await whitelist.addToWhitelist(investor2, 2, {from: admin});

	});

	it('should deploy config and crowdsale and connect to token and allocations contracts', async function() {
		config = await SaleConfiguration.new().should.be.fulfilled;
		crowdsale = await AkropolisCrowdsale.new(startTime, endTime, wallet, whitelist.address, config.address).should.be.fulfilled;
		token = await AkropolisToken.at(await crowdsale.token());
	});

	it('should register allocations', async function() {
		presaleAllocations = await AllocationsManager.new();
		await presaleAllocations.setToken(token.address);
		await presaleAllocations.setAdmin(admin);

		teamAllocations = await AllocationsManager.new();
		await teamAllocations.setToken(token.address);
		await teamAllocations.setAdmin(admin);

		advisorsAllocations = await AllocationsManager.new();
		await advisorsAllocations.setToken(token.address);
		await advisorsAllocations.setAdmin(admin);
		config = await SaleConfiguration.new();

		//Register some investors
		await presaleAllocations.registerAllocation(investor1, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_CLIFF, VESTING_PERIOD, {from: admin});
		await presaleAllocations.registerAllocation(investor2, (ALLOCATED_VALUE * 2), (ALLOCATED_VESTING * 10), VESTING_CLIFF, (VESTING_PERIOD * 2), {from: admin});
		await presaleAllocations.registerAllocation(investor3, ALLOCATED_VALUE, 0, 0, 0, {from: admin});
	});


	it('should sell max amount of tokens to whitelisted users during round 1', async function() {
		tokenBuyerAmount = (await config.AET_RATE()).mul(BUYER_AMOUNT);
		await increaseTimeTo(startTime);
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(1);

		await crowdsale.buyTokens(buyer1, {from: buyer1, value: BUYER_AMOUNT}).should.be.fulfilled;
		await crowdsale.buyTokens(investor1, {from: investor1, value: BUYER_AMOUNT}).should.be.fulfilled;


		(await token.balanceOf(buyer1)).should.be.bignumber.equal(tokenBuyerAmount);
		(await token.balanceOf(investor1)).should.be.bignumber.equal(tokenBuyerAmount);
	});


	it('should sell tokens to whitelisted users during round 2', async function() {
		await increaseTimeTo(startTime + duration.days(3));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(2);

		await crowdsale.buyTokens(buyer1, {from: buyer1, value: BUYER_AMOUNT}).should.be.fulfilled;
		await crowdsale.buyTokens(buyer2, {from: buyer2, value: BUYER_AMOUNT}).should.be.fulfilled;
		await crowdsale.buyTokens(investor1, {from: investor1, value: BUYER_AMOUNT}).should.be.fulfilled;
		await crowdsale.buyTokens(investor2, {from: investor2, value: BUYER_AMOUNT}).should.be.fulfilled;

		(await token.balanceOf(buyer1)).should.be.bignumber.equal(tokenBuyerAmount.mul(2));
		(await token.balanceOf(buyer2)).should.be.bignumber.equal(tokenBuyerAmount);
		(await token.balanceOf(investor1)).should.be.bignumber.equal(tokenBuyerAmount.mul(2));
		(await token.balanceOf(investor2)).should.be.bignumber.equal(tokenBuyerAmount);
	});


	it('should sell tokens to whitelisted users during round 3', async function() {
		await increaseTimeTo(startTime + duration.days(6));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(3);

		await crowdsale.buyTokens(buyer1, {from: buyer1, value: BUYER_AMOUNT}).should.be.fulfilled;
		await crowdsale.buyTokens(buyer2, {from: buyer2, value: BUYER_AMOUNT}).should.be.fulfilled;
		await crowdsale.buyTokens(investor1, {from: investor1, value: BUYER_AMOUNT}).should.be.fulfilled;
		await crowdsale.buyTokens(investor2, {from: investor2, value: BUYER_AMOUNT}).should.be.fulfilled;

		(await token.balanceOf(buyer1)).should.be.bignumber.equal(tokenBuyerAmount.mul(3));
		(await token.balanceOf(buyer2)).should.be.bignumber.equal(tokenBuyerAmount.mul(2));
		(await token.balanceOf(investor1)).should.be.bignumber.equal(tokenBuyerAmount.mul(3));
		(await token.balanceOf(investor2)).should.be.bignumber.equal(tokenBuyerAmount.mul(2));
	});


	it('should finalize crowdsale', async function() {
		await increaseTimeTo(afterEndTime);
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


	it('should distribute tokens among pre-sale users', async function() {
		investor1Crowdsale = tokenBuyerAmount.mul(3);
		investor2Crowdsale = tokenBuyerAmount.mul(2);

		await presaleAllocations.distributeAllocation(investor1, {from: owner});
		(await token.balanceOf(investor1)).should.be.bignumber.equal(investor1Crowdsale.add(ALLOCATED_VALUE));
		await presaleAllocations.distributeAllocation(investor2, {from: owner});
		(await token.balanceOf(investor2)).should.be.bignumber.equal(investor2Crowdsale.add(ALLOCATED_VALUE * 2));
		await presaleAllocations.distributeAllocation(investor3, {from: owner});
		(await token.balanceOf(investor3)).should.be.bignumber.equal(ALLOCATED_VALUE);
	});


	it('should correctly vest investors allocations', async function() {
		//Determine investor 1 token balance
		let vestingAddress1 = await presaleAllocations.getVesting(investor1);
		let vesting1 = await LinearTokenVesting.at(vestingAddress1);
		let vestingStart1 = await vesting1.start();

		await increaseTimeTo(vestingStart1.add(VESTING_PERIOD).add(1));
		await vesting1.release();

		(await token.balanceOf(investor1)).should.be.bignumber.equal(investor1Crowdsale.add(ALLOCATED_VALUE + ALLOCATED_VESTING));

		//Determine investor 2 token balance
		let vestingAddress2 = await presaleAllocations.getVesting(investor2);
		let vesting2 = await LinearTokenVesting.at(vestingAddress2);
		await vesting2.release();

		(await token.balanceOf(investor2)).should.be.bignumber.equal(investor2Crowdsale.add((ALLOCATED_VALUE * 2) + (ALLOCATED_VESTING * 5)));

		//Determine investor 3 token balance (did not receive vesting)
		(await token.balanceOf(investor3)).should.be.bignumber.equal(ALLOCATED_VALUE);

		let vestingStart2 = await vesting2.start();

		await increaseTimeTo(vestingStart2.add(VESTING_PERIOD * 2).add(1));
		await vesting2.release();

		(await token.balanceOf(investor2)).should.be.bignumber.equal(investor2Crowdsale.add((ALLOCATED_VALUE * 2) + (ALLOCATED_VESTING * 10)));
	});


	it('should allow for transfer of tokens', async function () {
		await token.transfer(unknown, 1, {from: investor1}).should.be.fulfilled;

		await token.approve(unknown, 1, {from: investor1}).should.be.fulfilled;
		await token.transferFrom(investor1, unknown, 1, {from: unknown}).should.be.fulfilled;
	})

});