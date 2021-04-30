pragma solidity 0.5.7;


contract DateKeeperAbstract {
    function validate(
        uint256[4] calldata validationParams
    ) external view returns (bool);

    function validateExpirationDate(
        uint256 expirationDate
    ) public view returns (bool);
}
