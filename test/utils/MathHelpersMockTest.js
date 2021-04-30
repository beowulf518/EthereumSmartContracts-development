import { ray } from '../helpers/constants';
import {
  getChaiBN,
  BigNumber,
} from '@nomisma/nomisma-smart-contract-helpers';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();

const MathHelpersMock = artifacts.require('./MathHelpersMock.sol');

contract('MathHelpersMock', function () {
  const one = '1';
  const two = '2';
  const three = '3';
  const four = '4';
  const five = '5';
  const six = '6';
  const evenArr = [four, three, five, one, two];
  const oddArr = [four, five, three, one, two, six];
  const oddArrWithNegativeValues = [-four, five, -three, one, -two, -six];
  const arrWithOutliers = [1, 3, 4, 4, 4, 4, 5, 5, 6, 6, 6, 7, 7, 7, 8, 9, 12, 52, 90, 13, 30];
  const arrWithoutOutliers = [1, 3, 4, 4, 4, 4, 5, 5, 6, 6, 6, 7, 7, 7, 8, 9, 12, 13];
  const expectedIndexesToKeep = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 19];

  beforeEach(async function () {
    this.mathHelpers = await MathHelpersMock.new();
  });

  describe('math helpers functions', function () {
    it('should find median for even length array', async function () {
      const median = await this.mathHelpers.getMedian(evenArr);
      median.should.be.bignumber.equal(
        new BigNumber(three)
          .mul(
            new BigNumber(10)
          )
      );
    });

    it('should find median for odd length array', async function () {
      const median = await this.mathHelpers.getMedian(oddArr);
      median.should.be.bignumber.equal(new BigNumber(35));
    });

    it('should compute absolute value for every element in array', async function () {
      const absArray = await this.mathHelpers.getAbsArray(oddArrWithNegativeValues);
      assert.equal(absArray.length, oddArrWithNegativeValues.length);
      for (let i = 0; i < absArray.length; i++) {
        absArray[i].should.be.bignumber.equal(
          new BigNumber(oddArr[i])
        );
      }
    });

    it('should subtract value from array', async function () {
      const subArray = await this.mathHelpers.subValueFromArray(oddArr, 5);
      assert.equal(subArray.length, oddArr.length);
      for (let i = 0; i < subArray.length; i++) {
        subArray[i].should.be.bignumber.equal(
          new BigNumber(oddArr[i] - 5)
        );
      }
    });

    it('should divide array by value', async function () {
      const divArray = await this.mathHelpers.divArrayWithValue(oddArr, 5);
      assert.equal(divArray.length, oddArr.length);
      for (let i = 0; i < divArray.length; i++) {
        divArray[i].should.be.bignumber.equal(
          new BigNumber(oddArr[i])
            .mul(ray)
            .div(
              new BigNumber(5)
            )
        );
      }
    });

    it('should multiply array by value', async function () {
      const mulArray = await this.mathHelpers.mulArrayWithValue(oddArr, 5);
      assert.equal(mulArray.length, oddArr.length);
      for (let i = 0; i < mulArray.length; i++) {
        mulArray[i].should.be.bignumber.equal(
          new BigNumber(oddArr[i])
            .mul(
              new BigNumber(5)
            )
        );
      }
    });

    it('should compute array sum', async function () {
      const sum = await this.mathHelpers.getArraySum(arrWithoutOutliers);
      const expectedSum = arrWithoutOutliers.reduce((a, b) => a + b, 0);
      sum.should.be.bignumber.equal(
        new BigNumber(expectedSum)
      );
    });

    it('should remove elements from uint array', async function () {
      const resultArray = await this.mathHelpers.removeElementsFromUintArray(arrWithOutliers, expectedIndexesToKeep);
      assert.equal(resultArray.length, arrWithoutOutliers.length);
      for (let i = 0; i < resultArray.length; i++) {
        resultArray[i].should.be.bignumber.equal(
          new BigNumber(arrWithoutOutliers[i])
        );
      }
    });
  });
});
