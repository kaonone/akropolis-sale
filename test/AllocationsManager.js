'use strict'

const AkropolisToken = artifacts.require('./AkropolisToken.sol')
const AllocationsManager = artifacts.require('./AllocationsManager.sol')
const LinearTokenVesting = artifacts.require('./LinearTokenVesting.sol')

const BigNumber = web3.BigNumber;

const should = require('chai')
	.use(require('chai-as-promised'))
	.use(require('chai-bignumber')(BigNumber))
	.should()

contract('AllocationsManager', function ([owner, admin, investor, investorWithVesting, foundation, other]) {

	const ALLOCATED_VALUE = 100;
	const UPDATED_VALUE = 200;
	const ALLOCATED_VESTING = 200;
	const VESTING_PERIOD = 1000;

	let token;
	let allocations;

	before(async function () {
		token = await AkropolisToken.new()
		allocations = await AllocationsManager.new();
	});

	it('should not allow registering allocations for anyone other than admin', async function () {
		await allocations.registerAllocation(investor, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_PERIOD).should.be.rejectedWith('revert');
    await allocations.registerAllocation(other, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_PERIOD).should.be.rejectedWith('revert');
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
		await allocations.registerAllocation(investor, ALLOCATED_VALUE, 0, 0, {from: admin});

		let allocated = await allocations.getAllocatedTokens(investor);
		allocated[0].should.be.bignumber.equal(ALLOCATED_VALUE);
		allocated[1].should.be.bignumber.equal(0);
		allocated[2].should.be.bignumber.equal(0);
	});


	it('should allow the admin to change allocations', async function () {
		await allocations.registerAllocation(investor, UPDATED_VALUE, 0, 0, {from: admin});

		let allocated = await allocations.getAllocatedTokens(investor);
		allocated[0].should.be.bignumber.equal(UPDATED_VALUE);
		allocated[1].should.be.bignumber.equal(0);
		allocated[2].should.be.bignumber.equal(0);
	});

	it('should allow the admin to register allocation with vesting', async function () {
		await allocations.setAdmin(admin);
		await allocations.registerAllocation(investorWithVesting, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_PERIOD, {from: admin});

		let allocated = await allocations.getAllocatedTokens(investorWithVesting);
		allocated[0].should.be.bignumber.equal(ALLOCATED_VALUE);
		allocated[1].should.be.bignumber.equal(ALLOCATED_VESTING);
		allocated[2].should.be.bignumber.equal(VESTING_PERIOD);
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


	it('should setup correct vesting', async function () {
		let vesting = LinearTokenVesting.at(await allocations.getVesting(investorWithVesting));

		(await vesting.beneficiary()).should.be.equal(investorWithVesting);
		(await vesting.duration()).should.be.bignumber.equal(VESTING_PERIOD);
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

})