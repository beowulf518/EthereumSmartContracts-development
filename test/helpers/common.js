import {
  BigNumber,
} from '@nomisma/nomisma-smart-contract-helpers';

export const getOriginBlock = async txHash => {
  const {
    blockNumber,
  } = await web3.eth.getTransaction(txHash);
  return blockNumber;
};

export const getTransactionGasCost = async function (txInfo) {
  const { gasPrice } = await web3.eth.getTransaction(txInfo.tx);
  return new BigNumber(gasPrice).mul(
    new BigNumber(txInfo.receipt.gasUsed)
  );
};

export const tokenAddressFromExchangeConnectorMock = async tx => {
  const {
    logs,
  } = await tx;
  const event = logs.find(e => e.event === 'TokenCreated');
  return event.args.token;
};

export const underlyingSetEthereumAddressCb = ctx => ctx.tokenManager.setEthereumAddress(
  ctx.underlyingAddress
);

export const defaultSetEthereumAddressCb = ctx => ctx.tokenManager.setEthereumAddress(
  ctx.baseAddress
);
