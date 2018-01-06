pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol";
import "./AkropolisToken.sol";

contract AkropolisCrowdsale is CappedCrowdsale, FinalizableCrowdsale {

    uint256 public constant AKR_RATE = 10;
    uint256 public constant HARD_CAP = 10000 ether;

    // Akropolis Token which is distributed during the sale
    AkropolisToken token;

    event WalletChange(address wallet);

    function AkropolisCrowdsale(
    uint256 _startTime,
    uint256 _endTime,
    address _wallet,
    AkropolisToken _token
    ) public
        CappedCrowdsale(HARD_CAP)
        FinalizableCrowdsale()
        Crowdsale(_startTime, _endTime, AKR_RATE, _wallet)
    {
        require(AKR_RATE > 0);
        require(_wallet != 0x0);
        require(address(_token) != 0x0);

        token = _token;
        token.pause();
    }

    function createTokenContract() internal returns(MintableToken) {
        return token;
    }


    function getRate() pure internal returns(uint256) {
        // the fixed rate going to be adjusted to make the tokens evenly distributed
        return AKR_RATE;
    }

    // low level token purchase function
    function buyTokens(address beneficiary) public payable {
        require(beneficiary != 0x0);
        require(validPurchase());

        uint256 weiAmount = msg.value;
        uint256 updatedWeiRaised = weiRaised.add(weiAmount);

        uint256 rate = getRate();
        // calculate token amount to be created
        uint256 tokens = weiAmount.mul(rate);

        // update state
        weiRaised = updatedWeiRaised;

        token.mint(beneficiary, tokens);
        TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

        forwardFunds();
    }

    function changeWallet(address _wallet) onlyOwner public {
        require(_wallet != 0x0);
        wallet = _wallet;
        WalletChange(_wallet);
    }

    function releaseToken(address _newTokenOwner) onlyOwner public {
        require(isFinalized);
        token.unpause();
        token.transferOwnership(_newTokenOwner);
    }

}