import {
  contractInstanceAt,
} from '@nomisma/nomisma-smart-contract-helpers';
import { setupResolver } from '../../../delegate/helpers/setup-resolver';

const TokenManagerBase = artifacts.require('./TokenManagerBase.sol');
const TokenManagerAdmin = artifacts.require('./TokenManagerAdmin.sol');
const TokenManagerAssets = artifacts.require('./TokenManagerAssets.sol');
const TokenManagerRouter = artifacts.require('./TokenManagerRouter.sol');
const TokenManagerMainInterface = artifacts.require('./TokenManagerMainInterface.sol');

export const setupTokenManager = async (
  roleManager,
  owner
) => {
  const tokenManagerBase = await TokenManagerBase.new();
  const tokenManagerAdmin = await TokenManagerAdmin.new();
  const tokenManagerAssets = await TokenManagerAssets.new();

  const resolver = await setupResolver(
    [
      tokenManagerBase,
      tokenManagerAdmin,
      tokenManagerAssets,
    ],
    roleManager.address,
    owner
  );

  const tokenManagerRouter = await TokenManagerRouter.new(
    roleManager.address,
    resolver.address,
    {
      from: owner,
    }
  );

  return await contractInstanceAt(
    TokenManagerMainInterface,
    tokenManagerRouter.address
  );
};
