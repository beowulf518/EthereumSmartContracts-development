pragma solidity 0.5.7;


contract ExchangeConnectorInterface {
    event TradeSucceded(
        address sourceAsset,
        address destinationAsset,
        address beneficiary,
        uint256 purchasedAmount
    );

    function trade(
        address srcAsset,
        address destAsset,
        address tradeDestAddress,
        uint256 srcAmount
    ) external payable returns (uint256);

    function setOracle(
        address _oracle
    ) public;

    function getHistoricRate(
        uint256 contractId
    ) public view returns (uint256);

    function getExchangeRate(
        address srcCurrencyAddress,
        address destCurrencyAddress,
        uint256 srcAmount
    ) public view returns (uint256);

    function getExchangeRates(
        address[] memory srcCurrencyAddresses,
        address[] memory destCurrencyAddresses,
        uint256[] memory srcAmounts
    ) public view returns (uint256[] memory);
}
