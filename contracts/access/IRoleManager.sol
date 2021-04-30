pragma solidity 0.5.7;


contract IRoleManager {
    function appointGovernors(address[] calldata governors) external;

    function appointAdmins(address[] calldata admins) external;

    function addRoleForAddress(address addr, bytes32 roleName) external;

    function addRolesForAddresses(
        address[] calldata addresses,
        bytes32[] calldata rolesArr
    ) external;

    function addUsersToWhitelist(
        address[] calldata users,
        bytes32[] calldata userRoles
    ) external;

    function removeRoleForAddress(address addr, bytes32 roleName) external;

    function removeUsersFromWhitelist(
        address[] calldata users,
        bytes32[] calldata userRoles
    ) external;

    function isGovernor(address addr) public view returns (bool);

    function isAdmin(address addr) public view returns (bool);

    function isUtilityAccount(address addr) public view returns (bool);

    function isUserWhitelistAdmin(address addr) public view returns (bool);

    function validateUsers(
        address[] memory addresses,
        bytes32[] memory userRoles
    ) public view returns (bool isValid);

    function hasRole(address addr, bytes32 roleName) public view returns (bool);
}
