pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../AbstractValidator.sol";
import "../../../utils/DateUtils.sol";
import "../../../access/RoleAware.sol";


contract FixedValidator is AbstractValidator, RoleAware {
    using SafeMath for uint256;
    using DateUtils for uint;

    ValidatorType public constant VALIDATOR_TYPE = ValidatorType.Fixed;

    struct FixedDates {
        uint256 length;
        uint256 startIdxPointer;
        mapping (uint256 => uint256) datesByIdx;
        mapping (uint256 => bool) datesByDate;
        mapping (uint256 => uint256) intervalStartsByDate;
        mapping (uint256 => uint256) intervalEndByDate;
    }

    FixedDates internal fixedDates;

    constructor(
        address roleManager,
        uint256[] memory dates,
        uint256[] memory datesIntervalStarts,
        uint256[] memory datesIntervalEnds
    ) public {
        setRoleManager(roleManager);
        addDatesToEnd(dates, datesIntervalStarts, datesIntervalEnds);
    }

    function getValidatorState() external view returns (
        bytes memory
    // solhint-disable-next-line function-max-lines
    ) {
        (
            uint256[] memory dates,
            uint256[] memory datesIntervalStarts,
            uint256[] memory datesIntervalEnds
        ) = getFixedDates();

        uint256 totalLength;
        assembly {
            totalLength := mul(mul(mload(dates), 3), 32)
        }

        bytes memory validatorState = new bytes(totalLength);

        for (uint256 i = 0; i <= dates.length; i++) {
            assembly {
                let offset := mul(mul(i, 32), 3)
                let validatorPtr := add(add(validatorState, 0x20), offset)
                let arrOffset := add(mul(i, 32), 32)
                mstore(validatorPtr, mload(add(arrOffset, dates)))
                mstore(add(validatorPtr, 32), mload(add(arrOffset, datesIntervalStarts)))
                mstore(add(validatorPtr, 64), mload(add(arrOffset, datesIntervalEnds)))
            }
        }

        return validatorState;
    }

    function validateExpirationDate(
        uint256 expirationDate
    ) external view returns (bool) {
        return fixedDates.datesByDate[expirationDate] == true && expirationDate <= now;
    }

    function validateLddDates(
        uint256 expirationDate,
        uint256 lddInvestEquity,
        uint256 lddInvestDebt,
        uint256 lddBorrow
    ) external view returns (bool) {
        return validateLddDate(expirationDate, lddInvestEquity)
            && validateLddDate(expirationDate, lddInvestDebt)
            && validateLddDate(expirationDate, lddBorrow);
    }

    /**
    @dev replaceDates - serves to add/remove/replace fixedDates configuration for
    Bank Protocol.
    @param _toAddDates - array of timestamps to be added as fixed dates. Please note
    that we support adding dates such that they are in the future compared to the
    last date that has been added for consistency purposes. Attempt to add date that is
    before one of the dates that is already in the contract state would revert. This
    array can be empty if only date removal is needed.
    @param _toAddDatesIntervalStarts - array of intervals in seconds from the moment
    of bank deployment to the minimum ldd required upon bank creation (lower bounds).
    Every LDD would need to be higher then this lower bound which gets measured relative
    to bank deployment timestamp. This array indexes correspond to `_toAddDates` indexes.
    Every timestamp in `_toAddDates` would have related interval start and end in
    `_toAddDatesIntervalStarts` and `_toAddDatesIntervalEnds` accordingly.
    @param _toAddDatesIntervalEnds - array of intervals in seconds from the moment
    of bank deployment to the maximum ldd required upon bank creation (higher bounds).
    Every LDD would need to be lower then this higher bound which gets measured relative
    to bank deployment timestamp. This array indexes correspond to `_toAddDates` indexes.
    Every timestamp in `_toAddDates` would have related interval start and end in
    `_toAddDatesIntervalStarts` and `_toAddDatesIntervalEnds` accordingly.
    @param _toRemoveDates - array of timestamps that would need to get removed. This
    array must be sorted from lowest to highest and the function would revert otherwise.
    This array can be empty if only addition is needed.
    */
    function replaceDates(
        uint256[] memory _toAddDates,
        uint256[] memory _toAddDatesIntervalStarts,
        uint256[] memory _toAddDatesIntervalEnds,
        uint256[] memory _toRemoveDates
    ) public onlyGovernor {
        addDatesToEnd(
            _toAddDates,
            _toAddDatesIntervalStarts,
            _toAddDatesIntervalEnds
        );
        removeDatesFromStart(_toRemoveDates);
    }

    /**
     * @dev View that returns contract dates properties
     */
    function getFixedDates()
    public
    view
    returns (
        uint256[] memory dates,
        uint256[] memory datesIntervalStarts,
        uint256[] memory datesIntervalEnds
    ) {
        uint256 arrLen = fixedDates.length
        .sub(fixedDates.startIdxPointer);
        dates = new uint256[](arrLen);
        datesIntervalStarts = new uint256[](arrLen);
        datesIntervalEnds = new uint256[](arrLen);
        for (uint256 idx = fixedDates.startIdxPointer; idx < fixedDates.length; idx++) {
            uint256 realIdx = idx
            .sub(fixedDates.startIdxPointer);
            dates[realIdx] = fixedDates.datesByIdx[idx];
            datesIntervalStarts[realIdx] = fixedDates.intervalStartsByDate[dates[realIdx]];
            datesIntervalEnds[realIdx] = fixedDates.intervalEndByDate[dates[realIdx]];
        }
    }

    /**
     * @dev Function add dates to the end of contract dates and sets dates
            intervals start and end properties.
       @param _dates array of dates to add at the end
       @param _datesIntervalStarts array of interval start dates
       @param _datesIntervalEnds array of interval end dates
     */
    function addDatesToEnd(
        uint256[] memory _dates,
        uint256[] memory _datesIntervalStarts,
        uint256[] memory _datesIntervalEnds
    ) internal {
        require(
            _dates.length == _datesIntervalStarts.length
            && _datesIntervalStarts.length == _datesIntervalEnds.length
        );
        if (_dates.length > 0) {

            if (fixedDates.length != 0) {
                require(
                    fixedDates.datesByIdx[fixedDates.length - 1] < _dates[0]
                );
            }

            for (uint256 dateIdx = 0; dateIdx < _dates.length; dateIdx++) {
                if (dateIdx != 0) {
                    require(
                        fixedDates.datesByIdx[dateIdx + fixedDates.length - 1] < _dates[dateIdx]
                    );
                }
                fixedDates.datesByDate[_dates[dateIdx]] = true;
                fixedDates.datesByIdx[dateIdx + fixedDates.length] = _dates[dateIdx];
                fixedDates.intervalStartsByDate[_dates[dateIdx]] = _datesIntervalStarts[dateIdx];
                fixedDates.intervalEndByDate[_dates[dateIdx]] = _datesIntervalEnds[dateIdx];

            }
            fixedDates.length = fixedDates.length + _dates.length;
        }
    }

    /**
     * @dev Function removed specified date from DateKeeper contract
       @param _dates array of dates to be removed
     */
    function removeDatesFromStart(
        uint256[] memory _dates
    ) internal {
        if (_dates.length > 0) {
            for (uint256 dateIdx = 0; dateIdx < _dates.length; dateIdx++) {
                require(
                    fixedDates.datesByDate[_dates[dateIdx]] == true
                );
                fixedDates.datesByDate[_dates[dateIdx]] = false;
                fixedDates.intervalStartsByDate[_dates[dateIdx]] = 0;
                fixedDates.intervalEndByDate[_dates[dateIdx]] = 0;
                require(
                    fixedDates.datesByIdx[dateIdx + fixedDates.startIdxPointer] == _dates[dateIdx]
                );
                fixedDates.datesByIdx[dateIdx + fixedDates.startIdxPointer] = 0;
            }
            fixedDates.startIdxPointer = fixedDates.startIdxPointer + _dates.length;
        }
    }

    function validateLddDate(uint256 expirationDate, uint256 lddDate) internal view returns (bool isValid) {
        isValid = DateUtils.isFullHour(lddDate);
        isValid = isValid && lddDate > now;
        isValid = isValid && fixedDates.intervalStartsByDate[expirationDate] < lddDate.sub(now);
        isValid = isValid && fixedDates.intervalEndByDate[expirationDate] > lddDate.sub(now);
    }

}
