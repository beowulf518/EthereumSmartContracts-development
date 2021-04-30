const ExchangeConnectorMock = artifacts.require('./ExchangeConnectorMock.sol');


export const setupExConMock = async (
  roleManagerAddress,
  tokenManagerAddress
) => {
  const exchangeConnectorMock = await ExchangeConnectorMock.new(
    roleManagerAddress,
    tokenManagerAddress
  );
  return exchangeConnectorMock;
};
