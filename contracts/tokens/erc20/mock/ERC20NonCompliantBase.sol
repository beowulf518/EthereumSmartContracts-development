pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";


contract ERC20NonCompliantBase {
    using SafeMath for uint256;

    uint8 public decimals = 18;
    uint256 public constant BALANCE = 10 ** 30;

    mapping(address => uint256) public balances;
    uint256 public totalSupply_;
    mapping (address => mapping (address => uint256)) internal allowed;

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 value
    );

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    function setDecimals(uint8 _decimals) external {
        decimals = _decimals;
    }

    function balanceOf(address _owner) external view returns (uint256) {
        return balances[_owner];
    }

    function allowance(
        address _owner,
        address _spender
    )
    external
    view
    returns (uint256)
    {
        return allowed[_owner][_spender];
    }
}