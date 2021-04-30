import {
  USER_WHITELIST_ADMIN_ROLE,
} from '../../access/helpers/role-manager';

const CompanyMapper = artifacts.require('./CompanyMapper.sol');
const RoleManager = artifacts.require('./IRoleManager.sol');

export const setupCompanyMapper = async (
  roleManagerAddr,
  governor,
  userWhiteListAdmin
) => {
  const companyMapper = await CompanyMapper.new(roleManagerAddr);
  const roleManager = await RoleManager.at(roleManagerAddr);
  if (typeof userWhiteListAdmin !== 'undefined') {
    await roleManager.addRoleForAddress(userWhiteListAdmin, USER_WHITELIST_ADMIN_ROLE, {from: governor});
  }

  return companyMapper;
};

export const addTradersToInvestorsMapping = async (
  roleManagerAddr,
  governor,
  userWhiteListAdmin
) => {
  const companyMapper = await CompanyMapper.new(roleManagerAddr);
  const roleManager = await RoleManager.at(roleManagerAddr);
  if (typeof userWhiteListAdmin !== 'undefined') {
    await roleManager.addRoleForAddress(userWhiteListAdmin, USER_WHITELIST_ADMIN_ROLE, {from: governor});
  }

  return companyMapper;
};
