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
    using SafeMath for uint256;


    event AllocationRegistered(address indexed investor, uint256 value, uint256 vestingValue, uint256 cliff, uint256 vestingPeriod);
    event AllocationDistributed(address indexed investor, uint256 value, uint256 vestingValue, uint256 cliff, uint256 vestingPeriod);
    event TokensReclaimed(address indexed newTokenOwner, uint256 valueReclaimed);

    enum AllocationStatus {REGISTERED, DISTRIBUTED}

    struct Allocation {
        uint256 index;
        uint256 value;
        uint256 vestingValue;
        uint256 cliff;
        uint256 vestingPeriod;
        address vestingContract;
        AllocationStatus status;
    }

    // Akropolis Token which is distributed during the pre-sale
    AkropolisToken public token;

    //Map representing how many tokens have been allocated for an investor address
    mapping(address => Allocation) allocations;

    //Array of addresses stored in addition order
    address[] public indexedAllocations;

    //Total value of all allocations
    uint256 public totalAllocated;

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
    function registerAllocation(address _investor, uint256 _value, uint256 _vestingValue, uint256 _cliff, uint256 _vestingPeriod) public onlyAdmin {
        require(_investor != 0x0);
        require(_value > 0 || _vestingValue > 0);
        require(_cliff <= _vestingPeriod);
        require(_value <= MAX_ALLOCATION_VALUE);
        require( (_vestingValue == 0 && _vestingPeriod == 0) || (_vestingValue > 0 && _vestingPeriod > 0) );

        require(allocations[_investor].status != AllocationStatus.DISTRIBUTED);


        uint256 index = indexedAllocations.length;
        if (allocations[_investor].value > 0) {
            totalAllocated = totalAllocated.sub(allocations[_investor].value);
            totalAllocated = totalAllocated.sub(allocations[_investor].vestingValue);
            index = allocations[_investor].index;
        } else {
            indexedAllocations.push(_investor);
        }

        allocations[_investor] = Allocation(index, _value, _vestingValue, _cliff, _vestingPeriod, 0, AllocationStatus.REGISTERED);

        totalAllocated = totalAllocated.add(_value).add(_vestingValue);

        AllocationRegistered(_investor, _value, _vestingValue, _cliff, _vestingPeriod);
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
            LinearTokenVesting vesting = new LinearTokenVesting(_investor, allocation.cliff, allocation.vestingPeriod);
            vesting.transferOwnership(owner);
            token.safeTransfer(address(vesting), allocation.vestingValue);
            allocation.vestingContract = address(vesting);
        }
        allocation.status = AllocationStatus.DISTRIBUTED;

        AllocationDistributed(_investor, allocation.value, allocation.vestingValue, allocation.cliff, allocation.vestingPeriod);
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
    * [allocated tokens, allocated vesting, cliff, vesting period]
    */
    function getAllocation(address _investor) public view returns(uint256[4]) {
        if (allocations[_investor].status == AllocationStatus.REGISTERED) {
            return [
                allocations[_investor].value,
                allocations[_investor].vestingValue,
                allocations[_investor].cliff,
                allocations[_investor].vestingPeriod
            ];
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

    /**
    * @dev Returns the number of allocations registered
    */
    function getAllocationsCount() public view returns(uint256) {
        return indexedAllocations.length;
    }

    /**
    * @dev Returns the address of the allocation at the given index
    */
    function getAllocationAddress(uint256 _index) public view returns(address) {
        return indexedAllocations[_index];
    }

    /**
    * @dev Removes an allocation for a given address
    */
    function removeAllocation(address _investor) public returns(bool) {
        require(allocations[_investor].value > 0);

        uint256 removalIndex = allocations[_investor].index;
        address lastAddress = indexedAllocations[indexedAllocations.length.sub(1)];
        indexedAllocations[removalIndex] = lastAddress;
        indexedAllocations.length = indexedAllocations.length.sub(1);
        allocations[lastAddress].index = removalIndex;

        totalAllocated = totalAllocated.sub(allocations[_investor].value);
        totalAllocated = totalAllocated.sub(allocations[_investor].vestingValue);
        delete allocations[_investor];
        return true;
    }



}

