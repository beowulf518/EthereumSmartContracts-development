import {
  USER_WHITELIST_ADMIN_ROLE,
  GOVERNOR_ROLE,
  ADMIN_ROLE,
} from '../../access/helpers/role-manager';

const UserValidator = artifacts.require('./UserValidator.sol');
const IUserValidator = artifacts.require('./IUserValidator');
const IRoleManager = artifacts.require('./IRoleManager.sol');

export const setupUserValidator = async (
  roleManagerAddr,
  owner,
  userWhiteListAdmin
) => {
  const _userValidator = await UserValidator.new(roleManagerAddr);
  const roleManager = await IRoleManager.at(roleManagerAddr);
  await roleManager.addRolesForAddresses(
    [
      _userValidator.address,
      _userValidator.address,
      _userValidator.address,
    ],
    [
      GOVERNOR_ROLE,
      USER_WHITELIST_ADMIN_ROLE,
      ADMIN_ROLE,
    ],
    { from: owner }
  );
  const userValidator = await IUserValidator.at(_userValidator.address);
  await userValidator.setIsEnabled(true);
  if (typeof userWhiteListAdmin !== 'undefined') {
    await userValidator.addRoleForAddress(
      userWhiteListAdmin,
      USER_WHITELIST_ADMIN_ROLE,
      {
        from: owner,
      }
    );
  }

  return userValidator;
};

export const whitelistUser = async (address, role, validator) => {
  const isWhitelisted = await validator.validateUsers([address], [role]);
  if(!isWhitelisted) {
    await validator.addUsersToWhitelist([address], [role]);
  }
};
