pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../delegate/Resolvable.sol";
import "../access/RoleAware.sol";
import "../registry/RegistryBaseAbstract.sol";


/**
 * @title RegistryBase
 * @dev Contract is used to registered contracts used in our systems.
        Some methods can be only called by registered contracts.
        It prevents unwanted external method call by third party client
 */
contract RegistryBase is Resolvable, RoleAware, RegistryBaseAbstract {
    using SafeMath for uint256;

    address public exchangeConnector;
    address public tokenManager;
    address public eventEmitter;
    address public dateKeeper;
    address public userValidator;
    address public tokenValidator;
    address public companyMapper;

    struct ContractStorage {
        uint256 length;
        mapping (uint256 => address) _contractsByIdx;
        mapping (address => bool) _contractsByAddress;
    }

    ContractStorage internal contractStorage;

    /**
     * @dev Constructor that sets resolver used in Registry
       @param _resolver address of Resolver contract to be set in
     */
    constructor(
        address _resolver,
        address _exchangeConnector,
        address _tokenManager,
        address _dateKeeper,
        address _userValidator,
        address _tokenValidator,
        address _companyMapper
    ) public {
        require(_resolver != address(0),
        "Zero address passed as _resolver to RegistryBase");
        require(_exchangeConnector != address(0),
        "Zero address passed as _exchangeConnector to RegistryBase");
        require(_tokenManager != address(0),
        "Zero address passed as _tokenManager to RegistryBase");
        require(_dateKeeper != address(0),
        "Zero address passed as _dateKeeper to RegistryBase");
        require(_userValidator != address(0), "User validator address is not set");
        require(
            _tokenValidator != address(0),
            "Zero address passed as _tokenValidator to RegistryBase"
        );
        require(_companyMapper != address(0), "Company mapper address is not set");
        resolver = Resolver(_resolver);
        exchangeConnector = _exchangeConnector;
        tokenManager = _tokenManager;
        tokenValidator = _tokenValidator;
        dateKeeper = _dateKeeper;
        userValidator = _userValidator;
        companyMapper = _companyMapper;
    }

    /**
    @dev    Registers `EventEmitter` contract by assigning it's address
            to the `eventEmitter` variable.
            Only `governor` can call this function.
    @param  _eventEmitter - address of a `EventEmitter` contract to be set.
    */
    function setEventEmitter(
        address _eventEmitter
    ) external onlyGovernor {
        require(_eventEmitter != address(0));
        eventEmitter = _eventEmitter;
    }

    /**
    @dev    Registers `TokenManager` contract by assigning it's address
            to the `tokenManager` variable.
            Only `governor` can call this function.
    @param  _tokenManager - address of a `TokenManager` contract to be set.
    */
    function setTokenManager(
        address _tokenManager
    ) external onlyGovernor {
        require(_tokenManager != address(0));
        tokenManager = _tokenManager;
    }

    /**
    @dev    Registers `ExchangeConnector` contract by assigning it's address
            to the `exchangeConnector` variable.
            Only `governor` can call this function.
    @param  _exchangeConnector - address of an `ExchangeConnector` contract to be set.
    */
    function setExchangeConnector(
        address _exchangeConnector
    ) external onlyGovernor {
        require(_exchangeConnector != address(0));
        exchangeConnector = _exchangeConnector;
    }

    /**
     * @dev Setting Resolver contract
       @param _resolver address of Resolver contract to be set in
     */
    function setResolver(
        address _resolver
    ) external onlyGovernor {
        require(_resolver != address(0));
        resolver = Resolver(_resolver);
    }

    /**
    * @dev Setting TokenValidator contract
      @param _tokenValidator address of TokenValidator contract to be set in
    */
    function setTokenValidator(
    address _tokenValidator
    ) external onlyGovernor {
        require(_tokenValidator != address(0), "TokenValidator address cannot be empty");
        tokenValidator = _tokenValidator;
    }

    /**
    @dev    Registers `DateKeeper` contract by assigning it's address
            to the `dateKeeper` variable.
            Only `owner` can call this function.
    @param  _dateKeeper - address of a `DateKeeper` contract to be set.
    */
    function setDateKeeper(
        address _dateKeeper
    ) external onlyGovernor {
        require(_dateKeeper != address(0));
        dateKeeper = _dateKeeper;
    }

    function setUserValidator(
        address _userValidator
    ) external onlyGovernor {
        require(_userValidator != address(0));
        userValidator = _userValidator;
    }

    function setCompanyMapper(address _companyMapper) external onlyGovernor {
        require(_companyMapper != address(0), "Company mapper address cannot be empty");
        companyMapper = _companyMapper;
    }

    /**
     * @dev View that checks if contract has been previously registered in Registry
     */
    function isValidContract(
        address _contract
    )
    external
    view
    returns (bool) {
        return _isValidContract(_contract);
    }

    function isValidContractOrUtility(
        address _contract
    )
    public
    view
    returns (bool) {
        return _isValidContract(_contract);
    }

    /**
     * @dev View that returns amount of registered contracts
     */
    function contractsLength() public view returns (uint256) {
        return contractStorage.length;
    }

    /**
     * @dev Returning registered contract by idx
       @param idx address of registered contract
     */
    function getContractByIdx(
        uint256 idx
    ) public view returns (address) {
        require(
            contractsLength() > idx,
            "Passed index doesn't exist"
        );
        return contractStorage._contractsByIdx[idx];
    }

    /**
     * @dev Adding new contract to list of registered contracts
       @param contractToVerify address of contract to verify
     */
    function verify(address contractToVerify) internal returns (bool) {
        contractStorage._contractsByAddress[contractToVerify] = true;
        contractStorage._contractsByIdx[contractStorage.length] = contractToVerify;
        contractStorage.length = contractStorage.length.add(1);

        return true;
    }

    function _isValidContract(
        address _contract
    )
    internal
    view
    returns (bool) {
        return contractStorage._contractsByAddress[_contract];
    }
}
