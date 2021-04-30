pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


contract ERC20TokenMock is ERC20 {
    string public name = "Mock Token";
    string public symbol = "MOCK";
    uint8 public decimals = 18;

    uint256 public constant BALANCE = 10 ** 30;

    constructor() public {
        _mint(msg.sender, BALANCE);
    }
}
