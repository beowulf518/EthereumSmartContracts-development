import {revert as EVMRevert} from 'truffle-test-helpers';
import { BigNumber } from '@nomisma/nomisma-smart-contract-helpers';

import {
  setupRoleManager,
} from '../../access/helpers/role-manager';

require('chai')
  .use(require('chai-as-promised'))
  .should();

const TokenValidator = artifacts.require('./TokenValidator.sol');

contract('TokenValidator', function ([owner, governor, token1, token2, token3, token4, token5]) {
  const precision1 = 7;
  const precision2 = 4;
  const precision3 = 3;

  beforeEach(async function () {
    this.roleManager = await setupRoleManager([owner], [governor]);
    this.tokenValidator = await TokenValidator.new(this.roleManager.address);
  });

  describe('Token validation against whitelist', function () {
    it('should validate single token', async function () {
      await this.tokenValidator.addTokensToWhitelist([token1], {from: governor});

      await this.tokenValidator.validateToken(token1).should.be.fulfilled;
      await this.tokenValidator.validateToken(token2).should.be.rejectedWith(EVMRevert);
    });

    it('should revert for user without governor role', async function () {
      await this.tokenValidator.addTokensToWhitelist([token1], {from: owner}).should.be.rejectedWith(EVMRevert);
      await this.tokenValidator.addTokensToWhitelist([token1, token2, token3], {from: owner})
        .should.be.rejectedWith(EVMRevert);
    });

    it('should validate multiple tokens', async function () {
      await this.tokenValidator.addTokensToWhitelist([token1, token2, token3], {from: governor});

      await this.tokenValidator.validateToken(token1).should.be.fulfilled;
      await this.tokenValidator.validateToken(token2).should.be.fulfilled;
      await this.tokenValidator.validateToken(token3).should.be.fulfilled;
      await this.tokenValidator.validateToken(token4).should.be.rejectedWith(EVMRevert);
      await this.tokenValidator.validateToken(token5).should.be.rejectedWith(EVMRevert);
      await this.tokenValidator.validateTokens([token1, token2, token3]).should.be.fulfilled;
      await this.tokenValidator.validateTokens([token4, token5]).should.be.rejectedWith(EVMRevert);
    });

    it('should add, remove and validate tokens', async function () {
      await this.tokenValidator.addTokensToWhitelist([token1, token2], {from: governor});
      await this.tokenValidator.addTokensToWhitelist([token3], {from: governor});

      await this.tokenValidator.validateToken(token1).should.be.fulfilled;
      await this.tokenValidator.validateToken(token2).should.be.fulfilled;
      await this.tokenValidator.validateToken(token3).should.be.fulfilled;

      await this.tokenValidator.removeTokenFromWhitelist(token2, {from: governor});
      await this.tokenValidator.removeTokenFromWhitelist(token3, {from: governor});

      await this.tokenValidator.validateToken(token1).should.be.fulfilled;
      await this.tokenValidator.validateToken(token2).should.be.rejectedWith(EVMRevert);
      await this.tokenValidator.validateToken(token3).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('emits events with appropriate values', function () {
    it('addTokensToWhitelist() check', async function () {
      await this.tokenValidator.addTokensToWhitelist([token1], {from: governor});

      const whitelistEvent = await this.tokenValidator.getPastEvents('TokenWhitelisted');
      const tokenAddressFromEvent = whitelistEvent.find(
        e => e.event === 'TokenWhitelisted').args.whitelistedToken;

      tokenAddressFromEvent.should.be.equal(token1);
    });

    it('removeTokenFromWhitelist() check', async function () {
      await this.tokenValidator.removeTokenFromWhitelist(token1, {from: governor});

      const whitelistEvent = await this.tokenValidator.getPastEvents('TokenRemovedFromWhitelist');
      const tokenAddressFromEvent = whitelistEvent.find(
        e => e.event === 'TokenRemovedFromWhitelist').args.deletedToken;

      tokenAddressFromEvent.should.be.equal(token1);
    });
  });

  describe('Token validation against CCP whitelist', function () {
    it('should validate single token', async function () {
      await this.tokenValidator.addTokensToCcpWhitelist(
        [token1],
        [precision1],
        {from: governor}
      );

      await this.tokenValidator.validateCcpToken(token1).should.be.fulfilled;
      await this.tokenValidator.validateCcpToken(token2).should.be.rejectedWith(EVMRevert);
    });

    it('should revert for user without governor role', async function () {
      await this.tokenValidator.addTokensToCcpWhitelist(
        [token1],
        [precision1],
        {from: owner}
      ).should.be.rejectedWith(EVMRevert);
      await this.tokenValidator.addTokensToCcpWhitelist(
        [token1, token2, token3],
        [precision1, precision2, precision3],
        {from: owner},
      )
        .should.be.rejectedWith(EVMRevert);
    });

    it('should validate multiple tokens', async function () {
      await this.tokenValidator.addTokensToCcpWhitelist(
        [token1, token2, token3],
        [precision1, precision2, precision3],
        {from: governor}
      );

      await this.tokenValidator.validateCcpToken(token1).should.be.fulfilled;
      await this.tokenValidator.validateCcpToken(token2).should.be.fulfilled;
      await this.tokenValidator.validateCcpToken(token3).should.be.fulfilled;
      await this.tokenValidator.validateCcpToken(token4).should.be.rejectedWith(EVMRevert);
      await this.tokenValidator.validateCcpToken(token5).should.be.rejectedWith(EVMRevert);
      await this.tokenValidator.validateCcpTokens([token1, token2, token3]).should.be.fulfilled;
      await this.tokenValidator.validateCcpTokens([token4, token5]).should.be.rejectedWith(EVMRevert);
    });

    it('should not validate if tokens and precisions array have different lengths', async function () {
      await this.tokenValidator.addTokensToCcpWhitelist(
        [ token1, token2, token3 ],
        [ precision1, precision2 ],
        {from: governor}
      ).should.be.rejectedWith(EVMRevert);
    });

    it('should add, remove and validate tokens', async function () {
      await this.tokenValidator.addTokensToCcpWhitelist(
        [token1, token2],
        [precision1, precision2],
        {from: governor}
      );
      await this.tokenValidator.addTokensToCcpWhitelist(
        [token3],
        [precision3],
        {from: governor}
      );

      await this.tokenValidator.validateCcpToken(token1).should.be.fulfilled;
      await this.tokenValidator.validateCcpToken(token2).should.be.fulfilled;
      await this.tokenValidator.validateCcpToken(token3).should.be.fulfilled;

      await this.tokenValidator.removeTokenFromCcpWhitelist(token2, {from: governor});
      await this.tokenValidator.removeTokenFromCcpWhitelist(token3, {from: governor});

      await this.tokenValidator.validateCcpToken(token1).should.be.fulfilled;
      await this.tokenValidator.validateCcpToken(token2).should.be.rejectedWith(EVMRevert);
      await this.tokenValidator.validateCcpToken(token3).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('emits events with appropriate values for CCP tokens', function () {
    it('addTokensToWhitelist() check', async function () {
      await this.tokenValidator.addTokensToCcpWhitelist(
        [token1],
        [precision1],
        {from: governor},
      );

      const whitelistEvent = await this.tokenValidator.getPastEvents('CcpTokenWhitelisted');
      const whitelistedArgs = whitelistEvent.find(
        e => e.event === 'CcpTokenWhitelisted').args;

      whitelistedArgs.whitelistedToken.should.be.equal(token1);
      whitelistedArgs.precision.should.be.bignumber.equal(new BigNumber(precision1));
      whitelistedArgs.toTokenPower.should.be.bignumber.equal(new BigNumber(18 - precision1));
    });

    it('removeTokenFromCcpWhitelist() can not be called if token is not in whitelist', async function () {
      await this.tokenValidator.removeTokenFromCcpWhitelist(
        token1,
        {from: governor}
      ).should.be.rejectedWith(EVMRevert);
    });

    it('removeTokenFromCcpWhitelist() check', async function () {
      await this.tokenValidator.addTokensToCcpWhitelist(
        [token1],
        [precision1],
        {from: governor},
      );
      await this.tokenValidator.removeTokenFromCcpWhitelist(
        token1,
        {from: governor}
      );

      const whitelistEvent = await this.tokenValidator.getPastEvents('CcpTokenRemovedFromWhitelist');
      const tokenAddressFromEvent = whitelistEvent.find(
        e => e.event === 'CcpTokenRemovedFromWhitelist').args.deletedToken;

      tokenAddressFromEvent.should.be.equal(token1);
    });

    it('post removeTokenFromCcpWhitelist() getCcpPrecision check', async function () {
      await this.tokenValidator.addTokensToCcpWhitelist(
        [token1],
        [precision1],
        {from: governor},
      );
      await this.tokenValidator.removeTokenFromCcpWhitelist(
        token1,
        {from: governor}
      );

      await this.tokenValidator.getCcpPrecision(token1).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('Whitelists are separate for Bank and CCP', function () {
    it('should validate tokens separately for Bank and CCP', async function () {
      await this.tokenValidator.addTokensToWhitelist([token3], {from: governor});
      await this.tokenValidator.addTokensToCcpWhitelist(
        [token1, token2],
        [precision1, precision2],
        {from: governor}
      );

      await this.tokenValidator.validateToken(token3).should.be.fulfilled;
      await this.tokenValidator.validateCcpToken(token1).should.be.fulfilled;
      await this.tokenValidator.validateCcpToken(token2).should.be.fulfilled;

      await this.tokenValidator.validateCcpToken(token3).should.be.rejectedWith(EVMRevert);
      await this.tokenValidator.validateToken(token1).should.be.rejectedWith(EVMRevert);
      await this.tokenValidator.validateToken(token2).should.be.rejectedWith(EVMRevert);

      await this.tokenValidator.removeTokenFromWhitelist(token3, {from: governor});
      await this.tokenValidator.removeTokenFromCcpWhitelist(token2, {from: governor});

      await this.tokenValidator.validateToken(token3).should.be.rejectedWith(EVMRevert);
      await this.tokenValidator.validateCcpToken(token1).should.be.fulfilled;
      await this.tokenValidator.validateToken(token1).should.be.rejectedWith(EVMRevert);
      await this.tokenValidator.validateCcpToken(token2).should.be.rejectedWith(EVMRevert);
    });
  });
});
