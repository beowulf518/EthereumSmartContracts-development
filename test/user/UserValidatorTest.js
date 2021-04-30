import {
  getChaiBN,
} from '@nomisma/nomisma-smart-contract-helpers';
import {
  revert as EVMrevert,
} from 'truffle-test-helpers';
import {
  setupRoleManager,
  BANK_USER_ROLE,
  CCP_USER_ROLE,
} from '../access/helpers/role-manager';
import {
  setupUserValidator,
} from './helpers/user-validator';

const RoleManagerMock = artifacts.require('./RoleManagerMock.sol');

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();

contract('UserValidator', function ([
  owner,
  userWhitelistAdmin,
  user1,
  user2,
]) {
  beforeEach(async function () {
    this.roleManager = await setupRoleManager([owner]);
    this.userValidator = await setupUserValidator(
      this.roleManager.address,
      owner,
      userWhitelistAdmin
    );
  });

  describe('#addUsersToWhitelist #validateUsers #removeUserFromWhitelist', function () {
    it('should validate ccp.user role for single user', async function () {
      await this.userValidator.addUsersToWhitelist([user1], [CCP_USER_ROLE],  {from: userWhitelistAdmin});

      const resultSuccess = await this.userValidator.validateUsers([user1], [CCP_USER_ROLE]);
      const resultFail = await this.userValidator.validateUsers([user1], [BANK_USER_ROLE]);
      assert.equal(resultSuccess, true);
      assert.equal(resultFail, false);
    });

    it('should validate multiple users with various user roles', async function () {
      const users = [user1, user2, user1];
      const roles = [CCP_USER_ROLE, BANK_USER_ROLE, BANK_USER_ROLE];
      await this.userValidator.addUsersToWhitelist(
        users,
        roles,
        {from: userWhitelistAdmin},
      );

      const validateSuccess = await this.userValidator.validateUsers(users, roles);
      assert.equal(validateSuccess, true);
      const incorrectRole = web3.utils.fromAscii('incorrect role');
      const validateFail2 = await this.userValidator.validateUsers(
        users,
        [CCP_USER_ROLE, incorrectRole, BANK_USER_ROLE]
      );

      await this.userValidator.removeUsersFromWhitelist([user1], [CCP_USER_ROLE], {from: userWhitelistAdmin});
      const validateFail = await this.userValidator.validateUsers(users, roles);
      const validateSuccess2 = await this.userValidator.validateUsers([user1], [BANK_USER_ROLE]);
      assert.equal(validateFail, false);
      assert.equal(validateSuccess2, true);
      assert.equal(validateFail2, false);
    });
  });

  describe('emit events #UserWhitelisted #UserRemovedFromWhitelist', function () {
    it('should emit UserWhitelisted event when adding new user', async function () {
      await this.userValidator.addUsersToWhitelist([user1], [CCP_USER_ROLE],  {from: userWhitelistAdmin});

      const whitelistEvent = await this.roleManager.getPastEvents('RoleAdded');
      const userFromEvent = whitelistEvent.find(
        e => e.event === 'RoleAdded').args.user;

      userFromEvent.should.be.equal(user1);
    });

    it('should emit UserRemovedFromWhitelist event when adding new user', async function () {
      await this.userValidator.addUsersToWhitelist(
        [user1],
        [CCP_USER_ROLE],
        {from: userWhitelistAdmin}
      );
      await this.userValidator.removeUsersFromWhitelist(
        [user1],
        [CCP_USER_ROLE],
        {from: userWhitelistAdmin}
      );

      const whitelistEvent = await this.roleManager.getPastEvents('RoleRemoved');
      const userFromEvent = whitelistEvent.find(
        e => e.event === 'RoleRemoved').args.user;

      userFromEvent.should.be.equal(user1);
    });
  });

  describe('Fallback function test', function () {
    it('fallback function should revert if role requirement is not met', async function () {
      await this.userValidator.appointAdmins([user2], {from: user1}).should.be.rejectedWith(EVMrevert);
    });

    it('fallback function should succeed if role requirement is met', async function () {
      await this.userValidator.appointAdmins([user1], {from: owner}).should.be.fulfilled;
    });

    it('Fallback function behaviour for calling view methods', async function () {
      await this.userValidator.appointAdmins([user1], {from: owner}).should.be.fulfilled;
      const isAdmin = await this.userValidator.isAdmin(user1);

      assert.equal(isAdmin, true);
    });

    it('Fallback function behaviour for state changing methods without defined sig should fail', async function () {
      const userValidatorMock = await RoleManagerMock.at(
        this.userValidator.address,
      );
      await userValidatorMock.appointGovernor(user1, {from: owner}).should.be.rejectedWith(EVMrevert);
    });
  });
});
