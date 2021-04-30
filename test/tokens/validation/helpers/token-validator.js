const TokenValidator = artifacts.require('./TokenValidator.sol');

export const setupTokenValidator = async (
  roleManager,
  admin,
  matrix,
  token
) => {
  const tokenValidator = await TokenValidator.new(roleManager.address);
  const tokens = matrix.map(({addr}) => addr);

  tokens.push(token);
  await tokenValidator.addTokensToWhitelist(
    tokens,
    {
      from: admin,
    }
  );

  return tokenValidator.address;
};

export const defaultTokenValidator = async (
  roleManagerAddr,
) => {
  return await TokenValidator.new(roleManagerAddr);
};
