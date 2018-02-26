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

//This integration test seeks to discover permission edge cases related to the token sales
//The specific permissions we ensure are revoked during the sale include setting admin, token assigning, whitelist duties
//Also included is not allowing unknown users to finalize crowdsale
contract('Akropolis Unknown Permissioning Scenario', function ([owner, admin, wallet, buyer1, buyer2, buyer3, buyer4, buyer5, investor1, investor2, investor3,
																						reserveFund, developmentFund, unknown]) {

	const ALLOCATED_VALUE = 100;
	const ALLOCATED_VESTING = 200;
	const VESTING_PERIOD = duration.days(100);
	const VESTING_CLIFF = duration.days(25);

	const CONTRIBUTION_AMOUNT = ether(1);

	let token, crowdsale, whitelist, config;
	let presaleAllocations, teamAllocations, advisorsAllocations;
	let startTime, endTime, afterEndTime;

	before(async function () {
		// Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
		await advanceBlock();

		startTime = latestTime() + duration.weeks(1);
		endTime = startTime + duration.days(9);
		afterEndTime = endTime + duration.seconds(1);

		whitelist = await Whitelist.new().should.be.fulfilled;

		await whitelist.setAdmin(admin);
		await whitelist.addToWhitelist(buyer1, 1, {from: admin});
		await whitelist.addToWhitelist(buyer2, 1, {from: admin});
		await whitelist.addToWhitelist(buyer3, 1, {from: admin});
		await whitelist.addToWhitelist(buyer4, 1, {from: admin});
		await whitelist.addToWhitelist(buyer5, 1, {from: admin});

		//deploy allocations
		presaleAllocations = await AllocationsManager.new();
		await presaleAllocations.setAdmin(admin);

		teamAllocations = await AllocationsManager.new();
		await teamAllocations.setAdmin(admin);

		advisorsAllocations = await AllocationsManager.new();
		await advisorsAllocations.setAdmin(admin);

		//Setup presale allocations
		await presaleAllocations.registerAllocation(investor1, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_CLIFF, VESTING_PERIOD, {from: admin});
		await presaleAllocations.registerAllocation(investor2, (ALLOCATED_VALUE * 2), (ALLOCATED_VESTING * 10), VESTING_CLIFF, (VESTING_PERIOD * 2), {from: admin});
		await presaleAllocations.registerAllocation(investor3, ALLOCATED_VALUE, 0, 0, 0, {from: admin});
	});

	
	it('should not let unknown users set the admin for whitelist, add or remove from whitelist', async function () {
		await whitelist.setAdmin(unknown, {from: unknown}).should.be.rejectedWith('revert');
		await whitelist.addToWhitelist(buyer4, 1, {from: unknown}).should.be.rejectedWith('revert');
		await whitelist.removeFromWhitelist(buyer4, {from: unknown}).should.be.rejectedWith('revert');
	});


	it('should deploy crowdsale and connect to token and allocations contracts', async function() {
		config = await SaleConfiguration.new();
		crowdsale = await AkropolisCrowdsale.new(startTime, endTime, wallet, whitelist.address, config.address).should.be.fulfilled;
		token = await AkropolisToken.at(await crowdsale.token());

		await crowdsale.setRoundDuration(duration.days(1), {from: owner}).should.be.fulfilled;
		await crowdsale.setCapsPerTier(1, 2, 3, {from: owner}).should.be.fulfilled;
	});


	it('should not let unknown users set the registration, token or admin for an allocation', async function () {
		await teamAllocations.setToken(token.address, {from: unknown}).should.be.rejectedWith('revert');
		await teamAllocations.setAdmin(unknown, {from: unknown}).should.be.rejectedWith('revert');
		await presaleAllocations.registerAllocation(unknown, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_CLIFF, VESTING_PERIOD, {from: unknown}).should.be.rejectedWith('revert');
	});


	it('should not let unknown users set the parameters, token or admin for crowdsale', async function () {
		await crowdsale.setRoundDuration(duration.days(1), {from: unknown}).should.be.rejectedWith('revert');
		await crowdsale.setCapsPerTier(1, 2, 3, {from: unknown}).should.be.rejectedWith('revert');
	});


	it('should not sell tokens to unknown users', async function () {
		await increaseTimeTo(startTime + duration.days(1));
		await crowdsale.buyTokens(unknown, {from: unknown, value: CONTRIBUTION_AMOUNT}).should.be.rejectedWith('revert');
	});


	it('should not allow unknown to remove buyer5 from whitelist', async function () {
		await whitelist.removeFromWhitelist(buyer5, {from: unknown}).should.be.rejectedWith('revert');
	});


	it('should allow admin to remove buyer5 from whitelist', async function () {
		await whitelist.removeFromWhitelist(buyer5, {from: admin}).should.be.fulfilled;
	});


	it('should not sell tokens to users removed from whitelist', async function () {
		await crowdsale.buyTokens(buyer5, {from: buyer5, value: CONTRIBUTION_AMOUNT}).should.be.rejectedWith('revert');
	});


	it('should not allow allocations or funds to be set by unknown addresses', async function() {
		await crowdsale.setPresaleAllocations(presaleAllocations.address, {from: unknown}).should.be.rejectedWith('revert');
		await crowdsale.setTeamAllocations(teamAllocations.address, {from: unknown}).should.be.rejectedWith('revert');
		await crowdsale.setAdvisorsAllocations(advisorsAllocations.address, {from: unknown}).should.be.rejectedWith('revert');

		await crowdsale.setReserveFund(reserveFund, {from: unknown}).should.be.rejectedWith('revert');
		await crowdsale.setDevelopmentFund(developmentFund, {from: unknown}).should.be.rejectedWith('revert');
	});


	it('should not allow unknown users to finalize crowdsale', async function () {
		await increaseTimeTo(afterEndTime);
		await crowdsale.finalize({from: unknown}).should.be.rejectedWith('revert');
	});


	it('should finalize crowdsale', async function() {
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


	it('should not allow unknown users to distribute tokens', async function() {
		await presaleAllocations.distributeAllocation(investor1, {from: unknown}).should.be.rejectedWith('revert');
	});

});