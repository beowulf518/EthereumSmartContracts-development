import {
  getChaiBN,
} from '@nomisma/nomisma-smart-contract-helpers';
import {
  CCP_USER_ROLE,
  setupRoleManager,
  USER_WHITELIST_ADMIN_ROLE,
} from '../../../access/helpers/role-manager';
import {
  setupErc1400,
  assertErrorCode,
  ERROR_CODES,
  EMPTY,
  EMPTY_ADDRESS,
  PARTITION1,
  PARTITION2,
  VALUE,
} from '../helpers/erc1400';
import {revert as EVMRevert} from 'truffle-test-helpers';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();

const RegistryMock = artifacts.require('./RegistryMock.sol');

contract('ERC1594', function ([owner, user1, user2, spender]) {
  beforeEach(async function () {
    this.roleManager = await setupRoleManager([owner], []);
    this.registry = await RegistryMock.new();
    this.token = await setupErc1400({
      roleManager: this.roleManager,
      owner,
      registryAddress: this.registry.address,
    });
  });

  describe('#canTransfer', function () {
    it('should return error code if token holder has no active partition', async function () {
      const result = await this.token.canTransfer(user2, VALUE, EMPTY, {from: user1});

      assertErrorCode(result, ERROR_CODES.NO_PARTITION);
    });

    it('should return error code if token holder has more than one active partitions', async function () {
      await this.roleManager.addRoleForAddress(user1, CCP_USER_ROLE, {from: owner});
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);
      await this.token.issueByPartition(PARTITION2, user1, VALUE, EMPTY);

      const result = await this.token.canTransfer(user2, VALUE, EMPTY, {from: user1});

      assertErrorCode(result, ERROR_CODES.MORE_THAN_ONE_ACTIVE_PARTITION);
    });

    it('should return error code if incorrect amount send', async function () {
      await this.roleManager.addRoleForAddress(user1, CCP_USER_ROLE, {from: owner});
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);

      const result = await this.token.canTransfer(user2, 0, EMPTY, {from: user1});

      assertErrorCode(result, ERROR_CODES.INVALID_AMOUNT);
    });

    it('should return error code if empty receiver address', async function () {
      await this.roleManager.addRoleForAddress(user1, CCP_USER_ROLE, {from: owner});
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);

      const result = await this.token.canTransfer(EMPTY_ADDRESS, VALUE, EMPTY, {from: user1});

      assertErrorCode(result, ERROR_CODES.EMPTY_RECEIVER_ADDRESS);
    });

    it('should return error code if token holder tries to send more than he owns', async function () {
      await this.roleManager.addRoleForAddress(user1, CCP_USER_ROLE, {from: owner});
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);

      const result = await this.token.canTransfer(user2, VALUE * 2, EMPTY, {from: user1});

      assertErrorCode(result, ERROR_CODES.INSUFFICIENT_BALANCE);
    });

    // eslint-disable-next-line max-len
    it('should return error code if sender does not have required role - authorized operator by partition', async function () {
      await this.roleManager.addRoleForAddress(user1, CCP_USER_ROLE, {from: owner});
      await this.roleManager.addRoleForAddress(owner, CCP_USER_ROLE, {from: owner});
      await this.roleManager.addRoleForAddress(spender, CCP_USER_ROLE, {from: owner});
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);
      await this.registry.setValidContract(false);
      await this.roleManager.removeRoleForAddress(user1, CCP_USER_ROLE, {from: owner});

      const result = await this.token.canTransfer(user2, VALUE, EMPTY, {from: user1});

      assertErrorCode(result, ERROR_CODES.INVALID_SENDER);
    });

    it('should return error code if receiver does not have required role', async function () {
      await this.roleManager.addRoleForAddress(user1, CCP_USER_ROLE, {from: owner});
      await this.roleManager.addRoleForAddress(owner, CCP_USER_ROLE, {from: owner});
      await this.roleManager.addRoleForAddress(spender, CCP_USER_ROLE, {from: owner});
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);
      await this.registry.setValidContract(false);

      const result = await this.token.canTransfer(user2, VALUE, EMPTY, {from: user1});

      assertErrorCode(result, ERROR_CODES.INVALID_RECEIVER);
    });

    it('should return OK code successfully', async function () {
      await this.roleManager.addRoleForAddress(user1, CCP_USER_ROLE, {from: owner});
      await this.roleManager.addRoleForAddress(user2, CCP_USER_ROLE, {from: owner});
      await this.roleManager.addRoleForAddress(owner, CCP_USER_ROLE, {from: owner});
      await this.roleManager.addRoleForAddress(spender, CCP_USER_ROLE, {from: owner});
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);
      await this.registry.setValidContract(false);

      const result = await this.token.canTransfer(user2, VALUE, EMPTY, {from: user1});

      assertErrorCode(result, ERROR_CODES.OK_CODE, 'partition1');
    });
  });

  describe('#canTransferFrom', function () {
    it('should return error code if token holder has no active partition', async function () {
      const result = await this.token.canTransferFrom(user1, user2, VALUE, EMPTY, {from: spender});

      assertErrorCode(result, ERROR_CODES.NO_PARTITION);
    });

    it('should return error code if token holder has more than one active partitions', async function () {
      await this.roleManager.addRoleForAddress(user1, CCP_USER_ROLE, {from: owner});
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);
      await this.token.issueByPartition(PARTITION2, user1, VALUE, EMPTY);

      const result = await this.token.canTransferFrom(user1, user2, VALUE, EMPTY, {from: spender});

      assertErrorCode(result, ERROR_CODES.MORE_THAN_ONE_ACTIVE_PARTITION);
    });

    it('should return error code if incorrect amount send', async function () {
      await this.roleManager.addRoleForAddress(user1, CCP_USER_ROLE, {from: owner});
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);

      const result = await this.token.canTransferFrom(user1, user2, 0, EMPTY, {from: spender});

      assertErrorCode(result, ERROR_CODES.INVALID_AMOUNT);
    });

    it('should return error code if empty receiver address', async function () {
      await this.roleManager.addRoleForAddress(user1, CCP_USER_ROLE, {from: owner});
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);

      const result = await this.token.canTransferFrom(user1, EMPTY_ADDRESS, VALUE, EMPTY, {from: spender});

      assertErrorCode(result, ERROR_CODES.EMPTY_RECEIVER_ADDRESS);
    });

    it('should return error code if token holder tries to send more than he owns', async function () {
      await this.roleManager.addRoleForAddress(user1, CCP_USER_ROLE, {from: owner});
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);

      const result = await this.token.canTransferFrom(user1, user2, VALUE * 2, EMPTY, {from: spender});

      assertErrorCode(result, ERROR_CODES.INSUFFICIENT_BALANCE);
    });

    it('should return error code if no operator allowed and receiver does not have partition', async function () {
      await this.roleManager.addRoleForAddress(user1, CCP_USER_ROLE, {from: owner});
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);
      await this.registry.setValidContract(false);

      const result = await this.token.canTransferFrom(user1, user2, VALUE, EMPTY, {from: spender});

      assertErrorCode(result, ERROR_CODES.INSUFFICIENT_ALLOWANCE);
    });

    it('should return error code if no operator allowed and receiver already has partition', async function () {
      await this.roleManager.addRoleForAddress(user1, CCP_USER_ROLE, {from: owner});
      await this.roleManager.addRoleForAddress(user2, CCP_USER_ROLE, {from: owner});
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);
      await this.token.issueByPartition(PARTITION1, user2, VALUE, EMPTY);
      await this.registry.setValidContract(false);

      const result = await this.token.canTransferFrom(user1, user2, VALUE, EMPTY, {from: spender});

      assertErrorCode(result, ERROR_CODES.INSUFFICIENT_ALLOWANCE);
    });

    it('should return error code if sender does not have required role - authorized operator', async function () {
      await this.roleManager.addRoleForAddress(user1, CCP_USER_ROLE, {from: owner});
      await this.roleManager.addRoleForAddress(owner, CCP_USER_ROLE, {from: owner});
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);
      await this.token.authorizeOperator(spender, {from: user1});
      await this.registry.setValidContract(false);

      const result = await this.token.canTransferFrom(user1, user2, VALUE, EMPTY, {from: spender});

      assertErrorCode(result, ERROR_CODES.INVALID_SENDER);
    });

    // eslint-disable-next-line max-len
    it('should return error code if sender does not have required role - authorized operator by partition', async function () {
      await this.roleManager.addRoleForAddress(user1, CCP_USER_ROLE, {from: owner});
      await this.roleManager.addRoleForAddress(owner, CCP_USER_ROLE, {from: owner});
      await this.roleManager.addRoleForAddress(spender, CCP_USER_ROLE, {from: owner});
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);
      await this.token.authorizeOperatorByPartition(PARTITION1, spender, {from: user1});
      await this.registry.setValidContract(false);
      await this.roleManager.removeRoleForAddress(user1, CCP_USER_ROLE, {from: owner});

      const result = await this.token.canTransferFrom(user1, user2, VALUE, EMPTY, {from: spender});

      assertErrorCode(result, ERROR_CODES.INVALID_SENDER);
    });

    it('should return error code if receiver does not have required role', async function () {
      await this.roleManager.addRoleForAddress(user1, CCP_USER_ROLE, {from: owner});
      await this.roleManager.addRoleForAddress(owner, CCP_USER_ROLE, {from: owner});
      await this.roleManager.addRoleForAddress(spender, CCP_USER_ROLE, {from: owner});
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);
      await this.token.authorizeOperatorByPartition(PARTITION1, spender, {from: user1});
      await this.registry.setValidContract(false);

      const result = await this.token.canTransferFrom(user1, user2, VALUE, EMPTY, {from: spender});

      assertErrorCode(result, ERROR_CODES.INVALID_RECEIVER);
    });

    it('should return OK code successfully', async function () {
      await this.roleManager.addRoleForAddress(user1, CCP_USER_ROLE, {from: owner});
      await this.roleManager.addRoleForAddress(user2, CCP_USER_ROLE, {from: owner});
      await this.roleManager.addRoleForAddress(owner, CCP_USER_ROLE, {from: owner});
      await this.roleManager.addRoleForAddress(spender, CCP_USER_ROLE, {from: owner});
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);
      await this.token.authorizeOperatorByPartition(PARTITION1, spender, {from: user1});
      await this.registry.setValidContract(false);

      const result = await this.token.canTransferFrom(user1, user2, VALUE, EMPTY, {from: spender});

      const OK_WITH_PARTITION = Object.assign({}, ERROR_CODES.OK_CODE);
      OK_WITH_PARTITION.errorMessage = 'partition1';
      assertErrorCode(result, OK_WITH_PARTITION);
    });
  });

  describe('#transferWithData', function () {
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
      const users = [user1, user2];
      const roles = [CCP_USER_ROLE, CCP_USER_ROLE];
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

      await this.token.transferWithData(user2, VALUE * 0.5, EMPTY, {from: user1});
      user1Balance = await this.token.balanceOfByPartition(PARTITION1, user1);
      const user2Balance = await this.token.balanceOfByPartition(PARTITION1, user2);

      assert.equal(user1Balance, VALUE * 0.5);
      assert.equal(user2Balance, VALUE * 0.5);
    });
  });

  describe('#transferFromWithData', function () {
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
      const users = [user1, user2, spender];
      const roles = [
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
      await this.token.transferFromWithData(
        user1,
        user2,
        VALUE,
        EMPTY,
        {
          from: spender,
        },
      ).should.be.rejectedWith(EVMRevert);

      await this.token.approve(
        spender,
        VALUE * 0.1,
        {
          from: user1,
        }
      );

      await this.token.transferFromWithData(
        user1,
        user2,
        VALUE * 0.1,
        EMPTY,
        {
          from: spender,
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
  });
});
