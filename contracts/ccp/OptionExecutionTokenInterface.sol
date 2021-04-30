pragma solidity 0.5.7;


contract OptionExecutionTokenInterface {
    function burnFrom(
        address _from,
        uint256 _value
    )
    external
    returns (bool);

    function allowance(
        address _owner,
        address _spender
    )
    external
    view
    returns (uint256);

    function optionType() public returns (uint256);
}
