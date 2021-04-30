pragma solidity 0.5.7;


contract ERC20SecurityStorage {
    string public name;
    string public symbol;
    uint8 public decimals = 18;

    mapping (address => uint256) internal _balances;

    mapping (address => mapping (address => uint256)) internal _allowed;

    uint256 internal _totalSupply;
}
