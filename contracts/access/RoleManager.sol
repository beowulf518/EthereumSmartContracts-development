pragma solidity 0.5.7;

import "./IRoleManager.sol";
import "openzeppelin-solidity/contracts/access/Roles.sol";
import "./RoleNames.sol";


contract RoleManager is RoleNames, IRoleManager {
    using Roles for Roles.Role;

    event RoleAdded(
        bytes32 roleName,
        address user
    );

    event RoleRemoved(
        bytes32 roleName,
        address user
    );

    mapping (bytes32 => Roles.Role) private roles;

    modifier onlyRole(bytes32 roleName) {
        checkRole(msg.sender, roleName);
        _;
    }

    constructor (address[] memory governors) public {
        for (uint256 i = 0; i < governors.length; i++) {
            addRole(governors[i], GOVERNOR_ROLE_NAME);
        }
    }

    function appointGovernors(address[] calldata governors) external onlyRole(GOVERNOR_ROLE_NAME) {
        for (uint256 i = 0; i < governors.length; i++) {
            addRole(governors[i], GOVERNOR_ROLE_NAME);
        }
    }

    function appointAdmins(address[] calldata admins) external onlyRole(GOVERNOR_ROLE_NAME) {
        for (uint256 i = 0; i < admins.length; i++) {
            addRole(admins[i], ADMIN_ROLE_NAME);
        }
    }

    function addRoleForAddress(address addr, bytes32 roleName) external onlyRole(GOVERNOR_ROLE_NAME) {
        require(addr != address(0), "Address for role is not set");
        addRole(addr, roleName);
    }

    /**
     * @dev Function to distribute multiple roles to addresses
       @param addresses array of user addresses
       @param rolesArr array of respective roles
     */
    function addRolesForAddresses(
        address[] calldata addresses,
        bytes32[] calldata rolesArr
    ) external onlyRole(GOVERNOR_ROLE_NAME) {
        require(addresses.length == rolesArr.length);
        require(addresses.length > 0);
        for (uint256 i = 0; i < addresses.length; i++) {
            require(addresses[i] != address(0), "Address for role is not set");
            addRole(addresses[i], rolesArr[i]);
        }
    }

    /**
     * @dev Function to add addresses of users to whitelisted
       @param users array of user addresses
       @param userRoles array of respective roles
     */
    function addUsersToWhitelist(
        address[] calldata users,
        bytes32[] calldata userRoles
    ) external onlyRole(USER_WHITELIST_ADMIN_ROLE_NAME) {
        require(users.length == userRoles.length);
        require(users.length > 0);
        for (uint256 i = 0; i < users.length; i++) {
            require(users[i] != address(0), "Address for role is not set");
            require(isValidUserRole(userRoles[i]), "Unknown user role, only ccp.user, bank.user roles allowed");
            addRole(users[i], userRoles[i]);
        }
    }

    function removeRoleForAddress(address addr, bytes32 roleName) external onlyRole(GOVERNOR_ROLE_NAME) {
        require(addr != address(0), "Address for role is not set");
        removeRole(addr, roleName);
    }

    /**
     * @dev Function to remove user address from whitelist
       @param users array of user addresses
       @param userRoles array of respective roles
     */
    function removeUsersFromWhitelist(
        address[] calldata users,
        bytes32[] calldata userRoles
    ) external onlyRole(USER_WHITELIST_ADMIN_ROLE_NAME) {
        require(users.length == userRoles.length);
        require(users.length > 0);
        require(validateUsers(users, userRoles), "One of the provided users is not valid");
        for (uint256 i = 0; i < users.length; i++) {
            require(users[i] != address(0), "Address for role is not set");

            removeRole(users[i], userRoles[i]);
        }
    }

    function validateUsers(
        address[] memory addresses,
        bytes32[] memory userRoles
    ) public view returns (bool isValid) {
        require(addresses.length == userRoles.length);
        require(addresses.length > 0);
        isValid = false;
        for (uint256 i = 0; i < addresses.length; i++) {
            isValid = isValidUserRole(userRoles[i]) && hasRole(addresses[i], userRoles[i]);
            if (!isValid) {
                break;
            }
        }
    }

    function isGovernor(address addr) public view returns (bool) {
        return hasRole(addr, GOVERNOR_ROLE_NAME);
    }

    function isAdmin(address addr) public view returns (bool) {
        return hasRole(addr, ADMIN_ROLE_NAME);
    }

    function isUtilityAccount(address addr) public view returns (bool) {
        return hasRole(addr, UTILITY_ACCOUNT_ROLE_NAME);
    }

    function isUserWhitelistAdmin(address addr) public view returns (bool) {
        return hasRole(addr, USER_WHITELIST_ADMIN_ROLE_NAME);
    }

    function checkRole(address addr, bytes32 roleName) public view {
        require(roles[roleName].has(addr), "Account does not have required role");
    }

    function hasRole(address addr, bytes32 roleName) public view returns (bool) {
        return roles[roleName].has(addr);
    }

    function addRole(address addr, bytes32 roleName) internal {
        roles[roleName].add(addr);
        emit RoleAdded(roleName, addr);
    }

    function removeRole(address addr, bytes32 roleName) internal {
        if (hasRole(addr, roleName)) {
            roles[roleName].remove(addr);
            emit RoleRemoved(roleName, addr);
        }
    }

    function isValidUserRole(bytes32 role) internal pure returns (bool) {
        return role == CCP_USER || role == BANK_USER;
    }
}
