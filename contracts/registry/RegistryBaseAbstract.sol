pragma solidity 0.5.7;


contract RegistryBaseAbstract {
    function setEventEmitter(
        address _eventEmitter
    ) external;

    function setTokenManager(
        address _tokenManager
    ) external;

    function setExchangeConnector(
        address _exchangeConnector
    ) external;

    function setResolver(
        address _resolver
    ) external;

    function setDateKeeper(
        address _dateKeeper
    ) external;

    function isValidContract(
        address _contract
    )
    external view returns (bool);

    function dateKeeper() external view returns (address);
    function tokenValidator() external view returns (address);
    function userValidator() external view returns (address);

    function isValidContractOrUtility(
        address _contract
    )
    public view returns (bool);

    function getContractByIdx(
        uint256 idx
    ) public view returns (address);
}
