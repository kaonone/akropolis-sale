'use strict'

import { advanceBlock } from './tools/advanceToBlock';
import { increaseTimeTo, duration } from './tools/increaseTime';
import latestTime from './tools/latestTime';

const AkropolisToken = artifacts.require('./AkropolisToken.sol')
const LinearTokenVesting = artifacts.require('./LinearTokenVesting.sol')

const BigNumber = web3.BigNumber;

const should = require('chai')
	.use(require('chai-as-promised'))
	.use(require('chai-bignumber')(BigNumber))
	.should();

contract('Linear Token Vesting', function ([owner, beneficiary, unknown]) {

	const DURATION = duration.days(100);
	const CLIFF = duration.days(25);
	const VESTING_AMOUNT = 100;

	let token;
	let vesting;
	let start;

	before(async function () {
		await advanceBlock();
		token = await AkropolisToken.new();
	});


	it('should not allow vesting without duration', async function () {
		vesting = await LinearTokenVesting.new(beneficiary, 0, 0).should.be.rejectedWith('revert');
	});


	it('should not allow vesting without beneficiary', async function () {
		vesting = await LinearTokenVesting.new(0x0, CLIFF, DURATION).should.be.rejectedWith('revert');
  });


	it('should not allow vesting with cliff longer than duration', async function () {
		vesting = await LinearTokenVesting.new(0x0, DURATION + 1, DURATION).should.be.rejectedWith('revert');
	});


	it('should define vesting', async function () {
		vesting = await LinearTokenVesting.new(beneficiary, CLIFF, DURATION);
		start = latestTime();
		await token.mint(vesting.address, VESTING_AMOUNT);

		(await token.balanceOf(vesting.address)).should.be.bignumber.equal(VESTING_AMOUNT);
		(await vesting.duration()).should.be.bignumber.equal(DURATION);
		(await vesting.beneficiary()).should.be.bignumber.equal(beneficiary);
		(await vesting.cliff()).should.be.bignumber.equal(CLIFF);
		(await vesting.start()).should.be.bignumber.equal(start);
	});


	it('should vest funds pro-rata', async function () {
		//Start: 0% vested
		(await vesting.vestedAmount(token.address)).should.be.bignumber.equal(0);

		//Cliff: 0% vested
		await increaseTimeTo(start + 0.24 * DURATION);
		(await vesting.vestedAmount(token.address)).should.be.bignumber.equal(0);

		//Time passed: 30%
		await increaseTimeTo(start + 0.3 * DURATION);
		(await vesting.vestedAmount(token.address)).should.be.bignumber.equal(30);

		//Time passed: 50%
		await increaseTimeTo(start + 0.5 * DURATION);
		(await vesting.vestedAmount(token.address)).should.be.bignumber.equal(50);
	});


	it('should not release tokens to unknown address', async function () {
		(await vesting.vestedAmount(token.address)).should.be.bignumber.equal(50);
		await vesting.release(token.address, {from: unknown}).should.be.rejectedWith('revert');
	});


	it('should release vested amount', async function () {
		(await vesting.vestedAmount(token.address)).should.be.bignumber.equal(50);
		(await vesting.releasableAmount(token.address)).should.be.bignumber.equal(50);

		await vesting.release(token.address);

		(await vesting.vestedAmount(token.address)).should.be.bignumber.equal(50);
		(await vesting.releasableAmount(token.address)).should.be.bignumber.equal(0);
		(await token.balanceOf(vesting.address)).should.be.bignumber.equal(50);
		(await token.balanceOf(beneficiary)).should.be.bignumber.equal(50);
	});

	it('should handle multiple release requests', async function () {
		await increaseTimeTo(start + 0.6 * DURATION);
		(await vesting.vestedAmount(token.address)).should.be.bignumber.equal(60);
		(await vesting.releasableAmount(token.address)).should.be.bignumber.equal(10);

		await vesting.release(token.address);
		await vesting.release(token.address).should.be.rejectedWith('revert');

		(await vesting.vestedAmount(token.address)).should.be.bignumber.equal(60);
		(await vesting.releasableAmount(token.address)).should.be.bignumber.equal(0);
		(await token.balanceOf(vesting.address)).should.be.bignumber.equal(40);
		(await token.balanceOf(beneficiary)).should.be.bignumber.equal(60);
	});


	it('should release total vesting', async function () {
		await increaseTimeTo(start + DURATION);
		(await vesting.vestedAmount(token.address)).should.be.bignumber.equal(VESTING_AMOUNT);
		(await vesting.releasableAmount(token.address)).should.be.bignumber.equal(40);

		await vesting.release(token.address);

		(await vesting.vestedAmount(token.address)).should.be.bignumber.equal(VESTING_AMOUNT);
		(await vesting.releasableAmount(token.address)).should.be.bignumber.equal(0);
		(await token.balanceOf(vesting.address)).should.be.bignumber.equal(0);
		(await token.balanceOf(beneficiary)).should.be.bignumber.equal(VESTING_AMOUNT);
	});


	it('should not release tokens if there are no unreleased tokens', async function () {
		(await vesting.releasableAmount(token.address)).should.be.bignumber.equal(0);
		await vesting.release(token.address).should.be.rejectedWith('revert');
	});


	it('should not vest more than the total vested amount, after the duration', async function() {
		await increaseTimeTo(start + 1.5 * DURATION);
		(await vesting.vestedAmount(token.address)).should.be.bignumber.equal(VESTING_AMOUNT);
	});


	it('should claim tokens accidentally sent after the vesting', async function() {
		await token.mint(vesting.address, 100);
		(await vesting.vestedAmount(token.address)).should.be.bignumber.equal(VESTING_AMOUNT + 100);
		(await vesting.releasableAmount(token.address)).should.be.bignumber.equal(100);

		await vesting.release(token.address);

		(await vesting.vestedAmount(token.address)).should.be.bignumber.equal(VESTING_AMOUNT + 100);
		(await vesting.releasableAmount(token.address)).should.be.bignumber.equal(0);
		(await token.balanceOf(vesting.address)).should.be.bignumber.equal(0);
		(await token.balanceOf(beneficiary)).should.be.bignumber.equal(VESTING_AMOUNT + 100);

	});

});