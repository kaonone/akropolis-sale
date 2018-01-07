/*
Implements ERC 20 Token standard: https://github.com/ethereum/EIPs/issues/20
*/

pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/MintableToken.sol';
import 'zeppelin-solidity/contracts/token/PausableToken.sol';

contract AkropolisToken is MintableToken, PausableToken {

    string public name = "Akropolis Token";

    uint8 public decimals = 18;

    string public symbol = "AET";

    string public version = 'AET 1.0';
}