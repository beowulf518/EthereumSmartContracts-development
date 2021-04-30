pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../KyberNetworkInterface.sol";
import "../../tokens/manager/TokenManagerMainInterface.sol";
import "../../utils/Utils.sol";
import "../../tokens/erc20/mock/ERC20NoReturnSignature.sol";
import "../../tokens/erc20/mock/MintableBurnableERC20TokenMock.sol";
import "../../tokens/erc20/ERC20NonCompliantAbstract.sol";
import "../../backward-compatibility/AddressPayable.sol";
import "../../delegate/Delegator.sol";


contract KyberNetworkMock is KyberNetwork, Utils, Delegator {
    using SafeMath for uint256;
    using AddressPayable for address;

    TokenManagerMainInterface public tokenManager;
    mapping (address => mapping (address => uint)) public rates;

    event TokenCreated(address token);

    constructor (
        TokenManagerMainInterface _tokenManager
    ) public {
        require(address(_tokenManager) != address(0));
        tokenManager = _tokenManager;
    }

    // solhint-disable-next-line no-empty-blocks
    function () external payable {}

    function setExpectedRate(address source, address dest, uint expectedRate) external {
        rates[source][dest] = expectedRate;
    }

    function setExpectedRates(
        address[] calldata sources,
        address[] calldata destinations,
        uint[] calldata expectedRates
    ) external {
        require(sources.length == destinations.length, "Sources and Destinations should have same length");
        require(sources.length == expectedRates.length, "Sources and Expected Rates should have same length");
        for (uint256 i = 0; i < sources.length; i++) {
            rates[sources[i]][destinations[i]] = expectedRates[i];
        }
    }

    function trade(
        ERC20 srcAsset,
        uint srcAmount,
        ERC20 destAsset,
        address tradeDestAddress,
/* solhint-disable no-unused-vars */
        uint maxDestAmount,
        uint minConversionRate,
        address walletId
/* solhint-disable no-unused-vars */
    ) external payable returns (uint) {
        require(maxDestAmount >= 0);
        require(minConversionRate >= 0);
        require(walletId != address(0));
        require(rates[address(srcAsset)][address(destAsset)] != 0,
        "Missing src to dest exchange rate"
        );
        address ethereumAddress = tokenManager.getEthereumAddress();
        uint256 value;
        if (address(srcAsset) == ethereumAddress) {
            value = msg.value;
        } else {
            value = srcAmount;
        }

        uint256 toTransfer = value.mul(rates[address(srcAsset)][address(destAsset)]).div(BASE_MULTIPLIER);

        if (address(destAsset) == ethereumAddress) {
            require(address(this).balance >= toTransfer);
            tradeDestAddress.toPayable().transfer(
                toTransfer
            );
        } else {
            address tokenWrapper = tokenManager.getTokenWrapper();
            bytes memory args = abi.encodeWithSignature(
                "safeTransfer(address,address,uint256)",
                address(destAsset),
                tradeDestAddress,
                toTransfer
            );

            delegate(
                tokenWrapper,
                args,
                "delegatecall() failed in KybetNetworkMock.trade()"
            );
        }

        return toTransfer;
    }

    function findBestRate(
        ERC20 src,
        ERC20 dest,
        uint srcQty
    ) external view returns (uint, uint) {
        return getExpectedRate(src, dest, srcQty);
    }

    function getExpectedRate(
        ERC20 source,
// solhint-disable-next-line no-unused-vars
        ERC20 dest,
        uint srcQty
    ) public view returns (uint expectedPrice, uint slippagePrice) {
        require(srcQty >= 0);
        uint expectedRate = rates[address(source)][address(dest)];
        expectedPrice = expectedRate;
        slippagePrice = expectedRate;
    }

    function generateAsset(bool isBadToken) public {
        address tokenAddr;
        if (isBadToken) {
            ERC20NoReturnSignature noReturnSignatureToken = new ERC20NoReturnSignature();
            tokenAddr = address(noReturnSignatureToken);
        } else {
            MintableBurnableERC20TokenMock tokenMock = new MintableBurnableERC20TokenMock();
            tokenAddr = address(tokenMock);
        }
        emit TokenCreated(tokenAddr);
    }

    function tokenFaucet(ERC20NonCompliantAbstract asset, uint256 amount) public {
        asset.transfer(msg.sender, amount);
    }
}
