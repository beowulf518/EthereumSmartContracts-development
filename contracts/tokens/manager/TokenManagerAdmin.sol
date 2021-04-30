pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./TokenManagerBase.sol";
import "./TokenManagerAdminInterface.sol";
import "../../registry/RegistryBaseAbstract.sol";
import "../../delegate/Delegator.sol";
import "../../utils/TokenDecimals.sol";


/**
 * @title TokenManagerAdmin
 * @dev Contract is responsible for managing interaction with tokens.
        It provides helper functions that allows to get decimals, balances and allowances
        of tokens. `collectFunds` function is used to safely transfer tokens to
        msg.sender by using TokenWrapper contract which implements safeTransferFrom
        function to transfer non compatible ERC20 tokens
 */
contract TokenManagerAdmin is
    Delegator,
    TokenManagerBase,
    TokenManagerAdminInterface {

    using TokenDecimals for address;

    /**
     * @dev Setting bank registry in TokenManager
       @param _registry address of BankRegistry contract
     */
    function setBankRegistry(
        address _registry
    ) external onlyGovernor {
        require(
            _registry != address(0),
            "Zero address passed as registry"
        );
        bankRegistry = _registry;
        emit BankRegistrySet(bankRegistry);
    }

    /**
     * @dev Setting OPM registry in TokenManager
       @param _registry address of OPMRegistry contract
     */
    function setOpmRegistry(
        address _registry
    ) external onlyGovernor {
        require(
            _registry != address(0),
            "Zero address passed as registry"
        );
        opmRegistry = _registry;
        emit OpmRegistrySet(opmRegistry);
    }

    /**
     * @dev Setting ethereum asset address in TokenManager
       @param _ethereumAddress address of ethereum asset
     */
    function setEthereumAddress(
        address _ethereumAddress
    ) external onlyAdmin {
        require(
            _ethereumAddress != address(0),
        "Zero address passed as ethereumAddress"
        );
        ethereumAddress = _ethereumAddress;
        emit EthereumAddressSet(ethereumAddress);
    }

    /**
     * @dev Setting TokenWrapper address in TokenManager
       @param _wrapper address of TokenWrapper contract
     */
    function setTokenWrapper(
        address _wrapper
    ) external onlyGovernor {
        require(
            address(_wrapper) != address(0),
            "Zero address passed as ethereumAddress"    
        );
        tokenWrapper = _wrapper;
        emit TokenWrapperSet(tokenWrapper);
    }

    /**
     * @dev Function that allows to safely transfer tokens to msg.sender
            Can be used only by verified bank contracts.
       @param from address of account to transfer tokens from
       @param tokenAddress address token to transfer
       @param amount of tokens to be transferred
     */
    function collectFunds(
        address from,
        address tokenAddress,
        uint256 amount
    ) external onlyAllowedContracts(bankRegistry) {
        collectFundsCommon(from, tokenAddress, amount);
    }

    function collectFundsToFundLock(
        address from,
        address tokenAddress,
        uint256 amount
    ) external onlyAllowedContracts(opmRegistry) {
        collectFundsCommon(from, tokenAddress, amount);
    }

    /**
     * @dev Getting address of ethereum asset set in TokenManager
     */
    function getEthereumAddress()
    external
    view
    returns (address) {
        return ethereumAddress;
    }

    /**
     * @dev Getting address of TokenWrapper contract set in TokenManager
     */
    function getTokenWrapper()
    external
    view
    returns (address) {
        return tokenWrapper;
    }

    /**
     * @dev Helper functions that gets decimals property for specified token
     * @param token address of asset to get decimals
     */
    function getTokenDecimals(
        address token
    ) external view returns (
        uint256
    ) {
        return token.getTokenDecimals();
    }

    /**
     * @dev Helper functions that gets multiple balances and allowances for specified tokens
     * @param tokens address of assets to get balances and allowances
     * @param spender address of account used to get allowance
     */
    function getTokenProperties(
        address[] calldata tokens,
        address spender
    ) external view returns (
        uint256[] memory,
        uint256[] memory
    ) {
        require(spender != address(0));
        uint256[] memory allowances = new uint256[](tokens.length);
        uint256[] memory balances = new uint256[](tokens.length);

        for (uint256 i = 0; i < tokens.length; i++) {
            allowances[i] = ERC20(tokens[i]).allowance(
                msg.sender,
                spender
            );
            balances[i] = ERC20(tokens[i]).balanceOf(msg.sender);
        }

        return (allowances, balances);
    }

    function collectFundsCommon(
        address from,
        address tokenAddress,
        uint256 amount
    ) internal {
        bytes memory args = abi.encodeWithSignature(
            "safeTransferFrom(address,address,address,uint256)",
            tokenAddress,
            from,
            msg.sender,
            amount
        );

        delegate(
            tokenWrapper,
            args,
            "delegatecall() failed in TokenManagerAdmin.collectFunds()"
        );
    }
}
