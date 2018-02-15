pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol";
import "zeppelin-solidity/contracts/token/SafeERC20.sol";
import "./AkropolisToken.sol";
import "./LinearTokenVesting.sol";

/**
 * @title Administrable
 * @dev Contract defines a role of an administrator with lesser privileges than the owner.
 * The administrator may perform oranizational task without having a decisive power over
 * token or funds transfer.
 */
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

    /**
    * @dev Owner is allowed to replace the admin at any given time
    */
    function setAdmin(address _admin) public onlyOwner {
        require(address(_admin) != 0x0);
        AdminChanged(admin, _admin);
        admin = _admin;
    }

}