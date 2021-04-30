pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../AbstractValidator.sol";
import "../../../utils/DateUtils.sol";
import "../../../access/RoleAware.sol";


contract PeriodValidator is AbstractValidator, RoleAware {
    using SafeMath for uint256;
    using DateUtils for uint;

    uint256 public validHour; // used to get hour for expiration date
    uint256 public validWeekday; // used to get hour for expiration date
    uint256 public periodInTheFutureEnabled; // in weeks, months, quarters respectively
    uint256 public minIntervalSinceDeployment; // offset from now in seconds
    uint256 public periodIntervalStart; // offset from now in seconds
    uint256 public periodIntervalEnd; // offset from now in seconds

    constructor(
        address roleManager,
        uint256 _initialTimestamp, // we pass date instead of hour because of backward compatibility
        uint256 _periodInTheFutureEnabled,
        uint256 _minIntervalSinceDeployment,
        uint256 _periodIntervalStart,
        uint256 _periodIntervalEnd
    ) internal {
        setRoleManager(roleManager);
        validHour = DateUtils.getHour(_initialTimestamp);
        validWeekday = DateUtils.getDayOfWeek(_initialTimestamp);
        periodInTheFutureEnabled = _periodInTheFutureEnabled;
        minIntervalSinceDeployment = _minIntervalSinceDeployment;
        periodIntervalStart = _periodIntervalStart;
        periodIntervalEnd = _periodIntervalEnd;
    }

    function setMinIntervalSinceDeployment(uint256 interval) external onlyGovernor {
        minIntervalSinceDeployment = interval;
    }

    function setPeriodInTheFutureEnabled(uint256 _periodInTheFutureEnabled) external onlyGovernor {
        periodInTheFutureEnabled = _periodInTheFutureEnabled;
    }

    function setPeriodIntervalStart(uint256 _periodIntervalStart) external onlyGovernor {
        periodIntervalStart = _periodIntervalStart;
    }

    function setPeriodIntervalEnd(uint256 _periodIntervalEnd) external onlyGovernor {
        periodIntervalEnd = _periodIntervalEnd;
    }

    function validateLddDates(
        uint256 expirationDate,
        uint256 lddInvestEquity,
        uint256 lddInvestDebt,
        uint256 lddBorrow
    ) external view returns (bool) {
        return validateLddDate(lddInvestEquity)
        && validateLddDate(lddInvestDebt)
        && validateLddDate(lddBorrow)
        && validateExpirationDate(expirationDate);
    }

    function validateExpirationDate(uint256 expirationDate) public view returns (bool);

    function validateLddDate(uint256 lddDate) internal view returns (bool) {
        return DateUtils.isFullHour(lddDate)
            && lddDate > now.add(periodIntervalStart)
            && lddDate < now.add(periodIntervalEnd);
    }
}
