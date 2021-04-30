import {
  getChaiBN,
  BigNumber,
} from '@nomisma/nomisma-smart-contract-helpers';
import {
  revert as EVMRevert,
} from 'truffle-test-helpers';
import {
  CCP_USER_ROLE,
  setupRoleManager,
} from '../../../access/helpers/role-manager';
import {
  assertErrorCode,
  EMPTY,
  EMPTY_ADDRESS,
  ERROR_CODES,
  PARTITION1,
  PARTITION2,
  PARTITION3,
  setupErc1400, toAsciiWithoutPadding,
  VALUE,
} from '../helpers/erc1400';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();

const RegistryMock = artifacts.require('./RegistryMock.sol');

contract('ERC1410', function ([
  owner,
  user1,
  user2,
  user3,
]) {
  describe('redeemByPartition', function () {
    beforeEach(async function () {
      this.roleManager = await setupRoleManager([owner], []);
      this.registry = await RegistryMock.new();
      // By default we need to make sure that registry does
      // identify transaction sender as valid contract
      // this needs to be explicitly toggled when we want to
      // simulate normal user transactions
      await this.registry.setValidContract(false);
      await this.registry.setOneOfMode(true);
      await this.registry.addOneOfContracts([owner]);
      this.token = await setupErc1400({
        roleManager: this.roleManager,
        owner,
        registryAddress: this.registry.address,
      });
    });

    it('can redeem tokens', async function () {
      await this.roleManager.addRoleForAddress(
        user1,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.registry.addOneOfContracts([owner]);
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      ).should.be.fulfilled;
      await this.token.redeemByPartition(
        PARTITION1,
        VALUE,
        EMPTY,
        {
          from: user1,
        }
      ).should.be.fulfilled;

      assert.equal(await this.token.balanceOfByPartition(PARTITION1, user1), 0);
    });

    it('can redeem tokens for multiple partitions', async function () {
      await this.roleManager.addRoleForAddress(
        user1,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.registry.addOneOfContracts([owner]);
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      ).should.be.fulfilled;
      await this.token.issueByPartition(
        PARTITION2,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      ).should.be.fulfilled;
      await this.token.issueByPartition(
        PARTITION3,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      ).should.be.fulfilled;
      await this.token.redeemByPartition(
        PARTITION1,
        VALUE,
        EMPTY,
        {
          from: user1,
        }
      ).should.be.fulfilled;

      await this.token.redeemByPartition(
        PARTITION2,
        VALUE / 2,
        EMPTY,
        {
          from: user1,
        }
      ).should.be.fulfilled;

      assert.equal(await this.token.balanceOfByPartition(PARTITION1, user1), 0);
      assert.equal(await this.token.balanceOfByPartition(PARTITION2, user1), VALUE / 2);
      assert.equal(await this.token.balanceOfByPartition(PARTITION3, user1), VALUE);
    });

    it('should revert token redemption if value is more than available balance', async function () {
      await this.roleManager.addRoleForAddress(
        user1,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.registry.addOneOfContracts([owner]);
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      ).should.be.fulfilled;
      await this.token.redeemByPartition(
        PARTITION1,
        VALUE * 2,
        EMPTY,
        {
          from: user1,
        }
      ).should.be.rejectedWith(EVMRevert);
    });

    it('should redeem tokens and delete partition if all tokens are redeemed', async function () {
      await this.roleManager.addRoleForAddress(
        user1,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.registry.addOneOfContracts([owner]);
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      ).should.be.fulfilled;
      await this.token.redeemByPartition(
        PARTITION1,
        VALUE - 1,
        EMPTY,
        {
          from: user1,
        }
      ).should.be.fulfilled;
      assert.equal(await this.token.balanceOfByPartition(PARTITION1, user1), 1);
      await this.token.redeemByPartition(
        PARTITION1,
        1,
        EMPTY,
        {
          from: user1,
        }
      ).should.be.fulfilled;
      const partitionsOfUser1 = await this.token.partitionsOf(user1);
      assert.equal(partitionsOfUser1.length, 0);
      assert.equal(await this.token.balanceOfByPartition(PARTITION1, user1), 0);
    });

    it('should emit even when redeeming tokens', async function () {
      await this.roleManager.addRoleForAddress(
        user1,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.registry.addOneOfContracts([owner]);
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      ).should.be.fulfilled;
      const { logs } = await this.token.redeemByPartition(
        PARTITION1,
        VALUE,
        EMPTY,
        {
          from: user1,
        }
      ).should.be.fulfilled;

      assert.equal(await this.token.balanceOfByPartition(PARTITION1, user1), 0);
      const event = logs.find(e => e.event === 'RedeemedByPartition');
      assert.equal(event.args.partition, PARTITION1);
      assert.equal(event.args.operator, EMPTY_ADDRESS);
      assert.equal(event.args.from, user1);
      assert.equal(event.args.amount, VALUE);
      assert.equal(event.args.operatorData, EMPTY);
    });
  });

  describe('operatorRedeemByPartition', function () {
    beforeEach(async function () {
      this.roleManager = await setupRoleManager([owner], []);
      this.registry = await RegistryMock.new();
      // By default we need to make sure that registry does
      // identify transaction sender as valid contract
      // this needs to be explicitly toggled when we want to
      // simulate normal user transactions
      await this.registry.setValidContract(false);
      await this.registry.setOneOfMode(true);
      await this.registry.addOneOfContracts([owner]);
      this.token = await setupErc1400({
        roleManager: this.roleManager,
        owner,
        registryAddress: this.registry.address,
      });
    });

    it('can redeem tokens when operator is authorized', async function () {
      await this.roleManager.addRoleForAddress(
        user1,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.registry.addOneOfContracts([owner]);
      await this.token.authorizeOperator(
        user2,
        {
          from: user1,
        }
      ).should.be.fulfilled;
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      ).should.be.fulfilled;
      await this.token.operatorRedeemByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: user2,
        }
      ).should.be.fulfilled;

      assert.equal(await this.token.balanceOfByPartition(PARTITION1, user1), 0);
    });

    it('can redeem tokens when operator is authorized for partition', async function () {
      await this.roleManager.addRoleForAddress(
        user1,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.registry.addOneOfContracts([owner]);
      await this.token.authorizeOperatorByPartition(
        PARTITION1,
        user2,
        {
          from: user1,
        }
      ).should.be.fulfilled;
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      ).should.be.fulfilled;
      await this.token.operatorRedeemByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: user2,
        }
      ).should.be.fulfilled;

      assert.equal(await this.token.balanceOfByPartition(PARTITION1, user1), 0);
    });

    it('should revert token redemption if operator is authorized for different partition', async function () {
      await this.roleManager.addRoleForAddress(
        user1,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.registry.addOneOfContracts([owner]);
      await this.token.authorizeOperatorByPartition(
        PARTITION2,
        user2,
        {
          from: user1,
        }
      ).should.be.fulfilled;
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      ).should.be.fulfilled;
      await this.token.operatorRedeemByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: user2,
        }
      ).should.be.rejectedWith(EVMRevert);
    });

    it('should revert token redemption if value is more than available balance', async function () {
      await this.roleManager.addRoleForAddress(
        user1,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.registry.addOneOfContracts([owner]);
      await this.token.authorizeOperatorByPartition(
        PARTITION1,
        user2,
        {
          from: user1,
        }
      ).should.be.fulfilled;
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      ).should.be.fulfilled;
      await this.token.operatorRedeemByPartition(
        PARTITION1,
        user1,
        VALUE * 2,
        EMPTY,
        {
          from: user2,
        }
      ).should.be.rejectedWith(EVMRevert);
    });

    it('should redeem tokens and delete partition if all tokens are redeemed', async function () {
      await this.roleManager.addRoleForAddress(
        user1,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.registry.addOneOfContracts([owner]);
      await this.token.authorizeOperatorByPartition(
        PARTITION1,
        user2,
        {
          from: user1,
        }
      ).should.be.fulfilled;
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      ).should.be.fulfilled;
      await this.token.operatorRedeemByPartition(
        PARTITION1,
        user1,
        VALUE - 1,
        EMPTY,
        {
          from: user2,
        }
      ).should.be.fulfilled;
      assert.equal(await this.token.balanceOfByPartition(PARTITION1, user1), 1);
      await this.token.operatorRedeemByPartition(
        PARTITION1,
        user1,
        1,
        EMPTY,
        {
          from: user2,
        }
      ).should.be.fulfilled;
      const partitionsOfUser1 = await this.token.partitionsOf(user1);
      assert.equal(partitionsOfUser1.length, 0);
      assert.equal(await this.token.balanceOfByPartition(PARTITION1, user1), 0);
    });

    it('should emit even when redeeming tokens', async function () {
      await this.roleManager.addRoleForAddress(
        user1,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.registry.addOneOfContracts([owner]);
      await this.token.authorizeOperatorByPartition(
        PARTITION1,
        user2,
        {
          from: user1,
        }
      ).should.be.fulfilled;
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      ).should.be.fulfilled;
      const { logs } = await this.token.operatorRedeemByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: user2,
        }
      ).should.be.fulfilled;

      assert.equal(await this.token.balanceOfByPartition(PARTITION1, user1), 0);
      const event = logs.find(e => e.event === 'RedeemedByPartition');
      assert.equal(event.args.partition, PARTITION1);
      assert.equal(event.args.operator, user2);
      assert.equal(event.args.from, user1);
      assert.equal(event.args.amount, VALUE);
      assert.equal(event.args.operatorData, EMPTY);
    });
  });

  describe('#canTransferByPartition', function () {
    beforeEach(async function () {
      this.roleManager = await setupRoleManager([owner], []);
      this.registry = await RegistryMock.new();
      this.token = await setupErc1400({
        roleManager: this.roleManager,
        owner,
        registryAddress: this.registry.address,
      });
    });

    it('should return correct error code', async function () {
      // Partition not yet created
      let result = await this.token.canTransferByPartition(
        user1,
        user2,
        PARTITION1,
        VALUE,
        EMPTY,
        {
          from: user1,
        },
      );
      assertErrorCode(
        result,
        ERROR_CODES.INVALID_PARTITION
      );

      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: user1,
        }
      );
      result = await this.token.canTransferByPartition(
        user1,
        user2,
        PARTITION1,
        0,
        EMPTY,
        {
          from: user1,
        },
      );
      assertErrorCode(
        result,
        ERROR_CODES.INVALID_AMOUNT
      );

      result = await this.token.canTransferByPartition(
        user1,
        user2,
        PARTITION1,
        VALUE * 2,
        EMPTY,
        {
          from: user1,
        },
      );
      assertErrorCode(
        result,
        ERROR_CODES.INSUFFICIENT_BALANCE
      );

      // receiver address is 0
      result = await this.token.canTransferByPartition(
        user1,
        EMPTY_ADDRESS,
        PARTITION1,
        VALUE,
        EMPTY,
        {
          from: user1,
        },
      );
      assertErrorCode(
        result,
        ERROR_CODES.ZEROX_ADDRESS_NOT_ALLOWED
      );

      // Successful transfer
      result = await this.token.canTransferByPartition(
        user1,
        user2,
        PARTITION1,
        VALUE,
        EMPTY,
        {
          from: user1,
        },
      );
      assertErrorCode(
        result,
        ERROR_CODES.OK_CODE,
        toAsciiWithoutPadding(PARTITION1),
      );
    });

    it('should return error code if incorrect amount send', async function () {
      await this.roleManager.addRoleForAddress(user1, CCP_USER_ROLE, {from: owner});
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);

      const result = await this.token.canTransferByPartition(user1, user2, PARTITION1, 0, EMPTY, {from: user1});

      assertErrorCode(result, ERROR_CODES.INVALID_AMOUNT);
    });

    it('should return error code if empty receiver address', async function () {
      await this.roleManager.addRoleForAddress(user1, CCP_USER_ROLE, {from: owner});
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);

      const result = await this.token.canTransferByPartition(
        user1,
        EMPTY_ADDRESS,
        PARTITION1,
        VALUE,
        EMPTY,
        {from: user1}
      );

      assertErrorCode(result, ERROR_CODES.EMPTY_RECEIVER_ADDRESS);
    });

    it('should return error code if token holder tries to send more than he owns', async function () {
      await this.roleManager.addRoleForAddress(user1, CCP_USER_ROLE, {from: owner});
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);

      const result = await this.token.canTransferByPartition(
        user1,
        user2,
        PARTITION1,
        VALUE * 2,
        EMPTY,
        {from: user1}
      );

      assertErrorCode(result, ERROR_CODES.INSUFFICIENT_BALANCE);
    });

    // eslint-disable-next-line max-len
    it('should return error code if sender does not have required role - authorized operator by partition', async function () {
      await this.roleManager.addRoleForAddress(user1, CCP_USER_ROLE, {from: owner});
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);
      await this.registry.setValidContract(false);
      await this.roleManager.removeRoleForAddress(user1, CCP_USER_ROLE, {from: owner});

      const result = await this.token.canTransferByPartition(
        user1,
        user2,
        PARTITION1,
        VALUE,
        EMPTY,
        {from: user1}
      );

      assertErrorCode(result, ERROR_CODES.INVALID_SENDER);
    });

    it('should return error code if receiver does not have required role', async function () {
      await this.roleManager.addRoleForAddress(user1, CCP_USER_ROLE, {from: owner});
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);
      await this.registry.setValidContract(false);

      const result = await this.token.canTransferByPartition(
        user1,
        user2,
        PARTITION1,
        VALUE,
        EMPTY,
        {from: user1}
      );

      assertErrorCode(result, ERROR_CODES.INVALID_RECEIVER);
    });

    it('should return OK code successfully', async function () {
      await this.roleManager.addRoleForAddress(user1, CCP_USER_ROLE, {from: owner});
      await this.roleManager.addRoleForAddress(user2, CCP_USER_ROLE, {from: owner});
      await this.token.issueByPartition(PARTITION1, user1, VALUE, EMPTY);
      await this.registry.setValidContract(false);

      const result = await this.token.canTransferByPartition(
        user1,
        user2,
        PARTITION1,
        VALUE,
        EMPTY,
        {from: user1}
      );

      assertErrorCode(result, ERROR_CODES.OK_CODE, 'partition1');
    });
  });

  describe('operator related authorize-revoke', function () {
    beforeEach(async function () {
      this.roleManager = await setupRoleManager([owner], []);
      this.registry = await RegistryMock.new();
      // By default we need to make sure that registry does
      // not identify transaction sender as valid contract
      // since non-participants of the protocol should not be
      // granted operator permissions so tests that require
      // registry to appoint someone as an operator or revoke
      // respective rights should be defined explicitly
      await this.registry.setValidContract(false);
      this.token = await setupErc1400({
        roleManager: this.roleManager,
        owner,
        registryAddress: this.registry.address,
      });
    });

    describe('authorizeOperator', function () {
      it('changes the state variable', async function () {
        await this.roleManager.addRoleForAddress(
          user1,
          CCP_USER_ROLE,
          {
            from: owner,
          }
        );
        await this.roleManager.addRoleForAddress(
          user2,
          CCP_USER_ROLE,
          {
            from: owner,
          }
        );
        await this.token.authorizeOperator(
          user1,
          {
            from: user2,
          }
        ).should.be.fulfilled;
        const authorized = await this.token.isOperator(user1, user2);
        assert.equal(authorized, true);
      });

      // eslint-disable-next-line max-len
      it('registry verified contract can be appointed as operator without the need to add appropriate role to rolemanager', async function () {
        await this.roleManager.addRoleForAddress(
          user2,
          CCP_USER_ROLE,
          {
            from: owner,
          }
        );
        await this.registry.setOneOfMode(true);
        await this.registry.addOneOfContracts([user1]);

        await this.token.authorizeOperator(
          user1,
          {
            from: user2,
          }
        ).should.be.fulfilled;

        const authorized = await this.token.isOperator(user1, user2);
        assert.equal(authorized, true);
      });

      // eslint-disable-next-line max-len
      it('registry verified contract can appoint other rolemanager verified address as operator without the need to add appropriate role to rolemanager for registry verified contract itself', async function () {
        await this.roleManager.addRoleForAddress(
          user1,
          CCP_USER_ROLE,
          {
            from: owner,
          }
        );
        await this.registry.setOneOfMode(true);
        await this.registry.addOneOfContracts([user2]);

        await this.token.authorizeOperator(
          user1,
          {
            from: user2,
          }
        ).should.be.fulfilled;

        const authorized = await this.token.isOperator(user1, user2);
        assert.equal(authorized, true);
      });

      // eslint-disable-next-line max-len
      it('registry verified contract can appoint other registry verified contract as operator without the need to add appropriate roles to rolemanager', async function () {
        await this.registry.setOneOfMode(true);
        await this.registry.addOneOfContracts([user1, user2]);

        await this.token.authorizeOperator(
          user1,
          {
            from: user2,
          }
        ).should.be.fulfilled;

        const authorized = await this.token.isOperator(user1, user2);
        assert.equal(authorized, true);
      });

      it('can not authorize non-participant of the system', async function () {
        await this.token.authorizeOperator(
          user2,
          {
            from: user1,
          }
        ).should.be.rejectedWith(EVMRevert);
      });

      it('non-participant of the system can not authorize participant of the system', async function () {
        await this.roleManager.addRoleForAddress(
          user1,
          CCP_USER_ROLE,
          {
            from: owner,
          }
        );
        await this.token.authorizeOperator(
          user1,
          {
            from: user2,
          }
        ).should.be.rejectedWith(EVMRevert);
      });

      it('emits event with appropriate arguments', async function () {
        await this.registry.setOneOfMode(true);
        await this.registry.addOneOfContracts([user1, user2]);

        const { logs } = await this.token.authorizeOperator(
          user1,
          {
            from: user2,
          }
        );

        const event = logs.find(e => e.event === 'AuthorizedOperator');
        assert.equal(event.args.operator, user1);
        assert.equal(event.args.tokenHolder, user2);
      });
    });

    describe('revokeOperator', function () {
      it('changes the state variable', async function () {
        await this.roleManager.addRoleForAddress(
          user1,
          CCP_USER_ROLE,
          {
            from: owner,
          }
        );
        await this.roleManager.addRoleForAddress(
          user2,
          CCP_USER_ROLE,
          {
            from: owner,
          }
        );
        await this.token.authorizeOperator(
          user1,
          {
            from: user2,
          }
        ).should.be.fulfilled;
        const authorized = await this.token.isOperator(
          user1,
          user2
        );
        assert.equal(authorized, true);
        await this.token.revokeOperator(
          user1,
          {
            from: user2,
          }
        ).should.be.fulfilled;

        const notAuthorized = await this.token.isOperator(
          user1,
          user2
        );

        assert.equal(notAuthorized, false);
      });

      // eslint-disable-next-line max-len
      it('registry verified contract can be revoked of its operator rights without the need to add appropriate role to rolemanager for registry verified contract', async function () {
        await this.roleManager.addRoleForAddress(
          user2,
          CCP_USER_ROLE,
          {
            from: owner,
          }
        );
        await this.registry.setOneOfMode(true);
        await this.registry.addOneOfContracts([user1]);
        await this.token.authorizeOperator(
          user1,
          {
            from: user2,
          }
        ).should.be.fulfilled;
        const authorized = await this.token.isOperator(
          user1,
          user2
        );
        assert.equal(authorized, true);

        await this.token.revokeOperator(
          user1,
          {
            from: user2,
          }
        ).should.be.fulfilled;

        await this.registry.setOneOfMode(false);
        const notAuthorized = await this.token.isOperator(
          user1,
          user2
        );
        assert.equal(notAuthorized, false);
      });

      // eslint-disable-next-line max-len
      it('registry verified contract can revoke other rolemanager verified address from its operator rights without the need to add appropriate role to rolemanager for registry verified contract itself', async function () {
        await this.roleManager.addRoleForAddress(
          user1,
          CCP_USER_ROLE,
          {
            from: owner,
          }
        );
        await this.registry.setOneOfMode(true);
        await this.registry.addOneOfContracts([user2]);
        await this.token.authorizeOperator(
          user1,
          {
            from: user2,
          }
        ).should.be.fulfilled;
        const authorized = await this.token.isOperator(
          user1,
          user2
        );
        assert.equal(authorized, true);

        await this.token.revokeOperator(
          user1,
          {
            from: user2,
          }
        ).should.be.fulfilled;

        await this.registry.setOneOfMode(false);
        const notAuthorized = await this.token.isOperator(
          user1,
          user2
        );
        assert.equal(notAuthorized, false);
      });

      // eslint-disable-next-line max-len
      it('registry verified contract can revoke other registry verified contract rights as operator without the need to add appropriate roles to rolemanager', async function () {
        await this.registry.setOneOfMode(true);
        await this.registry.addOneOfContracts([user1, user2]);
        await this.token.authorizeOperator(
          user1,
          {
            from: user2,
          }
        ).should.be.fulfilled;
        const authorized = await this.token.isOperator(
          user1,
          user2
        );
        assert.equal(authorized, true);

        await this.token.revokeOperator(
          user1,
          {
            from: user2,
          }
        ).should.be.fulfilled;

        await this.registry.setOneOfMode(false);
        const notAuthorized = await this.token.isOperator(
          user1,
          user2
        );
        assert.equal(notAuthorized, false);
      });

      it('emits event with appropriate arguments', async function () {
        await this.registry.setOneOfMode(true);
        await this.registry.addOneOfContracts([user1, user2]);
        await this.token.authorizeOperator(
          user1,
          {
            from: user2,
          }
        ).should.be.fulfilled;
        const authorized = await this.token.isOperator(
          user1,
          user2
        );
        assert.equal(authorized, true);

        const { logs } = await this.token.revokeOperator(
          user1,
          {
            from: user2,
          }
        );

        const event = logs.find(e => e.event === 'RevokedOperator');
        assert.equal(event.args.operator, user1);
        assert.equal(event.args.tokenHolder, user2);
      });
    });
  });

  describe('operatorTransferByPartition', function () {
    beforeEach(async function () {
      this.roleManager = await setupRoleManager([owner], []);
      this.registry = await RegistryMock.new();
      // By default we need to make sure that registry does
      // not identify transaction sender as valid contract
      // since non-participants of the protocol should not be
      // granted operator permissions so tests that require
      // registry to appoint someone as an operator or revoke
      // respective rights should be defined explicitly
      await this.registry.setValidContract(false);
      this.token = await setupErc1400({
        roleManager: this.roleManager,
        owner,
        registryAddress: this.registry.address,
      });
      await this.roleManager.addRoleForAddress(
        user1,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
    });

    it('assigned global per-user operator can transfer', async function () {
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.roleManager.addRoleForAddress(
        user3,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.registry.setOneOfMode(true);
      await this.registry.addOneOfContracts([owner]);
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      await this.token.authorizeOperator(
        user2,
        {
          from: user1,
        }
      ).should.be.fulfilled;
      await this.token.operatorTransferByPartition(
        PARTITION1,
        user1,
        user3,
        VALUE,
        EMPTY,
        EMPTY,
        {
          from: user2,
        }
      ).should.be.fulfilled;
    });

    it('assigned by-partition per-user operator can transfer', async function () {
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.roleManager.addRoleForAddress(
        user3,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.registry.setOneOfMode(true);
      await this.registry.addOneOfContracts([owner]);
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      await this.token.authorizeOperatorByPartition(
        PARTITION1,
        user2,
        {
          from: user1,
        }
      ).should.be.fulfilled;
      await this.token.operatorTransferByPartition(
        PARTITION1,
        user1,
        user3,
        VALUE,
        EMPTY,
        EMPTY,
        {
          from: user2,
        }
      ).should.be.fulfilled;
    });

    // eslint-disable-next-line max-len
    it('registry approved contract operator can not transfer if destination user is not whitelisted', async function () {
      await this.registry.setOneOfMode(true);
      await this.registry.addOneOfContracts([owner]);
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      await this.token.operatorTransferByPartition(
        PARTITION1,
        user1,
        user3,
        VALUE,
        EMPTY,
        EMPTY,
        {
          from: owner,
        }
      ).should.be.rejectedWith(EVMRevert);
    });

    it('registry approved contract operator can transfer', async function () {
      await this.roleManager.addRoleForAddress(
        user3,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.registry.setOneOfMode(true);
      await this.registry.addOneOfContracts([owner]);
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      await this.token.operatorTransferByPartition(
        PARTITION1,
        user1,
        user3,
        VALUE,
        EMPTY,
        EMPTY,
        {
          from: owner,
        }
      ).should.be.fulfilled;
    });

    it('can not transfer by partition for partition that does not exist', async function () {
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.registry.setOneOfMode(true);
      await this.registry.addOneOfContracts([owner]);
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      await this.token.operatorTransferByPartition(
        PARTITION2,
        user1,
        user3,
        VALUE,
        EMPTY,
        EMPTY,
        {
          from: owner,
        }
      ).should.be.rejectedWith(EVMRevert);
    });

    it('can not transfer by partition with value higher than balance of user for partition', async function () {
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.roleManager.addRoleForAddress(
        user3,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.registry.setOneOfMode(true);
      await this.registry.addOneOfContracts([owner]);
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      await this.token.authorizeOperator(
        user2,
        {
          from: user1,
        }
      ).should.be.fulfilled;
      await this.token.operatorTransferByPartition(
        PARTITION1,
        user1,
        user3,
        VALUE * 2,
        EMPTY,
        EMPTY,
        {
          from: user2,
        }
      ).should.be.rejectedWith(EVMRevert);
    });

    it('can not transfer by partition with 0 value', async function () {
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.roleManager.addRoleForAddress(
        user3,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.registry.setOneOfMode(true);
      await this.registry.addOneOfContracts([owner]);
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      await this.token.authorizeOperator(
        user2,
        {
          from: user1,
        }
      ).should.be.fulfilled;
      await this.token.operatorTransferByPartition(
        PARTITION1,
        user1,
        user3,
        0,
        EMPTY,
        EMPTY,
        {
          from: user2,
        }
      ).should.be.rejectedWith(EVMRevert);
    });

    it('can not transfer by partition to 0 address', async function () {
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.roleManager.addRoleForAddress(
        user3,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.registry.setOneOfMode(true);
      await this.registry.addOneOfContracts([owner]);
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      await this.token.authorizeOperator(
        user2,
        {
          from: user1,
        }
      ).should.be.fulfilled;
      await this.token.operatorTransferByPartition(
        PARTITION1,
        user1,
        EMPTY_ADDRESS,
        VALUE,
        EMPTY,
        EMPTY,
        {
          from: user2,
        }
      ).should.be.rejectedWith(EVMRevert);
    });

    it('can not transfer by if to address has no permission', async function () {
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.registry.setOneOfMode(true);
      await this.registry.addOneOfContracts([owner]);
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      await this.token.authorizeOperator(
        user2,
        {
          from: user1,
        }
      ).should.be.fulfilled;
      await this.token.operatorTransferByPartition(
        PARTITION1,
        user1,
        user3,
        VALUE,
        EMPTY,
        EMPTY,
        {
          from: user2,
        }
      ).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('transferByPartition', function () {
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
        user1,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
    });

    it('can transfer by partition', async function () {
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      await this.registry.setValidContract(false);
      await this.token.transferByPartition(
        PARTITION1,
        user2,
        VALUE,
        EMPTY,
        {
          from: user1,
        }
      ).should.be.fulfilled;
    });

    // eslint-disable-next-line max-len
    it('after transfer from address balance for partition and overall balance are decreased and to address balances are increased', async function () {
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      await this.registry.setValidContract(false);
      await this.token.transferByPartition(
        PARTITION1,
        user2,
        VALUE,
        EMPTY,
        {
          from: user1,
        }
      ).should.be.fulfilled;
      const expectedValueUser2 = new BigNumber(VALUE);
      const expectedValueUser1 = new BigNumber(0);
      const overalBalanceUser1 = await this.token.balanceOf(
        user1,
      );
      const overalBalanceUser2 = await this.token.balanceOf(
        user2,
      );
      overalBalanceUser1.should.be.bignumber.equal(expectedValueUser1);
      overalBalanceUser2.should.be.bignumber.equal(expectedValueUser2);
      const partitionBalanceUser1 = await this.token.balanceOfByPartition(
        PARTITION1,
        user1,
      );
      const partitionBalanceUser2 = await this.token.balanceOfByPartition(
        PARTITION1,
        user2,
      );
      partitionBalanceUser1.should.be.bignumber.equal(expectedValueUser1);
      partitionBalanceUser2.should.be.bignumber.equal(expectedValueUser2);
      const totalSupply = await this.token.totalSupply();
      totalSupply.should.be.bignumber.equal(expectedValueUser2);
    });

    it('can not transfer by partition for partition that does not exist', async function () {
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.registry.setValidContract(false);
      await this.token.transferByPartition(
        PARTITION1,
        user2,
        VALUE,
        EMPTY,
        {
          from: user1,
        }
      ).should.be.rejectedWith(EVMRevert);
    });

    it('can not transfer by partition with value higher than balance of user for partition', async function () {
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      await this.registry.setValidContract(false);
      await this.token.transferByPartition(
        PARTITION1,
        user2,
        VALUE * 2,
        EMPTY,
        {
          from: user1,
        }
      ).should.be.rejectedWith(EVMRevert);
    });

    it('can not transfer by partition with 0 value', async function () {
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      await this.registry.setValidContract(false);
      await this.token.transferByPartition(
        PARTITION1,
        user2,
        0,
        EMPTY,
        {
          from: user1,
        }
      ).should.be.rejectedWith(EVMRevert);
    });

    it('can not transfer by partition to 0 address', async function () {
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      await this.registry.setValidContract(false);
      await this.token.transferByPartition(
        PARTITION1,
        EMPTY_ADDRESS,
        VALUE,
        EMPTY,
        {
          from: user1,
        }
      ).should.be.rejectedWith(EVMRevert);
    });

    it('can not transfer by if to address has no permission', async function () {
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      await this.registry.setValidContract(false);
      await this.token.transferByPartition(
        PARTITION1,
        user2,
        VALUE,
        EMPTY,
        {
          from: user1,
        }
      ).should.be.rejectedWith(EVMRevert);
    });

    it('registry approved contract can initiate transfer by partition', async function () {
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      await this.roleManager.removeRoleForAddress(
        user1,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.registry.setOneOfMode(true);
      await this.registry.addOneOfContracts([user1]);
      await this.token.transferByPartition(
        PARTITION1,
        user2,
        VALUE,
        EMPTY,
        {
          from: user1,
        }
      ).should.be.fulfilled;
    });

    it('registry approved contract can be target of transfer by partition', async function () {
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      await this.registry.setOneOfMode(true);
      await this.registry.addOneOfContracts([user2]);
      await this.token.transferByPartition(
        PARTITION1,
        user2,
        VALUE,
        EMPTY,
        {
          from: user1,
        }
      ).should.be.fulfilled;
    });

    // eslint-disable-next-line max-len
    it('registry approved contract can not initiate transfer by partition if dest address has no permission', async function () {
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      await this.roleManager.removeRoleForAddress(
        user1,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.registry.setOneOfMode(true);
      await this.registry.addOneOfContracts([user1]);
      await this.token.transferByPartition(
        PARTITION1,
        user2,
        VALUE,
        EMPTY,
        {
          from: user1,
        }
      ).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('issueByPartition', function () {
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
    });

    it('can issue by partition', async function () {
      await this.roleManager.addRoleForAddress(
        user1,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      ).should.be.fulfilled;
    });

    // eslint-disable-next-line max-len
    it('can issue by partition to registry approved contract even if it does not have explicit permission', async function () {
      await this.registry.setOneOfMode(true);
      await this.registry.addOneOfContracts([owner, user1]);
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      ).should.be.fulfilled;
    });

    it('totalSupply is increased after we issue by partition', async function () {
      await this.roleManager.addRoleForAddress(
        user1,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      const initialSupply = await this.token.totalSupply();
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      const postIssueSupply = await this.token.totalSupply();
      postIssueSupply.sub(initialSupply).should.be.bignumber.equal(new BigNumber(VALUE));
    });

    it('balanceOfByPartition returns proper value after we issueByPartition', async function () {
      await this.roleManager.addRoleForAddress(
        user1,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      const partitionBalance = await this.token.balanceOfByPartition(
        PARTITION1,
        user1,
      );
      partitionBalance.should.be.bignumber.equal(new BigNumber(VALUE));
    });

    it('balanceOf returns proper value after we issueByPartition', async function () {
      await this.roleManager.addRoleForAddress(
        user1,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      const overalBalance = await this.token.balanceOf(
        user1,
      );
      overalBalance.should.be.bignumber.equal(new BigNumber(VALUE));
    });

    // eslint-disable-next-line max-len
    it('when we call it twice for same partition totalSupply, balanceOf and balanceOfByPartition reflect the sum amount', async function () {
      await this.roleManager.addRoleForAddress(
        user1,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      const expectedValue = new BigNumber(VALUE * 2);
      const overalBalance = await this.token.balanceOf(
        user1,
      );
      overalBalance.should.be.bignumber.equal(expectedValue);
      const partitionBalance = await this.token.balanceOfByPartition(
        PARTITION1,
        user1,
      );
      partitionBalance.should.be.bignumber.equal(expectedValue);
      const totalSupply = await this.token.totalSupply();
      totalSupply.should.be.bignumber.equal(expectedValue);
    });

    it('can not issue by partition if user does not have proper user role', async function () {
      await this.registry.setOneOfMode(true);
      await this.registry.addOneOfContracts([owner]);
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      ).should.be.rejectedWith(EVMRevert);
    });

    it('IssuedByPartition event has proper arguments', async function () {
      await this.roleManager.addRoleForAddress(
        user1,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      const { logs } = await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      const event = logs.find(e => e.event === 'IssuedByPartition');
      assert.equal(event.args.partition, PARTITION1);
      assert.equal(event.args.operator, EMPTY_ADDRESS);
      assert.equal(event.args.to, user1);
      assert.equal(event.args.amount, VALUE);
      assert.equal(event.args.data, EMPTY);
      assert.isNull(event.args.operatorData);
    });

    it('can not issue by partition with 0 value', async function () {
      await this.roleManager.addRoleForAddress(
        user1,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        0,
        EMPTY,
        {
          from: owner,
        }
      ).should.be.rejectedWith(EVMRevert);
    });
  });
});
