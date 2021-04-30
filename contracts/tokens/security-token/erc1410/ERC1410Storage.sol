pragma solidity 0.5.7;


contract ERC1410Storage {
    // Represents a fungible set of tokens.
    struct Partition {
        uint256 amount;
        bytes32 partition;
    }

    // Mapping from investor to their partitions
    mapping (address => Partition[]) public partitions;

    // Mapping from (investor, partition) to index of corresponding partition in partitions
    // @dev Stored value is always greater by 1 to avoid the 0 value of every index
    mapping (address => mapping (bytes32 => uint256)) public partitionToIndex;

    // Mapping from (investor, partition, operator) to approved status
    mapping (address => mapping (bytes32 => mapping (address => bool))) public partitionApprovals;

    // Mapping from (investor, operator) to approved status (can be used against any partition)
    mapping (address => mapping (address => bool)) public approvals;
    // (owner, spender, partition, value)
    mapping (address => mapping (address => mapping (bytes32 => uint256))) private allowanceByPartitionMap;
}