import moment from 'moment/moment';
import {
  latestTime,
  revert as EVMRevert,
} from 'truffle-test-helpers';
import {
  minIntervalSinceBankDeploymentTs,
  dayInSeconds,
  defaultDateKeeper,
  defaultBankDateKeeper,
  parseMapConfigParamFromSentData,
} from './helpers/date-keeper';
import {
  BigNumber,
  getChaiBN,
  deserializeBasicPeriodState,
  deserializeFixedState,
  deserializeDateKeeperReturnPayload,
  contractInstanceAt,
  validatorType,
  getExpirationDates,
  getValidRangesForExpDate,
  weeklyDatesPropName,
} from '@nomisma/nomisma-smart-contract-helpers';
import {
  setupRoleManager,
} from '../access/helpers/role-manager';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();

const WeeklyValidator = artifacts.require('./WeeklyValidator.sol');
const FixedValidator = artifacts.require('./FixedValidator.sol');
const AbstractValidator = artifacts.require('./AbstractValidator.sol');


contract('DateKeeper', function (addresses) {
  const [
    ,
    owner,
  ] = addresses;

  const proper = 'proper';
  const improper = 'improper';
  const properImproper = [
    {
      type: proper,
    },
    {
      type: improper,
    },
  ];

  describe('defaultDateKeeper - weekly and fixed', function () {
    beforeEach(async function () {
      this.lddIntervalStart = dayInSeconds;
      this.weeksInFutureEnabled = 4;
      this.roleManager = await setupRoleManager([owner]);

      this.dateKeeper = await defaultDateKeeper({
        ctx: this,
        roleManagerAddr: this.roleManager.address,
        owner,
        periodIntervalStart: this.lddIntervalStart,
        weeksInFutureEnabled: this.weeksInFutureEnabled,
      });

      this.fixedDates = this.dateKeeperParams.validators.find(
        ({ type }) => type === validatorType.FIXED
      ).fixedDates;

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
      const prExpDate = expDates[0].date;
      const [validLdd] = getValidRangesForExpDate({
        lastBlockTimestamp: latest,
        expirationDate: prExpDate,
        configs: parsedConfigs,
        validatorTypes,
      });

      const imprExpDate = prExpDate + dayInSeconds.toNumber();

      this.properImproperMap = {
        [proper]: prExpDate,
        [improper]: imprExpDate,
      };

      this.validLdd = validLdd;
    });

    describe('getFixedDates', async function () {
      it('can get proper dates post deployment', async function () {
        const fixedValidatorAddress = await this.dateKeeper.getValidator(1);
        const fixedValidator = await FixedValidator.at(fixedValidatorAddress);
        const { 0: fixedDates } = await fixedValidator.getFixedDates();
        fixedDates.forEach((date, idx) => {
          date.should.be.bignumber.equal(
            new BigNumber(this.fixedDates[0][idx])
          );
        });
      });
    });

    describe('replaceDates', function () {
      it('can call replaceDates with empty arrays', async function () {
        const toAddDates = [];
        const toAddDatesIntervalStarts = [];
        const toAddDatesIntervalEnds = [];
        const toRemoveDates = [];
        const fixedValidatorAddress = await this.dateKeeper.getValidator(1);
        const fixedValidator = await FixedValidator.at(fixedValidatorAddress);
        await fixedValidator.replaceDates(
          toAddDates,
          toAddDatesIntervalStarts,
          toAddDatesIntervalEnds,
          toRemoveDates,
          { from: owner }
        ).should.be.fulfilled;
        const { 0: fixedDates } = await fixedValidator.getFixedDates();
        assert.equal(fixedDates.length, this.fixedDates[0].length);
        fixedDates.forEach((date, idx) => {
          date.should.be.bignumber.equal(
            new BigNumber(this.fixedDates[0][idx])
          );
        });
      });

      it('added dates are valid after replace has been called', async function () {
        const latestFixedDate = this.fixedDates[0][this.fixedDates[0].length - 1];
        const newDate = latestFixedDate + 100500;
        const toAddDates = [newDate];
        const toAddDatesIntervalStarts = [dayInSeconds];
        const toAddDatesIntervalEnds = [dayInSeconds.mul(new BigNumber(2))];
        const toRemoveDates = [];
        const fixedValidatorAddress = await this.dateKeeper.getValidator(1);
        const fixedValidator = await FixedValidator.at(fixedValidatorAddress);
        await fixedValidator.replaceDates(
          toAddDates,
          toAddDatesIntervalStarts,
          toAddDatesIntervalEnds,
          toRemoveDates,
          { from: owner }
        ).should.be.fulfilled;
      });

      it('can not add date that is lower then last added date', async function () {
        const newDate = 100500;
        const toAddDates = [newDate];
        const toAddDatesIntervalStarts = [dayInSeconds];
        const toAddDatesIntervalEnds = [dayInSeconds.mul(new BigNumber(2))];
        const toRemoveDates = [];
        const fixedValidatorAddress = await this.dateKeeper.getValidator(1);
        const fixedValidator = await FixedValidator.at(fixedValidatorAddress);
        await fixedValidator.replaceDates(
          toAddDates,
          toAddDatesIntervalStarts,
          toAddDatesIntervalEnds,
          toRemoveDates,
          { from: owner }
        ).should.be.rejectedWith(EVMRevert);
      });

      it('removing date that does not exist should revert', async function () {
        const newDate = 100500;
        const toAddDates = [];
        const toAddDatesIntervalStarts = [];
        const toAddDatesIntervalEnds = [];
        const toRemoveDates = [newDate];
        const fixedValidatorAddress = await this.dateKeeper.getValidator(1);
        const fixedValidator = await FixedValidator.at(fixedValidatorAddress);
        await fixedValidator.replaceDates(
          toAddDates,
          toAddDatesIntervalStarts,
          toAddDatesIntervalEnds,
          toRemoveDates,
          { from: owner }
        ).should.be.rejectedWith(EVMRevert);
      });

      it('can remove first date ', async function () {
        const newDate = this.fixedDates[0][0];
        const toAddDates = [];
        const toAddDatesIntervalStarts = [];
        const toAddDatesIntervalEnds = [];
        const toRemoveDates = [newDate];
        const fixedValidatorAddress = await this.dateKeeper.getValidator(1);
        const fixedValidator = await FixedValidator.at(fixedValidatorAddress);
        await fixedValidator.replaceDates(
          toAddDates,
          toAddDatesIntervalStarts,
          toAddDatesIntervalEnds,
          toRemoveDates,
          { from: owner }
        ).should.be.fulfilled;
      });

      it('can remove multiple dates', async function () {
        const toAddDates = [];
        const toAddDatesIntervalStarts = [];
        const toAddDatesIntervalEnds = [];
        const toRemoveDates = this.fixedDates[0].slice(0, 3);
        const fixedValidatorAddress = await this.dateKeeper.getValidator(1);
        const fixedValidator = await FixedValidator.at(fixedValidatorAddress);
        await fixedValidator.replaceDates(
          toAddDates,
          toAddDatesIntervalStarts,
          toAddDatesIntervalEnds,
          toRemoveDates,
          { from: owner }
        ).should.be.fulfilled;
      });

      it('replacing dates not from start should revert', async function () {
        const toAddDates = [];
        const toAddDatesIntervalStarts = [];
        const toAddDatesIntervalEnds = [];
        const toRemoveDates = this.fixedDates[0].slice(1, 3);
        const fixedValidatorAddress = await this.dateKeeper.getValidator(1);
        const fixedValidator = await FixedValidator.at(fixedValidatorAddress);
        await fixedValidator.replaceDates(
          toAddDates,
          toAddDatesIntervalStarts,
          toAddDatesIntervalEnds,
          toRemoveDates,
          { from: owner }
        ).should.be.rejectedWith(EVMRevert);
      });

      it('removing all dates and adding new dates works properly', async function () {
        const fixedDatesArr = this.fixedDates[0];
        const toRemoveDates = fixedDatesArr;
        const toAddDates = new Array(fixedDatesArr.length)
          .fill(0)
          .map(
            (
              _,
              idx,
            ) => fixedDatesArr[fixedDatesArr.length - 1] + idx + 1
          );
        const toAddDatesIntervalStarts = toAddDates.map(() => dayInSeconds);
        const toAddDatesIntervalEnds = toAddDates.map(() => dayInSeconds.mul(new BigNumber(2)));
        const fixedValidatorAddress = await this.dateKeeper.getValidator(1);
        const fixedValidator = await FixedValidator.at(fixedValidatorAddress);
        await fixedValidator.replaceDates(
          toAddDates,
          toAddDatesIntervalStarts,
          toAddDatesIntervalEnds,
          toRemoveDates,
          { from: owner }
        ).should.be.fulfilled;
        const { 0: fixedDates } = await fixedValidator.getFixedDates();
        assert.equal(fixedDates.length, fixedDatesArr.length);
        fixedDates.forEach((date, idx) => {
          assert.equal(date, toAddDates[idx]);
        });
      });

      it('removing some dates and adding new dates works properly', async function () {
        const sliceAmt = 3;
        const fixedDatesArr = this.fixedDates[0];
        const toRemoveDates = fixedDatesArr.slice(0, sliceAmt);
        const toAddDates = new Array(fixedDatesArr.length)
          .fill(0)
          .map(
            (
              _,
              idx,
            ) => fixedDatesArr[fixedDatesArr.length - 1] + idx + 1
          );
        const toAddDatesIntervalStarts = toAddDates.map(() => dayInSeconds);
        const toAddDatesIntervalEnds = toAddDates.map(() => dayInSeconds.mul(new BigNumber(2)));
        const fixedValidatorAddress = await this.dateKeeper.getValidator(1);
        const fixedValidator = await FixedValidator.at(fixedValidatorAddress);
        await fixedValidator.replaceDates(
          toAddDates,
          toAddDatesIntervalStarts,
          toAddDatesIntervalEnds,
          toRemoveDates,
          { from: owner }
        ).should.be.fulfilled;
        const { 0: fixedDates } = await fixedValidator.getFixedDates();
        assert.equal(
          fixedDates.length,
          fixedDatesArr.length - toRemoveDates.length + toAddDates.length
        );
        const expectedDatesArr = [
          ...fixedDatesArr.slice(sliceAmt),
          ...toAddDates,
        ];
        fixedDates.forEach((date, idx) => {
          date.should.be.bignumber.equal(
            new BigNumber(expectedDatesArr[idx])
          );
        });
      });
    });

    describe('validate() check', function () {
      it('expDate past weeksInFutureEnabled returns false', async function () {
        const dateKeeper = await defaultDateKeeper({
          roleManagerAddr: this.roleManager.address,
          owner,
          minIntervalSinceBankDeployment: 0,
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
        const expDate = expDates.filter(
          (
            {
              dateType,
            }
          ) => dateType === weeklyDatesPropName,
        )
          .sort(
            (
              {
                date: dateA,
              },
              {
                date: dateB,
              }
            ) => dateB - dateA
          )[0].date;
        const [validLdd] = getValidRangesForExpDate({
          lastBlockTimestamp: latest,
          expirationDate: expDate,
          configs: parsedConfigs,
          validatorTypes,
        });

        const result = await dateKeeper.validate(
          [
            moment
              .unix(expDate)
              .utc()
              .add(7, 'days')
              .unix(),
            validLdd,
            validLdd,
            validLdd,
          ],
          { from: owner }
        );
        assert.equal(result, false);
      });

      // eslint-disable-next-line max-len
      it('expDate past weeksInFutureEnabled returns false, than returns true after setting minInterval', async function () {
        const dateKeeper = await defaultDateKeeper({
          roleManagerAddr: this.roleManager.address,
          owner,
          minIntervalSinceDeployment: 0,
        });

        const {
          '1': validatorTypes,
          '2': unparsedState,
        } = await dateKeeper.getValidatorInfo();
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
        const expDate = expDates.filter(
          (
            {
              dateType,
            }
          ) => dateType === weeklyDatesPropName,
        )
          .sort(
            (
              {
                date: dateA,
              },
              {
                date: dateB,
              }
            ) => dateB - dateA
          )[0].date;

        const [validLdd] = getValidRangesForExpDate({
          lastBlockTimestamp: latest,
          expirationDate: expDate,
          configs: parsedConfigs,
          validatorTypes,
        });

        // this is the 5th week. it should not be valid.
        const expirationDate = moment
          .unix(expDate)
          .utc()
          .add(7, 'days')
          .unix();

        let result = await dateKeeper.validate(
          [
            expirationDate,
            validLdd,
            validLdd,
            validLdd,
          ],
          { from: owner }
        );
        assert.equal(result, false);

        const weeklyValidatorAddress = await dateKeeper.getValidator(0);

        const weeklyValidator = await WeeklyValidator.at(weeklyValidatorAddress);
        await weeklyValidator.setMinIntervalSinceDeployment(
          minIntervalSinceBankDeploymentTs,
          { from: owner }
        );

        result = await dateKeeper.validate(
          [
            expirationDate,
            validLdd,
            validLdd,
            validLdd,
          ],
          { from: owner }
        );
        const nonLddResult = await dateKeeper.validateExpirationDate(
          expirationDate,
          { from: owner }
        );

        assert.equal(result, true);
        assert.equal(nonLddResult, true);
      });

      it('should validate all weeksInFutureEnabled expiration dates with one week minInterval', async function () {
        const dateKeeper = await defaultDateKeeper({
          roleManagerAddr: this.roleManager.address,
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
        const weeklyExpDates = expDates.filter(
          (
            {
              dateType,
            }
          ) => dateType === weeklyDatesPropName,
        )
          .map(({ date }) => date);

        const [validLdd] = getValidRangesForExpDate({
          lastBlockTimestamp: latest,
          expirationDate: weeklyExpDates[0],
          configs: parsedConfigs,
          validatorTypes,
        });

        let checksNumber = 0;
        for (let i = 0; i < weeklyExpDates.length; i++) {
          const result = await dateKeeper.validate(
            [
              weeklyExpDates[i],
              validLdd,
              validLdd,
              validLdd,
            ],
            { from: owner },
          );
          checksNumber++;
          assert.equal(result, true);
        }

        assert.equal(
          weeklyExpDates.length,
          checksNumber,
          'should have weeksInFutureEnabled valid dates'
        );
      });

      it('returns true for any of the fixed dates', async function () {
        const fixedDatesArr = this.fixedDates[0];
        const fixedValidatorAddress = await this.dateKeeper.getValidator(1);
        const fixedValidator = await FixedValidator.at(fixedValidatorAddress);

        const latest = await latestTime();
        const unparsed = await fixedValidator.getValidatorState();
        const parsedConfig = deserializeFixedState({
          payload: unparsed,
          BigNumber,
        });

        const results = await fixedDatesArr.reduce(async (acc, date) => {
          const newAcc = await acc;

          const [validLdd] = getValidRangesForExpDate({
            lastBlockTimestamp: latest,
            expirationDate: date,
            configs: [parsedConfig],
            validatorTypes: [new BigNumber(validatorType.FIXED)],
          });
          const result = await this.dateKeeper.validate(
            [
              date,
              validLdd,
              validLdd,
              validLdd,
            ],
            {
              from: owner,
            }
          );
          return [
            ...newAcc,
            result,
          ];
        }, Promise.resolve([]));
        assert.equal(results.every(val => val === true), true);
      });

      it('returns false for any of the fixed dates with ldd not obeying modulo rule', async function () {
        const fixedDatesArr = this.fixedDates[0];
        const fixedValidatorAddress = await this.dateKeeper.getValidator(1);
        const fixedValidator = await FixedValidator.at(fixedValidatorAddress);

        const latest = await latestTime();
        const unparsed = await fixedValidator.getValidatorState();
        const parsedConfig = deserializeFixedState({
          payload: unparsed,
          BigNumber,
        });

        const results = await fixedDatesArr.reduce(async (acc, date) => {
          const newAcc = await acc;
          const [validLdd] = getValidRangesForExpDate({
            lastBlockTimestamp: latest,
            expirationDate: date,
            configs: [parsedConfig],
            validatorTypes: [new BigNumber(validatorType.FIXED)],
          });
          const invalidLdd = new BigNumber(validLdd)
            .add(new BigNumber(1));
          const result = await this.dateKeeper.validate(
            [
              date,
              invalidLdd,
              validLdd,
              validLdd,
            ],
            {
              from: owner,
            }
          );
          return [
            ...newAcc,
            result,
          ];
        }, Promise.resolve([]));
        assert.equal(results.every(val => val === true), false);
      });

      it('returns true for any of the fixed dates post replacement', async function () {
        const sliceAmt = 3;
        const fixedDatesArr = this.fixedDates[0];
        const toRemoveDates = fixedDatesArr.slice(0, sliceAmt);
        const toAddDates = new Array(fixedDatesArr.length)
          .fill(0)
          .map(
            (
              _,
              idx,
            ) => fixedDatesArr[fixedDatesArr.length - 1] + idx + 1
          );
        const toAddDatesIntervalStarts = toAddDates.map(() => dayInSeconds);
        const toAddDatesIntervalEnds = toAddDates.map(() => dayInSeconds.mul(new BigNumber(2)));

        const fixedValidatorAddress = await this.dateKeeper.getValidator(1);
        const fixedValidator = await FixedValidator.at(fixedValidatorAddress);

        await fixedValidator.replaceDates(
          toAddDates,
          toAddDatesIntervalStarts,
          toAddDatesIntervalEnds,
          toRemoveDates,
          { from: owner }
        ).should.be.fulfilled;
        const {
          0: fixedDates,
        } = await fixedValidator.getFixedDates();

        assert.equal(
          fixedDates.length,
          fixedDatesArr.length - toRemoveDates.length + toAddDates.length
        );
        const expectedDatesArr = [
          ...fixedDatesArr.slice(sliceAmt),
          ...toAddDates,
        ];

        const latest = await latestTime();
        const unparsed = await fixedValidator.getValidatorState();
        const parsedConfig = deserializeFixedState({
          payload: unparsed,
          BigNumber,
        });

        const results = await expectedDatesArr.reduce(async (acc, date) => {
          const newAcc = await acc;
          const [validLdd] = getValidRangesForExpDate({
            lastBlockTimestamp: latest,
            expirationDate: date,
            configs: [parsedConfig],
            validatorTypes: [new BigNumber(validatorType.FIXED)],
          });
          const result = await this.dateKeeper.validate(
            [
              date,
              validLdd,
              validLdd,
              validLdd,
            ],
            {
              from: owner,
            }
          );
          return [
            ...newAcc,
            result,
          ];
        }, Promise.resolve([]));
        assert.equal(results.every(val => val === true), true);
      });

      // eslint-disable-next-line max-len
      it('returns false for any of the fixed dates post replacement with ldd not obeying modulo rule', async function () {
        const sliceAmt = 3;
        const fixedDatesArr = this.fixedDates[0];
        const toRemoveDates = fixedDatesArr.slice(0, sliceAmt);
        const toAddDates = new Array(fixedDatesArr.length)
          .fill(0)
          .map(
            (
              _,
              idx,
            ) => fixedDatesArr[fixedDatesArr.length - 1] + idx + 1
          );
        const toAddDatesIntervalStarts = toAddDates.map(() => dayInSeconds);
        const toAddDatesIntervalEnds = toAddDates.map(() => dayInSeconds.mul(new BigNumber(2)));
        const fixedValidatorAddress = await this.dateKeeper.getValidator(1);
        const fixedValidator = await FixedValidator.at(fixedValidatorAddress);

        await fixedValidator.replaceDates(
          toAddDates,
          toAddDatesIntervalStarts,
          toAddDatesIntervalEnds,
          toRemoveDates,
          { from: owner }
        ).should.be.fulfilled;
        const {
          0: fixedDates,
        } = await fixedValidator.getFixedDates();
        assert.equal(
          fixedDates.length,
          fixedDatesArr.length - toRemoveDates.length + toAddDates.length
        );
        const expectedDatesArr = [
          ...fixedDatesArr.slice(sliceAmt),
          ...toAddDates,
        ];

        const latest = await latestTime();
        const unparsed = await fixedValidator.getValidatorState();
        const parsedConfig = deserializeFixedState({
          payload: unparsed,
          BigNumber,
        });

        const results = await expectedDatesArr.reduce(async (acc, date) => {
          const newAcc = await acc;
          const [validLdd] = getValidRangesForExpDate({
            lastBlockTimestamp: latest,
            expirationDate: date,
            configs: [parsedConfig],
            validatorTypes: [new BigNumber(validatorType.FIXED)],
          });
          const invalidLdd = new BigNumber(validLdd)
            .add(new BigNumber(1));
          const result = await this.dateKeeper.validate(
            [
              date,
              validLdd,
              validLdd,
              invalidLdd,
            ],
            {
              from: owner,
            }
          );
          return [
            ...newAcc,
            result,
          ];
        }, Promise.resolve([]));
        assert.equal(results.every(val => val === true), false);
      });

      it('replaced fixed dates are not valid anymore', async function () {
        const sliceAmt = 3;
        const fixedDatesArr = this.fixedDates[0];
        const toRemoveDates = fixedDatesArr.slice(0, sliceAmt);
        const toAddDates = new Array(fixedDatesArr.length)
          .fill(0)
          .map(
            (
              _,
              idx,
            ) => fixedDatesArr[fixedDatesArr.length - 1] + idx + 1
          );
        const toAddDatesIntervalStarts = toAddDates.map(() => dayInSeconds);
        const toAddDatesIntervalEnds = toAddDates.map(() => dayInSeconds.mul(new BigNumber(2)));
        const fixedValidatorAddress = await this.dateKeeper.getValidator(1);
        const fixedValidator = await FixedValidator.at(fixedValidatorAddress);

        const latest = await latestTime();
        const unparsed = await fixedValidator.getValidatorState();
        const parsedConfig = deserializeFixedState({
          payload: unparsed,
          BigNumber,
        });

        await fixedValidator.replaceDates(
          toAddDates,
          toAddDatesIntervalStarts,
          toAddDatesIntervalEnds,
          toRemoveDates,
          { from: owner }
        ).should.be.fulfilled;
        const {
          0: fixedDates,
        } = await fixedValidator.getFixedDates();
        assert.equal(
          fixedDates.length,
          fixedDatesArr.length - toRemoveDates.length + toAddDates.length
        );

        const results = await toRemoveDates.reduce(async (acc, date) => {
          const newAcc = await acc;
          const [validLdd] = getValidRangesForExpDate({
            lastBlockTimestamp: latest,
            expirationDate: date,
            configs: [parsedConfig],
            validatorTypes: [new BigNumber(validatorType.FIXED)],
          });
          const result = await this.dateKeeper.validate(
            [
              date,
              validLdd,
              validLdd,
              validLdd,
            ],
            {
              from: owner,
            }
          );
          return [
            ...newAcc,
            result,
          ];
        }, Promise.resolve([]));
        assert.equal(results.every(val => val === false), true);
      });

      properImproper.forEach(
        (
          { type }
        ) => {
          const wrapToAssert = obj => type === proper ? assert.equal(obj, true) : assert.equal(obj, false);
          const text = type === proper ? 'True for proper' : 'False for improper';

          it(`returns ${text} expiration date`, async function () {
            wrapToAssert(
              await this.dateKeeper.validate(
                [
                  this.properImproperMap[type],
                  this.validLdd,
                  this.validLdd,
                  this.validLdd,
                ],
                { from: owner }
              )
            );
          });
        }
      );
    });

    it('proper data is returned from weekly validator', async function () {
      const validatorIdx = 0;
      const weeklyAddr = await this.dateKeeper.getValidator(validatorIdx);
      const weeklyValidator = await contractInstanceAt(AbstractValidator, weeklyAddr);
      const wState = await weeklyValidator.getValidatorState();
      const weeklyStateDeserialized = deserializeBasicPeriodState({
        payload: wState,
        BigNumber,
      });
      const sendData = this.dateKeeperParams.validators[validatorIdx];
      Object.keys(weeklyStateDeserialized).forEach((key) => {
        const configParam = parseMapConfigParamFromSentData({
          sendData,
          key,
        });

        if (BigNumber.isBN(configParam)) {
          configParam.should.be.bignumber.equal(weeklyStateDeserialized[key]);
        } else {
          assert.equal(configParam, weeklyStateDeserialized[key]);
        }
      });
    });

    it('proper data is returned from fixed validator', async function () {
      const validatorIdx = 1;
      const fixedAddr = await this.dateKeeper.getValidator(validatorIdx);
      const fixedValidator = await contractInstanceAt(AbstractValidator, fixedAddr);
      const fState = await fixedValidator.getValidatorState();
      const fixedStateDeserialized = deserializeFixedState({
        payload: fState,
        BigNumber,
      });
      const sendData = this.dateKeeperParams.validators[validatorIdx];
      Object.keys(fixedStateDeserialized).forEach((key) => {
        const configParam = parseMapConfigParamFromSentData({
          sendData,
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

  describe('Datekeeper with all 4 types of validators at once', function () {
    beforeEach(async function () {
      this.roleManager = await setupRoleManager([owner], [owner]);

      this.dateKeeper = await defaultBankDateKeeper({
        ctx: this,
        roleManagerAddr: this.roleManager.address,
        owner,
      });
    });

    it('can get all validators info', async function () {
      const {
        '1': receivedTypes,
        '2': receivedStates,
      } = await this.dateKeeper.getValidatorInfo();

      const deserializedStates = deserializeDateKeeperReturnPayload({
        payload: receivedStates,
        BigNumber,
        validatorTypes: receivedTypes,
      });
      deserializedStates.forEach((state, idx) => {
        const sendData = this.dateKeeperParams.validators[idx];
        Object.keys(state).forEach((key) => {
          const configParam = parseMapConfigParamFromSentData({
            sendData,
            key,
          });

          if (BigNumber.isBN(configParam)) {
            configParam.should.be.bignumber.equal(state[key]);
          } else if (Array.isArray(configParam)) {
            configParam.forEach((fixedItem, fixedIdx) => {
              fixedItem.should.be.bignumber.equal(state[key][fixedIdx]);
            });
          } else {
            assert.equal(configParam, state[key]);
          }
        });
      });
    });
  });
});
