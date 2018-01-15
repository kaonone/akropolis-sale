pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/crowdsale/Crowdsale.sol';

/**
 * @title WhitelistedCrowdsale
 * @dev Adding a support for whitelisting users during a crowdsale.
 * Only the users that were whitelisted by the contract admin may be allowed to buy tokens
 */
contract WhitelistedCrowdsale is Crowdsale, Ownable {

    // list of addresses that were verified and are allowed to the crowdsale
    mapping (address => bool) public whitelist;

    // admin who is allowed to add/remove from the whitelist
    address public admin;

    address public sender;

    /**
    * @dev Throws if called by any account other than the admin.
    */
    modifier onlyAdmin() {
        require(msg.sender == admin);
        _;
    }

    function WhitelistedCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet) public
        Crowdsale(_startTime, _endTime, _rate, _wallet) { }


    function setAdmin(address _admin) public onlyOwner {
        require(address(_admin) != 0x0);
        admin = _admin;
    }

    function addToWhitelist(address _buyer) public onlyAdmin {
        require(_buyer != 0x0);
        require(whitelist[_buyer] == false);
        whitelist[_buyer] = true;
    }

    function removeFromWhitelist(address _buyer) public onlyAdmin {
        require(_buyer != 0x0);
        require(whitelist[_buyer] == true);
        whitelist[_buyer] = false;
    }

    // @return true if buyer is whitelisted
    function isWhitelisted(address _buyer) public view returns (bool) {
        return whitelist[_buyer];
    }

    // overriding Crowdsale#validPurchase to add checking if a buyer is whitelisted
    // @return true if buyers can buy at the moment
    function validPurchase() internal constant returns (bool) {
        return super.validPurchase() && isWhitelisted(msg.sender);
    }

}