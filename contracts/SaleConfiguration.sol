pragma solidity ^0.4.18;

/**
 * @title SaleConfiguration
 * @dev Set of parameters configuring the sale process
 */
contract SaleConfiguration {

    //TODO: Update and verify values before going live

    uint256 public constant AET_RATE = 10;
    uint256 public constant HARD_CAP = 10000 ether;
    uint256 public constant MAX_ALLOCATION_VALUE = 1000 ether;

    uint256 public constant PUBLIC_SALE_SUPPLY = 10000;
    uint256 public constant PRESALE_SUPPLY = 40000;
    uint256 public constant TEAM_SUPPLY = 20000;
    uint256 public constant ADVISORS_SUPPLY = 5500;

    uint256 public constant RESERVE_FUND_VALUE = 15000;
    uint256 public constant BOUNTY_FUND_VALUE = 2000;
    uint256 public constant DEVELOPMENT_FUND_VALUE = 17500;

}