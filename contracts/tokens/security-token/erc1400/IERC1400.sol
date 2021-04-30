pragma solidity 0.5.7;

import "../erc20/IERC20Security.sol";
import "../erc1410/IERC1410.sol";
import "../erc1594/IERC1594.sol";
import "../erc1644/IERC1644.sol";
import "../erc1410/IERC1410Extended.sol";
import "../erc1400/IERC1400Permissions.sol";


// Interface for ERC1400 token
// solhint-disable-next-line no-empty-blocks
contract IERC1400 is
    IERC20Security,
    IERC1410,
    IERC1594,
    IERC1644,
    IERC1410Extended,
    IERC1400Permissions {
}
