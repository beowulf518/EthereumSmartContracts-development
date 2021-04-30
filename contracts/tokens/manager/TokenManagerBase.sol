pragma solidity 0.5.7;

import "../../delegate/Resolvable.sol";
import "../../access/RoleAware.sol";
import "../../registry/RegistryBaseAbstract.sol";


/**
 * @title TokenManagerBase
 * @dev Base contract inherited by TokenManagerAdmin and TokenManagerAssets.
        Keeps addresses of contracts needed for TokenManager functionality
 */
contract TokenManagerBase is RoleAware, Resolvable {

    address public bankRegistry;
    address public opmRegistry;
    address public ethereumAddress;
    address public tokenWrapper;

    event BankRegistrySet(
        address bankRegistryAddress
    );

    event OpmRegistrySet(
        address opmRegistryAddress
    );

    event EthereumAddressSet(
        address etherAddress
    );

    event TokenWrapperSet(
        address tokenWrapperAddress
    );

    /**
    * @dev Only contracts that are verified by Registry are allowed
    */
    modifier onlyAllowedContracts(address _registry) {
        require(_registry != address(0), "Registry is not set");

        require(
            RegistryBaseAbstract(_registry).isValidContractOrUtility(msg.sender),
            "Can only be called by a registered contract"
        );
        _;
    }
}
