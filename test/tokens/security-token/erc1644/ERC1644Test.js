import {
  getChaiBN,
} from '@nomisma/nomisma-smart-contract-helpers';
import {
  revert as EVMRevert,
} from 'truffle-test-helpers';
import { CCP_USER_ROLE, setupRoleManager } from '../../../access/helpers/role-manager';
import {
  EMPTY,
  PARTITION1,
  PARTITION2,
  PARTITION3,
  INCORRECT_PARTITION,
  setupErc1400,
  VALUE,
} from '../helpers/erc1400';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();

const RegistryMock = artifacts.require('./RegistryMock.sol');

contract('ERC1644', function ([
  owner,
  controller,
  user1,
  user2,
]) {
  beforeEach(async function () {
    this.roleManager = await setupRoleManager([owner], []);
    this.registry = await RegistryMock.new();
    await this.registry.setValidContract(true);
    this.token = await setupErc1400({
      roleManager: this.roleManager,
      owner,
      controller,
      controllable: false,
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

  describe('#controllerTransfer', function () {
    it('should be able to do controllerTransfer when token is controllable', async function () {
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );

      // Token is not controllable, should revert
      await this.token.controllerTransfer(
        user1,
        user2,
        VALUE,
        EMPTY,
        EMPTY,
        {
          from: user1,
        },
      ).should.be.rejectedWith(EVMRevert);

      await this.token.setControllable(true, {
        from: owner,
      });
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.token.controllerTransfer(
        user1,
        user2,
        VALUE,
        EMPTY,
        EMPTY,
        {
          from: controller,
        },
      ).should.be.fulfilled;

      assert.equal(await this.token.balanceOf(user2), VALUE);
    });

    // eslint-disable-next-line max-len
    it('if user has multiple partitions controller should be able to utilize _data in controllerTransfer to specify partition on which the action needs to be made', async function () {
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
        PARTITION2,
        user1,
        VALUE * 2,
        EMPTY,
        {
          from: owner,
        }
      );

      await this.token.setControllable(
        true,
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
      await this.token.controllerTransfer(
        user1,
        user2,
        VALUE * 2,
        PARTITION2,
        EMPTY,
        {
          from: controller,
        },
      ).should.be.fulfilled;

      assert.equal(
        await this.token.balanceOfByPartition(
          PARTITION2,
          user2
        ),
        VALUE * 2
      );
    });

    it('controllerTransfer should emit events with appropriate arguments', async function () {
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );

      await this.token.setControllable(true, {
        from: owner,
      });
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      const { logs } = await this.token.controllerTransfer(
        user1,
        user2,
        VALUE,
        EMPTY,
        EMPTY,
        {
          from: controller,
        },
      );

      const event = logs.find(e => e.event === 'ControllerTransfer');
      assert.equal(event.args._controller, controller);
      assert.equal(event.args._from, user1);
      assert.equal(event.args._to, user2);
      assert.equal(event.args._value, VALUE);
      assert.equal(event.args._data, EMPTY);
      assert.equal(event.args._operatorData, EMPTY);
    });

    // eslint-disable-next-line max-len
    it('should revert if user has multiple partitions and incorrect partition is passed in data', async function () {
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
        PARTITION2,
        user1,
        VALUE * 2,
        EMPTY,
        {
          from: owner,
        }
      );

      await this.token.setControllable(
        true,
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
      await this.token.controllerTransfer(
        user1,
        user2,
        VALUE,
        INCORRECT_PARTITION,
        EMPTY,
        {
          from: controller,
        },
      ).should.be.rejectedWith(EVMRevert);
    });

    // Is it valid case?
    // Or controller should be able to transfer token holder's tokens even if he is no longer whitelisted?
    // eslint-disable-next-line max-len
    it('should revert (??) if controllerTransfer is done for token holder who is no longer whitelisted', async function () {
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );

      await this.token.setControllable(true, {
        from: owner,
      });
      await this.roleManager.addRoleForAddress(
        user2,
        CCP_USER_ROLE,
        {
          from: owner,
        }
      );
      await this.roleManager.removeRoleForAddress(user1, CCP_USER_ROLE, {from: owner});
      await this.registry.setValidContract(false);
      await this.registry.setOneOfMode(true);
      await this.registry.addOneOfContracts([controller]);
      await this.token.controllerTransfer(
        user1,
        user2,
        VALUE,
        EMPTY,
        EMPTY,
        {
          from: controller,
        },
      ).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('#controllerRedeem', function () {
    it('should be able to do controllerRedeem when token is controllable', async function () {
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );

      // Token is not controllable, should revert
      await this.token.controllerRedeem(
        user1,
        VALUE,
        EMPTY,
        EMPTY,
        {
          from: user1,
        },
      ).should.be.rejectedWith(EVMRevert);

      await this.token.setControllable(true);
      await this.token.controllerRedeem(
        user1,
        VALUE,
        EMPTY,
        EMPTY,
        {
          from: controller,
        },
      ).should.be.fulfilled;

      assert.equal(await this.token.balanceOf(user1), 0);
    });

    it('controllerRedeem should emit events with appropriate arguments', async function () {
      await this.token.issueByPartition(
        PARTITION1,
        user1,
        VALUE,
        EMPTY,
        {
          from: owner,
        }
      );
      await this.token.setControllable(true);

      const { logs } = await this.token.controllerRedeem(
        user1,
        VALUE,
        EMPTY,
        EMPTY,
        {
          from: controller,
        },
      );

      const event = logs.find(e => e.event === 'ControllerRedemption');
      assert.equal(event.args._controller, controller);
      assert.equal(event.args._tokenHolder, user1);
      assert.equal(event.args._value, VALUE);
      assert.equal(event.args._data, EMPTY);
      assert.equal(event.args._operatorData, EMPTY);
    });

    // eslint-disable-next-line max-len
    it('if user has multiple partitions controller should be able to utilize _data in controllerRedeem to specify partition on which the action needs to be made', async function () {
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
        PARTITION2,
        user1,
        VALUE * 2,
        EMPTY,
        {
          from: owner,
        }
      );

      await this.token.setControllable(
        true,
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
      await this.token.controllerRedeem(
        user1,
        VALUE * 2,
        PARTITION2,
        EMPTY,
        {
          from: controller,
        },
      ).should.be.fulfilled;

      assert.equal(
        await this.token.balanceOfByPartition(
          PARTITION1,
          user1
        ),
        VALUE
      );
      assert.equal(
        await this.token.balanceOfByPartition(
          PARTITION2,
          user1
        ),
        0
      );
    });

    // eslint-disable-next-line max-len
    it('should revert if user has multiple partitions and incorrect partition is passed in data', async function () {
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
        PARTITION2,
        user1,
        VALUE * 2,
        EMPTY,
        {
          from: owner,
        }
      );
      await this.token.issueByPartition(
        PARTITION3,
        user2,
        VALUE * 2,
        EMPTY,
        {
          from: owner,
        }
      );

      await this.token.setControllable(
        true,
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
      await this.token.controllerRedeem(
        user1,
        VALUE,
        INCORRECT_PARTITION,
        EMPTY,
        {
          from: controller,
        },
      ).should.be.rejectedWith(EVMRevert);

      await this.token.controllerRedeem(
        user1,
        VALUE,
        PARTITION3, // user2 has PARTITION3 not user1
        EMPTY,
        {
          from: controller,
        },
      ).should.be.rejectedWith(EVMRevert);
    });
  });
});


