pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../erc1400/ERC1400Storage.sol";
import "./IERC1410.sol";
import "../erc1400/ERC1400ErrorCodes.sol";
import "../RequireStrings.sol";
import "./IERC1410Extended.sol";
import "../erc1400/ERC1400GovernorOnly.sol";
import "../erc1644/IERC1644.sol";


contract ERC1410 is
    ERC1400Storage,
    ERC1400ErrorCodes,
    ERC1400GovernorOnly,
    IERC1410 {

    using SafeMath for uint256;
    using RequireStrings for bytes32;

    function transferByPartition(
        bytes32 partition,
        address to,
        uint256 value,
        bytes calldata data
    ) external returns (bytes32) {
        IERC1410Extended(
            address(this)
        )
        .assertCanTransferFromByPartition(
            msg.sender,
            msg.sender,
            to,
            partition,
            value,
            data
        );

        (
            byte transferByPartitionCode,
            bytes32 transferByPartitionReason
        ) = _transferByPartition(
            msg.sender,
            to,
            value,
            partition,
            data,
            address(0),
            data
        );
        require(
            transferByPartitionCode == OK_CODE,
            transferByPartitionReason.toString()
        );

        return partition;
    }

    /// @notice Decreases totalSupply and the corresponding amount of the specified partition of msg.sender
    /// @param _partition The partition to allocate the decrease in balance
    /// @param _value The amount by which to decrease the balance
    /// @param _data Additional data attached to the burning
    /// of tokens
    function redeemByPartition(
        bytes32 _partition,
        uint256 _value,
        bytes calldata _data
    ) external {
        // Add the function to validate the `_data` parameter
        _redeemByPartition(
            _partition,
            msg.sender,
            address(0),
            _value,
            _data
        );
    }

    /// @notice Decreases totalSupply and the corresponding amount of the specified partition of tokenHolder
    /// @dev This function can only be called by the authorised operator.
    /// @param _partition The partition to allocate the decrease in balance.
    /// @param _tokenHolder The token holder whose balance should be decreased
    /// @param _value The amount by which to decrease the balance
    /// @param _operatorData Additional data attached to the
    /// transfer of tokens by the operator
    function operatorRedeemByPartition(
        bytes32 _partition,
        address _tokenHolder,
        uint256 _value,
        bytes calldata _operatorData
    ) external {
        // Add the function to validate the `_data` parameter
        require(_tokenHolder != address(0), "Invalid from address");
        require(
            isOperatorForPartition(
                _partition,
                msg.sender,
                _tokenHolder
            ),
            "Not authorised"
        );
        _redeemByPartition(
            _partition,
            _tokenHolder,
            msg.sender,
            _value,
            _operatorData
        );
    }

    /// @notice Authorises an operator for all partitions of
    /// `msg.sender`
    /// @param _operator An address which is being authorised
    function authorizeOperator(address _operator) external {
        IERC1400Permissions(
            address(this)
        )
        .assertBasicTwoSidePermissions(
            msg.sender,
            _operator
        );
        approvals[msg.sender][_operator] = true;
        emit AuthorizedOperator(_operator, msg.sender);
    }

    /// @notice Revokes authorisation of an operator previously given for all partitions of `msg.sender`
    /// @param _operator An address which is being de-authorised
    function revokeOperator(address _operator) external {
        IERC1400Permissions(
            address(this)
        )
        .assertBasicTwoSidePermissions(
            msg.sender,
            _operator
        );
        approvals[msg.sender][_operator] = false;
        emit RevokedOperator(_operator, msg.sender);
    }

    /// @notice Authorises an operator for a given partition of `msg.sender`
    /// @param _partition The partition to which the operator is authorised
    /// @param _operator An address which is being authorised
    function authorizeOperatorByPartition(
        bytes32 _partition,
        address _operator
    ) external {
        IERC1400Permissions(
            address(this)
        )
        .assertBasicTwoSidePermissions(
            msg.sender,
            _operator
        );
        partitionApprovals[msg.sender][_partition][_operator] = true;
        emit AuthorizedOperatorByPartition(_partition, _operator, msg.sender);
    }

    /// @notice Revokes authorisation of an operator previously given for a specified partition of `msg.sender`
    /// @param _partition The partition to which the operator is de-authorised
    /// @param _operator An address which is being de-authorised
    function revokeOperatorByPartition(
        bytes32 _partition,
        address _operator
    ) external {
        IERC1400Permissions(
            address(this)
        )
        .assertBasicTwoSidePermissions(
            msg.sender,
            _operator
        );
        partitionApprovals[msg.sender][_partition][_operator] = false;
        emit RevokedOperatorByPartition(_partition, _operator, msg.sender);
    }

    /// @notice Transfers the ownership of tokens from a specified partition from one address to another address
    /// @param _partition The partition from which to transfer tokens
    /// @param _from The address from which to transfer tokens from
    /// @param _to The address to which to transfer tokens to
    /// @param _value The amount of tokens to transfer from `_partition`
    /// @param _data Additional data attached to the transfer of tokens
    /// @param _operatorData Additional data attached to the transfer of tokens by the operator
    /// @return The partition to which the transferred tokens were allocated for the _to address
    function operatorTransferByPartition(
        bytes32 _partition,
        address _from,
        address _to,
        uint256 _value,
        bytes calldata _data,
        bytes calldata _operatorData
    ) external returns (bytes32) {
        IERC1410Extended(
            address(this)
        )
        .assertCanTransferFromByPartition(
            msg.sender,
            _from,
            _to,
            _partition,
            _value,
            _data
        );
        (
            byte transferByPartitionCode,
            bytes32 transferByPartitionReason
        ) = _transferByPartition(
            _from,
            _to,
            _value,
            _partition,
            _data,
            msg.sender,
            _operatorData
        );
        require(
            transferByPartitionCode == OK_CODE,
            transferByPartitionReason.toString()
        );
        return _partition;
    }

    /// @notice Increases totalSupply and the corresponding amount of the specified owners partition
    /// @param _partition The partition to allocate the increase in balance
    /// @param _tokenHolder The token holder whose balance should be increased
    /// @param _value The amount by which to increase the balance
    /// @param _data Additional data attached to the minting of tokens
    function issueByPartition(
        bytes32 _partition,
        address _tokenHolder,
        uint256 _value,
        bytes calldata _data
    ) external {
        _validateIssueByPartition(
            _partition,
            _tokenHolder,
            _value
        );
        _issueByPartition(
            _partition,
            _tokenHolder,
            _value,
            _data
        );
    }

    /// @notice Use to get the list of partitions `_tokenHolder` is associated with
    /// @param _tokenHolder An address corresponds whom partition list is queried
    /// @return List of partitions
    function partitionsOf(
        address _tokenHolder
    ) external view returns (bytes32[] memory) {
        bytes32[] memory partitionsList = new bytes32[](partitions[_tokenHolder].length);
        for (uint256 i = 0; i < partitions[_tokenHolder].length; i++) {
            partitionsList[i] = partitions[_tokenHolder][i].partition;
        }
        return partitionsList;
    }

    function canTransferByPartition(
        address _from,
        address _to,
        bytes32 _partition,
        uint256 _value,
        bytes memory _data
    ) public view returns (byte, bytes32, bytes32) {
        (
            byte canTransferCode,
            bytes32 canTransferReason
        ) = IERC1410Extended(
            address(this)
        )
        .canTransferFromByPartition(
            msg.sender,
            _from,
            _to,
            _partition,
            _value,
            _data
        );
        return (canTransferCode, canTransferReason, _partition);
    }

    /// @notice Counts the balance associated with a specific partition assigned to an tokenHolder
    /// @param _partition The partition for which to query the balance
    /// @param _tokenHolder An address for whom to query the balance
    /// @return The number of tokens owned by `_tokenHolder`
    /// with the metadata associated with `_partition`, possibly zero
    function balanceOfByPartition(
        bytes32 _partition,
        address _tokenHolder
    ) public view returns (uint256) {
        (
            byte partitionResultCode,
        ) = _validPartition(_partition, _tokenHolder);
        if (partitionResultCode == OK_CODE)
            return partitions[_tokenHolder][partitionToIndex[_tokenHolder][_partition] - 1].amount;
        else
            return 0;
    }

    /// @notice Determines whether `_operator` is an operator for all partitions of `_tokenHolder`
    /// @param _operator The operator to check
    /// @param _tokenHolder The token holder to check
    /// @return Whether the `_operator` is an operator for all partitions of `_tokenHolder`
    function isOperator(
        address _operator,
        address _tokenHolder
    ) public view returns (bool) {
        return approvals[_tokenHolder][_operator]
        || IERC1400Permissions(
            address(this)
        )
        .isRegistryOperator(_operator)
        || (
            IERC1644(address(this)).isControllable()
            && controller == _operator
        );
    }

    /// @notice Determines whether `_operator` is an operator for a specified partition of `_tokenHolder`
    /// @param _partition The partition to check
    /// @param _operator The operator to check
    /// @param _tokenHolder The token holder to check
    /// @return Whether the `_operator` is an operator for a specified partition of `_tokenHolder`
    function isOperatorForPartition(
        bytes32 _partition,
        address _operator,
        address _tokenHolder
    ) public view returns (bool) {
        return partitionApprovals[_tokenHolder][_partition][_operator] || isOperator(_operator, _tokenHolder);
    }

    function _transferByPartition(
        address _from,
        address _to,
        uint256 _value,
        bytes32 _partition,
        bytes memory _data,
        address _operator,
        bytes memory _operatorData
    ) internal returns (byte, bytes32) {
        _createPartitionForReceiver(_partition, _to);
        uint256 _fromIndex = partitionToIndex[_from][_partition] - 1;
        uint256 _toIndex = partitionToIndex[_to][_partition] - 1;

        // Changing the state values
        partitions[_from][_fromIndex].amount = partitions[_from][_fromIndex].amount.sub(_value);
        _balances[_from] = _balances[_from].sub(_value);
        partitions[_to][_toIndex].amount = partitions[_to][_toIndex].amount.add(_value);
        _balances[_to] = _balances[_to].add(_value);

        // Emit transfer event.
        emit TransferByPartition(
            _partition,
            _operator,
            _from,
            _to,
            _value,
            _data,
            _operatorData
        );
        return (OK_CODE, bytes32("Transfer success"));
    }

    function _validateIssueByPartition(
        bytes32 _partition,
        address _tokenHolder,
        uint256 _value
    ) internal view {
        (
            byte hasPermissionStatusCode,
            bytes32 hasPermissionReason
        ) = IERC1400Permissions(
            address(this)
        )
        .hasIssuePermissions(
            msg.sender,
            _tokenHolder
        );
        require(
            hasPermissionStatusCode == OK_CODE,
            hasPermissionReason.toString()
        );
        _validateParams(_partition, _value);
        require(
            _tokenHolder != address(0),
            "Invalid token receiver"
        );
    }

    function _issueByPartition(
        bytes32 _partition,
        address _tokenHolder,
        uint256 _value,
        bytes memory _data
    ) internal {
        uint256 index = partitionToIndex[_tokenHolder][_partition];
        if (index == 0) {
            partitions[_tokenHolder].push(Partition(_value, _partition));
            partitionToIndex[_tokenHolder][_partition] = partitions[_tokenHolder].length;
        } else {
            partitions[_tokenHolder][index - 1].amount = partitions[_tokenHolder][index - 1].amount.add(_value);
        }
        _totalSupply = _totalSupply.add(_value);
        _balances[_tokenHolder] = _balances[_tokenHolder].add(_value);

        emit IssuedByPartition(
            _partition,
            address(0),
            _tokenHolder,
            _value,
            _data,
            ""
        );
    }

    function _validPartition(
        bytes32 _partition,
        address _holder
    ) internal view returns (byte, bytes32) {
        if (
            partitions[_holder].length < partitionToIndex[_holder][_partition]
            || partitionToIndex[_holder][_partition] == 0
        )
            return (INVALID_PARTITION, bytes32("Partition not found"));
        else
            return (OK_CODE, _partition);
    }

    function _createPartitionForReceiver(
        bytes32 _partition,
        address _holder
    ) internal returns (byte, bytes32) {
        (
            byte partitionResultCode,
        ) = _validPartition(_partition, _holder);
        if (partitionResultCode == OK_CODE) { // Partition already exists, no need to create
            return (OK_CODE, _partition);
        }

        partitions[_holder].push(Partition(0, _partition));
        partitionToIndex[_holder][_partition] = partitions[_holder].length;
        return (OK_CODE, _partition);
    }

    function _redeemByPartition(
        bytes32 _partition,
        address _from,
        address _operator,
        uint256 _value,
        bytes memory _operatorData
    ) internal {
        _validateParams(_partition, _value);
        (
            byte partitionResultCode,
            bytes32 partitionResult
        ) = _validPartition(_partition, _from);
        require(
            partitionResultCode == OK_CODE,
            partitionResult.toString()
        );
        uint256 index = partitionToIndex[_from][_partition] - 1;
        require(
            partitions[_from][index].amount >= _value,
            "Insufficient value"
        );
        if (partitions[_from][index].amount == _value) {
            _deletePartitionForHolder(
                _from,
                _partition,
                index
            );
        } else {
            partitions[_from][index].amount = partitions[_from][index].amount.sub(_value);
        }
        _balances[_from] = _balances[_from].sub(_value);
        _totalSupply = _totalSupply.sub(_value);

        emit RedeemedByPartition(
            _partition,
            _operator,
            _from,
            _value,
            _operatorData
        );
    }

    function _deletePartitionForHolder(
        address _holder,
        bytes32 _partition,
        uint256 index
    ) internal {
        if (
            partitions[_holder].length.sub(1) != index
        ) {
            partitions[_holder][index] = partitions[_holder][partitions[_holder].length.sub(1)];
            partitionToIndex[_holder][partitions[_holder][index].partition] = index + 1;
        }
        delete partitionToIndex[_holder][_partition];
        partitions[_holder].length--;
    }

    function _validateParams(
        bytes32 _partition,
        uint256 _value
    ) internal pure {
        require(_value != uint256(0), "Zero value not allowed");
        require(_partition != bytes32(0), "Invalid partition");
    }
}
