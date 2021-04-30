pragma solidity 0.5.7;


contract IERC1410Extended {
    function canTransferFromByPartition(
        address _sender,
        address _from,
        address _to,
        bytes32 _partition,
        uint256 _value,
        bytes calldata _data
    ) external view returns (byte, bytes32);

    function assertCanTransferFromByPartition(
        address _sender,
        address _from,
        address _to,
        bytes32 _partition,
        uint256 _value,
        bytes calldata _data
    ) external view;

    function assertSinglePartitionForHolder(
        address holder
    ) external view returns (
        byte,
        bytes32
    );

    function assertRequireSinglePartitionForHolder(
        address holder
    ) external view returns (bytes32);

    function assertRequireSinglePartitionWithDataForHolder(
        address _holder,
        bytes calldata _data
    ) external view returns (bytes32);
}
