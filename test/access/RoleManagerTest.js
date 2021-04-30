import {
  revert as EVMrevert,
} from 'truffle-test-helpers';

import {
  getChaiBN,
} from '@nomisma/nomisma-smart-contract-helpers';
import {
  setupRoleManager,
  GOVERNOR_ROLE,
  ADMIN_ROLE,
} from './helpers/role-manager';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();

const TokenValidator = artifacts.require('./TokenValidator.sol');

contract('RoleManager', function ([roleManger1, governor1, governor2,
  notGovernor, token1, token2]) {
  beforeEach(async function () {
    this.roleManager = await setupRoleManager([roleManger1], []);
    this.tokenValidator = await TokenValidator.new(this.roleManager.address);
  });

  describe('#appointGovernors #addRoleForAddress #isGovernor', function () {
    it('should add token to whitelist using appointing governor in RoleManager', async function () {
      await this.roleManager.addRoleForAddress(governor1, ADMIN_ROLE, {from: roleManger1});

      await this.tokenValidator.validateToken(token1).should.be.rejectedWith(EVMrevert);
      await this.tokenValidator.addTokensToWhitelist([token1], {from: governor1});
      await this.tokenValidator.validateToken(token1).should.be.fulfilled;

      await this.tokenValidator.validateToken(token2).should.be.rejectedWith(EVMrevert);
      await this.tokenValidator.addTokensToWhitelist([token2], {from: notGovernor}).should.be.rejectedWith(EVMrevert);
      await this.tokenValidator.validateToken(token2).should.be.rejectedWith(EVMrevert);
    });

    it('should add token to whitelist using add governor role in RoleManager', async function () {
      await this.roleManager.addRoleForAddress(governor2, ADMIN_ROLE, {from: roleManger1});

      await this.tokenValidator.validateToken(token1).should.be.rejectedWith(EVMrevert);
      await this.tokenValidator.addTokensToWhitelist([token1], {from: governor2});
      await this.tokenValidator.validateToken(token1).should.be.fulfilled;

      await this.tokenValidator.validateToken(token2).should.be.rejectedWith(EVMrevert);
      await this.tokenValidator.addTokensToWhitelist([token2], {from: notGovernor}).should.be.rejectedWith(EVMrevert);
      await this.tokenValidator.validateToken(token2).should.be.rejectedWith(EVMrevert);
    });

    it('should check if account is governor', async function () {
      let isGovernor1 = await this.roleManager.isGovernor(governor1);
      let isGovernor2 = await this.roleManager.isGovernor(governor2);
      let isNotGovernor = await this.roleManager.isGovernor(notGovernor);
      assert.equal(isGovernor1, false);
      assert.equal(isGovernor2, false);
      assert.equal(isNotGovernor, false);

      await this.roleManager.appointGovernors([governor1], {from: roleManger1});
      await this.roleManager.addRoleForAddress(governor2, GOVERNOR_ROLE, {from: roleManger1});

      isGovernor1 = await this.roleManager.isGovernor(governor1);
      isGovernor2 = await this.roleManager.isGovernor(governor2);
      isNotGovernor = await this.roleManager.isGovernor(notGovernor);
      assert.equal(isGovernor1, true);
      assert.equal(isGovernor2, true);
      assert.equal(isNotGovernor, false);
    });
  });
});
