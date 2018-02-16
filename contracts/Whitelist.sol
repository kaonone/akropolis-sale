pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import './Administrable.sol';

/**
 * @title Whitelist
 * @dev Contract that allows adding users represented by ethereum accounts to a white list
 * Only whitelisted users are allowed to participate during the crowdsale
 * Users are divided into different tier on the merit of their engagement into the project
 * Specific rules for tiered users participation are specified into WhitelistedCrowdsale contract
 */
contract Whitelist is Administrable {
    using SafeMath for uint256;

    //Mapping with buyer address as a key and buyer index (in order of addition) as a value
    mapping (address => uint256) public whitelist;

    //Mapping with buyer address as a key and associated tier as a value
    mapping (address => uint8) public tiers;

    //Array of addresses stored in addition order
    address[] public indexedWhitelist;

    function addToWhitelist(address _buyer, uint8 _tier) public onlyAdmin {
        require(_buyer != 0x0);
        require(_tier >= 1 && _tier <= 3);
        require(isWhitelisted(_buyer) == false);

        indexedWhitelist.push(_buyer);
        whitelist[_buyer] = indexedWhitelist.length;
        tiers[_buyer] = _tier;
    }

    /**
    * @dev Removes a buyer with a given address from whitelisted users
    */
    function removeFromWhitelist(address _buyer) public onlyAdmin {
        require(_buyer != 0x0);
        require(isWhitelisted(_buyer));

        uint256 removalIndex = whitelist[_buyer].sub(1);
        address lastAddress = indexedWhitelist[indexedWhitelist.length.sub(1)];
        indexedWhitelist[removalIndex] = lastAddress;
        indexedWhitelist.length = indexedWhitelist.length.sub(1);

        if (removalIndex < indexedWhitelist.length) {
          whitelist[lastAddress] = removalIndex.add(1);
        }

        delete whitelist[_buyer];
        delete tiers[_buyer];
    }


    /**
    * @return true if buyer is whitelisted
    */
    function isWhitelisted(address _buyer) public view returns (bool) {
        return whitelist[_buyer] > 0;
    }


    /**
     * @notice Returns the tier associated with a given buyer
     * @param _buyer address
     */
    function getTier(address _buyer) public view returns (uint8) {
        require(isWhitelisted(_buyer));
        return tiers[_buyer];
    }


    /**
    * @return total number of whitelisted users
    */
    function getWhitelistedCount() public view returns(uint256) {
        return indexedWhitelist.length;
    }


    /**
    * A helper method that may be used to list all of the whitelisted addresses
    * @return address of whitelisted user with a given index
    */
    function getWhitelistedAddress(uint256 _index) public view returns(address) {
        return indexedWhitelist[_index];
    }
}
