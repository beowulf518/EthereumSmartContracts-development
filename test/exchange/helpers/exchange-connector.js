import { setupResolver } from '../../delegate/helpers/setup-resolver';
import { contractInstanceAt } from '@nomisma/nomisma-smart-contract-helpers';
const ExchangeConnector = artifacts.require('./ExchangeConnector.sol');
const ExchangeConnectorRouter = artifacts.require('./ExchangeConnectorRouter.sol');
const ExchangeConnectorInterface = artifacts.require('./ExchangeConnectorInterface.sol');


export const setupExchangeConnector = async ({
  kyberNetworkAddress,
  tokenManagerAddress,
  roleManager,
  owner,
}) => {
  const exchangeConnectorImpl = await ExchangeConnector.new();
  const resolver = await setupResolver(
    [
      exchangeConnectorImpl,
    ],
    roleManager.address,
    owner
  );
  const exchangeConnectorRouter = await ExchangeConnectorRouter.new(
    kyberNetworkAddress,
    roleManager.address,
    tokenManagerAddress,
    resolver.address,
    {
      from: owner,
    }
  );
  return contractInstanceAt(
    ExchangeConnectorInterface,
    exchangeConnectorRouter.address
  );
};
