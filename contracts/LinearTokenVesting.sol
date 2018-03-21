pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/SafeERC20.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "./AkropolisToken.sol";

/**
 * @title LinearTokenVesting
 * @dev A token holder contract that can release its tokens pro-rata with the passing time
 * starting after the cliff period
 */
contract LinearTokenVesting is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for AkropolisToken;

    event Released(uint256 amount);

    // AET token that is under vesting
    AkropolisToken public token;

    // beneficiary of tokens after they are released
    address public beneficiary;

    // start of the vesting period
    uint256 public start;

    // duration of the vesting period
    uint256 public duration;

    // time after which tokens begin to vest
    uint256 public cliff;

    // amounts of the AET token that has been already released
    uint256 public released;

    /**
     * @dev Creates a vesting contract that vests its balance of the AET token to the
     * _beneficiary, gradually in a linear fashion until _start + _duration.
     * @param _token address of the AET token that is under vesting
     * @param _beneficiary address of the beneficiary to whom vested tokens are transferred
     * @param _cliff duration in seconds after which tokens will begin to vest
     * @param _duration duration in seconds of the period in which the tokens will vest
     */
    function LinearTokenVesting(AkropolisToken _token, address _beneficiary, uint256 _cliff, uint256 _duration) public {
        require(address(_token) != 0x0);
        require(_beneficiary != 0x0);
        require(_duration > 0);
        require(_cliff <= _duration);

        token = _token;
        beneficiary = _beneficiary;
        duration = _duration;
        start = now;
        cliff = _cliff;
    }

    /**
     * @notice Transfers vested tokens to beneficiary.
     */
    function release() public {
        require(msg.sender == owner || msg.sender == beneficiary);

        uint256 unreleased = releasableAmount();
        require(unreleased > 0);

        released = released.add(unreleased);
        token.safeTransfer(beneficiary, unreleased);
        Released(unreleased);
    }

    /**
     * @dev Calculates the amount that has already vested but hasn't been released yet.
     */
    function releasableAmount() public view returns (uint256) {
        return vestedAmount().sub(released);
    }

    /**
     * @dev Calculates the amount that has already vested.
     */
    function vestedAmount() public view returns (uint256) {
        uint256 currentBalance = token.balanceOf(this);
        uint256 totalBalance = currentBalance.add(released);

        if (now < start.add(cliff)) {
            return 0;
        } else if (now >= start.add(duration)) {
            return totalBalance;
        } else {
            return totalBalance.mul(now.sub(start)).div(duration);
        }
    }
}
