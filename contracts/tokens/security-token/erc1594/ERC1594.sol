pragma solidity 0.5.7;

import "../erc1400/ERC1400Storage.sol";
import "./IERC1594.sol";
import "../erc20/IERC20Security.sol";
import "../erc1410/IERC1410Extended.sol";
import "../erc1400/ERC1400ErrorCodes.sol";
import "../../../delegate/Delegator.sol";


contract ERC1594 is
    ERC1400Storage,
    ERC1400ErrorCodes,
    Delegator,
    IERC1594 {
    // Not supporting data parameter for now
    function transferWithData(
        address _to,
        uint256 _value,
        bytes calldata _data
    ) external returns (bool) {
        require(_data.length >= 0);
        delegate(
            address(this),
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                _to,
                _value
            ),
            "Transfer with data failed"
        );

        return true;
    }

    // Not supporting data parameter for now
    function transferFromWithData(
        address _from,
        address _to,
        uint256 _value,
        bytes calldata _data
    ) external returns (bool) {
        require(_data.length >= 0);
        delegate(
            address(this),
            abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                _from,
                _to,
                _value
            ),
            "TransferFrom with data failed"
        );

        return true;
    }

    // This function is token implementation specific so no default implementation provided
    function issue(
        address _tokenHolder,
        uint256 _value,
        bytes calldata _data
    ) external {
        require(_tokenHolder != address(0));
        require(_value >= 0);
        require(_data.length >= 0);
        revert("Method not implemented");
    }

    // This function is not implemented as it can mistakenly cause msg.sender to burn his token
    // he did not intend to burn.
    function redeem(
        uint256 _value,
        bytes calldata _data
    ) external {
        require(_value >= 0);
        require(_data.length >= 0);
        revert("Method not implemented");
    }

    function redeemFrom(
        address _tokenHolder,
        uint256 _value,
        bytes calldata _data
    ) external {
        require(_tokenHolder != address(0));
        require(_value >= 0);
        require(_data.length >= 0);
        revert("Method not implemented");
    }

    function isIssuable() external view returns (bool) {
        return issuance;
    }

    function canTransfer(
        address _to,
        uint256 _value,
        bytes calldata _data
    ) external view returns (byte, bytes32) {
        return _canTransferFrom(msg.sender, _to, _value, _data);
    }

    function canTransferFrom(
        address _from,
        address _to,
        uint256 _value,
        bytes calldata _data
    ) external view returns (byte, bytes32) {
        return _canTransferFrom(_from, _to, _value, _data);
    }

    function _canTransferFrom(
        address _from,
        address _to,
        uint256 _value,
        bytes memory _data
    ) internal view returns (byte, bytes32) {
        (
            byte partitionRequestCode,
            bytes32 partitionOrError
        ) = IERC1410Extended(
            address(this)
        )
        .assertSinglePartitionForHolder(_from);
        if (partitionRequestCode == OK_CODE) {
            return IERC1410Extended(
                address(this)
            )
            .canTransferFromByPartition(
                msg.sender,
                _from,
                _to,
                partitionOrError,
                _value,
                _data
            );
        } else {
            return (
                partitionRequestCode,
                partitionOrError
            );
        }
    }
}
