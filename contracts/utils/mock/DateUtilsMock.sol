pragma solidity 0.5.7;

import "../DateUtils.sol";


contract DateUtilsMock {

    function isValidDate(uint year, uint month, uint day) external pure returns (bool) {
        return DateUtils.isValidDate(year, month, day);
    }

    function isValidDateTime(
        uint year,
        uint month,
        uint day,
        uint hour,
        uint minute,
        uint second
    ) external pure returns (bool) {
        return DateUtils.isValidDateTime(
            year,
            month,
            day,
            hour,
            minute,
            second
        );
    }
    // not used currently, but potentially will be used for Bank.
    // function isLeapYear(uint timestamp) external pure returns (bool) {
    //     return DateUtils.isLeapYear(timestamp);
    // }

    function getDaysInMonth(uint timestamp) external pure returns (uint) {
        return DateUtils.getDaysInMonth(timestamp);
    }

    function getWeekdayOfTheMonth(
        uint256 timestamp,
        uint256 weekDayNumOfMonth,
        uint256 validWeekday,
        bool fromEnd
    ) external pure returns (uint256) {
        return DateUtils.getWeekdayOfTheMonth(
            timestamp,
            weekDayNumOfMonth,
            validWeekday,
            fromEnd
        );
    }
}
