'use strict'

const AkropolisToken = artifacts.require('./AkropolisToken.sol')
const AkropolisPresale = artifacts.require('./AkropolisPresale.sol')

const BigNumber = web3.BigNumber;

const should = require('chai')
	.use(require('chai-as-promised'))
	.use(require('chai-bignumber')(BigNumber))
	.should()

contract('Akropolis Presale', function ([owner, admin, investor, foundation, other]) {

	let token;
	let presale;

	before(async function () {
		token = await AkropolisToken.new()
		presale = await AkropolisPresale.new();
	});

	it('should not allow registering allocations for anyone other than admin', async function () {
		await presale.registerAllocation(investor, 100).should.be.rejectedWith('revert');
	});


	it('should allow the admin to register allocations', async function () {
		await presale.setAdmin(admin);
		await presale.registerAllocation(investor, 100, {from: admin});

		let allocated = await presale.getAllocatedTokens(investor);
		(await allocated).should.be.bignumber.equal(100);
	});


	it('should allow the admin to change allocations', async function () {
		await presale.registerAllocation(investor, 200, {from: admin});

		let allocated = await presale.getAllocatedTokens(investor);
		(await allocated).should.be.bignumber.equal(200);
	});


	it('should allow the owner to set the token', async function () {
		await presale.setToken(token.address, {from: owner});

		let tokenAddress = await presale.token();
		(await tokenAddress).should.be.equal(token.address);
	});


	it('should setup the token', async function () {
		await presale.setToken(token.address, {from: owner});

		let tokenAddress = await presale.token();
		(await tokenAddress).should.be.equal(token.address);
	});


	it('should allow the owner to distribute the tokens', async function () {
		await token.mint(presale.address, 300, {from: owner});
		(await token.balanceOf(presale.address)).should.be.bignumber.equal(300);

		await presale.distributeAllocation(investor, {from: owner});
		(await token.balanceOf(investor)).should.be.bignumber.equal(200);
		(await token.balanceOf(presale.address)).should.be.bignumber.equal(100);
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