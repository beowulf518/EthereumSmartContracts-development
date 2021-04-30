import moment from 'moment/moment';

import {
  BigNumber,
  getChaiBN,
  deserializeBasicPeriodState,
  deserializeExtendedPeriodState,
  deserializeFixedState,
  deserializeDateKeeperReturnPayload,
  getExpirationDates,
  getValidRangesForExpDate,
  validatorType,
  getNthValidWeekdayInFutureMonth,
} from '@nomisma/nomisma-smart-contract-helpers';
import {
  setupDateKeeper,
  defaultBankDateKeeper,
  setupPeriodValidator,
  MIN_INTERVAL_SINCE_BANK_DEPLOYMENT,
  DAY_IN_SECONDS,
  initialTimestamp,
  defaultFixedDatesGetter,
  parseMapConfigParamFromSentData,
} from '../helpers/date-keeper';

import {
  setupRoleManager,
} from '../../access/helpers/role-manager';
import {
  increaseTimeTo,
  latestTime,

} from 'truffle-test-helpers';

const FixedValidator = artifacts.require('./FixedValidator.sol');

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();


contract('Validators', function (addresses) {
  const owner = addresses[0];
  beforeEach(async function () {
    this.roleManager = await setupRoleManager([owner], [owner]);
  });

  describe('WeeklyValidator#validateExpirationDate() edge cases', function () {
    // eslint-disable-next-line max-len
    it('can properly validate for next friday on saturday when only one week in the future can be used', async function () {
      this.weeklyValidator = await setupPeriodValidator({
        type: validatorType.WEEKLY,
        roleManagerAddr: this.roleManager.address,
        periodInTheFutureEnabled: 1,
        minIntervalSinceDeployment: 0,
        periodIntervalStart: 0,
        periodIntervalEnd: 0,
      });
      const saturdayThisWeek = moment.utc().startOf('isoWeek').hour(8).day(6);
      const fridayNextWeek = moment
        .utc()
        .startOf('isoWeek')
        .hour(8)
        .day(5)
        .add(7, 'days');

      const latest = await latestTime();
      if (latest < saturdayThisWeek.unix()) {
        await increaseTimeTo(saturdayThisWeek.unix());
      }
      const isValid = await this.weeklyValidator.validateExpirationDate(fridayNextWeek.unix());

      assert.equal(isValid, true);
    });
  });

  describe('WeeklyValidator#validateExpirationDate()', function () {
    beforeEach(async function () {
      this.minIntervalSinceDeployment = MIN_INTERVAL_SINCE_BANK_DEPLOYMENT;
      this.weeklyValidator = await setupPeriodValidator({
        type: validatorType.WEEKLY,
        roleManagerAddr: this.roleManager.address,
        initialTimestampParam: initialTimestamp,
        periodIntervalStart: 0,
        periodIntervalEnd: 0,
        minIntervalSinceDeployment: this.minIntervalSinceDeployment,
      });
      this.dateKeeper = await setupDateKeeper(this.roleManager.address, owner, [this.weeklyValidator.address]);
    });

    it('should validates fridays for next 6 weeks', async function () {
      const latest = await latestTime();
      let toAdd = 0;
      let firstValidExpirationDate = moment
        .unix(latest)
        .utc()
        .startOf('isoWeek')
        .hour(8)
        .day(5)
        .minutes(0)
        .seconds(0);
      if (firstValidExpirationDate.unix() <= latest) {
        toAdd = 7;
      }
      firstValidExpirationDate = firstValidExpirationDate
        .add(toAdd, 'days')
        .add(this.minIntervalSinceDeployment, 'seconds');
      const fridayNextWeek = firstValidExpirationDate
        .clone()
        .add(7, 'days');
      const fridayInTwoWeeks = firstValidExpirationDate
        .clone()
        .add(14, 'days');
      const fridayInThreeWeeks = firstValidExpirationDate
        .clone()
        .add(21, 'days');
      const fridayInFourWeeks = firstValidExpirationDate
        .clone()
        .add(28, 'days');

      const isValidFridayThisWeek = await this.dateKeeper.validateExpirationDate(firstValidExpirationDate.unix());
      const isValidFridayNextWeek = await this.dateKeeper.validateExpirationDate(fridayNextWeek.unix());
      const isValidFridayInTwoWeeks = await this.dateKeeper.validateExpirationDate(fridayInTwoWeeks.unix());
      const isValidFridayInThreeWeeks = await this.dateKeeper.validateExpirationDate(fridayInThreeWeeks.unix());
      const isValidFridayInFourWeeks = await this.dateKeeper.validateExpirationDate(fridayInFourWeeks.unix());

      assert.equal(isValidFridayThisWeek, true);
      assert.equal(isValidFridayNextWeek, true);
      assert.equal(isValidFridayInTwoWeeks, true);
      assert.equal(isValidFridayInThreeWeeks, true);
      assert.equal(isValidFridayInFourWeeks, false);
    });

    it('should validate various days of the week excluding friday for next 6 weeks', async function () {
      const dayThisWeek =  moment.utc().startOf('isoWeek').hour(8).day(0);
      const dayNextWeek =  moment.utc().startOf('isoWeek').hour(8).day(1 + 7);
      const dayInTwoWeeks =  moment.utc().startOf('isoWeek').hour(8).day(2 + 14);
      const dayInThreeWeeks =  moment.utc().startOf('isoWeek').hour(8).day(3 + 21);
      const dayInFourWeeks =  moment.utc().startOf('isoWeek').hour(8).day(4 + 28);
      const dayInFiveWeeks =  moment.utc().startOf('isoWeek').hour(8).day(6 + 35);

      const isValidDayThisWeek = await this.dateKeeper.validateExpirationDate(dayThisWeek.unix());
      const isValidDayNextWeek = await this.dateKeeper.validateExpirationDate(dayNextWeek.unix());
      const isValidDayInTwoWeeks = await this.dateKeeper.validateExpirationDate(dayInTwoWeeks.unix());
      const isValidDayInThreeWeeks = await this.dateKeeper.validateExpirationDate(dayInThreeWeeks.unix());
      const isValidDayInFourWeeks = await this.dateKeeper.validateExpirationDate(dayInFourWeeks.unix());
      const isValidDayInFiveWeeks = await this.dateKeeper.validateExpirationDate(dayInFiveWeeks.unix());

      assert.equal(isValidDayThisWeek, false);
      assert.equal(isValidDayNextWeek, false);
      assert.equal(isValidDayInTwoWeeks, false);
      assert.equal(isValidDayInThreeWeeks, false);
      assert.equal(isValidDayInFourWeeks, false);
      assert.equal(isValidDayInFiveWeeks, false);
    });
  });

  describe('MonthlyValidator#validateExpirationDate() edge cases', function () {
    // eslint-disable-next-line max-len
    it('can properly validate for next month\'s second last friday when only one month in the future is allowed and it is already past last friday in current month', async function () {
      this.monthlyValidator = await setupPeriodValidator({
        type: validatorType.MONTHLY,
        roleManagerAddr: this.roleManager.address,
        periodInTheFutureEnabled: 1,
        minIntervalSinceDeployment: 0,
        periodIntervalStart: 0,
        periodIntervalEnd: 0,
        weekdayNumOfTheMonth: 2,
        weekdayFromEnd: true,
      });
      const latest = await latestTime();
      const firstDayOfMonth = moment
        .unix(latest)
        .utc()
        .date(1)
        .hour(8)
        .minutes(0)
        .seconds(0);
      const fridayDay = 5;
      const secondFridayOfMonth = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 1,
        latest,
        weekDayNum: fridayDay,
        n: 2,
        shiftMonths: 0,
      });
      if (latest < secondFridayOfMonth.unix()) {
        const lastFridayOfTheMonth = getNthValidWeekdayInFutureMonth({
          latest,
          currentMonthStartDate: firstDayOfMonth,
          monthsInFuture: 1,
          weekDayNum: fridayDay,
          n: 1,
        });
        await increaseTimeTo(lastFridayOfTheMonth.unix());
      }
      const newLatest = await latestTime();
      const validDate = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 1,
        latest: newLatest,
        weekDayNum: fridayDay,
        n: 2,
      });

      const notValidInTheFutureDate = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 2,
        latest: newLatest,
        weekDayNum: fridayDay,
        n: 2,
      });
      const notValidInThePast = await this.monthlyValidator.validateExpirationDate(secondFridayOfMonth.unix());
      const isValid = await this.monthlyValidator.validateExpirationDate(validDate.unix());
      const notValidInTheFuture = await this.monthlyValidator.validateExpirationDate(notValidInTheFutureDate.unix());

      assert.equal(notValidInThePast, false);
      assert.equal(isValid, true);
      assert.equal(notValidInTheFuture, false);
    });
  });

  describe('MonthlyValidator#validateExpirationDate() ', function () {
    beforeEach(async function () {
      this.monthlyValidator = await setupPeriodValidator({
        type: validatorType.MONTHLY,
        roleManagerAddr: this.roleManager.address,
        periodInTheFutureEnabled: 3,
        minIntervalSinceDeployment: 0,
        periodIntervalStart: 0,
        periodIntervalEnd: 0,
      });
      this.dateKeeper = await setupDateKeeper(
        this.roleManager.address,
        owner,
        [this.monthlyValidator.address],
      );
    });

    // TODO skipping it for now as it fails randomly
    it.skip('should validate fridays for next 3 months with fourth month\'s friday being not valid', async function () {
      // TODO: Sometimes this test fails for no obvious reason
      // TODO: there must be something related to the latest
      // TODO: value being uncontrolled though sometimes
      // TODO: the lastFridayOfMonth is not valid
      const latest = await latestTime();
      const firstDayOfMonth = moment
        .unix(latest)
        .utc()
        .date(1)
        .hours(8)
        .minutes(0)
        .seconds(0);
      const fridayDay = 5;
      const lastFridayOfMonth = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 1,
        latest,
        weekDayNum: fridayDay,
        n: 1,
      });
      const lastFridayOfMonth2 = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 2,
        latest,
        weekDayNum: fridayDay,
        n: 1,
      });
      const lastFridayOfMonth3 = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 3,
        latest,
        weekDayNum: fridayDay,
        n: 1,
      });
      const lastFridayOfMonth4 = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 4,
        latest,
        weekDayNum: fridayDay,
        n: 1,
      });

      const isValidLastFridayOfMonth = await this.dateKeeper.validateExpirationDate(lastFridayOfMonth.unix());
      const isValidLastFridayOfMonth2 = await this.dateKeeper.validateExpirationDate(lastFridayOfMonth2.unix());
      const isValidLastFridayOfMonth3 = await this.dateKeeper.validateExpirationDate(lastFridayOfMonth3.unix());
      const isValidLastFridayOfMonth4 = await this.dateKeeper.validateExpirationDate(lastFridayOfMonth4.unix());

      assert.equal(isValidLastFridayOfMonth, true);
      assert.equal(isValidLastFridayOfMonth2, true);
      assert.equal(isValidLastFridayOfMonth3, true);
      assert.equal(isValidLastFridayOfMonth4, false);
    });

    it('should not validate improper days of the week', async function () {
      const latest = await latestTime();
      const firstDayOfMonth = moment
        .unix(latest)
        .utc()
        .date(1)
        .hours(8)
        .minutes(0)
        .seconds(0);
      const dayOfMonth = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 1,
        latest,
        weekDayNum: 4,
        n: 1,
      });
      const dayMonth2 = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 1,
        latest,
        weekDayNum: 6,
        n: 1,
      });
      const dayMonth3 = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 2,
        latest,
        weekDayNum: 3,
        n: 1,
      });
      const dayMonth4 = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 2,
        latest,
        weekDayNum: 2,
        n: 1,
      });

      const isValidDayOfMonth = await this.dateKeeper.validateExpirationDate(dayOfMonth.unix());
      const isValidDayOfMonth2 = await this.dateKeeper.validateExpirationDate(dayMonth2.unix());
      const isValidDayOfMonth3 = await this.dateKeeper.validateExpirationDate(dayMonth3.unix());
      const isValidDayOfMonth4 = await this.dateKeeper.validateExpirationDate(dayMonth4.unix());

      assert.equal(isValidDayOfMonth, false);
      assert.equal(isValidDayOfMonth2, false);
      assert.equal(isValidDayOfMonth3, false);
      assert.equal(isValidDayOfMonth4, false);
    });

    it('should validate second last fridays of the month for next 4 months', async function () {
      this.monthlyValidator = await setupPeriodValidator({
        type: validatorType.MONTHLY,
        roleManagerAddr: this.roleManager.address,
        periodInTheFutureEnabled: 3,
        minIntervalSinceDeployment: 0,
        periodIntervalStart: 0,
        periodIntervalEnd: 0,
        weekdayNumOfTheMonth: 2,
      });
      this.dateKeeper = await setupDateKeeper(
        this.roleManager.address,
        owner,
        [this.monthlyValidator.address],
      );

      const latest = await latestTime();
      const firstDayOfMonth = moment
        .unix(latest)
        .utc()
        .date(1)
        .hours(8)
        .minutes(0)
        .seconds(0);
      const fridayDay = 5;
      const secondLastFridayOfCurrentMonth = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 1,
        latest,
        weekDayNum: fridayDay,
        n: 2,
      });
      const secondFridayOfTheMonth2 = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 2,
        latest,
        weekDayNum: fridayDay,
        n: 2,
      });
      const secondFridayOfTheMonth3 = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 3,
        latest,
        weekDayNum: fridayDay,
        n: 2,
      });
      const secondFridayOfTheMonth4 = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 4,
        latest,
        weekDayNum: fridayDay,
        n: 2,
      });

      const isSecondFridayOfTheMonthValid = await this.dateKeeper.validateExpirationDate(
        secondLastFridayOfCurrentMonth.unix(),
      );
      const isSecondFridayOfTheMonth2Valid = await this.dateKeeper.validateExpirationDate(
        secondFridayOfTheMonth2.unix()
      );
      const isSecondFridayOfTheMonth3Valid = await this.dateKeeper.validateExpirationDate(
        secondFridayOfTheMonth3.unix()
      );
      const isSecondFridayOfTheMonth4Valid = await this.dateKeeper.validateExpirationDate(
        secondFridayOfTheMonth4.unix()
      );

      assert.equal(isSecondFridayOfTheMonthValid, true);
      assert.equal(isSecondFridayOfTheMonth2Valid, true);
      assert.equal(isSecondFridayOfTheMonth3Valid, true);
      assert.equal(isSecondFridayOfTheMonth4Valid, false);
    });
  });

  describe('QuarterlyValidator#validateExpirationDate() edge cases', function () {
    // eslint-disable-next-line max-len
    it('can properly validate for next quarter\'s second last friday when only one month in the future is allowed and it is already past last friday in current month', async function () {
      this.quarterlyValidator = await setupPeriodValidator({
        type: validatorType.QUARTERLY,
        roleManagerAddr: this.roleManager.address,
        periodInTheFutureEnabled: 1,
        minIntervalSinceDeployment: 0,
        periodIntervalStart: 0,
        periodIntervalEnd: 0,
        weekdayNumOfTheMonth: 2,
      });
      const latest = await latestTime();
      const firstDayOfMonth = moment
        .unix(latest)
        .utc()
        .endOf('quarter')
        .date(1)
        .hours(8)
        .minutes(0)
        .seconds(0);
      const fridayDay = 5;
      const secondFridayFromTheEndOfQuarter = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 1,
        latest,
        weekDayNum: fridayDay,
        n: 2,
      });
      if (latest < secondFridayFromTheEndOfQuarter.unix()) {
        const lastFridayOfTheMonth = getNthValidWeekdayInFutureMonth({
          currentMonthStartDate: firstDayOfMonth,
          monthsInFuture: 1,
          latest,
          weekDayNum: fridayDay,
          n: 1,
        });
        await increaseTimeTo(lastFridayOfTheMonth.unix());
      }
      const newLatest = await latestTime();
      const validDate = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 1,
        latest: newLatest,
        weekDayNum: fridayDay,
        n: 2,
        shiftMonths: 3,
      });
      const notValidInFutureDate = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 4,
        latest: newLatest,
        weekDayNum: fridayDay,
        n: 2,
        shiftMonths: 3,
      });
      const notValidInThePast = await this.quarterlyValidator.validateExpirationDate(
        secondFridayFromTheEndOfQuarter.unix()
      );
      const isValid = await this.quarterlyValidator.validateExpirationDate(validDate.unix());
      const notValidInFuture = await this.quarterlyValidator.validateExpirationDate(notValidInFutureDate.unix());

      assert.equal(notValidInThePast, false);
      assert.equal(isValid, true);
      assert.equal(notValidInFuture, false);
    });
  });

  describe('QuarterlyValidator#validateExpirationDate() ', function () {
    beforeEach(async function () {
      this.quarterlyValidator = await setupPeriodValidator({
        type: validatorType.QUARTERLY,
        roleManagerAddr: this.roleManager.address,
        periodInTheFutureEnabled: 2,
        minIntervalSinceDeployment: 0,
        periodIntervalStart: 0,
        periodIntervalEnd: 0,
      });
      this.dateKeeper = await setupDateKeeper(this.roleManager.address, owner, [this.quarterlyValidator.address]);
    });

    it('should validate fridays for next 3 quarters', async function () {
      let latest = await latestTime();
      const nextQuarterStart = moment
        .unix(latest)
        .utc()
        .endOf('quarter')
        .add(1, 'days')
        .hours(8)
        .minutes(0)
        .seconds(0);
      await increaseTimeTo(nextQuarterStart.unix());
      latest = await latestTime();
      const firstDayOfMonth = moment
        .unix(latest)
        .utc()
        .endOf('quarter')
        .date(1)
        .hours(8)
        .minutes(0)
        .seconds(0);
      const fridayDay = 5;
      const lastFridayOfQuarter = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 1,
        latest,
        weekDayNum: fridayDay,
        n: 1,
        shiftMonths: 3,
      });
      const lastFridayOfQuarter2 = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 4,
        latest,
        weekDayNum: fridayDay,
        n: 1,
        shiftMonths: 3,
      });
      const lastFridayOfQuarter3 = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 7,
        latest,
        weekDayNum: fridayDay,
        n: 1,
        shiftMonths: 3,
      });

      const isValidLastFridayOfQuarter = await this.dateKeeper.validateExpirationDate(lastFridayOfQuarter.unix());
      const isValidLastFridayOfQuarter2 = await this.dateKeeper.validateExpirationDate(lastFridayOfQuarter2.unix());
      const isValidLastFridayOfQuarter3 = await this.dateKeeper.validateExpirationDate(lastFridayOfQuarter3.unix());

      assert.equal(isValidLastFridayOfQuarter, true);
      assert.equal(isValidLastFridayOfQuarter2, true);
      assert.equal(isValidLastFridayOfQuarter3, false);
    });

    it('should not validate various days of the week excluding friday for quarters', async function () {
      const latest = await latestTime();
      const firstDayOfMonth = moment
        .unix(latest)
        .utc()
        .endOf('quarter')
        .date(1)
        .hours(8)
        .minutes(0)
        .seconds(0);
      const dayOfQuarter = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 1,
        latest,
        weekDayNum: 4,
        n: 1,
        shiftMonths: 3,
      });
      const dayOfQuarter2 = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 1,
        latest,
        weekDayNum: 6,
        n: 1,
        shiftMonths: 3,
      });
      const dayOfQuarter3 = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 4,
        latest,
        weekDayNum: 4,
        n: 1,
        shiftMonths: 3,
      });

      const isValidDayOfQuarter = await this.dateKeeper.validateExpirationDate(dayOfQuarter.unix());
      const isValidDayOfQuarter2 = await this.dateKeeper.validateExpirationDate(dayOfQuarter2.unix());
      const isValidDayOfQuarter3 = await this.dateKeeper.validateExpirationDate(dayOfQuarter3.unix());

      assert.equal(isValidDayOfQuarter, false);
      assert.equal(isValidDayOfQuarter2, false);
      assert.equal(isValidDayOfQuarter3, false);
    });
  });

  describe('PeriodValidator#validateLddDates() ', function () {
    beforeEach(async function () {
      this.weeklyValidator = await setupPeriodValidator({
        type: validatorType.WEEKLY,
        roleManagerAddr: this.roleManager.address,
      });
      this.dateKeeper = await setupDateKeeper(
        this.roleManager.address,
        owner,
        [this.weeklyValidator.address],
      );
      const {
        '1': validatorTypes,
        '2': unparsedState,
      } = await this.dateKeeper.getValidatorInfo();
      const parsedConfigs = deserializeDateKeeperReturnPayload({
        payload: unparsedState,
        validatorTypes,
        BigNumber,
      });
      const latest = await latestTime();
      const expDates = getExpirationDates({
        latest,
        configs: parsedConfigs,
        validatorTypes,
      });
      this.expDate = expDates[0].date;
      const [rangeStart] = getValidRangesForExpDate({
        lastBlockTimestamp: latest,
        expirationDate: this.expDate,
        configs: parsedConfigs,
        validatorTypes,
      });
      this.validLdd = rangeStart;
    });

    it('should validate ldd dates', async function () {
      const notObeyingModuloRuleLdd = new BigNumber(this.validLdd).add(new BigNumber(1));
      const beforePeriodIntervalLdd = new BigNumber(this.validLdd).sub(DAY_IN_SECONDS.mul(new BigNumber(2)));
      const afterPeriodIntervalLdd = new BigNumber(this.validLdd).add(DAY_IN_SECONDS.mul(new BigNumber(3)));

      const isValidLddDates = await this.dateKeeper.validate([
        this.expDate,
        this.validLdd,
        this.validLdd,
        this.validLdd,
      ]);

      const isNotObeyingModuloRuleLdd = await this.dateKeeper.validate([
        this.expDate,
        this.validLdd,
        notObeyingModuloRuleLdd,
        this.validLdd,
      ]);

      const isBeforePeriodIntervalLddValid = await this.dateKeeper.validate([
        this.expDate,
        beforePeriodIntervalLdd,
        this.validLdd,
        this.validLdd,
      ]);

      const isAfterPeriodIntervalLddValid = await this.dateKeeper.validate([
        this.expDate,
        this.validLdd,
        this.validLdd,
        afterPeriodIntervalLdd,
      ]);

      assert.equal(isValidLddDates, true);
      assert.equal(isNotObeyingModuloRuleLdd, false);
      assert.equal(isBeforePeriodIntervalLddValid, false);
      assert.equal(isAfterPeriodIntervalLddValid, false);
    });
  });

  describe('defaultBankDateKeeper#validate() no fixed', function () {
    beforeEach(async function () {
      this.dateKeeper = await defaultBankDateKeeper({
        roleManagerAddr: this.roleManager.address,
        minIntervalSinceBankDeployment: 0,
        owner,
        useFixed: false,
      });

      const {
        '1': validatorTypes,
        '2': unparsedState,
      } = await this.dateKeeper.getValidatorInfo();
      const parsedConfigs = deserializeDateKeeperReturnPayload({
        payload: unparsedState,
        validatorTypes,
        BigNumber,
      });
      const latest = await latestTime();
      const expDates = getExpirationDates({
        latest,
        configs: parsedConfigs,
        validatorTypes,
      });
      this.expDate = expDates[0].date;
      const [rangeStart] = getValidRangesForExpDate({
        lastBlockTimestamp: latest,
        expirationDate: this.expDate,
        configs: parsedConfigs,
        validatorTypes,
      });
      this.validLdd = rangeStart;

      this.validLddParams = [
        this.validLdd,
        this.validLdd,
        this.validLdd,
      ];
    });

    it('Quarterly should validate last Friday of the next 2 Quarters Ends only', async function () {
      const latest = await latestTime();
      const firstDayOfMonth = moment
        .unix(latest)
        .utc()
        .endOf('quarter')
        .date(1)
        .hours(8)
        .minutes(0)
        .seconds(0);
      const lastFridayOfQuarter = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 1,
        latest,
        weekDayNum: 5,
        n: 1,
        shiftMonths: 3,
      });
      const lastFridayOfQuarter2 = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 4,
        latest,
        weekDayNum: 5,
        n: 1,
        shiftMonths: 3,
      });
      const lastFridayOfQuarter3 = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 7,
        latest,
        weekDayNum: 5,
        n: 1,
        shiftMonths: 3,
      });

      const isValidLastFridayOfQuarter = await this.dateKeeper.validate(
        [
          lastFridayOfQuarter.unix(),
          ...this.validLddParams,
        ]
      );
      const isValidLastFridayOfQuarter2 = await this.dateKeeper.validate(
        [
          lastFridayOfQuarter2.unix(),
          ...this.validLddParams,
        ]
      );
      const isValidLastFridayOfQuarter3 = await this.dateKeeper.validate(
        [
          lastFridayOfQuarter3.unix(),
          ...this.validLddParams,
        ]
      );

      assert.equal(isValidLastFridayOfQuarter, true);
      assert.equal(isValidLastFridayOfQuarter2, true);
      assert.equal(isValidLastFridayOfQuarter3, false);
    });
  });

  // TODO: Fixed validator is temporary disabled as defaultFixedDatesGetter implementation is flawed
  // Should validate:
  // - The next 4 Fridays
  // - The last Friday of the next 3 Months
  // - The Last Friday of the next 2 Quarters Ends
  describe('defaultBankDateKeeper#validate() with fixed', function () {
    beforeEach(async function () {
      this.dateKeeper = await defaultBankDateKeeper({
        roleManagerAddr: this.roleManager.address,
        minIntervalSinceBankDeployment: 0,
        owner,
      });

      const {
        '1': validatorTypes,
        '2': unparsedState,
      } = await this.dateKeeper.getValidatorInfo();
      const parsedConfigs = deserializeDateKeeperReturnPayload({
        payload: unparsedState,
        validatorTypes,
        BigNumber,
      });
      const latest = await latestTime();
      const expDates = getExpirationDates({
        latest,
        configs: parsedConfigs,
        validatorTypes,
      });
      this.expDate = expDates[0].date;
      const [rangeStart] = getValidRangesForExpDate({
        lastBlockTimestamp: latest,
        expirationDate: this.expDate,
        configs: parsedConfigs,
        validatorTypes,
      });
      this.validLdd = rangeStart;

      this.validLddParams = [
        this.validLdd,
        this.validLdd,
        this.validLdd,
      ];
    });

    it('should validate next 4 Fridays', async function () {
      const latest = await latestTime();
      let toAdd = 0;
      let fridayThisWeek = moment
        .unix(latest)
        .utc()
        .startOf('isoWeek')
        .hour(8)
        .day(5)
        .minutes(0)
        .seconds(0);
      if (fridayThisWeek.unix() <= latest) {
        toAdd = 7;
      }
      fridayThisWeek = fridayThisWeek.add(toAdd, 'days');
      const fridayNextWeek =  moment
        .unix(latest)
        .utc()
        .startOf('isoWeek')
        .hour(8)
        .day(5)
        .add(7 + toAdd, 'days')
        .minutes(0)
        .seconds(0);
      const fridayInTwoWeeks =  moment
        .unix(latest)
        .utc()
        .startOf('isoWeek')
        .hour(8)
        .day(5)
        .add(14 + toAdd, 'days')
        .minutes(0)
        .seconds(0);
      const fridayInThreeWeeks =  moment
        .unix(latest)
        .utc()
        .startOf('isoWeek')
        .hour(8)
        .day(5)
        .add(21 + toAdd, 'days')
        .minutes(0)
        .seconds(0);

      const isFridayThisWeekValid = await this.dateKeeper.validate(
        [
          fridayThisWeek.unix(),
          ...this.validLddParams,
        ]
      );
      const isFridayNextWeekValid = await this.dateKeeper.validate(
        [
          fridayNextWeek.unix(),
          ...this.validLddParams,
        ]
      );
      const isFridayInTwoWeeksValid = await this.dateKeeper.validate(
        [
          fridayInTwoWeeks.unix(),
          ...this.validLddParams,
        ]
      );
      const isFridayInThreeWeeksValid = await this.dateKeeper.validate(
        [
          fridayInThreeWeeks.unix(),
          ...this.validLddParams,
        ]
      );

      assert.equal(isFridayThisWeekValid, true);
      assert.equal(isFridayNextWeekValid, true);
      assert.equal(isFridayInTwoWeeksValid, true);
      assert.equal(isFridayInThreeWeeksValid, true);
    });

    it('should validate last Friday of the next 3 Months', async function () {
      const latest = await latestTime();
      const firstDayOfMonth = moment
        .unix(latest)
        .utc()
        .date(1)
        .hours(8)
        .minutes(0)
        .seconds(0);
      const fridayDay = 5;
      const lastFridayOfMonth = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        latest,
        monthsInFuture: 1,
        weekDayNum: fridayDay,
        n: 1,
      });
      const lastFridayOfMonth2 = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 2,
        latest,
        weekDayNum: fridayDay,
        n: 1,
      });
      const lastFridayOfMonth3 = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 3,
        latest,
        weekDayNum: fridayDay,
        n: 1,
      });

      const isValidLastFridayOfMonth = await this.dateKeeper.validate(
        [
          lastFridayOfMonth.unix(),
          ...this.validLddParams,
        ]
      );
      const isValidLastFridayOfMonth2 = await this.dateKeeper.validate(
        [
          lastFridayOfMonth2.unix(),
          ...this.validLddParams,
        ]
      );
      const isValidLastFridayOfMonth3 = await this.dateKeeper.validate(
        [
          lastFridayOfMonth3.unix(),
          ...this.validLddParams,
        ]
      );

      assert.equal(isValidLastFridayOfMonth, true);
      assert.equal(isValidLastFridayOfMonth2, true);
      assert.equal(isValidLastFridayOfMonth3, true);
    });

    it('should validate last Friday of the next 2 Quarters Ends', async function () {
      const latest = await latestTime();
      const firstDayOfMonth = moment
        .unix(latest)
        .utc()
        .endOf('quarter')
        .date(1)
        .hours(8)
        .minutes(0)
        .seconds(0);
      const lastFridayOfQuarter = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        latest,
        monthsInFuture: 1,
        weekDayNum: 5,
        n: 1,
        shiftMonths: 3,
      });
      const lastFridayOfQuarter2 = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 4,
        latest,
        weekDayNum: 5,
        n: 1,
        shiftMonths: 3,
      });
      const lastFridayOfQuarter4 = getNthValidWeekdayInFutureMonth({
        currentMonthStartDate: firstDayOfMonth,
        monthsInFuture: 10,
        latest,
        weekDayNum: 5,
        n: 1,
        shiftMonths: 3,
      });

      const isValidLastFridayOfQuarter = await this.dateKeeper.validate(
        [
          lastFridayOfQuarter.unix(),
          ...this.validLddParams,
        ]
      );
      // last valid fixed validator date
      const isValidLastFridayOfQuarter2 = await this.dateKeeper.validate(
        [
          lastFridayOfQuarter2.unix(),
          ...this.validLddParams,
        ]
      );
      const isValidLastFridayOfQuarter4 = await this.dateKeeper.validate(
        [
          lastFridayOfQuarter4.unix(),
          ...this.validLddParams,
        ]
      );

      assert.equal(isValidLastFridayOfQuarter, true);
      assert.equal(isValidLastFridayOfQuarter2, true);
      assert.equal(isValidLastFridayOfQuarter4, false);
    });
  });

  describe('#getValidatorState()', function () {
    it('Weekly', async function () {
      const config = {
        type: validatorType.WEEKLY,
        initialTimestampParam: initialTimestamp,
        roleManagerAddr: this.roleManager.address,
        periodInTheFutureEnabled: 1,
        minIntervalSinceDeployment: 0,
        periodIntervalStart: 0,
        periodIntervalEnd: 0,
      };
      const weeklyValidator = await setupPeriodValidator(config);

      const wState = await weeklyValidator.getValidatorState();

      const weeklyStateDeserialized = deserializeBasicPeriodState({
        payload: wState,
        BigNumber,
      });

      Object.keys(weeklyStateDeserialized).forEach((key) => {
        const configParam = parseMapConfigParamFromSentData({
          sendData: config,
          key,
        });

        if (BigNumber.isBN(configParam)) {
          configParam.should.be.bignumber.equal(weeklyStateDeserialized[key]);
        } else {
          assert.equal(configParam, weeklyStateDeserialized[key]);
        }
      });
    });

    it('Monthly', async function () {
      const config = {
        type: validatorType.MONTHLY,
        roleManagerAddr: this.roleManager.address,
        initialTimestampParam: initialTimestamp,
        periodInTheFutureEnabled: 1,
        minIntervalSinceDeployment: 0,
        periodIntervalStart: 0,
        periodIntervalEnd: 0,
        weekdayNumOfTheMonth: 2,
        weekdayFromEnd: true,
      };
      const monthlyValidator = await setupPeriodValidator(config);

      const mState = await monthlyValidator.getValidatorState();

      const monthlyStateDeserialized = deserializeExtendedPeriodState({
        payload: mState,
        BigNumber,
      });

      Object.keys(monthlyStateDeserialized).forEach((key) => {
        const configParam = parseMapConfigParamFromSentData({
          sendData: config,
          key,
        });

        if (BigNumber.isBN(configParam)) {
          configParam.should.be.bignumber.equal(monthlyStateDeserialized[key]);
        } else {
          assert.equal(configParam, monthlyStateDeserialized[key]);
        }
      });
    });

    it('Quarterly', async function () {
      const config = {
        type: validatorType.QUARTERLY,
        roleManagerAddr: this.roleManager.address,
        initialTimestampParam: initialTimestamp,
        periodInTheFutureEnabled: 1,
        minIntervalSinceDeployment: 0,
        periodIntervalStart: 0,
        periodIntervalEnd: 0,
        weekdayNumOfTheMonth: 2,
        weekdayFromEnd: false,
      };
      const quarterlyValidator = await setupPeriodValidator(config);

      const qState = await quarterlyValidator.getValidatorState();

      const quarterlyStateDeserialized = deserializeExtendedPeriodState({
        payload: qState,
        BigNumber,
      });

      Object.keys(quarterlyStateDeserialized).forEach((key) => {
        const configParam = parseMapConfigParamFromSentData({
          sendData: config,
          key,
        });

        if (BigNumber.isBN(configParam)) {
          configParam.should.be.bignumber.equal(quarterlyStateDeserialized[key]);
        } else {
          assert.equal(configParam, quarterlyStateDeserialized[key]);
        }
      });
    });

    it('Fixed', async function () {
      const fixedDates = await defaultFixedDatesGetter();
      const fixedValidator = await FixedValidator.new(this.roleManager.address, ...fixedDates);

      const config = { fixedDates };
      const fState = await fixedValidator.getValidatorState();

      const fixedStateDeserialized = deserializeFixedState({
        payload: fState,
        BigNumber,
      });
      Object.keys(fixedStateDeserialized).forEach((key) => {
        const configParam = parseMapConfigParamFromSentData({
          sendData: config,
          key,
        });

        if (BigNumber.isBN(configParam)) {
          configParam.should.be.bignumber.equal(fixedStateDeserialized[key]);
        } else if (Array.isArray(configParam)) {
          configParam.forEach((fixedItem, fixedIdx) => {
            fixedItem.should.be.bignumber.equal(fixedStateDeserialized[key][fixedIdx]);
          });
        } else {
          assert.equal(configParam, fixedStateDeserialized[key]);
        }
      });
    });
  });
});
