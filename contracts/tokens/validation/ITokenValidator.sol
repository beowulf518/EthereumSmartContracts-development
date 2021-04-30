pragma solidity 0.5.7;


contract ITokenValidator {
    function validateTokens(address[] memory tokens) public view;
    function validateToken(address token) public view;
    function validateCcpTokens(address[] memory tokens) public view;
    function validateCcpToken(address token) public view;

    function getCcpPrecision(
        address token
    )
    public
    view
    returns (
        uint256 precision,
        uint256 toTokenPower
    );

    function addTokensToWhitelist(address[] memory tokens) public;
    function removeTokenFromWhitelist(address token) public;

    function addTokensToCcpWhitelist(
        address[] memory tokens,
        uint256[] memory precisions
    ) public;

    function removeTokenFromCcpWhitelist(address token) public;
}