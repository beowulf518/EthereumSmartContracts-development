pragma solidity 0.5.7;


contract ERC20NonCompliantAbstract {

    function transfer(
        address _to,
        uint256 _value
    )
    external;

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    )
    external;

    function approve(
        address _spender,
        uint256 _value
    )
    external;

    function balanceOf(
        address _owner
    )
    external
    view
    returns (uint256);

    function allowance(
        address _owner,
        address _spender
    )
    public
    view
    returns (uint256);
}
