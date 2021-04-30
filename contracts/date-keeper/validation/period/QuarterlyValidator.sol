pragma solidity 0.5.7;

import "../../../utils/DateUtils.sol";
import "./PeriodValidator.sol";


contract QuarterlyValidator is PeriodValidator {
    using DateUtils for uint;

    ValidatorType public constant VALIDATOR_TYPE = ValidatorType.Quarterly;

    bool public weekDayNumFromEnd;
    uint256 public weekDayNumOfMonth; // 1st, 2nd, 3rd, 4nd, 5nd friday of the month
    // not every month has 5 fridays, so 5nd is treated as last friday of the month

    constructor(
        address roleManager,
        uint256 _initialTimestamp,
        uint256 _periodInTheFutureEnabled,
        uint256 _minIntervalSinceDeployment,
        uint256 _periodIntervalStart,
        uint256 _periodIntervalEnd,
        uint256 _weekDayNumOfMonth,
        bool _weekDayNumFromEnd
    ) public PeriodValidator(
        roleManager,
        _initialTimestamp,
        _periodInTheFutureEnabled,
        _minIntervalSinceDeployment,
        _periodIntervalStart,
        _periodIntervalEnd
    ) {
        require(
            _weekDayNumOfMonth >= 1
            && _weekDayNumOfMonth <= 5,
            "Only 1,2,3,4,5 values allowed for weekday of the month"
        );
        weekDayNumOfMonth = _weekDayNumOfMonth;
        weekDayNumFromEnd = _weekDayNumFromEnd;
    }

    function getValidatorState() external view returns (
        bytes memory
    ) {
        // 8 vars * 32 bytes each
        bytes memory validatorState = new bytes(256);

        assembly {
            mstore(add(validatorState, 0x20), sload(validHour_slot))
            mstore(add(validatorState, 0x40), sload(validWeekday_slot))
            mstore(add(validatorState, 0x60), sload(periodInTheFutureEnabled_slot))
            mstore(add(validatorState, 0x80), sload(minIntervalSinceDeployment_slot))
            mstore(add(validatorState, 0xa0), sload(periodIntervalStart_slot))
            mstore(add(validatorState, 0xc0), sload(periodIntervalEnd_slot))
            mstore(add(validatorState, 0xe0), sload(weekDayNumFromEnd_slot))
            mstore(add(validatorState, 0x100), sload(weekDayNumOfMonth_slot))
        }

        return validatorState;
    }

    function validateExpirationDate(uint256 expirationDate) public view returns (bool) {
        bool isModuloValid = DateUtils.isFullHour(expirationDate);
        if (!isModuloValid) {
            return false;
        }
        uint validExpirationDate = getNextValidExpirationDateWithFullHours(now.add(minIntervalSinceDeployment));
        if (validExpirationDate < now.add(minIntervalSinceDeployment)) {
            validExpirationDate = getNextValidExpirationDateWithFullHours(
                DateUtils.addMonths(validExpirationDate, 3)
            );
        }

        for (uint256 i = 0; i < periodInTheFutureEnabled; i++) {
            if (DateUtils.isSameDayAndHour(expirationDate, validExpirationDate)) {
                return true;
            }
            validExpirationDate = DateUtils.addMonths(validExpirationDate, 3);
            validExpirationDate = getNextValidExpirationDateWithFullHours(
                validExpirationDate
            );
        }

        return false;
    }

    function getNextValidExpirationDateWithFullHours(
        uint256 getMonthFromTimestamp
    ) internal view returns (uint256 validDate) {
        (uint year, , uint day) = DateUtils.timestampToDate(getMonthFromTimestamp);
        uint quarterMonth = DateUtils.getQuarterForMonth(getMonthFromTimestamp);
        validDate = DateUtils.timestampFromDate(year, quarterMonth, day);
        validDate = DateUtils.getWeekdayOfTheMonth(
            validDate,
            weekDayNumOfMonth,
            validWeekday,
            weekDayNumFromEnd
        );
        validDate = DateUtils.setFullHour(validDate, validHour);
    }
}
