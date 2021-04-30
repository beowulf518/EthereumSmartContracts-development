import {
  latestTime,
} from 'truffle-test-helpers';
import {
  BigNumber,
  validatorType,
} from '@nomisma/nomisma-smart-contract-helpers';
import moment from 'moment';

const DateKeeper = artifacts.require('./DateKeeper.sol');
const WeeklyValidator = artifacts.require('./WeeklyValidator.sol');
const MonthlyValidator = artifacts.require('./MonthlyValidator.sol');
const QuarterlyValidator = artifacts.require('./QuarterlyValidator.sol');
const FixedValidator = artifacts.require('./FixedValidator.sol');

export const DAY_IN_SECONDS = new BigNumber(86400);
export const MIN_INTERVAL_SINCE_BANK_DEPLOYMENT = 604800;
export const WEEKS_IN_FUTURE_ENABLED = 4;

export const fixedMaturityWeekDay = 5;
export const weeksInTheFutureEnabled = 4;
export const minIntervalSinceBankDeploymentTs = 604800;
export const dayInSeconds = new BigNumber(86400);
// Friday, 8:00 AM, Jan/04/2019
// should be tz independent datetime in the past
export const initialTimestamp = moment.utc({
  year: 2019,
  month: 0,
  day: 0,
  hour: 8,
}).day(fixedMaturityWeekDay).unix();

export const fixedHoursMinutes = {
  hour: 8,
};

// march, june, september, december
const fixedQMaturityMonths = [2, 5, 8, 11];
// third week of the month
const fixedQMaturityWeek = 3;

const getThirdFridayDate = (year, month) => {
  return moment({
    year,
    month,
    day: 0,
  })
    .day(fixedMaturityWeekDay + fixedQMaturityWeek * 7)
    .date();
};

export const setupDateKeeper = async (roleManagerAddr, owner, validators = []) => {
  const dateKeeper = await DateKeeper.new(roleManagerAddr, validators, { from: owner });

  return dateKeeper;
};

export const setupPeriodValidator = async ({
  type,
  roleManagerAddr,
  initialTimestampParam = initialTimestamp,
  periodInTheFutureEnabled = WEEKS_IN_FUTURE_ENABLED,
  minIntervalSinceDeployment = MIN_INTERVAL_SINCE_BANK_DEPLOYMENT,
  periodIntervalStart = DAY_IN_SECONDS,
  periodIntervalEnd = DAY_IN_SECONDS.mul(new BigNumber(2)),
  weekdayNumOfTheMonth = 1, // n of day from end. I.e. 2nd first or 1st last.
  weekdayFromEnd = true, // for monthly and quarterly we also
  // define whether the date should be determined from the end
}) => {
  const validatorParams = [
    roleManagerAddr,
    initialTimestampParam,
    periodInTheFutureEnabled,
    minIntervalSinceDeployment,
    periodIntervalStart,
    periodIntervalEnd,
  ];
  switch (type) {
    case validatorType.WEEKLY: {
      return await WeeklyValidator.new(...validatorParams);
    }
    case validatorType.MONTHLY:
      return await MonthlyValidator.new(
        ...validatorParams,
        weekdayNumOfTheMonth,
        weekdayFromEnd,
      );
    case validatorType.QUARTERLY:
      return await QuarterlyValidator.new(
        ...validatorParams,
        weekdayNumOfTheMonth,
        weekdayFromEnd
      );
    default:
      throw new Error('Validator type not defined');
  }
};

// TODO: Fix this method, it gives incorrect values depending on latestTime()
export const defaultFixedDatesGetter = async () => {
  const latest = await latestTime();
  const latestMoment = moment.unix(latest);
  const fixedDates = fixedQMaturityMonths.map(month => {
    let year;
    if (latestMoment.month() + 3 >= month) {
      year = latestMoment.year() + 1;
    } else {
      latestMoment.year();
    }
    const day = getThirdFridayDate(year, month);
    return moment.utc({
      year,
      month,
      day,
      ...fixedHoursMinutes,
    }).unix();
  }).sort((a, b) => a - b);
  return [
    fixedDates,
    fixedDates.map(() => dayInSeconds),
    fixedDates.map(() => dayInSeconds.mul(new BigNumber(3))),
  ];
};

