/*
Implements ERC 20 Token standard: https://github.com/ethereum/EIPs/issues/20
*/

pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/MintableToken.sol";
import "zeppelin-solidity/contracts/token/PausableToken.sol";


contract AkropolisToken is MintableToken, PausableToken {

    string public constant name = "Akropolis External Token";

    uint8 public constant decimals = 18;

    string public constant symbol = "AET";

    string public constant version = "AET 1.0";
}