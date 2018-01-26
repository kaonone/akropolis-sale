pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol";
import "./AkropolisToken.sol";
import "./WhitelistedCrowdsale.sol";
import "./IncreasingCapCrowdsale.sol";
import "./SaleConfiguration.sol";
import "./AllocationsManager.sol";


contract AkropolisCrowdsale is IncreasingCapCrowdsale, FinalizableCrowdsale, WhitelistedCrowdsale, SaleConfiguration {

    event WalletChange(address wallet);

    mapping(address => uint256) public contributions;
    uint256 public tokensSold;

    AllocationsManager public presaleAllocations;
    AllocationsManager public teamAllocations;
    AllocationsManager public advisorsAllocations;

    address public reserveFund;
    address public bountyFund;
    address public developmentFund;


    function AkropolisCrowdsale(
    uint256 _startTime,
    uint256 _endTime,
    address _wallet,
    address _whitelist
    ) public
        IncreasingCapCrowdsale(HARD_CAP)
        FinalizableCrowdsale()
        WhitelistedCrowdsale(_startTime, _endTime, AET_RATE, _wallet, _whitelist)
    {
        require(AET_RATE > 0);
        require(_wallet != 0x0);
    }

    function setToken(AkropolisToken _token) public onlyOwner {
        require(address(token) == 0x0);
        require(address(_token) != 0x0);
        require(_token.paused());
        require(_token.owner() == address(this));

        token = _token;
    }

    // low level token purchase function
    function buyTokens(address beneficiary) public payable {
        require(beneficiary != 0x0);
        require(validPurchase());

        uint256 weiAmount = msg.value;
        uint256 updatedWeiRaised = weiRaised.add(weiAmount);

        uint256 tokens = calculateTokens(weiAmount);

        // update state
        weiRaised = updatedWeiRaised;

        require(token.mint(beneficiary, tokens));

        contributions[beneficiary] = contributions[beneficiary].add(weiRaised);
        tokensSold = tokensSold.add(tokens);
        require(tokensSold <= PUBLIC_SALE_SUPPLY);
        
        TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

        forwardFunds();
    }

    // overriding Crowdsale#validPurchase to add checking if a buyer is within the cap
    // @return true if buyers can buy at the moment
    function validPurchase() internal constant returns (bool) {
        return super.validPurchase() && msg.value <= getAvailableCap(msg.sender);
    }

    function changeWallet(address _wallet) public onlyOwner {
        require(_wallet != 0x0);
        wallet = _wallet;
        WalletChange(_wallet);
    }

    /**
    * Overwrites the base OpenZeppelin function not to waste gas on an unnecessary token creation
    */
    function createTokenContract() internal returns (MintableToken) {
        return MintableToken(0x0);
    }

    /**
     * @dev Returns the bonus at the current moment in percents
     */
    function finalization() internal {

        //Mint allocations
        require(address(presaleAllocations) != 0x0 && address(teamAllocations) != 0x0 && address(advisorsAllocations) != 0x0);
        token.mint(presaleAllocations, PRESALE_SUPPLY);
        token.mint(teamAllocations, TEAM_SUPPLY);
        token.mint(advisorsAllocations, ADVISORS_SUPPLY);

        //Mint special purpose funds
        require(reserveFund != 0x0 && bountyFund != 0x0 && developmentFund != 0x0);
        token.mint(reserveFund, RESERVE_FUND_VALUE);
        token.mint(bountyFund, BOUNTY_FUND_VALUE);
        token.mint(developmentFund, DEVELOPMENT_FUND_VALUE);


        //Calculate unsold tokens and send to the reserve
        uint256 unsold = PUBLIC_SALE_SUPPLY.sub(tokensSold);
        if (unsold > 0) {
            token.mint(reserveFund, unsold);
        }

        //Finish minting and release token
        token.finishMinting();
        AkropolisToken(token).unpause();
        token.transferOwnership(owner);
    }

    /**
    * @dev Returns the bonus at the current moment in percents
    */
    function getCurrentBonus() public view returns(uint256) {
        uint256 round = getCurrentRound();
        if (round == 1) {
            return 20;
        } else if (round == 2) {
            return 10;
        } else if (round == 3) {
            return 5;
        }
        return 0;
    }

    function setPresaleAllocations(AllocationsManager _presaleAllocations) public onlyOwner {
        presaleAllocations = _presaleAllocations;
    }

    function setTeamAllocations(AllocationsManager _teamAllocations) public onlyOwner {
        teamAllocations = _teamAllocations;
    }

    function setAdvisorsAllocations(AllocationsManager _advisorsAllocations) public onlyOwner {
        advisorsAllocations = _advisorsAllocations;
    }

    function setReserveFund(address _reserveFund) public onlyOwner {
        reserveFund = _reserveFund;
    }

    function setBountyFund(address _bountyFund) public onlyOwner {
        bountyFund = _bountyFund;
    }

    function setDevelopmentFund(address _developmentFund) public onlyOwner {
        developmentFund = _developmentFund;
    }

    /**
    * @dev Returns the number of AET tokens per contributed amount in wei
    *      including the early participants bonus
    */
    function calculateTokens(uint256 _amountInWei) internal view returns(uint256) {
        return _amountInWei.mul(AET_RATE).mul(getCurrentBonus().add(100)).div(100);
    }

    function getAvailableCap(address _buyer) public view returns(uint256) {
        return getCurrentCap().sub(contributions[_buyer]);
    }
}