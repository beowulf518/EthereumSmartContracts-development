pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";
import "./BankEventEmitterTransferPartialAbstract.sol";


contract BankToken is ERC20Mintable, ERC20Burnable {

    address public owner;
    string public name;
    string public symbol;
    uint8 public decimals;
    BankEventEmitterTransferPartialAbstract public eventEmitter;

    constructor(
        address _owner,
        uint256 _decimals,
        string memory _name,
        string memory _symbol,
        address _eventEmitter
    ) public {
        require(_owner != address(0));
        require(_eventEmitter != address(0));
        decimals = uint8(_decimals);
        name = _name;
        symbol = _symbol;

        // ERC20Mintable constructor adds minter role for msg.sender. Only _owner is needed to have minter role.
        // That is the reason we remove minter role for msg.sender
        addMinter(_owner);
        renounceMinter();
        owner = _owner;
        eventEmitter = BankEventEmitterTransferPartialAbstract(_eventEmitter);
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    )
    public
    returns (bool)
    {
        bool transferResult = super.transferFrom(_from, _to, _value);
        if (transferResult) {
            require(
                eventEmitter.emitTransfer(
                    owner,
                    _from,
                    _to,
                    _value
                )
            );
        }
        return transferResult;
    }

    function transfer(
        address _to,
        uint256 _value
    ) public returns (bool) {
        bool transferResult = super.transfer(_to, _value);
        if (transferResult) {
            require(
                eventEmitter.emitTransfer(
                    owner,
                    msg.sender,
                    _to,
                    _value
                )
            );
        }
        return transferResult;
    }
}
