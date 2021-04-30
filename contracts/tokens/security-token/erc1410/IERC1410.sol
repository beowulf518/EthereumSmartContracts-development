pragma solidity 0.5.7;


contract IERC1410 {
    event TransferByPartition(
        bytes32 indexed _fromPartition,
        address _operator,
        address indexed _from,
        address indexed _to,
        uint256 _value,
        bytes _data,
        bytes _operatorData
    );

    event AuthorizedOperator(
        address indexed operator,
        address indexed tokenHolder
    );

    event RevokedOperator(
        address indexed operator,
        address indexed tokenHolder
    );

    event AuthorizedOperatorByPartition(
        bytes32 indexed partition,
        address indexed operator,
        address indexed tokenHolder
    );

    event RevokedOperatorByPartition(
        bytes32 indexed partition,
        address indexed operator,
        address indexed tokenHolder
    );

    event IssuedByPartition(
        bytes32 indexed partition,
        address indexed operator,
        address indexed to,
        uint256 amount,
        bytes data,
        bytes operatorData
    );

    event RedeemedByPartition(
        bytes32 indexed partition,
        address indexed operator,
        address indexed from,
        uint256 amount,
        bytes operatorData
    );

    function transferByPartition(
        bytes32 _partition,
        address _to,
        uint256 _value,
        bytes calldata _data
    ) external returns (bytes32);

    function operatorTransferByPartition(
        bytes32 _partition,
        address _from,
        address _to,
        uint256 _value,
        bytes calldata _data,
        bytes calldata _operatorData
    ) external returns (bytes32);

    function authorizeOperator(address _operator) external;
    function revokeOperator(address _operator) external;

    function authorizeOperatorByPartition(
        bytes32 _partition,
        address _operator
    ) external;

    function revokeOperatorByPartition(
        bytes32 _partition,
        address _operator
    ) external;

    // Issuance / Redemption
    function issueByPartition(
        bytes32 _partition,
        address _tokenHolder,
        uint256 _value,
        bytes calldata _data
    ) external;

    function redeemByPartition(
        bytes32 _partition,
        uint256 _value,
        bytes calldata _data
    ) external;

    function operatorRedeemByPartition(
        bytes32 _partition,
        address _tokenHolder,
        uint256 _value,
        bytes calldata _operatorData
    ) external;

    function balanceOfByPartition(
        bytes32 _partition,
        address _tokenHolder
    ) external view returns (uint256);

    function partitionsOf(
        address _tokenHolder
    ) external view returns (bytes32[] memory);

    function canTransferByPartition(
        address _from,
        address _to,
        bytes32 _partition,
        uint256 _value,
        bytes calldata _data
    ) external view returns (
        byte,
        bytes32,
        bytes32
    );

    function isOperator(
        address _operator,
        address _tokenHolder
    ) external view returns (bool);

    function isOperatorForPartition(
        bytes32 _partition,
        address _operator,
        address _tokenHolder
    ) external view returns (bool);
}
