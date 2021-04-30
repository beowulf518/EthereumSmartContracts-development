const TokenWrapper = artifacts.require('./TokenWrapper.sol');

export const setupTokenWrapper = async (
  tokenManager
) => {
  const tokenWrapper = await TokenWrapper.new();
  await tokenManager.setTokenWrapper(
    tokenWrapper.address
  );

  return tokenWrapper;
};
