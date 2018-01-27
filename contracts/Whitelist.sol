pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import './Administrable.sol';


contract Whitelist is Administrable {

    // list of addresses that were verified and are allowed to the crowdsale
    mapping (address => bool) public whitelist;
    address[] public indexedWhitelist;

    function addToWhitelist(address _buyer) public onlyAdmin {
        require(_buyer != 0x0);
        require(whitelist[_buyer] == false);
        whitelist[_buyer] = true;
        indexedWhitelist.push(_buyer);
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


    function getWhitelistedCount() public view returns(uint256) {
        return indexedWhitelist.length;
    }
}
