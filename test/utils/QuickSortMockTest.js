import {
  getChaiBN,
  BigNumber,
} from '@nomisma/nomisma-smart-contract-helpers';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();

const QuickSortMock = artifacts.require('./QuickSortMock.sol');

contract('QuickSortMock', function () {
  const one = '1';
  const two = '2';
  const three = '3';
  const four = '4';
  const five = '5';
  const arr = [four, five, three, one, two];
  beforeEach(async function () {
    this.quickSort = await QuickSortMock.new();
  });

  it('returns two arrays', async function () {
    const {
      0: sortedArr,
      1: sortedIdxesArr,
    } = await this.quickSort.sortMock(arr);
    assert.equal(sortedArr.length, arr.length);
    assert.equal(sortedIdxesArr.length, arr.length);
  });

  it('sorts array ascending', async function () {
    const { 0: sortedArr } = await this.quickSort.sortMock(arr);
    const sorted = arr.sort(
      (
        a,
        b
      ) => new BigNumber(a)
        .sub(
          new BigNumber(b)
        ).toNumber()
    );
    for (let i = 0; i < sorted.length; i++) {
      sortedArr[i].should.be.bignumber.equal(
        new BigNumber(
          sorted[i]
        )
      );
    }
  });

  it('during sorting proper initial item indexes are returned', async function () {
    const {
      0: sortedArr,
      1: sorterArrIdxes,
    } = await this.quickSort.sortMock(arr);
    for (let i = 0; i < arr.length; i++) {
      const idx = sorterArrIdxes[i];
      sortedArr[i].should.be.bignumber.equal(
        new BigNumber(arr[idx.toNumber()])
      );
    }
  });
});
