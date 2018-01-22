pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol";
import "zeppelin-solidity/contracts/token/SafeERC20.sol";
import "./AkropolisToken.sol";
import "./LinearTokenVesting.sol";


contract Administrable is Ownable {

    event AdminChanged(address indexed previousAdmin, address indexed newAdmin);

    //An address serving as an admin
    address public admin;

    /**
    * @dev Throws if called by any account other than the admin.
    */
    modifier onlyAdmin() {
        require(msg.sender == admin);
        _;
    }

    function setAdmin(address _admin) public onlyOwner {
        require(address(_admin) != 0x0);
        AdminChanged(admin, _admin);
        admin = _admin;
    }

}