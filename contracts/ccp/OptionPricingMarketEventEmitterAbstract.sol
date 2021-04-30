pragma solidity 0.5.7;

import "../utils/Utils.sol";


contract OptionPricingMarketEventEmitterAbstract is Utils {
    function emitBidReceived(
        address sender,
        uint256 collateral,
        uint256 strikePrice,
        uint256 notional,
        uint256 optionType,
        uint256 premiumPercentage,
        uint256 bidIdx
    )
    external
    returns (bool);

    function emitBidWithdrawn(
        address sender,
        uint256 bidIdx
    )
    external
    returns (bool);

    function emitTransactionSettled(
        uint256 transactionId
    )
    external
    returns (bool);

    function emitRedeemAvailable(
        address optionExecutionToken,
        uint256 amount,
        uint256 transactionId
    )
    external
    returns (bool);

    function emitTokensRedeemed(
        address optionExecutionToken,
        uint256 tokensAmount,
        uint256 assetAmount,
        address beneficiary
    )
    external
    returns (bool);

    function emitTransfer(
        address from,
        address to,
        uint256 amount
    )
    external
    returns (bool);

    function emitMintedRepresentationToken(
        address destCurrencyAddress,
        uint256 rate,
        uint256 srcAmount,
        uint256 destAmount
    )
    external
    returns (bool);

    function emitPaired(
        address shortPutBidderAddress,
        uint256 shortPutBidIdx,
        address shortPutTokenAddress,
        address longCallBidderAddress,
        uint256 longCallBidIdx,
        address longCallTokenAddress,
        uint256 transactionId,
        uint256 transactionMaturity
    )
    external
    returns (bool);
}
