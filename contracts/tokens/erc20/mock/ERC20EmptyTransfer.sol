pragma solidity 0.5.7;

import "./ERC20NonCompliantBase.sol";


contract ERC20EmptyTransfer is ERC20NonCompliantBase {

    string public name = "EMPTY TRANSFER";
    string public symbol = "ETR";

    bool public transferEnabled = true;

    constructor() public {
        balances[msg.sender] = BALANCE;
        totalSupply_ = BALANCE;
    }

    function transfer(address _to, uint256 _value) external {
        if (transferEnabled) {
            require(_to != address(0));
            require(_value <= balances[msg.sender]);

            balances[msg.sender] = balances[msg.sender].sub(_value);
            balances[_to] = balances[_to].add(_value);
        }

        emit Transfer(msg.sender, _to, _value);
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external {
        emit Transfer(_from, _to, _value);
    }

    function approve(address _spender, uint256 _value) external {
        emit Approval(msg.sender, _spender, _value);
    }

    function toggleTransferEnabled() public {
        transferEnabled = !transferEnabled;
    }
}
