pragma solidity 0.5.7;


contract IERC1400Permissions {

    event RegistrySet(
        address registryAddress
    );

    function setRegistry(
        address _registry
    ) external;

    function setController(
        address _controller
    ) external;

    function init(
        string calldata _name,
        string calldata _symbol,
        address _controller,
        bool _controllable,
        bool _issuance,
        bytes32 _userRole,
        address _registry
    ) external;

    function assertBasicTwoSidePermissions(
        address from,
        address to
    ) external view;

    function isGovernor(
        address _underCheck
    ) external view returns (bool);

    function hasIssuePermissions(
        address sender,
        address to
    ) external view returns (byte, bytes32);

    function hasTransferPermissions(
        address sender,
        address from,
        address to
    ) external view returns (byte, bytes32);

    function isRegistryOperator(
        address _operator
    ) external view returns (bool);
}