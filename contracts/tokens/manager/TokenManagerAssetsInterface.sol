pragma solidity 0.5.7;


interface TokenManagerAssetsInterface {

    function getBankTokens(
        address eventEmitter,
        uint256 _decimals
    ) external returns (address, address);
}
