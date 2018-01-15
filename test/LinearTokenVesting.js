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

contract('Linear Token Vesting', function ([owner, beneficiary]) {

	const DURATION = duration.days(100);
	const VESTING_AMOUNT = 100;

	let token;
	let vesting;
	let start;

	before(async function () {
		await advanceBlock();
		token = await AkropolisToken.new();
	});

	it('should define vesting', async function () {
		vesting = await LinearTokenVesting.new(beneficiary, DURATION);
		start = latestTime();
		await token.mint(vesting.address, VESTING_AMOUNT);

		(await token.balanceOf(vesting.address)).should.be.bignumber.equal(VESTING_AMOUNT);
		(await vesting.duration()).should.be.bignumber.equal(DURATION);
		(await vesting.beneficiary()).should.be.bignumber.equal(beneficiary);
		(await vesting.start()).should.be.bignumber.equal(start);
	});


	it('should vest funds pro-rata', async function () {
		//Start: 0% vested
		(await vesting.vestedAmount(token.address)).should.be.bignumber.equal(0);

		//Time passed: 20%
		await increaseTimeTo(start + 0.2 * DURATION);
		(await vesting.vestedAmount(token.address)).should.be.bignumber.equal(20);

		//Time passed: 50%
		await increaseTimeTo(start + 0.5 * DURATION);
		(await vesting.vestedAmount(token.address)).should.be.bignumber.equal(50);
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

	it('should release total vesting', async function () {
		await await increaseTimeTo(start + DURATION);
		(await vesting.vestedAmount(token.address)).should.be.bignumber.equal(VESTING_AMOUNT);
		(await vesting.releasableAmount(token.address)).should.be.bignumber.equal(50);

		await vesting.release(token.address);

		(await vesting.vestedAmount(token.address)).should.be.bignumber.equal(VESTING_AMOUNT);
		(await vesting.releasableAmount(token.address)).should.be.bignumber.equal(0);
		(await token.balanceOf(vesting.address)).should.be.bignumber.equal(0);
		(await token.balanceOf(beneficiary)).should.be.bignumber.equal(VESTING_AMOUNT);
	});

})