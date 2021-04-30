/*
This file contains tests for parts of DateUtils
which have not been tested during DateKeeper and Validators testing.
*/
import { BigNumber, getChaiBN } from '@nomisma/nomisma-smart-contract-helpers';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();

const DateUtilsMock = artifacts.require('./DateUtilsMock.sol');

contract('DateUtilsMock', function () {
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

  beforeEach(async function () {
    this.dateUtilsMock = await DateUtilsMock.new();

    this.properImproperMap = {
      [proper]: {
        year: new BigNumber(2019),
        month: new BigNumber(12),
        day: new BigNumber(7),
        hour: new BigNumber(19),
        minute: new BigNumber(9),
        second: new BigNumber(33),
        timestamp: new BigNumber(1472344422),
      },
      [improper]: {
        year: new BigNumber(1945),
        month: new BigNumber(13),
        day: new BigNumber(41),
        hour: new BigNumber(27),
        minute: new BigNumber(69),
        second: new BigNumber(96),
        timestamp: new BigNumber(1566952422),
      },
    };
  });

  const wrapToAssert = (obj, type) => type === proper ? assert.equal(obj, true) : assert.equal(obj, false);

  describe('#isValidDate()', function () {
    properImproper.forEach(
      ({ type }) => {
        const text = type === proper ? 'True for proper' : 'False for improper';

        it(`should return ${text} date`, async function () {
          wrapToAssert(
            await this.dateUtilsMock.isValidDate(
              this.properImproperMap[type].year,
              this.properImproperMap[type].month,
              this.properImproperMap[type].day
            ),
            type
          );
        });
      });
  });

  describe('#isValidDateTime()', function () {
    properImproper.forEach(
      ({ type }) => {
        const text = type === proper ? 'True for proper' : 'False for improper';

        it(`should return ${text} date-time`, async function () {
          wrapToAssert(
            await this.dateUtilsMock.isValidDateTime(
              this.properImproperMap[type].year,
              this.properImproperMap[type].month,
              this.properImproperMap[type].day,
              this.properImproperMap[type].hour,
              this.properImproperMap[type].minute,
              this.properImproperMap[type].second,
            ),
            type
          );
        });
      });
  });

  // describe('#isLeapYear()', function () {
  //   properImproper.forEach(
  //     ({ type }) => {
  //       const text = type === proper ? 'True for proper' : 'False for improper';

  //       it(`should return ${text} leap year timestamp`, async function () {
  //         wrapToAssert(
  //           await this.dateUtilsMock.isLeapYear(
  //             this.properImproperMap[type].timestamp
  //           ),
  //           type
  //         );
  //       });
  //     });
  // });

  describe('#getDaysInMonth()', function () {
    it('should return proper amount of days for a month', async function () {
      // Wednesday, 28 August 2019 г., 20:31:22
      const timestamp = new BigNumber(1567024282);
      const daysInAugust = new BigNumber(31);

      const daysInMonth = await this.dateUtilsMock.getDaysInMonth(timestamp);

      daysInMonth.should.be.bignumber.equal(daysInAugust);
    });
  });

  describe('#getWeekdayOfTheMonth()', function () {
    it('should return proper timestamp', async function () {
      // Wednesday, 28 August 2019 г., 20:31:22
      const timestamp = new BigNumber(1567024282);
      // Friday, 30 August 2019 г., 0:00:00
      const validTimestamp = new BigNumber(1567123200);
      const weekdayNumOfMonth = new BigNumber(5);
      const validWeekday = new BigNumber(5);

      const weekdayNumOut = await this.dateUtilsMock.getWeekdayOfTheMonth(
        timestamp,
        weekdayNumOfMonth,
        validWeekday,
        false
      );

      weekdayNumOut.should.be.bignumber.equal(validTimestamp);
    });
  });
});
