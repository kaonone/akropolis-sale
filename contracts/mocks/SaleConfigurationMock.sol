pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';

/**
 * @title SaleConfigurationMock
 * @dev Set of parameters configuring the sale process
 */
contract SaleConfigurationMock {
    using SafeMath for uint256;

    uint8 public constant DECIMALS = 18;
    uint256 public constant DECIMALS_FACTOR = 10**uint256(DECIMALS);

    uint256 public AET_RATE = 10;
    uint256 public HARD_CAP = 10000 ether;
    uint256 public constant MAX_ALLOCATION_VALUE = DECIMALS_FACTOR * 1000;

    uint256 public TOTAL_SUPPLY = DECIMALS_FACTOR * 100000;
    uint256 public PUBLIC_SALE_SUPPLY = DECIMALS_FACTOR * 10000;
    uint256 public constant PRESALE_SUPPLY = DECIMALS_FACTOR * 20000;
    uint256 public constant TEAM_SUPPLY = DECIMALS_FACTOR * 20000;
    uint256 public constant ADVISORS_SUPPLY = DECIMALS_FACTOR * 5500;

    uint256 public constant RESERVE_FUND_VALUE = DECIMALS_FACTOR * 20000;
    uint256 public constant DEVELOPMENT_FUND_VALUE = DECIMALS_FACTOR * 24500;

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