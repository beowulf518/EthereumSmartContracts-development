pragma solidity 0.5.7;

import "../erc1410/ERC1410Storage.sol";
import "../erc20/ERC20SecurityStorage.sol";
import "../erc1594/ERC1594Storage.sol";
import "../erc1644/ERC1644Storage.sol";
import "./ERC1400PermissionsStorage.sol";
import "./ERC1400RoleAwareStorage.sol";
import "../../../delegate/Resolvable.sol";


// solhint-disable-next-line no-empty-blocks
contract ERC1400Storage is
    ERC1400RoleAwareStorage,
    Resolvable,
    ERC20SecurityStorage,
    ERC1410Storage,
    ERC1594Storage,
    ERC1644Storage,
    ERC1400PermissionsStorage {
}