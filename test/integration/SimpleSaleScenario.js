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

contract('Akropolis TGE Scenario', function ([owner, admin, buyer1, buyer2, buyer3, bonusBuyer4,
																						presaleAllocations, teamAllocations, advisorsAllocations,
																						reserveFund, bountyFund, developmentFund]) {

	const ALLOCATED_VALUE = 100;
	const ALLOCATED_VESTING = 200;
	const VESTING_PERIOD = 1000;

	let token, crowdsale, whitelist, config, allocations;
	let startTime, endTime, afterEndTime;


	it('should deploy AET token', async function () {
		token = await AkropolisToken.new().should.be.fulfilled;
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

		await allocations.registerAllocation(buyer1, ALLOCATED_VALUE, 0, 0, {from: admin}).should.be.fulfilled;
		await allocations.registerAllocation(buyer2, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_PERIOD, {from: admin}).should.be.fulfilled;
		await allocations.registerAllocation(buyer3, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_PERIOD, {from: admin}).should.be.fulfilled;
	});


	it('should deploy crowdsale and connect to token and allocations contracts', async function() {

	});


	it('should sell tokens to whitelisted users', async function() {

	});


	it('should finalize crowdsale', async function() {

	});


	it('should distribute tokens among pre-sale users', async function() {

	});

});