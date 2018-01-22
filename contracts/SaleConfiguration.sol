pragma solidity ^0.4.18;

/**
 * @title SaleConfiguration
 * @dev Set of parameters configuring the sale process
 */
contract SaleConfiguration {

    uint256 public constant AET_RATE = 10;
    uint256 public constant HARD_CAP = 10000 ether;
    uint256 public constant MAX_ALLOCATION_VALUE = 1000 ether;

}