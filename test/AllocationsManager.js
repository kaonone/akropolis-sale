'use strict'

const AkropolisToken = artifacts.require('./AkropolisToken.sol');
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

contract('AllocationsManager', function ([owner, admin, investor, investorWithVesting, investor3, foundation, other]) {

	const ALLOCATED_VALUE = 100;
	const UPDATED_VALUE = 200;
	const ALLOCATED_VESTING = 200;
	const VESTING_PERIOD = 1000;
	const VESTING_CLIFF = 250;

	let token;
	let allocations;

	before(async function () {
		token = await AkropolisToken.new();
		allocations = await AllocationsManager.new();
	});

	it('should not allow registering allocations for anyone other than admin', async function () {
		await allocations.registerAllocation(investor, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_CLIFF, VESTING_PERIOD).should.be.rejectedWith('revert');
    await allocations.registerAllocation(other, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_CLIFF, VESTING_PERIOD).should.be.rejectedWith('revert');
	});

	it('should not allow setting admin for anyone other than the owner', async function() {
		await allocations.setAdmin(admin, {from: admin}).should.be.rejectedWith('revert');
		await allocations.setAdmin(admin, {from: investor}).should.be.rejectedWith('revert');
		await allocations.setAdmin(admin, {from: other}).should.be.rejectedWith('revert');
	});


	it('should not allow setting empty admin', async function() {
		await allocations.setAdmin(0x0).should.be.rejectedWith('revert');
	});


	it('should allow the admin to register allocations', async function () {
		await allocations.setAdmin(admin);
		await allocations.registerAllocation(investor, ALLOCATED_VALUE, 0, 0, 0, {from: admin});

		let allocated = await allocations.getAllocation(investor);
		allocated[0].should.be.bignumber.equal(ALLOCATED_VALUE);
		allocated[1].should.be.bignumber.equal(0);
		allocated[2].should.be.bignumber.equal(0);
		allocated[3].should.be.bignumber.equal(0);

		(await allocations.totalAllocated()).should.be.bignumber.equal(ALLOCATED_VALUE);
		(await allocations.getAllocationsCount()).should.be.bignumber.equal(1);
		(await allocations.getAllocationAddress(0)).should.be.equal(investor);
	});


	it('should allow the admin to change allocations', async function () {
		await allocations.registerAllocation(investor, UPDATED_VALUE, 0, 0, 0, {from: admin});

		let allocated = await allocations.getAllocation(investor);
		allocated[0].should.be.bignumber.equal(UPDATED_VALUE);
		allocated[1].should.be.bignumber.equal(0);
		allocated[2].should.be.bignumber.equal(0);
		allocated[3].should.be.bignumber.equal(0);

		(await allocations.totalAllocated()).should.be.bignumber.equal(UPDATED_VALUE);
	});


	it('should allow the admin to register allocation with vesting', async function () {
		await allocations.registerAllocation(investorWithVesting, ALLOCATED_VALUE * 2, ALLOCATED_VESTING * 2, VESTING_CLIFF * 2, VESTING_PERIOD * 2, {from: admin});

		let allocated = await allocations.getAllocation(investorWithVesting);
		allocated[0].should.be.bignumber.equal(ALLOCATED_VALUE * 2);
		allocated[1].should.be.bignumber.equal(ALLOCATED_VESTING * 2);
		allocated[2].should.be.bignumber.equal(VESTING_CLIFF * 2);
		allocated[3].should.be.bignumber.equal(VESTING_PERIOD * 2);

		(await allocations.totalAllocated()).should.be.bignumber.equal(UPDATED_VALUE + ALLOCATED_VALUE * 2 + ALLOCATED_VESTING * 2);
		(await allocations.getAllocationsCount()).should.be.bignumber.equal(2);
		(await allocations.getAllocationAddress(1)).should.be.equal(investorWithVesting);
	});


	it('should allow the admin to update allocation with vesting', async function () {
		await allocations.registerAllocation(investorWithVesting, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_CLIFF, VESTING_PERIOD, {from: admin});

		let allocated = await allocations.getAllocation(investorWithVesting);
		allocated[0].should.be.bignumber.equal(ALLOCATED_VALUE);
		allocated[1].should.be.bignumber.equal(ALLOCATED_VESTING);
		allocated[2].should.be.bignumber.equal(VESTING_CLIFF);
		allocated[3].should.be.bignumber.equal(VESTING_PERIOD);

		(await allocations.totalAllocated()).should.be.bignumber.equal(UPDATED_VALUE + ALLOCATED_VALUE + ALLOCATED_VESTING);
		(await allocations.getAllocationsCount()).should.be.bignumber.equal(2);
		(await allocations.getAllocationAddress(0)).should.be.equal(investor);
		(await allocations.getAllocationAddress(1)).should.be.equal(investorWithVesting);
	});


	it('should allow the admin to remove allocation in the order of additions', async function () {
		await allocations.removeAllocation(investor);

		(await allocations.getAllocationsCount()).should.be.bignumber.equal(1);
		(await allocations.getAllocationAddress(0)).should.be.equal(investorWithVesting);

		await allocations.removeAllocation(investorWithVesting);
		(await allocations.getAllocationsCount()).should.be.bignumber.equal(0);
		(await allocations.totalAllocated()).should.be.bignumber.equal(0);
	});


	it('should allow the admin to remove allocation in the reverse order', async function () {
		await allocations.registerAllocation(investorWithVesting, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_CLIFF, VESTING_PERIOD, {from: admin});
		await allocations.registerAllocation(investor, UPDATED_VALUE, 0, 0, 0, {from: admin});

		await allocations.removeAllocation(investor);

		(await allocations.getAllocationsCount()).should.be.bignumber.equal(1);
		(await allocations.getAllocationAddress(0)).should.be.equal(investorWithVesting);

		await allocations.removeAllocation(investorWithVesting);
		(await allocations.getAllocationsCount()).should.be.bignumber.equal(0);
		(await allocations.totalAllocated()).should.be.bignumber.equal(0);
	});


	it('should allow the admin to remove allocation starting from the middle', async function () {
		await allocations.registerAllocation(investorWithVesting, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_CLIFF, VESTING_PERIOD, {from: admin});
		await allocations.registerAllocation(investor, UPDATED_VALUE, 0, 0, 0, {from: admin});
		await allocations.registerAllocation(investor3, ALLOCATED_VALUE, 0, 0, 0, {from: admin});

		(await allocations.getAllocationsCount()).should.be.bignumber.equal(3);
		(await allocations.getAllocationAddress(0)).should.be.equal(investorWithVesting);
		(await allocations.getAllocationAddress(1)).should.be.equal(investor);
		(await allocations.getAllocationAddress(2)).should.be.equal(investor3);
		(await allocations.totalAllocated()).should.be.bignumber.equal(ALLOCATED_VALUE + ALLOCATED_VESTING + ALLOCATED_VALUE + UPDATED_VALUE);

		await allocations.removeAllocation(investor);

		(await allocations.getAllocationsCount()).should.be.bignumber.equal(2);
		(await allocations.getAllocationAddress(0)).should.be.equal(investorWithVesting);
		(await allocations.getAllocationAddress(1)).should.be.equal(investor3);
		(await allocations.totalAllocated()).should.be.bignumber.equal(ALLOCATED_VALUE + ALLOCATED_VESTING + ALLOCATED_VALUE);

		await allocations.removeAllocation(investorWithVesting);

		(await allocations.getAllocationsCount()).should.be.bignumber.equal(1);
		(await allocations.getAllocationAddress(0)).should.be.equal(investor3);
		(await allocations.totalAllocated()).should.be.bignumber.equal(ALLOCATED_VALUE);

		await allocations.removeAllocation(investor3);
	});


	it('should allow the admin to add allocations after removal', async function () {
		await allocations.registerAllocation(investor, UPDATED_VALUE, 0, 0, 0, {from: admin});
		await allocations.registerAllocation(investorWithVesting, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_CLIFF, VESTING_PERIOD, {from: admin});

		(await allocations.totalAllocated()).should.be.bignumber.equal(UPDATED_VALUE + ALLOCATED_VALUE + ALLOCATED_VESTING);
		(await allocations.getAllocationsCount()).should.be.bignumber.equal(2);
		(await allocations.getAllocationAddress(0)).should.be.equal(investor);
		(await allocations.getAllocationAddress(1)).should.be.equal(investorWithVesting);
	});


	it('should not allow admin to register null investor', async function () {
		await allocations.registerAllocation(0, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_CLIFF, VESTING_PERIOD, {from: admin}).should.be.rejectedWith('revert');
	});


	it('should not allow admin to remove non-existing allocation ', async function () {
		await allocations.removeAllocation(other).should.be.rejectedWith('revert');
	});


	it('should not allow admin to register null value ', async function () {
		await allocations.registerAllocation(investor, 0, 0, 0, 0, {from: admin}).should.be.rejectedWith('revert');
	});


	it('should not allow admin to register value greater than max allocation value ', async function () {
		let bigAllocation = (await allocations.MAX_ALLOCATION_VALUE()).add(1);
		await allocations.registerAllocation(investor, bigAllocation, ALLOCATED_VESTING, VESTING_CLIFF, VESTING_PERIOD, {from: admin}).should.be.rejectedWith('revert');
	});


	it('should not allow null vesting value with vesting period including proper time ', async function () {
		await allocations.registerAllocation(investor, ALLOCATED_VALUE, ether(0), VESTING_CLIFF, VESTING_PERIOD, {from: admin}).should.be.rejectedWith('revert');
	});


	it('should not allow proper vesting value with null time allocated ', async function () {
		await allocations.registerAllocation(investor, ALLOCATED_VALUE, ALLOCATED_VESTING, 0, 0, {from: admin}).should.be.rejectedWith('revert');
	});


	it('should not allow proper vesting value cliff longer than the vesting period ', async function () {
		await allocations.registerAllocation(investor, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_PERIOD + 1, VESTING_PERIOD, {from: admin}).should.be.rejectedWith('revert');
	});


	it('should allow the owner to set the token', async function () {
		await allocations.setToken(token.address, {from: owner});

		let tokenAddress = await allocations.token();
		tokenAddress.should.be.equal(token.address);
	});


	it('should not allow setting token for anyone other than the owner', async function() {
		await allocations.setToken(token.address, {from: admin}).should.be.rejectedWith('revert');
		await allocations.setToken(token.address, {from: investor}).should.be.rejectedWith('revert');
		await allocations.setToken(token.address, {from: other}).should.be.rejectedWith('revert');
	});


	it('should not allow setting empty token address', async function() {
		await allocations.setToken(0x0).should.be.rejectedWith('revert');
	});


	it('should allow the owner to distribute the tokens', async function () {
		await token.mint(allocations.address, 600, {from: owner});
		(await token.balanceOf(allocations.address)).should.be.bignumber.equal(600);

		await allocations.distributeAllocation(investor, {from: owner});

		(await token.balanceOf(investor)).should.be.bignumber.equal(UPDATED_VALUE);
		(await token.balanceOf(allocations.address)).should.be.bignumber.equal(400);
	});


	it('should allow the owner to distribute the tokens with vesting', async function () {
		await allocations.distributeAllocation(investorWithVesting, {from: owner});

		(await token.balanceOf(investorWithVesting)).should.be.bignumber.equal(ALLOCATED_VALUE);
		(await token.balanceOf(allocations.address)).should.be.bignumber.equal(100);
	});


	it('should not allow distribution of tokens to null investor', async function () {
		await allocations.distributeAllocation(0x0, {from: owner}).should.be.rejectedWith('revert');
	});


	it('should not allow to register allocation for investor that already has a distributed status', async function () {
		await allocations.registerAllocation(investorWithVesting, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_CLIFF, VESTING_PERIOD,
			{from: admin}).should.be.rejectedWith('revert');
	});

	it('should NOT allow to ditribute allocation twice', async function () {
		await allocations.distributeAllocation(investorWithVesting, {from: owner}).should.be.rejectedWith('revert');
	});


	it('should return 0 allocated tokens for already distributed investors', async function () {
		let allocated = await allocations.getAllocation(investorWithVesting);
		allocated[0].should.be.bignumber.equal(0);
		allocated[1].should.be.bignumber.equal(0);
		allocated[2].should.be.bignumber.equal(0);
		allocated[3].should.be.bignumber.equal(0);
	});


	it('should setup correct vesting', async function () {
		let vesting = LinearTokenVesting.at(await allocations.getVesting(investorWithVesting));

		(await vesting.beneficiary()).should.be.equal(investorWithVesting);
		(await vesting.duration()).should.be.bignumber.equal(VESTING_PERIOD);
		(await vesting.cliff()).should.be.bignumber.equal(VESTING_CLIFF);
		(await token.balanceOf(vesting.address)).should.be.bignumber.equal(ALLOCATED_VESTING);
		(await vesting.releasableAmount(token.address)).should.be.bignumber.equal(0);
	});


	it('should not allow reclaiming for anyone other than the owner', async function () {
		await allocations.reclaimTokens(foundation, {from: admin}).should.be.rejectedWith('revert');
		await allocations.reclaimTokens(foundation, {from: investor}).should.be.rejectedWith('revert');
		await allocations.reclaimTokens(foundation, {from: other}).should.be.rejectedWith('revert');
	});


	it('should allow reclaiming outstanding tokens', async function () {
		await allocations.reclaimTokens(foundation, {from: owner});
		(await token.balanceOf(foundation)).should.be.bignumber.equal(100);
		(await token.balanceOf(allocations.address)).should.be.bignumber.equal(0);
	});

});