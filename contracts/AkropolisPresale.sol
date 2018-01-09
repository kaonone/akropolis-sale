pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol";
import "./AkropolisToken.sol";


contract AkropolisPresale is Ownable, Pausable {

    uint256 public constant MAX_ALLOCATION_VALUE = 1000 ether;

    event PresaleAllocationRegistered(address indexed investor, uint256 value);
    event PresaleAllocationDistributed(address indexed investor, uint256 value);
    event TokensReclaimed(address indexed newTokenOwner, uint256 valueReclaimed);

    enum AllocationStatus {REGISTERED, DISTRIBUTED}

    struct Allocation {
        uint256 value;
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

    function setAdmin(AkropolisToken _admin) public onlyOwner {
        require(address(_admin) != 0x0);
        admin = _admin;
    }

    /**
    * @dev Register the amount of tokens allocated for an investor.
    * The amount my be changed before the tokens are distributed.
    */
    function registerAllocation(address _investor, uint256 _value) public onlyAdmin {
        require(_investor != 0x0);
        require(_value > 0);
        require(_value <= MAX_ALLOCATION_VALUE);
        require(allocations[_investor].status != AllocationStatus.DISTRIBUTED);

        allocations[_investor] = Allocation(_value, AllocationStatus.REGISTERED);

        PresaleAllocationRegistered(_investor, _value);
    }

    /**
    * @dev Mints the allocated tokens and transfer them to the investor account.
    */
    function distributeAllocation(address _investor) public onlyOwner {
        Allocation storage allocation = allocations[_investor];
        require(allocation.value > 0);
        require(allocation.status == AllocationStatus.REGISTERED);

        token.transfer(_investor, allocation.value);
        allocation.status = AllocationStatus.DISTRIBUTED;

        PresaleAllocationDistributed(_investor, allocation.value);
    }

    /**
    * @dev Releases the tokens that were allocated for distribution
    */
    function reclaimTokens(address _newTokenOwner) public onlyOwner {
        uint256 total = token.balanceOf(this);
        token.transfer(_newTokenOwner, total);
        TokensReclaimed(_newTokenOwner, total);
    }

    function getAllocatedTokens(address _investor) public view returns(uint256) {
        if (allocations[_investor].status == AllocationStatus.REGISTERED) {
            return allocations[_investor].value;
        } else {
            0;
        }
    }

}