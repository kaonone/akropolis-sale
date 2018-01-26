pragma solidity ^0.4.18;

/**
 * @title SaleConfigurationMock
 * @dev Set of parameters configuring the sale process
 */
contract SaleConfigurationMock {

    uint256 public AET_RATE = 10;
    uint256 public constant HARD_CAP = 10000 ether;
    uint256 public constant MAX_ALLOCATION_VALUE = 1000 ether;

    function setAET_RATE(uint256 _aetRate) public {
        AET_RATE = _aetRate;
    }

}