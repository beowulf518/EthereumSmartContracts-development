pragma solidity 0.5.7;

import "./TokenManagerBase.sol";
import "./TokenManagerAdminInterface.sol";
import "./TokenManagerAssetsInterface.sol";


// solhint-disable-next-line no-empty-blocks
contract TokenManagerMainInterface is
    TokenManagerBase,
    TokenManagerAdminInterface,
    TokenManagerAssetsInterface {}
