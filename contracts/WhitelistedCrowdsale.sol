pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/crowdsale/Crowdsale.sol';
import './Administrable.sol';
import './Whitelist.sol';

/**
 * @title WhitelistedCrowdsale
 * @dev Adding a support for whitelisting users during a crowdsale.
 * Only the users that were whitelisted by the contract admin may be allowed to buy tokens
 */
contract WhitelistedCrowdsale is Crowdsale, Administrable {

    Whitelist _whitelistContract;

    function WhitelistedCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet, address whitelistAddress) public
        Crowdsale(_startTime, _endTime, _rate, _wallet) {
        _whitelistContract = Whitelist(whitelistAddress);
    }


    // overriding Crowdsale#validPurchase to add checking if a buyer is whitelisted
    // @return true if buyers can buy at the moment
    function validPurchase() internal constant returns (bool) {
        return super.validPurchase() && _whitelistContract.isWhitelisted(msg.sender);
    }

}