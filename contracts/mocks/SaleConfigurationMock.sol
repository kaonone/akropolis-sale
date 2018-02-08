pragma solidity ^0.4.18;

/**
 * @title SaleConfigurationMock
 * @dev Set of parameters configuring the sale process
 */
contract SaleConfigurationMock {

    uint256 public AET_RATE = 10;
    uint256 public HARD_CAP = 10000 ether;
    uint256 public constant MAX_ALLOCATION_VALUE = 1000 ether;

    uint256 public PUBLIC_SALE_SUPPLY = 10000 ether;
    uint256 public constant PRESALE_SUPPLY = 40000 ether;
    uint256 public constant TEAM_SUPPLY = 20000 ether;
    uint256 public constant ADVISORS_SUPPLY = 5500 ether;

    uint256 public constant RESERVE_FUND_VALUE = 15000 ether;
    uint256 public constant BOUNTY_FUND_VALUE = 2000 ether;
    uint256 public constant DEVELOPMENT_FUND_VALUE = 17500 ether;

    function setAET_RATE(uint256 _aetRate) public {
        AET_RATE = _aetRate;
    }

    function setHARD_CAP(uint256 _hardCap) public {
        HARD_CAP = _hardCap;
    }

    function setPUBLIC_SALE_SUPPLY(uint256 _publicSaleSupply) public {
        PUBLIC_SALE_SUPPLY = _publicSaleSupply;
    }
}