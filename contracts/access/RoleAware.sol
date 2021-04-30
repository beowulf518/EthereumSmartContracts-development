pragma solidity 0.5.7;

import "./IRoleManager.sol";


contract RoleAware {
    IRoleManager internal roleManager;

    modifier onlyGovernor() {
        require(roleManager.isGovernor(msg.sender), "Only governor can execute this function");
        _;
    }

    modifier onlyAdmin() {
        require(roleManager.isAdmin(msg.sender), "Only admin can execute this function");
        _;
    }

    modifier onlyUtilityAccount() {
        require(roleManager.isUtilityAccount(msg.sender), "Only utility account can execute this function");
        _;
    }

    modifier onlyUserWhitelistAdmin() {
        require(roleManager.isUserWhitelistAdmin(msg.sender), "Only user whitelist admin can execute this function");
        _;
    }

    modifier onlyRole(bytes32 roleName) {
        require(roleManager.hasRole(msg.sender, roleName), "Permission denied to execute this function");
        _;
    }

    function setRoleManager(address _roleManager) internal {
        require(_roleManager != address(0), "Role manager address cannot be empty");
        roleManager = IRoleManager(_roleManager);
    }
}
