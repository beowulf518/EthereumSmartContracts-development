import {
  CCP_USER_ROLE,
  setupRoleManager,
  USER_WHITELIST_ADMIN_ROLE,
} from '../../../access/helpers/role-manager';
import {
  setupErc1400,
  PARTITION1,
  VALUE,
  EMPTY,
  PARTITION2,
  PARTITION3,
} from '../helpers/erc1400';
import { revert as EVMRevert } from 'truffle-test-helpers';
import { getChaiBN } from '@nomisma/nomisma-smart-contract-helpers';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();

const RegistryMock = artifacts.require('./RegistryMock.sol');

contract('ERC20Security', function ([
  owner,
  user1,
  user2,
  user3,
  user4,
  user5,
]) {
  describe('#transfer', function () {
    beforeEach(async function () {
      this.roleManager = await setupRoleManager([owner], []);
      this.registry = await RegistryMock.new();
      // By default we need to make sure that registry does
      // identify transaction sender as valid contract
      // this needs to be explicitly toggled when we want to
      // simulate normal user transactions
      await this.registry.setValidContract(true);
      this.token = await setupErc1400({
        roleManager: this.roleManager,
        owner,
        registryAddress: this.registry.address,
      });
      await this.roleManager.addRoleForAddress(
        owner,
        USER_WHITELIST_ADMIN_ROLE,
        {
          from: owner,
        }
      );
      const users = [user1, user2, user3, user4, user5];
      const roles = [
        CCP_USER_ROLE,
        CCP_USER_ROLE,
        CCP_USER_ROLE,
        CCP_USER_ROLE,
        CCP_USER_ROLE,
      ];
      await this.roleManager.addUsersToWhitelist(
        users,
        roles,
        {
          from: owner,
        }
      );
    });

    it('should transfer when user has single partition', async function () {
      let user1Balance = await this.token.balanceOfByPartition(PARTITION1, user1);
      assert.equal(user1Balance, 0);

      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);
      user1Balance = await this.token.balanceOfByPartition(PARTITION1, user1);
      assert.equal(user1Balance, VALUE);

      await this.token.transfer(user2, VALUE * 0.5, {from: user1});
      user1Balance = await this.token.balanceOfByPartition(PARTITION1, user1);
      const user2Balance = await this.token.balanceOfByPartition(PARTITION1, user2);

      assert.equal(user1Balance, VALUE * 0.5);
      assert.equal(user2Balance, VALUE * 0.5);
    });

    it('should make multiple transfers for multiple partitions', async function () {
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);
      await this.token.issueByPartition(PARTITION2, user2, VALUE, EMPTY);

      // user4 has no partition
      await this.token.transfer(user1, VALUE * 0.1, {from: user4}).should.be.rejectedWith(EVMRevert);

      await this.token.transfer(user4, VALUE * 0.1, {from: user1});
      assert.equal(await this.token.balanceOfByPartition(PARTITION1, user4), VALUE * 0.1);

      await this.token.transfer(user4, VALUE * 0.1, {from: user2});
      assert.equal(await this.token.balanceOfByPartition(PARTITION2, user4), VALUE * 0.1);

      // user4 has already two partitions should use transferByPartition instead
      await this.token.transfer(user5, VALUE * 0.1, {from: user4}).should.be.rejectedWith(EVMRevert);

      await this.token.transferByPartition(PARTITION1, user5, VALUE * 0.1, EMPTY, {from: user4});
      assert.equal(await this.token.balanceOfByPartition(PARTITION1, user4), 0);
      assert.equal(await this.token.balanceOfByPartition(PARTITION2, user4), VALUE * 0.1);
      assert.equal(await this.token.balanceOfByPartition(PARTITION1, user5), VALUE * 0.1);
    });

    it('should transfer only tokens for specified partition', async function () {
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);
      await this.token.issueByPartition(PARTITION2, user1, VALUE, EMPTY);
      await this.token.issueByPartition(PARTITION3, user1, VALUE, EMPTY);

      // user4 has already three partitions should use transferByPartition instead
      await this.token.transfer(user2, VALUE * 0.5, {from: user1}).should.be.rejectedWith(EVMRevert);

      await this.token.transferByPartition(PARTITION1, user2, VALUE * 0.5, EMPTY, {from: user1});
      assert.equal(await this.token.balanceOfByPartition(PARTITION1, user1), VALUE * 0.5);
      assert.equal(await this.token.balanceOfByPartition(PARTITION2, user1), VALUE);
      assert.equal(await this.token.balanceOfByPartition(PARTITION3, user1), VALUE);

      assert.equal(await this.token.balanceOfByPartition(PARTITION1, user2), VALUE * 0.5);
      assert.equal(await this.token.balanceOfByPartition(PARTITION2, user2), 0);
      assert.equal(await this.token.balanceOfByPartition(PARTITION3, user2), 0);
    });
  });

  describe('#transferFrom', function () {
    beforeEach(async function () {
      this.roleManager = await setupRoleManager([owner], []);
      this.registry = await RegistryMock.new();
      // By default we need to make sure that registry does
      // identify owner as valid contract. Other addresses are
      // however not valid since non-participants of the protocol
      // should not be granted operator permissions.
      await this.registry.setValidContract(false);
      await this.registry.setOneOfMode(true);
      await this.registry.addOneOfContracts([owner]);
      this.token = await setupErc1400({
        roleManager: this.roleManager,
        owner,
        registryAddress: this.registry.address,
      });
      await this.roleManager.addRoleForAddress(
        owner,
        USER_WHITELIST_ADMIN_ROLE,
        {
          from: owner,
        }
      );
      const users = [user1, user2, user3, user4, user5];
      const roles = [
        CCP_USER_ROLE,
        CCP_USER_ROLE,
        CCP_USER_ROLE,
        CCP_USER_ROLE,
        CCP_USER_ROLE,
      ];
      await this.roleManager.addUsersToWhitelist(
        users,
        roles,
        {
          from: owner,
        }
      );
    });
    it('should transferFrom for single partition', async function () {
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );

      // no allowance given to user3
      await this.token.transferFrom(
        user1,
        user2,
        VALUE,
        {
          from: user3,
        },
      ).should.be.rejectedWith(EVMRevert);

      await this.token.approve(
        user3,
        VALUE * 0.1,
        {
          from: user1,
        }
      );

      await this.token.transferFrom(
        user1,
        user2,
        VALUE * 0.1,
        {
          from: user3,
        }
      ).should.be.fulfilled;
      assert.equal(
        await this.token.balanceOfByPartition(
          PARTITION1,
          user1
        ),
        VALUE * 0.9
      );
      assert.equal(
        await this.token.balanceOfByPartition(
          PARTITION1,
          user2,
        ),
        VALUE * 0.1
      );
    });

    it('should transferFrom for multiple partitions', async function () {
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );

      // no allowance given to user3
      await this.token.transferFrom(
        user1,
        user2,
        VALUE * 0.1,
        {
          from: user3,
        }
      ).should.be.rejectedWith(EVMRevert);
      await this.token.authorizeOperator(user3, {
        from: user1,
      });
      // no allowance given to user2
      // even he has his own tokens on PARTITION1 he cannot send tokens of user 1
      await this.token.transferFrom(
        user1,
        user2,
        VALUE * 0.1,
        {
          from: user3,
        }
      ).should.be.fulfilled;
    });
  });

  describe('#approve', function () {
    beforeEach(async function () {
      this.roleManager = await setupRoleManager([owner], []);
      this.registry = await RegistryMock.new();
      // By default we need to make sure that registry does
      // identify owner as valid contract. Other addresses are
      // however not valid since non-participants of the protocol
      // should not be granted operator permissions.
      await this.registry.setValidContract(false);
      await this.registry.setOneOfMode(true);
      await this.registry.addOneOfContracts([owner]);
      this.token = await setupErc1400({
        roleManager: this.roleManager,
        owner,
        registryAddress: this.registry.address,
      });
      await this.roleManager.addRoleForAddress(
        owner,
        USER_WHITELIST_ADMIN_ROLE,
        {
          from: owner,
        }
      );
      const users = [user1, user2, user3, user4, user5];
      const roles = [
        CCP_USER_ROLE,
        CCP_USER_ROLE,
        CCP_USER_ROLE,
        CCP_USER_ROLE,
        CCP_USER_ROLE,
      ];
      await this.roleManager.addUsersToWhitelist(
        users,
        roles,
        {
          from: owner,
        }
      );
    });

    it('should add operator after approval', async function () {
      let isOperator = await this.token.isOperator(
        user1,
        user2,
        VALUE,
        {
          from: owner,
        }
      );

      assert.equal(isOperator, false);

      await this.token.approve(
        user1,
        VALUE * 0.1,
        {
          from: user2,
        }
      );
      isOperator = await this.token.isOperator(
        user1,
        user2,
        VALUE,
        {
          from: owner,
        }
      );

      assert.equal(isOperator, true);
    });
  });
});
