pragma solidity 0.5.7;

import "../../delegate/Router.sol";


/**
 * @title TokenManagerRouter
 * @dev Router that redirects calls to concrete TokenManager contract based on
        resolver signature to address mapping
 */
contract TokenManagerRouter is Router {

    /**
     * @dev Constructor to create new Router contract. RoleManager and Resolver is
            needed to set role access and resolves address of called signature.
       @param _roleManager RoleManager contract address
       @param _resolver Resolver contract address
     */
    constructor(
        address _roleManager,
        address _resolver
    ) public {
        initRouter(
            _resolver,
            _roleManager
        );
    }
}
