pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./KyberNetworkInterface.sol";
import "./ExchangeConnectorInterface.sol";
import "../tokens/erc20/MintableBurnableERC20.sol";
import "../tokens/manager/TokenManagerMainInterface.sol";
import "../delegate/Resolvable.sol";
import "./ExchangeConnectorBase.sol";
import "../delegate/Delegator.sol";
import "../access/RoleAware.sol";
import "../price-oracle/IPriceOracle.sol";
import "../access/RoleNames.sol";


/**
 * @title ExchangeConnector
 * @dev Adapter contract used to trade assets with external KyberNetwork contract.
        Provides easy to use interface to trade and get exchange rates of given
        asset. Returned rates are normalized to 18 digit.
 */
contract ExchangeConnector is
    ExchangeConnectorBase,
    Delegator {

    using SafeMath for uint256;

    bool public initialised = false;
    bool public implementation = false;
    uint256 public constant MAX_DEST_AMOUNT = 2 ** 256 - 1;
    uint256 public constant MIN_RATE = 1;

    KyberNetwork public kyberNetwork;

    constructor() public {
        implementation = true;
    }

    // solhint-disable-next-line no-empty-blocks
    function () external payable {}

    /**
     * @dev Trading source currency for destination currency using
            external KyberNetwork contract
     * @param srcAsset source asset used to buy
     * @param destAsset destination asset which is bought
     * @param tradeDestAddress address to send destination tokens to
     */
    function trade(
        address srcAsset,
        address destAsset,
        address tradeDestAddress,
        uint256 srcAmount
    ) external payable returns (uint256) {
        uint256 value;
        uint purchasedAmount;
        if (srcAsset == tokenManager.getEthereumAddress()) {
            value = msg.value;
            purchasedAmount = kyberNetwork.trade.value(value)(
                ERC20(srcAsset), // Source asset ERC20
                value, // Amount of source asset to trade
                ERC20(destAsset), // Asset to buy
                tradeDestAddress, // Send bought tokens here
                MAX_DEST_AMOUNT, // maxDestAmount
                MIN_RATE, // minConversionRate
                tradeDestAddress // wallet id
            );
        } else {
            value = srcAmount;

            address tokenWrapper = tokenManager.getTokenWrapper();
            bytes memory args = abi.encodeWithSignature(
                "safeApprove(address,address,uint256)",
                srcAsset,
                address(kyberNetwork),
                value
            );

            delegate(
                tokenWrapper,
                args,
                "delegatecall() failed in ExchangeConnector.trade()"
            );

            purchasedAmount = kyberNetwork.trade(
                ERC20(srcAsset), // Source asset ERC20
                value, // Amount of source asset to trade
                ERC20(destAsset), // Asset to buy
                tradeDestAddress, // Send bought tokens here
                MAX_DEST_AMOUNT, // maxDestAmount
                MIN_RATE, // minConversionRate
                tradeDestAddress // wallet id
            );
        }
        
        emit TradeSucceded(
            srcAsset,
            destAsset,
            tradeDestAddress,
            purchasedAmount
        );

        return uint256(purchasedAmount);
    }

    /**
     * @dev Initialization of ExchangeConnector contract. Can be called only once.
            Setting of crucial contracts addresses used by ExchangeConnector
       @param kyberNetworkContractAddress address of external KyberNetwork contract
       @param _tokenManager address of TokenManager contract
     */
    function init(
        address kyberNetworkContractAddress,
        address _tokenManager
    ) public returns (bool) {
        require(!implementation, "Only delegatecall access");
        require(
            initialised == false,
            "ExchangeConnector has already been initialised"
        );
        require(address(_tokenManager) != address(0));
        tokenManager = TokenManagerMainInterface(_tokenManager);
        kyberNetwork = KyberNetwork(kyberNetworkContractAddress);
        initialised = true;
        return true;
    }

    /**
     * @dev Returns rate between source currency and destination currency
     * @param srcCurrencyAddress source currency address
     * @param destCurrencyAddress destination currency address
     * @param srcAmount amount of source currency to exchange
     */
    function getExchangeRate(
        address srcCurrencyAddress,
        address destCurrencyAddress,
        uint256 srcAmount
    ) public view returns (uint256) {
        // Mapping currency code to token address
        ERC20 source = ERC20(srcCurrencyAddress);
        ERC20 dest = ERC20(destCurrencyAddress);
        uint expectedPrice;
        uint slippagePrice;
        (expectedPrice, slippagePrice) = kyberNetwork.getExpectedRate(
            source,
            dest,
            srcAmount
        );

        return normaliseExchangeRate(
            srcCurrencyAddress,
            destCurrencyAddress,
            uint256(expectedPrice),
            tokenManager
        );
    }

    /**
     * @dev Returns multiple rates between source currencies and destination currencies
     * @param srcCurrencyAddresses source currencies addresses
     * @param destCurrencyAddresses destination currencies addresses
     * @param srcAmounts amounts of source currencies to exchange
     */
    function getExchangeRates(
        address[] memory srcCurrencyAddresses,
        address[] memory destCurrencyAddresses,
        uint256[] memory srcAmounts
    ) public view returns (uint256[] memory) {
        uint256[] memory exchangeRates = new uint256[](srcCurrencyAddresses.length);
        for (uint256 i = 0; i < srcCurrencyAddresses.length; i++) {
            exchangeRates[i] = getExchangeRate(
                srcCurrencyAddresses[i],
                destCurrencyAddresses[i],
                srcAmounts[i]
            );
        }

        return exchangeRates;
    }
}
