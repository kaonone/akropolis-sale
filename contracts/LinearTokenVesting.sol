pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20Basic.sol";
import "zeppelin-solidity/contracts/token/SafeERC20.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title LinearTokenVesting
 * @dev A token holder contract that can release its tokens pro-rata with the passing time
 */
contract LinearTokenVesting is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for ERC20Basic;

    event Released(uint256 amount);

    // beneficiary of tokens after they are released
    address public beneficiary;

    // start of the vesting period
    uint256 public start;

    // duration of the vesting period
    uint256 public duration;

    // amounts of tokens that has been already released
    mapping (address => uint256) public released;

    /**
     * @dev Creates a vesting contract that vests its balance of any ERC20 token to the
     * _beneficiary, gradually in a linear fashion until _start + _duration.
     * @param _beneficiary address of the beneficiary to whom vested tokens are transferred
     * @param _duration duration in seconds of the period in which the tokens will vest
     */
    function LinearTokenVesting(address _beneficiary, uint256 _duration) public {
        require(_beneficiary != 0x0);
        require(_duration >= 0);

        beneficiary = _beneficiary;
        duration = _duration;
        start = now;
    }

    /**
     * @notice Transfers vested tokens to beneficiary.
     * @param token ERC20 token which is being vested
     */
    function release(ERC20Basic token) public {
        require(msg.sender == owner || msg.sender == beneficiary);

        uint256 unreleased = releasableAmount(token);

        require(unreleased > 0);

        released[token] = released[token].add(unreleased);

        token.safeTransfer(beneficiary, unreleased);

        Released(unreleased);
    }

    /**
     * @dev Calculates the amount that has already vested but hasn't been released yet.
     * @param token ERC20 token which is being vested
     */
    function releasableAmount(ERC20Basic token) public view returns (uint256) {
        return vestedAmount(token).sub(released[token]);
    }

    /**
     * @dev Calculates the amount that has already vested.
     * @param token ERC20 token which is being vested
     */
    function vestedAmount(ERC20Basic token) public view returns (uint256) {
        uint256 currentBalance = token.balanceOf(this);
        uint256 totalBalance = currentBalance.add(released[token]);

        if (now >= start.add(duration)) {
            return totalBalance;
        } else {
            return totalBalance.mul(now.sub(start)).div(duration);
        }
    }
}
