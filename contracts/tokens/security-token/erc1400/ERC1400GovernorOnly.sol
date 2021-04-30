pragma solidity 0.5.7;

import "../erc1400/IERC1400Permissions.sol";


contract ERC1400GovernorOnly {
    modifier onlyGovernor() {
        require(
            IERC1400Permissions(
                address(this)
            ).isGovernor(msg.sender),
            "Only governor can set controller"
        );
        _;
    }
}