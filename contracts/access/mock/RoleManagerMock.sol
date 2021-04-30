pragma solidity 0.5.7;

import "../RoleManager.sol";


contract RoleManagerMock is RoleManager {
    function appointGovernor(address governor) external onlyRole(GOVERNOR_ROLE_NAME) {
        addRole(governor, GOVERNOR_ROLE_NAME);
    }
}
