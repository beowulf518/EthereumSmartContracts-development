pragma solidity 0.5.7;

import "./ERC20NonCompliantBase.sol";


contract ERC20NoReturnSignature is ERC20NonCompliantBase {

    string public name = "NO RETURN SIGNATURE";
    string public symbol = "NRS";

    constructor() public {
        balances[msg.sender] = BALANCE;
        totalSupply_ = BALANCE;
    }

    function transfer(address _to, uint256 _value) external {
        require(_to != address(0));
        require(_value <= balances[msg.sender]);

        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        emit Transfer(msg.sender, _to, _value);
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external {
        require(_to != address(0));
        require(_value <= balances[_from]);
        require(_value <= allowed[_from][msg.sender]);

        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
        emit Transfer(_from, _to, _value);
    }

    function approve(address _spender, uint256 _value) external {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
    }
}
