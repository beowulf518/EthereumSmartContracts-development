pragma solidity 0.5.7;

import "../access/RoleAware.sol";
import "../access/RoleNames.sol";


/**
 * @title UserValidator
 * @dev Contract used for whitelisting users that wants to interact with Bank or CCP
 */
contract UserValidator is RoleAware, RoleNames {

    bool public isEnabled;

    //Signatures of RoleManager functions
    bytes4 private constant APPOINT_GOVERNORS_SIG = bytes4(keccak256("appointGovernors(address[])"));
    bytes4 private constant APPOINT_ADMINS_SIG = bytes4(keccak256("appointAdmins(address[])"));
    bytes4 private constant ADD_ROLE_FOR_ADDRESS_SIG = bytes4(keccak256("addRoleForAddress(address,bytes32)"));
    bytes4 private constant REMOVE_ROLE_FOR_ADDRESS_SIG = bytes4(keccak256("removeRoleForAddress(address,bytes32)"));
    bytes4 private constant ADD_USERS_TO_WHITELIST_SIG = bytes4(keccak256("addUsersToWhitelist(address[],bytes32[])"));
    // solhint-disable-next-line max-line-length
    bytes4 private constant REMOVE_USERS_FROM_WHITELIST_SIG = bytes4(keccak256("removeUsersFromWhitelist(address[],bytes32[])"));

    /**
     * @dev Constructor setting RoleManager contract
       @param roleManager address of RoleManager contract
     */
    constructor(address roleManager) public {
        // UserValidator needs to have governance role set to have access for user roles governance functions
        setRoleManager(roleManager);
    }

    // solhint-disable-next-line
    function() external {
        bytes4 functionSignature = msg.sig;

        if (functionSignature == 0x0) {
            return;
        }

        bool useStaticCall = true;
        if (functionSignature == APPOINT_GOVERNORS_SIG) {
            require(
                roleManager.hasRole(msg.sender, GOVERNOR_ROLE_NAME),
                "Only governor is allowed to call appointGovernors"
            );
            useStaticCall = false;
        } else if (functionSignature == APPOINT_ADMINS_SIG) {
            require(
                roleManager.hasRole(msg.sender, GOVERNOR_ROLE_NAME),
                "Only governor is allowed to call appointAdmins"
            );
            useStaticCall = false;
        } else if (functionSignature == ADD_ROLE_FOR_ADDRESS_SIG) {
            require(
                roleManager.hasRole(msg.sender, GOVERNOR_ROLE_NAME),
                "Only governor is allowed to call addRoleForAddress"
            );
            useStaticCall = false;
        } else if (functionSignature == REMOVE_ROLE_FOR_ADDRESS_SIG) {
            require(
                roleManager.hasRole(msg.sender, GOVERNOR_ROLE_NAME),
                "Only governor is allowed to call removeRoleForAddress"
            );
            useStaticCall = false;
        } else if (functionSignature == ADD_USERS_TO_WHITELIST_SIG) {
            require(
                roleManager.hasRole(msg.sender, USER_WHITELIST_ADMIN_ROLE_NAME),
                "Only user whitelist admin is allowed to call addUsersToWhitelist"
            );
            useStaticCall = false;
        } else if (functionSignature == REMOVE_USERS_FROM_WHITELIST_SIG) {
            require(
                roleManager.hasRole(msg.sender, USER_WHITELIST_ADMIN_ROLE_NAME),
                "Only user whitelist admin is allowed to call removeUsersFromWhitelist"
            );
            useStaticCall = false;
        }
        bool success;
        // For the case when signature is not recognised we
        // assume that caller does not have any specific
        // permission assigned to him and thus he is limited
        // to only access view functions so we stick to
        // using staticcall
        if (useStaticCall) {
            (
                success,
            ) = address(roleManager).staticcall(msg.data);
        } else {
            (
                success,
            ) = address(roleManager).call(msg.data);
        }

        require(success, "Failed in fallback function of UserValidator");

        assembly {
            let m := mload(0x40)
            returndatacopy(m, 0, returndatasize)
            return(m, returndatasize)
        }
    }

    function setIsEnabled(bool _isEnabled) external onlyGovernor {
        isEnabled = _isEnabled;
    }

    /**
     * @dev Function to check if users are whitelisted
       @param addresses array of users to be checked
       @param userRoles array of user roles to be checked
     */
    function validateUsers(
        address[] memory addresses,
        bytes32[] memory userRoles
    ) public view returns (bool isValid) {
        if (!isEnabled) {
            return true;
        }
        return roleManager.validateUsers(addresses, userRoles);
    }
}
