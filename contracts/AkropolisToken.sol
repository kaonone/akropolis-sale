/*
Implements ERC 20 Token standard: https://github.com/ethereum/EIPs/issues/20
*/

pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/MintableToken.sol';

contract AkropolisToken is MintableToken {

    string public name = "Akropolis Token";

    uint8 public decimals = 18;

    string public symbol = "AKR";

    string public version = 'AKR 1.0';
}