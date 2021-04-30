pragma solidity 0.5.7;

import "./IERC1410Extended.sol";
import "./IERC1410.sol";
import "../erc1400/ERC1400ErrorCodes.sol";
import "../../../utils/KindMath.sol";
import "../erc1400/ERC1400Storage.sol";
import "../erc1400/IERC1400Permissions.sol";
import "../RequireStrings.sol";


contract ERC1410Extended is
    ERC1400Storage,
    ERC1400ErrorCodes,
    IERC1410Extended {

    using RequireStrings for bytes32;

    function assertCanTransferFromByPartition(
        address _sender,
        address _from,
        address _to,
        bytes32 _partition,
        uint256 _value,
        bytes calldata _data
    ) external view {
        (
            byte canTransferCode,
            bytes32 canTransferReason
        ) = _canTransferFromByPartition(
            _sender,
            _from,
            _to,
            _partition,
            _value,
            _data
        );
        require(
            canTransferCode == OK_CODE,
            canTransferReason.toString()
        );
    }

    function canTransferFromByPartition(
        address _sender,
        address _from,
        address _to,
        bytes32 _partition,
        uint256 _value,
        bytes calldata _data
    ) external view returns (byte, bytes32) {
        return _canTransferFromByPartition(
            _sender,
            _from,
            _to,
            _partition,
            _value,
            _data
        );
    }

    function assertSinglePartitionForHolder(
        address holder
    ) external view returns (byte, bytes32) {
        return _assertSinglePartitionForHolder(holder);
    }

    function assertRequireSinglePartitionForHolder(
        address holder
    ) external view returns (bytes32) {
        (
            byte partitionRequestCode,
            bytes32 partitionOrError
        ) = _assertSinglePartitionForHolder(holder);
        require(
            partitionRequestCode == OK_CODE,
            partitionOrError.toString()
        );
        return partitionOrError;
    }

    function assertRequireSinglePartitionWithDataForHolder(
        address _holder,
        bytes calldata _data
    ) external view returns (bytes32) {
        bytes32 partition;
        (
            byte partitionRequestCode,
            bytes32 partitionOrError
        ) = _assertSinglePartitionForHolder(_holder);

        if (partitionRequestCode == OK_CODE) {
            partition = partitionOrError;
        } else {
            bytes memory dataCopy = _data;
            require(
                dataCopy.length == 32,
                partitionOrError.toString()
                // TODO: can we improve this
                // TODO: by extending error message
            );
            assembly {
                partition := mload(add(dataCopy, 0x20))
            }
        }

        return partition;
    }

    // solhint-disable-next-line code-complexity
    function _canTransferFromByPartition(
        address _sender,
        address _from,
        address _to,
        bytes32 _partition,
        uint256 _value,
        bytes memory _data
    // solhint-disable-next-line function-max-lines
    ) internal view returns (byte, bytes32) {
        require(_data.length >= 0);
        if (_value == 0) {
            return (
                INVALID_AMOUNT,
                bytes32("Invalid amount")
            );
        }

        if (
            partitions[_from].length < partitionToIndex[_from][_partition]
            || partitionToIndex[_from][_partition] == 0
        ) {
            return (INVALID_PARTITION, bytes32("Partition not found"));
        }

        if (_to == address(0)) {
            return (TRANSFER_FAILURE, bytes32("0x address not allowed"));
        }

        // _from user cannot have idx = 0 because previous checks would return invalid partition error code
        uint256 partitionFromIdx = partitionToIndex[_from][_partition];
        if (
            !KindMath.checkSub(partitions[_from][partitionFromIdx - 1].amount, _value)
        ) {
            return (
                INSUFFICIENT_BALANCE,
                bytes32("Insufficient balance")
            );
        }

        // _to user can have idx = 0 and it is valid scenario as _to user does not have created partition yet.
        // It will be automatically created when _to user will receive (transferred or issued) his first tokens
        // on this partition
        uint256 partitionToIdx = partitionToIndex[_to][_partition];
        if (
            partitionToIdx != 0 &&
            !KindMath.checkAdd(partitions[_to][partitionToIdx - 1].amount, _value)
        ) {
            return (
                TRANSFER_FAILURE,
                bytes32("Receiver balance overflow")
            );
        }

        if (
            !KindMath.checkSub(_balances[_from], _value)
            || !KindMath.checkAdd(_balances[_to], _value)
        ) {
            return (
                TRANSFER_FAILURE,
                bytes32("Transfer overflow or underflow")
            );
        }

        if (
            _sender != _from
            && !partitionApprovals[_from][_partition][_sender]
            && !IERC1410(address(this)).isOperatorForPartition(_partition, _sender, _from)
        ) {
            return (
                INSUFFICIENT_ALLOWANCE,
                bytes32("Invalid operator")
            );
        }

        (
            byte permissionCode,
            bytes32 permissionReason
        ) = IERC1400Permissions(
            address(this)
        )
        .hasTransferPermissions(
            _sender,
            _from,
            _to
        );

        if (permissionCode != OK_CODE) {
            return (permissionCode, permissionReason);
        }

        return (OK_CODE, _partition);
    }

    function _assertSinglePartitionForHolder(
        address holder
    ) internal view returns (byte, bytes32) {
        if (partitions[holder].length == 0) {
            return (
                NO_ACTIVE_PARTITIONS,
                bytes32("No active partitions")
            );
        }
        if (partitions[holder].length != 1) {
            return (
                MORE_THAN_ONE_PARTITION,
                bytes32("More than one partition")
            );
        }

        return (OK_CODE, partitions[holder][0].partition);
    }
}
