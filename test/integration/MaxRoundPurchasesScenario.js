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

contract('Akropolis Max Round Purchase Scenario', function ([owner, admin, wallet, buyer1, buyer2, buyer3, buyer4, investor1, investor2, investor3,
																						reserveFund, bountyFund, developmentFund, unknown]) {

	const ALLOCATED_VALUE = 100;
	const ALLOCATED_VESTING = 200;
	const VESTING_PERIOD = duration.days(100);

	const BASE_CAP_INDIVIDUAL_AMOUNT = ether(2);
	const MAX_CAP_INDIVIDUAL_AMOUNT = ether(20);

	let token, crowdsale, whitelist, config;
	let presaleAllocations, teamAllocations, advisorsAllocations;
	let startTime, endTime, afterEndTime;
	let tokenBuyerAmount, tokenBuyerAmountRound1, tokenBuyerAmountRound2, tokenBuyerAmountRound3, tokenBuyerAmountRound4;

	before(async function () {
		// Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
		await advanceBlock();

		startTime = latestTime() + duration.weeks(1);
		endTime = startTime + duration.days(4);
		afterEndTime = endTime + duration.seconds(1);

		token = await AkropolisToken.new().should.be.fulfilled;
		await token.pause().should.be.fulfilled;

		whitelist = await Whitelist.new().should.be.fulfilled;
	});


	it('should register 4 users to the whitelist', async function () {
		await whitelist.setAdmin(admin);
		await whitelist.addToWhitelist(buyer1, {from: admin}).should.be.fulfilled;
		await whitelist.addToWhitelist(buyer2, {from: admin}).should.be.fulfilled;
		await whitelist.addToWhitelist(buyer3, {from: admin}).should.be.fulfilled;
		await whitelist.addToWhitelist(buyer4, {from: admin}).should.be.fulfilled;
	});


	it('should deploy pre-sale allocations', async function() {
		presaleAllocations = await AllocationsManager.new().should.be.fulfilled;
		await presaleAllocations.setToken(token.address);


		teamAllocations = await AllocationsManager.new().should.be.fulfilled;
		await teamAllocations.setToken(token.address);
		await teamAllocations.setAdmin(admin);

		advisorsAllocations = await AllocationsManager.new().should.be.fulfilled;
		await advisorsAllocations.setToken(token.address);
		await advisorsAllocations.setAdmin(admin);
	});


	it('should register 3 presale investors', async function() {
		await presaleAllocations.setAdmin(admin);
		await presaleAllocations.registerAllocation(investor1, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_PERIOD, {from: admin}).should.be.fulfilled;
		await presaleAllocations.registerAllocation(investor2, (ALLOCATED_VALUE * 2), (ALLOCATED_VESTING * 10), (VESTING_PERIOD * 2), {from: admin}).should.be.fulfilled;
		await presaleAllocations.registerAllocation(investor3, ALLOCATED_VALUE, 0, 0, {from: admin}).should.be.fulfilled;
	});


	it('should deploy config and crowdsale and connect to token and allocations contracts', async function() {
		config = await SaleConfiguration.new().should.be.fulfilled;
		crowdsale = await AkropolisCrowdsale.new(startTime, endTime, wallet, whitelist.address, config.address).should.be.fulfilled;
		await crowdsale.setAdmin(admin);
		await token.transferOwnership(crowdsale.address).should.be.fulfilled;
		await crowdsale.setToken(token.address).should.be.fulfilled;
		await crowdsale.setBaseCap(BASE_CAP_INDIVIDUAL_AMOUNT, {from: owner}).should.be.fulfilled;
		await crowdsale.setMaxCap(MAX_CAP_INDIVIDUAL_AMOUNT, {from: owner}).should.be.fulfilled;
		await crowdsale.setRoundDuration(duration.days(1), {from: owner}).should.be.fulfilled;
	});


	it('should sell max amount of tokens to whitelisted users during round 1', async function() {
		tokenBuyerAmount = (await config.AET_RATE()).mul(BASE_CAP_INDIVIDUAL_AMOUNT);
		await increaseTimeTo(startTime);
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(1);

		await crowdsale.buyTokens(buyer1, {from: buyer1, value: BASE_CAP_INDIVIDUAL_AMOUNT}).should.be.fulfilled;
		await crowdsale.buyTokens(buyer2, {from: buyer2, value: BASE_CAP_INDIVIDUAL_AMOUNT}).should.be.fulfilled;
		await crowdsale.buyTokens(buyer3, {from: buyer3, value: BASE_CAP_INDIVIDUAL_AMOUNT}).should.be.fulfilled;
		await crowdsale.buyTokens(buyer4, {from: buyer4, value: BASE_CAP_INDIVIDUAL_AMOUNT}).should.be.fulfilled;

		tokenBuyerAmountRound1 = tokenBuyerAmount.mul(1.2);

		console.log("the token buyer amount is" + tokenBuyerAmount + "amount round2 is" + tokenBuyerAmountRound1);
		(await token.balanceOf(buyer1)).should.be.bignumber.equal(tokenBuyerAmountRound1);
		(await token.balanceOf(buyer2)).should.be.bignumber.equal(tokenBuyerAmountRound1);
		(await token.balanceOf(buyer3)).should.be.bignumber.equal(tokenBuyerAmountRound1);
		(await token.balanceOf(buyer4)).should.be.bignumber.equal(tokenBuyerAmountRound1);
	});


	it('should sell tokens to whitelisted users during round 2', async function() {
		await increaseTimeTo(startTime + duration.days(1));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(2);
		
		console.log("Buy Tokens buyer 1");
		await crowdsale.buyTokens(buyer1, {from: buyer1, value: BASE_CAP_INDIVIDUAL_AMOUNT}).should.be.fulfilled;


		tokenBuyerAmountRound2 = tokenBuyerAmount.mul(1.1)+ tokenBuyerAmountRound1;
		console.log("the token buyer amount is " + tokenBuyerAmount + "amount round2 is " + tokenBuyerAmountRound2);
		console.log("token buyer 1");
		(await token.balanceOf(buyer1)).should.be.bignumber.equal(tokenBuyerAmountRound2);
	});


	it('should sell tokens to whitelisted users during round 3', async function() {
		await increaseTimeTo(startTime + duration.days(2));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(3);

		await crowdsale.buyTokens(buyer1, {from: buyer1, value: BASE_CAP_INDIVIDUAL_AMOUNT.mul(2)}).should.be.fulfilled;

		tokenBuyerAmountRound3 = tokenBuyerAmount.mul(1.05).mul(2) + tokenBuyerAmountRound2;
		(await token.balanceOf(buyer1)).should.be.bignumber.equal(tokenBuyerAmountRound3);
	});


	it('should sell tokens to whitelisted users during round 4', async function() {
		await increaseTimeTo(startTime + duration.days(3));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(4);

		await crowdsale.buyTokens(buyer1, {from: buyer1, value: BASE_CAP_INDIVIDUAL_AMOUNT.mul(6)}).should.be.fulfilled;

		tokenBuyerAmountRound4 = tokenBuyerAmount.mul(1.0).mul(6) + tokenBuyerAmountRound3;
		(await token.balanceOf(buyer1)).should.be.bignumber.equal(tokenBuyerAmountRound4);
	});


	it('should not allow for transfer of tokens', async function () {
		await token.transferFrom(buyer1, unknown, tokenBuyerAmount, {from: buyer1}).should.be.rejectedWith('revert');
	});


	it('should finalize crowdsale', async function() {
		await increaseTimeTo(afterEndTime);
		await crowdsale.setPresaleAllocations(presaleAllocations.address, {from: owner});
		await crowdsale.setTeamAllocations(teamAllocations.address, {from: owner});
		await crowdsale.setAdvisorsAllocations(advisorsAllocations.address, {from: owner});

		await crowdsale.setReserveFund(reserveFund, {from: owner});
		await crowdsale.setBountyFund(bountyFund, {from: owner});
		await crowdsale.setDevelopmentFund(developmentFund, {from: owner});

		await crowdsale.finalize({from: owner}).should.be.fulfilled;

		//Test presale allocations
		(await token.balanceOf(presaleAllocations.address)).should.be.bignumber.equal((await config.PRESALE_SUPPLY()));

		//Test team allocations
		(await token.balanceOf(teamAllocations.address)).should.be.bignumber.equal((await config.TEAM_SUPPLY()));

		//Test advisors allocations
		(await token.balanceOf(advisorsAllocations.address)).should.be.bignumber.equal((await config.ADVISORS_SUPPLY()));

		//Test bounty fund
		(await token.balanceOf(bountyFund)).should.be.bignumber.equal((await config.BOUNTY_FUND_VALUE()));

		//Test dev fund
		(await token.balanceOf(developmentFund)).should.be.bignumber.equal((await config.DEVELOPMENT_FUND_VALUE()));

		//Test reserve fund
		let sold = await crowdsale.tokensSold();
		let supply = await config.PUBLIC_SALE_SUPPLY();
		let unsold = supply.sub(sold);
		(await token.balanceOf(reserveFund)).should.be.bignumber.equal((await config.RESERVE_FUND_VALUE()).add(unsold));
	});


	it('should distribute tokens among pre-sale users', async function() {
		await presaleAllocations.distributeAllocation(investor1, {from: owner});
		(await token.balanceOf(investor1)).should.be.bignumber.equal(ALLOCATED_VALUE);
		await presaleAllocations.distributeAllocation(investor2, {from: owner});
		(await token.balanceOf(investor2)).should.be.bignumber.equal(ALLOCATED_VALUE * 2);
		await presaleAllocations.distributeAllocation(investor3, {from: owner});
		(await token.balanceOf(investor3)).should.be.bignumber.equal(ALLOCATED_VALUE);
	});


	it('should correctly vest investors allocations', async function() {
		//Determine investor 1 token balance
		let vestingAddress1 = await presaleAllocations.getVesting(investor1);
		let vesting1 = await LinearTokenVesting.at(vestingAddress1);
		let vestingStart1 = await vesting1.start();

		await increaseTimeTo(vestingStart1.add(VESTING_PERIOD));
		await vesting1.release(token.address);

		(await token.balanceOf(investor1)).should.be.bignumber.equal(ALLOCATED_VALUE + ALLOCATED_VESTING);

		//Determine investor 2 token balance
		let vestingAddress2 = await presaleAllocations.getVesting(investor2);
		let vesting2 = await LinearTokenVesting.at(vestingAddress2);
		await vesting2.release(token.address);

		(await token.balanceOf(investor2)).should.be.bignumber.equal((ALLOCATED_VALUE * 2) + (ALLOCATED_VESTING * 5));

		//Determine investor 3 token balance (did not receive vesting)
		(await token.balanceOf(investor3)).should.be.bignumber.equal(ALLOCATED_VALUE);

		let vestingStart2 = await vesting2.start();

		await increaseTimeTo(vestingStart2.add(VESTING_PERIOD * 2));
		await vesting2.release(token.address);

		(await token.balanceOf(investor2)).should.be.bignumber.equal((ALLOCATED_VALUE * 2) + (ALLOCATED_VESTING * 10));
	});


	it('should allow for transfer of tokens', async function () {
		await token.transfer(unknown, 1, {from: buyer1}).should.be.fulfilled;

		await token.approve(unknown, 1, {from: buyer1}).should.be.fulfilled;
		await token.transferFrom(buyer1, unknown, 1, {from: unknown}).should.be.fulfilled;
	})
});