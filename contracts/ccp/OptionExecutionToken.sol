pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "../utils/Utils.sol";
import "./OptionPricingMarketEventEmitterAbstract.sol";


contract OptionExecutionToken is ERC20, Utils {

    event Burn(address indexed burner, uint256 value);

    string public name = "Option Execution Token";
    string public symbol = "OET";
    uint8 public decimals = 0;
    uint256 public constant BALANCE = 100;

    uint256 public optionType;
    uint256 public maturity;
    uint256 public notional;
    address public base; //maybe can delete to store everything as underlying type
    //ideally should store everything as underlying type, deleting base would re-enforce this
    address public underlying;
    uint256 public expectedRate;
    OptionPricingMarketEventEmitterAbstract public opmEventEmitter;

    modifier notExpired() {
        require(now < maturity);
        _;
    }

    constructor (
        address _beneficiary,
        uint256 _optionType,
        uint256 _maturity,
        uint256 _notional,
        address _base,
        address _underlying,
        uint256 _expectedRate,
        address _opmEventEmitter
    ) public {
        require(_beneficiary != address(0), "Beneficiary cannot be empty");
        require(_maturity > now, "Maturity cannot be in the past");
        require(_notional > 0, "Notional must be greater than 0");
        require(_base != address(0), "Base cannot be empty");
        require(_underlying != address(0), "Underlying cannot be empty");
        require(_expectedRate > 0, "Expected rate must be greater than 0");
        require(_opmEventEmitter != address(0), "OPM event emitter cannot be empty");

        optionType = _optionType;
        maturity = _maturity;
        notional = _notional;
        base = _base;
        underlying = _underlying;
        expectedRate = _expectedRate;
        opmEventEmitter = OptionPricingMarketEventEmitterAbstract(_opmEventEmitter);

        _mint(_beneficiary, BALANCE);
    }

    function burnFrom(
        address _from,
        uint256 _value
    )
    external
    returns (bool)
    {
        require(_from != address(0));
        require(_value <= balanceOf(_from));
        require(_value <= allowance(_from, msg.sender));

        _burn(_from, _value);
        _approve(_from, msg.sender, allowance(_from, msg.sender).sub(_value));

        emit Burn(_from, _value);
        return true;
    }

    function transfer(
        address _to,
        uint256 _value
    ) public notExpired() returns (bool) {
        bool transferResult = super.transfer(_to, _value);
        if (transferResult) {
            require(
                opmEventEmitter.emitTransfer(
                    msg.sender,
                    _to,
                    _value
                ),
                "Couldn't emit TokenTransfer event."
            );
        }
        return transferResult;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    )
    public
    notExpired()
    returns (bool)
    {
        bool transferResult = super.transferFrom(_from, _to, _value);
        if (transferResult) {
            require(
                opmEventEmitter.emitTransfer(
                    _from,
                    _to,
                    _value
                ),
                "Couldn't emit TokenTransfer event."
            );
        }
        return transferResult;
    }
}
