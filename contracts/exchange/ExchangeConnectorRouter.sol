pragma solidity 0.5.7;

import "../delegate/Resolver.sol";
import "../delegate/Router.sol";
import "../delegate/Delegator.sol";


contract ExchangeConnectorRouter is Router, Delegator {
    string public constant INIT_SIG = "init(address,address)";

    constructor(
        address kyberNetworkContractAddress,
        address _roleManager,
        address _tokenManager,
        address _resolver
    ) public {
        initRouter(
            _resolver,
            _roleManager
        );

        bytes4 initSig = bytes4(
            keccak256(
                bytes(INIT_SIG)
            )
        );
        address initialiser = Resolver(_resolver).lookup(initSig);

        bytes memory args = abi.encodeWithSignature(
            INIT_SIG,
            kyberNetworkContractAddress,
            _tokenManager
        );

        delegate(
            initialiser,
            args,
            "delegatecall() failed in ExchangeConnectorRouter.constructor"
        );
    }
}
