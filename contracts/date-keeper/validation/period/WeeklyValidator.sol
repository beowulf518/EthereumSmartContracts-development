pragma solidity 0.5.7;

import "../../../utils/DateUtils.sol";
import "./PeriodValidator.sol";


contract WeeklyValidator is PeriodValidator {
    using DateUtils for uint;

    ValidatorType public constant VALIDATOR_TYPE = ValidatorType.Weekly;

    constructor(
        address roleManager,
        uint256 _initialTimestamp,
        uint256 _periodInTheFutureEnabled,
        uint256 _minIntervalSinceDeployment,
        uint256 _periodIntervalStart,
        uint256 _periodIntervalEnd
    ) public PeriodValidator(
        roleManager,
        _initialTimestamp,
        _periodInTheFutureEnabled,
        _minIntervalSinceDeployment,
        _periodIntervalStart,
        _periodIntervalEnd
    ) {} //solhint-disable-line no-empty-blocks

    function getValidatorState() external view returns (
        bytes memory
    ) {
        // 6 vars * 32 bytes each
        bytes memory validatorState = new bytes(192);

        assembly {
            mstore(add(validatorState, 0x20), sload(validHour_slot))
            mstore(add(validatorState, 0x40), sload(validWeekday_slot))
            mstore(add(validatorState, 0x60), sload(periodInTheFutureEnabled_slot))
            mstore(add(validatorState, 0x80), sload(minIntervalSinceDeployment_slot))
            mstore(add(validatorState, 0xa0), sload(periodIntervalStart_slot))
            mstore(add(validatorState, 0xc0), sload(periodIntervalEnd_slot))
        }

        return validatorState;
    }

    function validateExpirationDate(uint256 expirationDate) public view returns (bool) {
        if (!DateUtils.isFullHour(expirationDate)) {
            return false;
        }
        uint validExpirationDate =
        getNextValidExpirationDateWithFullHours(
            now.add(minIntervalSinceDeployment)
        );
        if (now.add(minIntervalSinceDeployment) > validExpirationDate) {
            validExpirationDate = DateUtils.addDays(validExpirationDate, 7);
        }

        for (uint256 i = 0; i < periodInTheFutureEnabled; i++) {
            if (DateUtils.isSameDayAndHour(expirationDate, validExpirationDate)) {
                return true;
            }
            validExpirationDate = getNextValidExpirationDateWithFullHours(
                DateUtils.addDays(validExpirationDate, 7)
            );
        }

        return false;
    }

    function getNextValidExpirationDateWithFullHours(
        uint256 getMonthFromTimestamp
    ) internal view returns (uint256 validDate) {
        validDate = DateUtils.getWeekdayForTheWeek(
            getMonthFromTimestamp,
            validWeekday
        );
        validDate = DateUtils.setFullHour(validDate, validHour);
    }
}
