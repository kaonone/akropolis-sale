pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import './Administrable.sol';

//Register of addresses that were verified and are allowed to the crowdsale
contract Whitelist is Administrable {
    using SafeMath for uint256;

    //Mapping with buyer address as a key and buyer index (in order of addition) as a value
    mapping (address => uint256) public whitelist;
    //Array of addresses stored in addition order
    address[] public indexedWhitelist;

    function addToWhitelist(address _buyer) public onlyAdmin {
        require(_buyer != 0x0);
        require(isWhitelisted(_buyer) == false);
        indexedWhitelist.push(_buyer);
        whitelist[_buyer] = indexedWhitelist.length;
    }


    function removeFromWhitelist(address _buyer) public onlyAdmin {
        require(_buyer != 0x0);
        require(isWhitelisted(_buyer));

        indexedWhitelist[whitelist[_buyer].sub(1)] = indexedWhitelist[indexedWhitelist.length.sub(1)];
        indexedWhitelist.length = indexedWhitelist.length.sub(1);
        whitelist[_buyer] = 0;
    }


    // @return true if buyer is whitelisted
    function isWhitelisted(address _buyer) public view returns (bool) {
        return whitelist[_buyer] > 0;
    }


    function getWhitelistedCount() public view returns(uint256) {
        return indexedWhitelist.length;
    }
}
