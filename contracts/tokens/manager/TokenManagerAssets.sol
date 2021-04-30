pragma solidity 0.5.7;

import "./TokenManagerBase.sol";
import "./TokenManagerAssetsInterface.sol";
import "../../bank/BankToken.sol";


/**
 * @title TokenManagerAssets
 * @dev Contract responsible for creating new tokens. OptionPricingMarket contracts
        are issuing OptionExecutionTokens and Bank contract are issuing
        BankDebt and BankEquity tokens
 */
contract TokenManagerAssets is TokenManagerBase, TokenManagerAssetsInterface {

    /**
     * @dev Function to issue new BankDebt and BankEquity tokens.
       @param eventEmitter address of OpmEventEmitter contract
       @param _decimals number of decimals digits for new created Tokens
     */
    function getBankTokens(
        address eventEmitter,
        uint256 _decimals
    ) external onlyAllowedContracts(bankRegistry) returns (
        address,
        address
    ) {
        address bankDebtToken = address(
            new BankToken(
                msg.sender,
                _decimals,
                "Bank Debt Token",
                "BDT",
                eventEmitter
            )
        );

        address bankEquityToken = address(
            new BankToken(
                msg.sender,
                _decimals,
                "Bank Equity Token",
                "BET",
                eventEmitter
            )
        );

        return (bankDebtToken, bankEquityToken);
    }
}
