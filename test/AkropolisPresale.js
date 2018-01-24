'use strict'

const AkropolisToken = artifacts.require('./AkropolisToken.sol')
const AkropolisPresale = artifacts.require('./AkropolisPresale.sol')
const LinearTokenVesting = artifacts.require('./LinearTokenVesting.sol')

const BigNumber = web3.BigNumber;

const should = require('chai')
	.use(require('chai-as-promised'))
	.use(require('chai-bignumber')(BigNumber))
	.should()

function ether (n) {
	return new web3.BigNumber(web3.toWei(n, 'ether'));
}

contract('Akropolis Presale', function ([owner, admin, investor, investorWithVesting, foundation, other]) {

	const ALLOCATED_VALUE = 100;
	const UPDATED_VALUE = 200;
	const ALLOCATED_VESTING = 200;
	const VESTING_PERIOD = 1000;

	let token;
	let presale;

	before(async function () {
		token = await AkropolisToken.new()
		presale = await AkropolisPresale.new();
	});

	it('should not allow registering allocations for anyone other than admin', async function () {
		await presale.registerAllocation(investor, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_PERIOD).should.be.rejectedWith('revert');
    	await presale.registerAllocation(other, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_PERIOD).should.be.rejectedWith('revert');
	});

	it('should not allow setting admin for anyone other than the owner', async function() {
		await presale.setAdmin(admin, {from: admin}).should.be.rejectedWith('revert');
		await presale.setAdmin(admin, {from: investor}).should.be.rejectedWith('revert');
		await presale.setAdmin(admin, {from: other}).should.be.rejectedWith('revert');
	});


	it('should not allow setting empty admin', async function() {
		await presale.setAdmin(0x0).should.be.rejectedWith('revert');
	});


	it('should allow the admin to register allocations', async function () {
		await presale.setAdmin(admin);
		await presale.registerAllocation(investor, ALLOCATED_VALUE, 0, 0, {from: admin});

		let allocated = await presale.getAllocatedTokens(investor);
		allocated[0].should.be.bignumber.equal(ALLOCATED_VALUE);
		allocated[1].should.be.bignumber.equal(0);
		allocated[2].should.be.bignumber.equal(0);
	});


	it('should allow the admin to change allocations', async function () {
		await presale.registerAllocation(investor, UPDATED_VALUE, 0, 0, {from: admin});

		let allocated = await presale.getAllocatedTokens(investor);
		allocated[0].should.be.bignumber.equal(UPDATED_VALUE);
		allocated[1].should.be.bignumber.equal(0);
		allocated[2].should.be.bignumber.equal(0);
	});

	it('should allow the admin to register allocation with vesting', async function () {
		await presale.setAdmin(admin);
		await presale.registerAllocation(investorWithVesting, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_PERIOD, {from: admin});

		let allocated = await presale.getAllocatedTokens(investorWithVesting);
		allocated[0].should.be.bignumber.equal(ALLOCATED_VALUE);
		allocated[1].should.be.bignumber.equal(ALLOCATED_VESTING);
		allocated[2].should.be.bignumber.equal(VESTING_PERIOD);
	});


	it('should not allow admin to register null investor', async function () {
		await presale.registerAllocation(0, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_PERIOD, {from: admin}).should.be.rejectedWith('revert');
	})


	it('should not allow admin to register null value ', async function () {
		await presale.registerAllocation(investor, ether(0), ALLOCATED_VESTING, VESTING_PERIOD, {from: admin}).should.be.rejectedWith('revert');
	})


	it('should not allow admin to register value greater than max allocation value ', async function () {
		let bigAllocation = (await presale.MAX_ALLOCATION_VALUE()).toNumber() + ether(1);
		await presale.registerAllocation(investor, bigAllocation, ALLOCATED_VESTING, VESTING_PERIOD, {from: admin}).should.be.rejectedWith('revert');
	})


	it('should not allow null vesting value with vesting period including proper time ', async function () {
		await presale.registerAllocation(investor, ALLOCATED_VALUE, ether(0), VESTING_PERIOD, {from: admin}).should.be.rejectedWith('revert');
	})


	it('should not allow proper vesting value with null time allocated ', async function () {
		await presale.registerAllocation(investor, ALLOCATED_VALUE, ALLOCATED_VESTING, 0, {from: admin}).should.be.rejectedWith('revert');
	})


	it('should allow the owner to set the token', async function () {
		await presale.setToken(token.address, {from: owner});

		let tokenAddress = await presale.token();
		tokenAddress.should.be.equal(token.address);
	});


	it('should not allow setting token for anyone other than the owner', async function() {
		await presale.setToken(token.address, {from: admin}).should.be.rejectedWith('revert');
		await presale.setToken(token.address, {from: investor}).should.be.rejectedWith('revert');
		await presale.setToken(token.address, {from: other}).should.be.rejectedWith('revert');
	});


	it('should not allow setting empty token address', async function() {
		await presale.setToken(0x0).should.be.rejectedWith('revert');
	});


	it('should allow the owner to distribute the tokens', async function () {
		await token.mint(presale.address, 600, {from: owner});
		(await token.balanceOf(presale.address)).should.be.bignumber.equal(600);

		await presale.distributeAllocation(investor, {from: owner});

		(await token.balanceOf(investor)).should.be.bignumber.equal(UPDATED_VALUE);
		(await token.balanceOf(presale.address)).should.be.bignumber.equal(400);
	});


	it('should allow the owner to distribute the tokens with vesting', async function () {
		await presale.distributeAllocation(investorWithVesting, {from: owner});

		(await token.balanceOf(investorWithVesting)).should.be.bignumber.equal(ALLOCATED_VALUE);
		(await token.balanceOf(presale.address)).should.be.bignumber.equal(100);
	});


	it('should not allow distribution of tokens to null investor', async function () {
		await presale.distributeAllocation(0x0, {from: owner}).should.be.rejectedWith('revert');
	})


	it('should not allow to register allocation for investor that already has a distributed status', async function () {
		await presale.registerAllocation(investorWithVesting, ALLOCATED_VALUE, ALLOCATED_VESTING, VESTING_PERIOD,
			{from: admin}).should.be.rejectedWith('revert');
	})


	it('should return 0 allocated tokens for already distributed investors', async function () {
		let allocated = await presale.getAllocatedTokens(investorWithVesting);
		allocated[0].should.be.bignumber.equal(0);
		allocated[1].should.be.bignumber.equal(0);
		allocated[2].should.be.bignumber.equal(0);
	})


	it('should setup correct vesting', async function () {
		let vesting = LinearTokenVesting.at(await presale.getVesting(investorWithVesting));

		(await vesting.beneficiary()).should.be.equal(investorWithVesting);
		(await vesting.duration()).should.be.bignumber.equal(VESTING_PERIOD);
		(await token.balanceOf(vesting.address)).should.be.bignumber.equal(ALLOCATED_VESTING);
		(await vesting.releasableAmount(token.address)).should.be.bignumber.equal(0);
	});


	it('should not allow reclaiming for anyone other than the owner', async function () {
		await presale.reclaimTokens(foundation, {from: admin}).should.be.rejectedWith('revert');
		await presale.reclaimTokens(foundation, {from: investor}).should.be.rejectedWith('revert');
		await presale.reclaimTokens(foundation, {from: other}).should.be.rejectedWith('revert');
	});


	it('should allow reclaiming outstanding tokens', async function () {
		await presale.reclaimTokens(foundation, {from: owner});
		(await token.balanceOf(foundation)).should.be.bignumber.equal(100);
		(await token.balanceOf(presale.address)).should.be.bignumber.equal(0);
	});

})