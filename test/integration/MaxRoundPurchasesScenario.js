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

//This integration test seeks to explore that 4 buyers are able to buy the maximum amount allotted to them per round
//The test ensures that they can buy up to the maximum individual cap for each round and afterwards not 1 more
//We ensure that the crowdsale completes correctly and tokens can be transferred
contract('Akropolis Max Round Purchase Scenario', function ([owner, admin, wallet, buyer1, buyer2, buyer3, buyer4,
																						reserveFund, bountyFund, developmentFund, unknown]) {

	let token, crowdsale, whitelist, config;
	let presaleAllocations, teamAllocations, advisorsAllocations;
	let startTime, endTime, afterEndTime;
	let tokenBuyerAmountTier1, tokenBuyerAmountTier2, tokenBuyerAmountTier3;

	before(async function () {
		// Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
		await advanceBlock();

		startTime = latestTime() + duration.weeks(1);
		endTime = startTime + duration.days(9);
		afterEndTime = endTime + duration.seconds(1);

		token = await AkropolisToken.new().should.be.fulfilled;
		await token.pause().should.be.fulfilled;

		whitelist = await Whitelist.new().should.be.fulfilled;

		//Set up Whitelist
		await whitelist.setAdmin(admin);
		await whitelist.addToWhitelist(buyer1, 1, {from: admin});
		await whitelist.addToWhitelist(buyer2, 1, {from: admin});
		await whitelist.addToWhitelist(buyer3, 2, {from: admin});
		await whitelist.addToWhitelist(buyer4, 3, {from: admin});

		//Assign Allocations
		presaleAllocations = await AllocationsManager.new();
		await presaleAllocations.setToken(token.address);
		await presaleAllocations.setAdmin(admin);
		teamAllocations = await AllocationsManager.new();
		await teamAllocations.setToken(token.address);
		await teamAllocations.setAdmin(admin);
		advisorsAllocations = await AllocationsManager.new();
		await advisorsAllocations.setToken(token.address);
		await advisorsAllocations.setAdmin(admin);
	});


	it('should deploy config and crowdsale and connect to token and allocations contracts', async function() {
		config = await SaleConfiguration.new().should.be.fulfilled;
		crowdsale = await AkropolisCrowdsale.new(startTime, endTime, wallet, whitelist.address, config.address).should.be.fulfilled;
		await token.transferOwnership(crowdsale.address).should.be.fulfilled;
		await crowdsale.setToken(token.address).should.be.fulfilled;
	});


	it('should sell max amount of tokens to a tier 1 whitelisted user during round 1', async function() {
		tokenBuyerAmountTier1 = (await config.AET_RATE()).mul(ether(10));
		await increaseTimeTo(startTime);
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(1);

		await crowdsale.buyTokens(buyer1, {from: buyer1, value: ether(10)}).should.be.fulfilled;


		(await token.balanceOf(buyer1)).should.be.bignumber.equal(tokenBuyerAmountTier1);

		await crowdsale.buyTokens(buyer1, {from: buyer1, value: 1}).should.be.rejectedWith('revert');
		await crowdsale.buyTokens(buyer3, {from: buyer3, value: 1}).should.be.rejectedWith('revert');
		await crowdsale.buyTokens(buyer4, {from: buyer4, value: 1}).should.be.rejectedWith('revert');
	});


	it('should sell max amount of tokens to a tier 1 and 2 whitelisted user during round 2', async function() {
		tokenBuyerAmountTier2 = (await config.AET_RATE()).mul(ether(5));
		await increaseTimeTo(startTime+ duration.days(3));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(2);

		await crowdsale.buyTokens(buyer2, {from: buyer2, value: ether(10)}).should.be.fulfilled;
		await crowdsale.buyTokens(buyer3, {from: buyer3, value: ether(5)}).should.be.fulfilled;


		(await token.balanceOf(buyer1)).should.be.bignumber.equal(tokenBuyerAmountTier1);
		(await token.balanceOf(buyer2)).should.be.bignumber.equal(tokenBuyerAmountTier1);
		(await token.balanceOf(buyer3)).should.be.bignumber.equal(tokenBuyerAmountTier2);

		await crowdsale.buyTokens(buyer1, {from: buyer1, value: 1}).should.be.rejectedWith('revert');
		await crowdsale.buyTokens(buyer2, {from: buyer2, value: 1}).should.be.rejectedWith('revert');
		await crowdsale.buyTokens(buyer3, {from: buyer3, value: 1}).should.be.rejectedWith('revert');
		await crowdsale.buyTokens(buyer4, {from: buyer4, value: 1}).should.be.rejectedWith('revert');
	});

	it('should sell max amount of tokens to any whitelisted user during round 3', async function() {
		tokenBuyerAmountTier3 = (await config.AET_RATE()).mul(ether(15));
		await increaseTimeTo(startTime+ duration.days(6));
		(await crowdsale.getCurrentRound()).should.be.bignumber.equal(3);

		let tier1BuyerContribution = config.MAX_CONTRIBUTION_VALUE().sub(ether(10));
		let tier2BuyerContribution = config.MAX_CONTRIBUTION_VALUE().sub(ether(5));

		await crowdsale.buyTokens(buyer1, {from: buyer1, value: tier1BuyerContribution}).should.be.fulfilled;
		await crowdsale.buyTokens(buyer2, {from: buyer2, value: tier1BuyerContribution}).should.be.fulfilled;
		await crowdsale.buyTokens(buyer3, {from: buyer3, value: tier2BuyerContribution}).should.be.fulfilled;
		await crowdsale.buyTokens(buyer3, {from: buyer3, value: ether(15)}).should.be.fulfilled;


		(await token.balanceOf(buyer1)).should.be.bignumber.equal(tokenBuyerAmountTier3);
		(await token.balanceOf(buyer2)).should.be.bignumber.equal(tokenBuyerAmountTier3);
		(await token.balanceOf(buyer3)).should.be.bignumber.equal(tokenBuyerAmountTier3);
		(await token.balanceOf(buyer4)).should.be.bignumber.equal(tokenBuyerAmountTier3);

		await crowdsale.buyTokens(buyer1, {from: buyer1, value: 1}).should.be.rejectedWith('revert');
		await crowdsale.buyTokens(buyer2, {from: buyer2, value: 1}).should.be.rejectedWith('revert');
		await crowdsale.buyTokens(buyer3, {from: buyer3, value: 1}).should.be.rejectedWith('revert');
		await crowdsale.buyTokens(buyer4, {from: buyer4, value: 1}).should.be.rejectedWith('revert');
	});


	it('should not allow for transfer of tokens before end of sale', async function () {
		await token.transfer(unknown, 1, {from: buyer1}).should.be.rejectedWith('revert');
		await token.approve(unknown, 1, {from: buyer1}).should.be.rejectedWith('revert');
		await token.transferFrom(buyer1, unknown, 1, {from: unknown}).should.be.rejectedWith('revert');
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
	});


	it('should not mint more tokens', async function () {
		await token.mint(buyer1, 1, { from: owner }).should.be.rejectedWith('revert');
	});
});