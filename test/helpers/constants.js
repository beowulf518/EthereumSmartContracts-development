import {
  BigNumber,
} from '@nomisma/nomisma-smart-contract-helpers';

export const premiumPercentage = new BigNumber(2);
export const underlyingRate = '10';
export const baseRate = '2';

export const defaultVote = web3.utils.toWei('10', 'finney');
export const defaultPayWeight = web3.utils.toWei('1', 'ether');
export const defaultNotional = web3.utils.toWei('220', 'finney');
export const defaultQBase = '10';
export const defaultQUnderlying = '1';
export const longCallOptionType = 0;
export const shortPutOptionType = 1;

export const day = 24 * 60 * 60;
export const decreaseInterval = 4 * 365 * day;
export const initialTotalRewardAmount = new BigNumber(100);
export const initialTokenBalance = web3.utils.toWei('10', 'finney');

export const ray = new BigNumber('10').pow(
  new BigNumber('27')
);

const baseMultiplierBaseBN = new BigNumber('10');
export const baseMultiplierBN = baseMultiplierBaseBN.pow(
  new BigNumber('18')
);

export const underlyingRateWithBaseMultiplier = new BigNumber(underlyingRate)
  .mul(baseMultiplierBN);
export const baseRateWithBaseMultiplier = new BigNumber(baseRate)
  .mul(baseMultiplierBN);

