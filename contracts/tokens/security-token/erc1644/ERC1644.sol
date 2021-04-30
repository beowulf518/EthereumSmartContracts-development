pragma solidity 0.5.7;

import "../erc1400/ERC1400Storage.sol";
import "./IERC1644.sol";
import "../erc1410/IERC1410Extended.sol";
import "../../../delegate/Delegator.sol";
import "../erc1400/ERC1400ErrorCodes.sol";
import "../RequireStrings.sol";
import "../erc1400/ERC1400GovernorOnly.sol";


contract ERC1644 is
    ERC1400Storage,
    ERC1400ErrorCodes,
    Delegator,
    ERC1400GovernorOnly,
    IERC1644 {

    using RequireStrings for bytes32;

    function controllerTransfer(
        address _from,
        address _to,
        uint256 _value,
        bytes calldata _data,
        bytes calldata _operatorData
    ) external onlyRouterAccess {
        require(controllable, "Token is not controllable");
        require(msg.sender == controller, "Controller only");
        bytes32 partition = IERC1410Extended(
            address(this)
        )
        .assertRequireSinglePartitionWithDataForHolder(_from, _data);

        delegate(
            address(this),
            abi.encodeWithSignature(
                "operatorTransferByPartition(bytes32,address,address,uint256,bytes,bytes)",
                partition,
                _from,
                _to,
                _value,
                _data,
                _operatorData
            ),
            "Controller transfer failed"
        );

        emit ControllerTransfer(
            msg.sender,
            _from,
            _to,
            _value,
            _data,
            _operatorData
        );
    }

    function controllerRedeem(
        address _tokenHolder,
        uint256 _value,
        bytes calldata _data,
        bytes calldata _operatorData
    ) external onlyRouterAccess {
        require(msg.sender == controller, "Controller only");
        require(controllable, "Token is not controllable");
        bytes32 partition = IERC1410Extended(
            address(this)
        )
        .assertRequireSinglePartitionWithDataForHolder(_tokenHolder, _data);

        delegate(
            address(this),
            abi.encodeWithSignature(
                "operatorRedeemByPartition(bytes32,address,uint256,bytes)",
                partition,
                _tokenHolder,
                _value,
                _operatorData
            ),
            "Controller redeem failed"
        );

        emit ControllerRedemption(
            msg.sender,
            _tokenHolder,
            _value,
            _data,
            _operatorData
        );
    }

    function setControllable(bool _controllable) external onlyGovernor {
        controllable = _controllable;
    }

    function isControllable() external view returns (bool) {
        return controllable;
    }
}
