pragma solidity 0.5.7;


contract ERC1400PermissionsStorage {

    bool internal isImplementationContract;
    bool internal initialised;

    address public registryAddress;
    bytes32 public userRole;

    modifier onlyRouterAccess() {
        require(!isImplementationContract);
        _;
    }
}