const genericDataKeeper = async ({
  ctx,
  configGetter,
  roleManagerAddr,
  owner,
}) => {
  const config = await configGetter();
  if (!ctx.dateKeeperParams) {
    ctx.dateKeeperParams = {};
  }
  ctx.dateKeeperParams.validators = config;
  const validators = await ctx.dateKeeperParams.validators
    .reduce(
      async (acc, validatorParams) => {
        const newAcc = await acc;
        let validator;
        if (validatorParams.type === validatorType.FIXED) {
          validator = await FixedValidator.new(
            roleManagerAddr,
            ...validatorParams.fixedDates
          );
        } else {
          validator = await setupPeriodValidator(validatorParams);
        }
        return [ ...newAcc, validator ];
      },
      Promise.resolve([]),
    );

  const dateKeeper = await DateKeeper.new(
    roleManagerAddr,
    validators.map(validator => validator.address),
    { from: owner },
  );

  return dateKeeper;
};

export const defaultDateKeeper = async ({
  roleManagerAddr,
  owner,
  initialTimestampParam = initialTimestamp,
  weeksInFutureEnabled = WEEKS_IN_FUTURE_ENABLED,
  minIntervalSinceDeployment = MIN_INTERVAL_SINCE_BANK_DEPLOYMENT,
  periodIntervalStart = DAY_IN_SECONDS,
  periodIntervalEnd = DAY_IN_SECONDS.mul(new BigNumber(2)),
  ctx = {},
  configGetter = async () => {
    const fixedDates = await defaultFixedDatesGetter();
    const config = [
      {
        type: validatorType.WEEKLY,
        roleManagerAddr,
        initialTimestampParam,
        weeksInFutureEnabled,
        minIntervalSinceDeployment,
        periodIntervalStart,
        periodIntervalEnd,
      },
      {
        type: validatorType.FIXED,
        fixedDates,
      },
    ];
    return config;
  },
}) => genericDataKeeper({
  ctx,
  owner,
  roleManagerAddr,
  configGetter,
});

export const defaultBankDateKeeper = async ({
  roleManagerAddr,
  owner,
  initialTimestampParam = initialTimestamp,
  minIntervalSinceBankDeployment = MIN_INTERVAL_SINCE_BANK_DEPLOYMENT,
  periodIntervalStart = DAY_IN_SECONDS,
  periodIntervalEnd = DAY_IN_SECONDS.mul(new BigNumber(2)),
  weekdayNumOfTheMonth = 1, // last friday of the month as default
  weekdayFromEnd = true,
  useFixed = false,
  ctx = {},
  configGetter = async () => {
    const config = [
      {
        type: validatorType.WEEKLY,
        roleManagerAddr,
        initialTimestampParam,
        periodInTheFutureEnabled: 4,
        minIntervalSinceDeployment: minIntervalSinceBankDeployment,
        periodIntervalStart,
        periodIntervalEnd,
      },
      {
        type: validatorType.MONTHLY,
        roleManagerAddr,
        initialTimestampParam,
        periodInTheFutureEnabled: 3,
        minIntervalSinceDeployment: minIntervalSinceBankDeployment,
        periodIntervalStart,
        periodIntervalEnd,
        weekdayNumOfTheMonth,
        weekdayFromEnd,
      },
      {
        type: validatorType.QUARTERLY,
        roleManagerAddr,
        initialTimestampParam,
        periodInTheFutureEnabled: 2,
        minIntervalSinceDeployment: minIntervalSinceBankDeployment,
        periodIntervalStart,
        periodIntervalEnd,
        weekdayNumOfTheMonth,
        weekdayFromEnd,
      },
    ];
    if (useFixed) {
      const fixedDates = await defaultFixedDatesGetter();
      config.push({
        type: validatorType.FIXED,
        fixedDates,
      });
    }
    return config;
  },
}) => genericDataKeeper({
  ctx,
  owner,
  roleManagerAddr,
  configGetter,
});

