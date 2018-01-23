pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol";
import "./AkropolisToken.sol";
import "./WhitelistedCrowdsale.sol";
import "./IncreasingCapCrowdsale.sol";
import "./SaleConfiguration.sol";


contract AkropolisCrowdsale is IncreasingCapCrowdsale, FinalizableCrowdsale, WhitelistedCrowdsale, SaleConfiguration {

    event WalletChange(address wallet);

    mapping(address => uint256) public contributions;

    function AkropolisCrowdsale(
    uint256 _startTime,
    uint256 _endTime,
    address _wallet
    ) public
        IncreasingCapCrowdsale(HARD_CAP)
        FinalizableCrowdsale()
        WhitelistedCrowdsale(_startTime, _endTime, AET_RATE, _wallet)
    {
        require(AET_RATE > 0);
        require(_wallet != 0x0);

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

        token.mint(beneficiary, tokens);
        TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

        contributions[beneficiary] = contributions[beneficiary].add(weiRaised);

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

    function releaseToken(address _newTokenOwner) public onlyOwner {
        require(isFinalized);
        token.transferOwnership(_newTokenOwner);
    }

    function createTokenContract() internal returns(MintableToken) {
        return new AkropolisToken();
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