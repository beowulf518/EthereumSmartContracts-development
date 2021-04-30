pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";


contract QtumRepresentationToken is ERC20Mintable, ERC20Burnable {
    string public decimals = "0";
    string public symbol = "QTUM";
    string public name = "QTUM Representation Token";
}
