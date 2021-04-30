pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";


contract MintableBurnableERC20TokenMock is ERC20Mintable, ERC20Burnable {
    string public name = "MB Mock Token";
    string public symbol = "MBMOCK";
    uint8 public decimals = 18;

    uint256 public constant BALANCE = 10 ** 30;

    constructor() public {
        _mint(msg.sender, BALANCE);
    }

    function setDecimals(uint8 _decimals) external {
        decimals = _decimals;
    }
}
