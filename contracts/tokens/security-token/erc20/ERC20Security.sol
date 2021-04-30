pragma solidity 0.5.7;

import "./IERC20SecurityBasic.sol";
import "../erc1400/ERC1400Storage.sol";
import "../erc1410/IERC1410Extended.sol";
import "../../../delegate/Delegator.sol";


contract ERC20Security is
    ERC1400Storage,
    Delegator,
    IERC20SecurityBasic {

    constructor() public {
        isImplementationContract = true;
    }

    function transfer(
        address _to,
        uint256 _value
    ) public onlyRouterAccess returns (bool success) {
        bytes32 partition = IERC1410Extended(
            address(this)
        )
        .assertRequireSinglePartitionForHolder(msg.sender);
        delegate(
            address(this),
            abi.encodeWithSignature(
                "transferByPartition(bytes32,address,uint256,bytes)",
                partition,
                _to,
                _value,
                ""
            ),
            "Transfer failed"
        );

        success = true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public onlyRouterAccess returns (bool success) {
        bytes32 partition = IERC1410Extended(
            address(this)
        )
        .assertRequireSinglePartitionForHolder(_from);
        delegate(
            address(this),
            abi.encodeWithSignature(
                "operatorTransferByPartition(bytes32,address,address,uint256,bytes,bytes)",
                partition,
                _from,
                _to,
                _value,
                "",
                ""
            ),
            "Operator transfer failed"
        );

        success = true;
    }

    function approve(
        address _spender,
        uint256 _value
    ) public onlyRouterAccess returns (bool success) {
        require(_value >= 0);
        delegate(
            address(this),
            abi.encodeWithSignature(
                "authorizeOperator(address)",
                _spender
            ),
            "Approve failed"
        );

        success = true;
    }

    function allowance(
        address _owner,
        address _spender
    ) public view returns (uint256 remaining) {
        require(_owner != address(0));
        require(_spender != address(0));
        remaining = 0;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return _balances[_owner];
    }
}