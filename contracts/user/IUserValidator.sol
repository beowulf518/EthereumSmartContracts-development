pragma solidity 0.5.7;

import "../access/IRoleManager.sol";


contract IUserValidator is IRoleManager {
    function setIsEnabled(bool _isEnabled) external;
}