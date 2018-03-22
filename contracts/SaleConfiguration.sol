pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';

/**
 * @title SaleConfiguration
 * @dev Set of parameters configuring the sale process
 */
contract SaleConfiguration {
    using SafeMath for uint256;


    uint8 public constant DECIMALS = 18;
    uint256 public constant DECIMALS_FACTOR = 10**uint256(DECIMALS);

    //TODO: Update and verify values before going live

    uint256 public constant AET_RATE = 10000;
    uint256 public constant HARD_CAP = 6000 ether;
    uint256 public constant MAX_ALLOCATION_VALUE = DECIMALS_FACTOR * 1000;

    uint256 public constant TOTAL_SUPPLY = DECIMALS_FACTOR * 900000000;
    uint256 public constant PUBLIC_SALE_SUPPLY = DECIMALS_FACTOR * 90000000;
    uint256 public constant PRESALE_SUPPLY = DECIMALS_FACTOR * 180000000;
    uint256 public constant TEAM_SUPPLY = DECIMALS_FACTOR * 180000000;
    uint256 public constant ADVISORS_SUPPLY = DECIMALS_FACTOR * 49500000;

    uint256 public constant RESERVE_FUND_VALUE = DECIMALS_FACTOR * 180000000;
    uint256 public constant DEVELOPMENT_FUND_VALUE = DECIMALS_FACTOR * 220500000;

    uint256 public constant MIN_TIER_1 = 2 ether;
    uint256 public constant MAX_TIER_1 = 10 ether;
    uint256 public constant MIN_TIER_2 = 1 ether;
    uint256 public constant MAX_TIER_2 = 5 ether;
    uint256 public constant MIN_TIER_3 = 0 ether;
    uint256 public constant MAX_TIER_3 = 3 ether;
    uint256 public constant ROUND_DURATION = 3 days;

}