pragma solidity 0.5.7;


contract TokenManagerAdminInterface {

    function setBankRegistry(
        address _registry
    ) external;

    function setOpmRegistry(
        address _registry
    ) external;

    function setEthereumAddress (
        address _ethereumAddress
    )
    external;

    function setTokenWrapper(
        address _wrapper
    ) external;

    function collectFunds(
        address from,
        address tokenAddress,
        uint256 amount
    ) external;

    function collectFundsToFundLock(
        address from,
        address tokenAddress,
        uint256 amount
    ) external;

    function getEthereumAddress()
    external
    view
    returns
    (address ethereumAddress);

    function getTokenWrapper()
    external
    view
    returns (address);

    function getTokenDecimals(
        address token
    ) external view returns (uint256 decimals);

    function getTokenProperties(
        address[] calldata tokens,
        address spender
    ) external view returns (
        uint256[] memory,
        uint256[] memory
    );

}
