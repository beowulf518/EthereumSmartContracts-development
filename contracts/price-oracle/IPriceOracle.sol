pragma solidity 0.5.7;


contract IPriceOracle {
    function prices(
        uint256 contractId
    ) external view returns (uint256 price);
}