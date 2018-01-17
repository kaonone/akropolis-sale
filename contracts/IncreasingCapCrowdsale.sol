pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol";

/**
 * @title IncreasingCapCrowdsale
 * @dev Adding a dynamic cap per buyer that is gradually increased with time.
 */
contract IncreasingCapCrowdsale is CappedCrowdsale, Ownable {

    // Initial contribution cap for participants expressed in wei
    uint256 public baseCap;

    // Maximum contribution cap for participants expressed in wei
    uint256 public maxCap;

    // Duration of a round of distribution, after each round we gradually increase the buyer's cap
    uint256 public roundDuration;

    function IncreasingCapCrowdsale(uint256 _cap) public
        CappedCrowdsale(_cap) { }

    function setBaseCap(uint256 _baseCap) public onlyOwner {
        require(_baseCap > 0);
        require(maxCap == 0 || maxCap >= _baseCap);
        baseCap = _baseCap;
    }

    function setMaxCap(uint256 _maxCap) public onlyOwner {
        require(_maxCap > 0 && _maxCap < cap);
        require(baseCap == 0 || _maxCap >= baseCap);
        maxCap = _maxCap;
    }

    function setRoundDuration(uint256 _roundDuration) public onlyOwner {
        require(_roundDuration > 0);
        require(_roundDuration.mul(4) <= endTime.sub(startTime));
        roundDuration = _roundDuration;
    }

    function getCurrentRound() public view returns(uint256) {
        uint256 round = now.sub(startTime).div(roundDuration).add(1);
        if (round > 4) {
            round = 4;
        }
        return round;
    }

    function getCurrentCap() public view returns(uint256) {
        uint256 round = getCurrentRound();
        assert(round >=1 && round <= 4);
        uint cap = baseCap;

        if (round == 2) {
            cap = baseCap.mul(2);
        } else if (round == 3) {
            cap = baseCap.mul(4);
        } else if (round == 4) {
            cap = maxCap;
        }

        if (cap > maxCap) {
            return maxCap;
        }
        return cap;
    }

}