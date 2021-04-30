pragma solidity 0.5.7;

import "./Resolver.sol";
import "../access/RoleAware.sol";


/**
 * @title Router
 * @dev Contracts that extend Router contract serves as data storage. Router delegates
        all calls based on mapping found in Resolver. All calls are executed in context
        of calling router.
 */
contract Router is RoleAware {
    Resolver public resolver;

    /**
     * @dev Default fallback functions that intercepts all calls. Method signature found
            in resolver is used to get address of contract to call. Next `delegatecall` is
            executed to call resolved contract address.
     */
    // solhint-disable-next-line no-complex-fallback
    function() external payable {
        if (msg.sig == 0x0) {
            return;
        }

        // Get routing information for the called function
        address destination = resolver.lookup(msg.sig);

        // Make the call
        assembly {
            calldatacopy(mload(0x40), 0, calldatasize)
            let size := extcodesize(destination)
            if iszero(size) { revert(0, 0) }
            let result := delegatecall(gas, destination, mload(0x40), calldatasize, mload(0x40), 0)
            returndatacopy(mload(0x40), 0, returndatasize)
            switch result
            case 1 { return(mload(0x40), returndatasize) }
            default { revert(mload(0x40), returndatasize) }
        }
    }

    /**
     * @dev Setting Resolver contract used for routing calls
       @param _resolver address of Resolver contract to be set for Router
     */
    function setResolver(address _resolver) public onlyGovernor {
        resolver = Resolver(_resolver);
    }

    /**
     * @dev Router initialization function that sets resolver and governance role
       @param _resolver address of Resolver contract to be set for Router
     */
    function initRouter(
        address _resolver,
        address _roleManager
    ) internal {
        require(_resolver != address(0));
        resolver = Resolver(_resolver);
        setRoleManager(_roleManager);
    }
}
