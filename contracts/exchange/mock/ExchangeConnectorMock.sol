pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../ExchangeConnectorInterface.sol";
import "../../tokens/erc20/mock/MintableBurnableERC20TokenMock.sol";
import "../../tokens/erc20/MintableBurnableERC20.sol";
import "../../tokens/erc20/ERC20NonCompliantAbstract.sol";
import "../../tokens/erc20/mock/ERC20NoReturnSignature.sol";
import "../../tokens/erc20/mock/ERC20NoReturnValue.sol";
import "../../utils/Utils.sol";
import "../../tokens/manager/TokenManagerMainInterface.sol";
import "../ExchangeConnectorBase.sol";
import "../../delegate/Delegator.sol";


contract ExchangeConnectorMock is
    ExchangeConnectorBase,
    Utils,
    Delegator {

    using SafeMath for uint256;

    event TokenCreated(
        address token,
        uint256 rate
    );

    event TokenRateSet(
        address token,
        uint256 rate
    );

    mapping (address => uint256) public tokensToRates;

    bool public isZeroRate = false;

    constructor (
        address _roleManager,
        TokenManagerMainInterface _tokenManager
    ) public {
        require(address(_tokenManager) != address(0));
        tokenManager = _tokenManager;
        setRoleManager(_roleManager);
    }

    // solhint-disable-next-line no-empty-blocks
    function () external payable {}

    function trade(
        address srcAsset,
        address destAsset,
        address tradeDestAddress,
        uint256 srcAmount
    ) external payable returns (uint256) {
        require(tokensToRates[srcAsset] != 0, "Dont have exchange rate for src");
        require(tokensToRates[destAsset] != 0, "Dont have exchange rate for dest");
        address ethereumAddress = tokenManager.getEthereumAddress();
        uint256 value;
        if (srcAsset == ethereumAddress) {
            value = msg.value;
        } else {
            value = srcAmount;
        }

        uint256 toTransfer = value
            .mul(
                getExchangeRate(
                    srcAsset,
                    destAsset,
                    srcAmount
                )
            )
            .div(BASE_MULTIPLIER);

        if (destAsset == ethereumAddress) {
            require(address(this).balance >= toTransfer);
            address payable payableDest = address(uint160(tradeDestAddress));
            payableDest.transfer(
                toTransfer
            );
        } else {
            address tokenWrapper = tokenManager.getTokenWrapper();
            bytes memory args = abi.encodeWithSignature(
                "safeTransfer(address,address,uint256)",
                destAsset,
                tradeDestAddress,
                toTransfer
            );

            delegate(
                tokenWrapper,
                args,
                "delegatecall() failed in ExchangeConnectorMock's trade()."
            );
        }

        return toTransfer;
    }

    function setExchangeRate(
        address srcCurrencyAddress,
        address destCurrencyAddress,
        uint256 rate
    ) external onlyGovernor returns (bool) {
        require(destCurrencyAddress != address(0));
        tokensToRates[srcCurrencyAddress] = rate;
        return true;
    }

    function mint(
        address currency,
        uint256 amount
    ) external {
        MintableBurnableERC20(currency).mint(
            msg.sender,
            amount
        );
    }

    function getExchangeRate(
        address srcCurrencyAddress,
        address destCurrencyAddress,
        uint256 srcAmount
    ) public view returns (uint256) {
        if (!isZeroRate) {
            require(srcAmount != 0);
            require(tokensToRates[srcCurrencyAddress] != 0);
            require(tokensToRates[destCurrencyAddress] != 0);
            return normaliseExchangeRate(
                srcCurrencyAddress,
                destCurrencyAddress,
                tokensToRates[srcCurrencyAddress],
                tokenManager
            );
        } else {
            return 0;
        }
    }

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

    function setTokenRate(
        address token,
        uint256 rate
    ) public {
        require(rate != 0);
        tokensToRates[token] = rate;

        emit TokenRateSet(token, rate);
    }

    function generateAsset(
        uint256 rate,
        bool isBadToken
    ) public {
        address tokenAddr;
        if (isBadToken) {
            ERC20NoReturnSignature noReturnSignatureToken = new ERC20NoReturnSignature();
            tokenAddr = address(noReturnSignatureToken);
        } else {
            MintableBurnableERC20TokenMock tokenMock = new MintableBurnableERC20TokenMock();
            tokenAddr = address(tokenMock);
        }
        tokensToRates[tokenAddr] = rate;
        emit TokenCreated(
            tokenAddr,
            rate
        );
    }

    function tokenFaucet(
        ERC20NonCompliantAbstract asset,
        uint256 amount
    ) public {
        asset.transfer(
            msg.sender,
            amount
        );
    }

    function setZeroRate(
        bool value
    ) public {
        isZeroRate = value;
    }
}
