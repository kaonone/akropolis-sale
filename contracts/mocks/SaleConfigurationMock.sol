pragma solidity ^0.4.18;

/**
 * @title SaleConfigurationMock
 * @dev Set of parameters configuring the sale process
 */
contract SaleConfigurationMock {

    uint256 public AET_RATE = 10;
    uint256 public HARD_CAP = 10000 ether;
    uint256 public constant MAX_ALLOCATION_VALUE = 1000 ether;

    uint256 public TOTAL_SUPPLY = 100000 ether;
    uint256 public PUBLIC_SALE_SUPPLY = 10000 ether;
    uint256 public constant PRESALE_SUPPLY = 20000 ether;
    uint256 public constant TEAM_SUPPLY = 20000 ether;
    uint256 public constant ADVISORS_SUPPLY = 5500 ether;

    uint256 public constant RESERVE_FUND_VALUE = 20000 ether;
    uint256 public constant DEVELOPMENT_FUND_VALUE = 24500 ether;

    uint256 public constant MIN_TIER_1 = 2 ether;
    uint256 public constant MAX_TIER_1 = 10 ether;
    uint256 public constant MIN_TIER_2 = 1 ether;
    uint256 public constant MAX_TIER_2 = 5 ether;
    uint256 public constant MIN_TIER_3 = 0 ether;
    uint256 public constant MAX_TIER_3 = 3 ether;
    uint256 public constant ROUND_DURATION = 3 days;

    function setAET_RATE(uint256 _aetRate) public {
        AET_RATE = _aetRate;
    }

    function setHARD_CAP(uint256 _hardCap) public {
        HARD_CAP = _hardCap;
    }

    function setPUBLIC_SALE_SUPPLY(uint256 _publicSaleSupply) public {
        PUBLIC_SALE_SUPPLY = _publicSaleSupply;
    }

    function setTOTAL_SUPPLY(uint256 _totalSupply) public {
        TOTAL_SUPPLY = _totalSupply;
    }
}