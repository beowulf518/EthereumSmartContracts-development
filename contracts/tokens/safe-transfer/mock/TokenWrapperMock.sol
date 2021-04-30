pragma solidity 0.5.7;

import "../../erc20/mock/MintableBurnableERC20TokenMock.sol";
import "../../erc20/mock/ERC20NoReturnSignature.sol";
import "../../erc20/mock/ERC20NoReturnValue.sol";
import "../../erc20/mock/ERC20EmptyTransfer.sol";
import "../../../exchange/mock/ExchangeConnectorMock.sol";
import "../../erc20/ERC20NonCompliantAbstract.sol";
import "../../../backward-compatibility/AddressPayable.sol";


contract TokenWrapperMock {
    using AddressPayable for address;

    enum MockTokenType {MintableBurnable, NoReturnValue, NoReturnSignature, EmptyTransfer}

    event TokenCreated(
        address token,
        uint256 rate
    );

    function safeTransferMock(
        address wrapper,
        address token,
        address dest,
        uint256 amount
    ) public {
        assembly {
            let size := extcodesize(wrapper)
            if iszero(size) { revert(0, 0) }
        }
        (bool status,) = wrapper.delegatecall(
            abi.encodeWithSignature(
                "safeTransfer(address,address,uint256)",
                token,
                dest,
                amount
            )
        );
        require(status, "safeTransfer() failed.");
    }

    function safeTransferFromMock(
        address wrapper,
        address token,
        address from,
        address to,
        uint256 amount
    ) public {
        assembly {
            let size := extcodesize(wrapper)
            if iszero(size) { revert(0, 0) }
        }
        (bool status,) = wrapper.delegatecall(
            abi.encodeWithSignature(
                "safeTransferFrom(address,address,address,uint256)",
                token,
                from,
                to,
                amount
            )
        );
        require(status, "safeTransferFrom() failed.");
    }

    function safeApproveMock(
        address wrapper,
        address token,
        address spender,
        uint256 amount
    ) public {
        assembly {
            let size := extcodesize(wrapper)
            if iszero(size) { revert(0, 0) }
        }
        (bool status,) = wrapper.delegatecall(
            abi.encodeWithSignature(
                "safeApprove(address,address,uint256)",
                token,
                spender,
                amount
            )
        );
        require(status, "safeApprove() failed.");
    }

    function generateMockTokenForExchangeConnector(
        address exchangeConnectorAddress,
        MockTokenType mockTokenType,
        uint256 rate
    ) public {
        address tokenAddr;
        if (mockTokenType == MockTokenType.MintableBurnable) {
            MintableBurnableERC20TokenMock mintableBurnableToken = new MintableBurnableERC20TokenMock();
            tokenAddr = address(mintableBurnableToken);
        } else if (mockTokenType == MockTokenType.NoReturnSignature) {
            ERC20NoReturnSignature noReturnSignatureToken = new ERC20NoReturnSignature();
            tokenAddr = address(noReturnSignatureToken);
        } else if (mockTokenType == MockTokenType.NoReturnValue) {
            ERC20NoReturnValue noReturnValueToken = new ERC20NoReturnValue();
            tokenAddr = address(noReturnValueToken);
        } else if (mockTokenType == MockTokenType.EmptyTransfer) {
            ERC20EmptyTransfer emptyTransferToken = new ERC20EmptyTransfer();
            tokenAddr = address(emptyTransferToken);
        } else {
            revert("Unknown mock token type");
        }

        ExchangeConnectorMock exchangeConnector = ExchangeConnectorMock(exchangeConnectorAddress.toPayable());
        exchangeConnector.setTokenRate(tokenAddr, rate);

        ERC20NonCompliantAbstract token = ERC20NonCompliantAbstract(tokenAddr);
        uint256 balance = token.balanceOf(address(this));
        token.transfer(exchangeConnectorAddress, balance);

        emit TokenCreated(tokenAddr, rate);
    }
}
