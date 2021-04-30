pragma solidity 0.5.7;


contract RegistryMock {
    bool internal validContract = true;
    /**
    * This mode can be used to specify an array of valid
    * addresses. In this mode this contract would ignore
    * value of `validContract` and would instead check that
    * the passed address actually matches to at least one of
    * the preconfigured ones.
    */
    bool internal oneOfMode = false;

    mapping (address => bool) internal oneOfContracts;

    address public userValidator;
    address public tokenValidator;
    address public companyMapper;

    function setValidContract(bool _val) external {
        validContract = _val;
    }

    function setOneOfMode(bool _val) external {
        oneOfMode = _val;
    }

    function addOneOfContracts(
        address[] calldata addresses
    ) external {
        for (uint256 i = 0; i < addresses.length; i++) {
            oneOfContracts[addresses[i]] = true;
        }
    }

    function removeOneOfContracts(
        address[] calldata addresses
    ) external {
        for (uint256 i = 0; i < addresses.length; i++) {
            oneOfContracts[addresses[i]] = false;
        }
    }

    function setUserValidator(address _userValidator) external {
        userValidator = _userValidator;
    }

    function setTokenValidator(address _tokenValidator) external {
        tokenValidator = _tokenValidator;
    }

    function setCompanyMapper(address _companyMapper) external {
        companyMapper = _companyMapper;
    }

    function isValidContract(
        address _contract
    ) external view returns (bool) {
        return _isValidContract(_contract);
    }

    function isValidContractOrUtility(
        address _contract
    )
    public view returns (bool) {
        return _isValidContract(_contract);
    }

    function _isValidContract(
        address _contract
    ) internal view returns (bool) {
        require(_contract != address(0));
        if (oneOfMode) {
            return oneOfContracts[_contract];
        } else {
            return validContract;
        }
    }
}
