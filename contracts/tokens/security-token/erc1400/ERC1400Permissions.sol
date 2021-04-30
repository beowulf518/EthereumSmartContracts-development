pragma solidity 0.5.7;

import "./ERC1400Storage.sol";
import "./IERC1400Permissions.sol";
import "./ERC1400ErrorCodes.sol";
import "../../../access/RoleNames.sol";
import "../../../registry/RegistryBaseAbstract.sol";
import "../RequireStrings.sol";


contract ERC1400Permissions is
    ERC1400Storage,
    ERC1400ErrorCodes,
    RoleNames,
    IERC1400Permissions {

    using RequireStrings for bytes32;

    modifier onlyGovernor() {
        require(roleManager.isGovernor(msg.sender), "Only governor can execute this function");
        _;
    }

    /**
     * @dev Setting registry in TokenManager
       @param _registry address of BankRegistry contract
     */
    function setRegistry(
        address _registry
    ) external onlyGovernor {
        _setRegistry(_registry);
    }

    function setController(
        address _controller
    ) external onlyGovernor {
        controller = _controller;
    }

    function init(
        string calldata _name,
        string calldata _symbol,
        address _controller,
        bool _controllable,
        bool _issuance,
        bytes32 _userRole,
        address _registry
    ) external onlyGovernor {
        require(!initialised, "Already initialised");
        initialised = true;
        name = _name;
        symbol = _symbol;
        controller = _controller;
        issuance = _issuance;
        controllable = _controllable;
        require(_userRole == CCP_USER || _userRole == BANK_USER, "Can not use arbitrary roles");
        userRole = _userRole;
        _setRegistry(_registry);
    }

    function isGovernor(
        address _underCheck
    ) external view returns (bool) {
        return roleManager.isGovernor(_underCheck);
    }

    function assertBasicTwoSidePermissions(
        address from,
        address to
    ) external view {
        (
            byte permissionCode,
            bytes32 permissionReason
        ) = _hasTransferPermissionsPartial(
            from,
            to
        );
        require(
            permissionCode == OK_CODE,
            permissionReason.toString()
        );
    }

    function hasIssuePermissions(
        address sender,
        address to
    ) external view returns (byte, bytes32) {
        if (!_isRegistryOperator(sender)) {
            return (INVALID_SENDER, "Invalid sender");
        }
        if (!roleManager.hasRole(to, userRole) && !_isRegistryOperator(to)) {
            return (INVALID_RECEIVER, "Invalid receiver");
        } else {
            return (OK_CODE, bytes32(""));
        }
    }

    function hasTransferPermissions(
        address sender,
        address from,
        address to
    ) external view returns (byte, bytes32) {
        if (!roleManager.hasRole(sender, userRole) && !_isRegistryOperator(sender)) {
            return (INVALID_SENDER, "Invalid sender");
        }

        return _hasTransferPermissionsPartial(from, to);
    }

    function isRegistryOperator(
        address _operator
    ) external view returns (bool) {
        return _isRegistryOperator(_operator);
    }

    function _setRegistry(
        address _registry
    ) internal onlyGovernor {
        require(
            _registry != address(0),
            "Zero address passed as registry"
        );
        registryAddress = _registry;
        emit RegistrySet(registryAddress);
    }

    function _isRegistryOperator(
        address _operator
    ) internal view returns (bool) {
        return RegistryBaseAbstract(registryAddress).isValidContractOrUtility(_operator);
    }

    function _hasTransferPermissionsPartial(
        address from,
        address to
    ) internal view returns (byte, bytes32) {
        if (!roleManager.hasRole(from, userRole) && !_isRegistryOperator(from)) {
            return (INVALID_SENDER, "Invalid sender");
        }
        if (!roleManager.hasRole(to, userRole) && !_isRegistryOperator(to)) {
            return (INVALID_RECEIVER, "Invalid receiver");
        } else {
            return (OK_CODE, bytes32(""));
        }
    }
}
