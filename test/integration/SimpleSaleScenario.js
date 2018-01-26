import { advanceBlock } from './tools/advanceToBlock';
import { increaseTimeTo, duration } from './tools/increaseTime';
import latestTime from './tools/latestTime';

const AkropolisToken = artifacts.require('./AkropolisToken.sol');
const AkropolisCrowdsale = artifacts.require('./AkropolisCrowdsale.sol');
const Whitelist = artifacts.require('./Whitelist.sol');
const SaleConfigurationMock = artifacts.require('./SaleConfigurationMock.sol');

const BigNumber = web3.BigNumber;

const should = require('chai')
	.use(require('chai-as-promised'))
	.use(require('chai-bignumber')(BigNumber))
	.should();

function ether (n) {
	return new web3.BigNumber(web3.toWei(n, 'ether'));
}

contract('Akropolis TGE Scenario', function ([owner, admin, buyer, wallet, bonusBuyer1, bonusBuyer2, bonusBuyer3, bonusBuyer4,
																						presaleAllocations, teamAllocations, advisorsAllocations,
																						reserveFund, bountyFund, developmentFund]) {

	let token, crowdsale, whitelist, config;
	let startTime, endTime, afterEndTime;



	it('should deploy AET token', async function () {

	});


	it('should deploy Whitelist', async function () {

	});


	it('should register 3 users to the whitelist', async function () {

	});


	it('should deploy pre-sale allocations', async function() {

	});


	it('should register 3 investors', async function() {

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