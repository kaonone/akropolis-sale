pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol";
import "zeppelin-solidity/contracts/token/SafeERC20.sol";
import "./AkropolisToken.sol";
import "./LinearTokenVesting.sol";
import "./SaleConfiguration.sol";


contract AllocationsManager is Ownable, Pausable, SaleConfiguration {
    using SafeERC20 for AkropolisToken;


    event AllocationRegistered(address indexed investor, uint256 value, uint256 vestingValue, uint256 vestingPeriod);
    event AllocationDistributed(address indexed investor, uint256 value, uint256 vestingValue, uint256 vestingPeriod);
    event TokensReclaimed(address indexed newTokenOwner, uint256 valueReclaimed);

    enum AllocationStatus {REGISTERED, DISTRIBUTED}

    struct Allocation {
        uint256 value;
        uint256 vestingValue;
        uint256 vestingPeriod;
        address vestingContract;
        AllocationStatus status;
    }

    // Akropolis Token which is distributed during the pre-sale
    AkropolisToken public token;

    //Map representing how many tokens have been allocated for an investor address
    mapping(address => Allocation) allocations;

    //A role that is responsible for recording allocations,
    address public admin;

    /**
    * @dev Throws if called by any account other than the admin.
    */
    modifier onlyAdmin() {
        require(msg.sender == admin);
        _;
    }

    function setToken(AkropolisToken _token) public onlyOwner {
        require(address(_token) != 0x0);
        token = _token;
    }

    function setAdmin(address _admin) public onlyOwner {
        require(address(_admin) != 0x0);
        admin = _admin;
    }

    /**
    * @dev Register the amount of tokens allocated for an investor.
    * The amount my be changed before the tokens are distributed.
    */
    function registerAllocation(address _investor, uint256 _value, uint256 _vestingValue, uint256 _vestingPeriod) public onlyAdmin {
        require(_investor != 0x0);
        require(_value > 0);
        require(_value <= MAX_ALLOCATION_VALUE);
        require( (_vestingValue == 0 && _vestingPeriod == 0) || (_vestingValue > 0 && _vestingPeriod > 0) );

        require(allocations[_investor].status != AllocationStatus.DISTRIBUTED);

        allocations[_investor] = Allocation(_value, _vestingValue, _vestingPeriod, 0, AllocationStatus.REGISTERED);

        AllocationRegistered(_investor, _value, _vestingValue, _vestingPeriod);
    }

    /**
    * @dev Mints the allocated tokens and transfer them to the investor account.
    */
    function distributeAllocation(address _investor) public onlyOwner {
        Allocation storage allocation = allocations[_investor];
        require(allocation.value > 0);
        require(allocation.status == AllocationStatus.REGISTERED);

        token.safeTransfer(_investor, allocation.value);
        if (allocation.vestingValue > 0) {
            LinearTokenVesting vesting = new LinearTokenVesting(_investor, allocation.vestingPeriod);
            vesting.transferOwnership(owner);
            token.safeTransfer(address(vesting), allocation.vestingValue);
            allocation.vestingContract = address(vesting);
        }
        allocation.status = AllocationStatus.DISTRIBUTED;

        AllocationDistributed(_investor, allocation.value, allocation.vestingValue, allocation.vestingPeriod);
    }

    /**
    * @dev Releases the tokens that were allocated for distribution
    */
    function reclaimTokens(address _newTokenOwner) public onlyOwner {
        uint256 total = token.balanceOf(this);
        token.transfer(_newTokenOwner, total);
        TokensReclaimed(_newTokenOwner, total);
    }

    /**
    * @dev Returns the value of allocated tokens in the following format
    * [allocated tokens, allocated vesting, vesting period]
    */
    function getAllocatedTokens(address _investor) public view returns(uint256[3]) {
        if (allocations[_investor].status == AllocationStatus.REGISTERED) {
            return [allocations[_investor].value, allocations[_investor].vestingValue, allocations[_investor].vestingPeriod];
        }
    }

    /**
    * @dev Returns the address of a vesting contract for a given investor
    */
    function getVesting(address _investor) public view returns(address) {
        if (allocations[_investor].status == AllocationStatus.DISTRIBUTED) {
            return allocations[_investor].vestingContract;
        }
    }



}