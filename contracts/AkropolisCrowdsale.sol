pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol";
import "./AkropolisToken.sol";
import "./WhitelistedCrowdsale.sol";
import "./Whitelist.sol";
import "./SaleConfiguration.sol";
import "./AllocationsManager.sol";


contract AkropolisCrowdsale is CappedCrowdsale, FinalizableCrowdsale, WhitelistedCrowdsale {

    event WalletChange(address wallet);

    mapping(address => uint256) public contributions;
    uint256 public tokensSold;

    AllocationsManager public presaleAllocations;
    AllocationsManager public teamAllocations;
    AllocationsManager public advisorsAllocations;

    address public reserveFund;
    address public bountyFund;
    address public developmentFund;


    SaleConfiguration public config;

    function AkropolisCrowdsale(
    uint256 _startTime,
    uint256 _endTime,
    address _wallet,
    Whitelist _whitelist,
    SaleConfiguration _config
    ) public
        Crowdsale(_startTime, _endTime, _config.AET_RATE(), _wallet)
        CappedCrowdsale(_config.HARD_CAP())
        FinalizableCrowdsale()
        WhitelistedCrowdsale(_startTime, _endTime, _whitelist, _config)
    {
        require(address(_config) != 0x0);
        require(address(_whitelist) != 0x0);
        require(_wallet != 0x0);

        //Validate configuration
        config = _config;
        require(config.PUBLIC_SALE_SUPPLY() > 0);
        require(config.PRESALE_SUPPLY() > 0);
        require(config.TEAM_SUPPLY() > 0);
        require(config.ADVISORS_SUPPLY() > 0);

        require(config.RESERVE_FUND_VALUE() > 0);
        require(config.BOUNTY_FUND_VALUE() > 0);
        require(config.DEVELOPMENT_FUND_VALUE() > 0);

        require(config.PRESALE_SUPPLY() > 0);

        token = new AkropolisToken();
        AkropolisToken(token).pause();
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

        contributions[beneficiary] = contributions[beneficiary].add(weiAmount);
        tokensSold = tokensSold.add(tokens);
        require(tokensSold <= config.PUBLIC_SALE_SUPPLY());
        
        TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

        forwardFunds();
    }

    // overriding Crowdsale#validPurchase to add checking if a buyer is within the cap
    // @return true if buyers can buy at the moment
    function validPurchase() internal constant returns (bool) {
        bool isAdmitted = isBuyerAdmitted(msg.sender);
        bool isAboveMin = msg.value >= getMin(msg.sender);
        bool isBelowCap = msg.value <= getAvailableCap(msg.sender);
        return super.validPurchase() && isAdmitted && isAboveMin && isBelowCap;
    }

    /**
    * Allows to end a crowdsale when all of the tokens allocated for the public sale are sold out
    */
    function hasEnded() public view returns (bool) {
        bool tokensSoldOut = (tokensSold == config.PUBLIC_SALE_SUPPLY());
        return super.hasEnded() || tokensSoldOut;
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
        token.mint(presaleAllocations, config.PRESALE_SUPPLY());
        token.mint(teamAllocations, config.TEAM_SUPPLY());
        token.mint(advisorsAllocations, config.ADVISORS_SUPPLY());

        //Mint special purpose funds
        require(reserveFund != 0x0 && bountyFund != 0x0 && developmentFund != 0x0);
        token.mint(reserveFund, config.RESERVE_FUND_VALUE());
        token.mint(bountyFund, config.BOUNTY_FUND_VALUE());
        token.mint(developmentFund, config.DEVELOPMENT_FUND_VALUE());


        //Calculate unsold tokens and send to the reserve
        uint256 unsold = config.PUBLIC_SALE_SUPPLY().sub(tokensSold);
        if (unsold > 0) {
            token.mint(reserveFund, unsold);
        }

        //Finish minting and release token
        token.finishMinting();
        AkropolisToken(token).unpause();
        token.transferOwnership(owner);
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
        return _amountInWei.mul(config.AET_RATE());
    }

    function getAvailableCap(address _buyer) public view returns(uint256) {
        return getCap(_buyer).sub(contributions[_buyer]);
    }
}