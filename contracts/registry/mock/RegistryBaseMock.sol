pragma solidity 0.5.7;


contract RegistryBaseMock {
    bool internal isValid = true;

    function setIsValid(bool _val) external {
        isValid = _val;
    }

    function isValidContract(
        address _contract
    ) external view returns (bool) {
        require(_contract != address(0));
        return isValid;
    }

    function isValidContractOrUtility(
        address _contract
    ) external view returns (bool) {
        require(_contract != address(0));
        return isValid;
    }
}