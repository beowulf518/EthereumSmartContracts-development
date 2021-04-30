import { roles } from '@nomisma/nomisma-smart-contract-helpers';

const RoleManager = artifacts.require('./RoleManager.sol');

export const {
  GOVERNOR_ROLE,
  ADMIN_ROLE,
  USER_WHITELIST_ADMIN_ROLE,
  CCP_USER_ROLE,
  BANK_USER_ROLE,
  UTILITY_ACCOUNT_ROLE,
  PRICE_ORACLE_ACCOUNT_ROLE_NAME,
} = roles;

export const setupRoleManager = async (
  governors,
  admins,
) => {
  const roleManager = await RoleManager.new(governors);
  if (typeof admins !== 'undefined' && admins.length > 0) {
    await roleManager.appointAdmins(admins, {from: governors[0]});
  }

  return roleManager;
};
