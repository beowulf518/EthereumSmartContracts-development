import {
  bulkRegister,
  buildConfigs,
} from '@nomisma/nomisma-smart-contract-helpers';

const Resolver = artifacts.require('./Resolver.sol');


export const setupResolver = async (
  contracts,
  roleManagerAddr,
  owner
) => {
  const resolver = await Resolver.new(roleManagerAddr);
  const configs = await buildConfigs(contracts);

  await bulkRegister({
    resolver: resolver,
    contracts: contracts,
    configs: configs,
    owner,
  });

  return resolver;
};