export const defaultOPMDateKeeper = async ({
  roleManagerAddr,
  owner,
  initialTimestampParam = initialTimestamp,
  minIntervalSinceBankDeployment = MIN_INTERVAL_SINCE_BANK_DEPLOYMENT,
  periodIntervalStart = DAY_IN_SECONDS,
  periodIntervalEnd = DAY_IN_SECONDS.mul(new BigNumber(2)),
  weekdayNumOfTheMonth = 1, // last friday of the month as default
  weekdayFromEnd = true,
  ctx = {},
  configGetter = async () => {
    const config = [
      {
        type: validatorType.WEEKLY,
        roleManagerAddr,
        initialTimestamp: initialTimestampParam,
        periodInFutureEnabled: 4,
        minIntervalSinceDeployment: minIntervalSinceBankDeployment,
        periodIntervalStart,
        periodIntervalEnd,
      },
      {
        type: validatorType.MONTHLY,
        roleManagerAddr,
        initialTimestampParam,
        periodInFutureEnabled: 3,
        minIntervalSinceBankDeployment,
        periodIntervalStart,
        periodIntervalEnd,
        weekdayNumOfTheMonth,
        weekdayFromEnd,
      },
      {
        type: validatorType.QUARTERLY,
        roleManagerAddr,
        initialTimestampParam,
        periodInFutureEnabled: 2,
        minIntervalSinceBankDeployment,
        periodIntervalStart,
        periodIntervalEnd,
        weekdayNumOfTheMonth,
        weekdayFromEnd,
      },
    ];
    return config;
  },
}) => genericDataKeeper({
  ctx,
  owner,
  roleManagerAddr,
  configGetter,
});

export const getFirstFridayOfTheMonth = function (date) {
  const lastDay = date.clone().startOf('month').hour(date.hour()).minute(0).second(0);
  let daysToAdd;
  if (lastDay.day() <= 5) {
    daysToAdd = 5 - lastDay.day();
  } else {
    daysToAdd = 12 - lastDay.day();
  }

  return lastDay.add(daysToAdd, 'days');
};

/**
 * TODO: remove this shame helper
 * TODO: it seems that this can be done by unifying names across
 * TODO: smart contracts and helpers
 * @param sendData
 * @param key
 * @returns {number | boolean}
 */
export const parseMapConfigParamFromSentData = ({
  sendData,
  key,
}) => {
  let configParam;
  if (typeof sendData[key] === 'number' || typeof sendData[key] === 'string') {
    configParam = new BigNumber(sendData[key]);
  } else if (key === 'validHour') {
    configParam = new BigNumber(
      moment.unix(sendData.initialTimestampParam).utc().hour()
    );
  } else if (key === 'validWeekday') {
    configParam = new BigNumber(
      moment.unix(sendData.initialTimestampParam).utc().isoWeekday()
    );
  } else if (key === 'periodInTheFutureEnabled') {
    configParam = new BigNumber(sendData.weeksInFutureEnabled);
  } else if (key === 'weekDayNumFromEnd') {
    configParam = sendData.weekdayFromEnd;
  } else if (key === 'weekDayNumOfMonth') {
    configParam = sendData.weekdayNumOfTheMonth;
  } else if (key === 'dates') {
    configParam = sendData.fixedDates[0].map(d => new BigNumber(d));
  } else if (key === 'datesIntervalStarts') {
    configParam = sendData.fixedDates[1].map(d => new BigNumber(d));
  } else if (key === 'datesIntervalEnds') {
    configParam = sendData.fixedDates[2].map(d => new BigNumber(d));
  } else { // boolean value
    configParam = sendData[key];
  }
  return configParam;
};
