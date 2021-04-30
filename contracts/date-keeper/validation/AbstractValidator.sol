pragma solidity 0.5.7;


contract AbstractValidator {
    enum ValidatorType {
        Weekly,
        Monthly,
        Quarterly,
        Fixed
    }

    function validateExpirationDate(
        uint256 expirationDate
    ) external view returns (bool);

    function validateLddDates(
        uint256 expirationDate,
        uint256 lddInvestEquity,
        uint256 lddInvestDebt,
        uint256 lddBorrow
    ) external view returns (bool);

    // solhint-disable-next-line func-name-mixedcase
    function VALIDATOR_TYPE() external view returns (ValidatorType);

    function getValidatorState() external view returns (bytes memory validatorState);
}
