pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../tokens/manager/TokenManagerMainInterface.sol";
import "../price-oracle/IPriceOracle.sol";
import "../access/RoleNames.sol";
import "../access/RoleAware.sol";
import "./ExchangeConnectorInterface.sol";


/**
 * @title ExchangeConnectorBase
 * @dev Contract that normalize exchange rates used in trading. Tokens has different amount of decimals.
        Most popular is 18 decimal. All rates are normalized to 18 decimals
 */
contract ExchangeConnectorBase is
    RoleAware,
    Resolvable,
    RoleNames,
    ExchangeConnectorInterface {

    using SafeMath for uint256;

    TokenManagerMainInterface public tokenManager;
    IPriceOracle public oracle;

    function setOracle(
        address _oracle
    ) public onlyRole(ADMIN_ROLE_NAME) {
        require(_oracle != address(0), "Oracle can not have empty address");
        oracle = IPriceOracle(_oracle);
    }

    function getHistoricRate(
        uint256 contractId
    ) public view returns (uint256) {
        require(address(oracle) != address(0), "No oracle address found");
        uint256 rate = oracle.prices(
            contractId
        );
        require(rate > 0, "Oracle price is not set");
        return rate;
    }

    /**
     * @dev Normalize exchange rate to 18 digits
       @param srcCurrencyAddress address of source currency
       @param destCurrencyAddress address of destination currency
       @param expectedRate rate that will be normalized
     */
    function normaliseExchangeRate(
        address srcCurrencyAddress,
        address destCurrencyAddress,
        uint256 expectedRate,
        TokenManagerMainInterface _tokenManager
    ) internal view returns (uint256) {
        uint256 decimalsSrc = _tokenManager.getTokenDecimals(srcCurrencyAddress);
        uint256 decimalsDest = _tokenManager.getTokenDecimals(destCurrencyAddress);
        return expectedRate
            .mul(
                uint256(10) ** decimalsDest
            )
            .div(
                uint256(10) ** decimalsSrc
            );
    }
}
