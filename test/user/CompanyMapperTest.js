import {
  getChaiBN,
} from '@nomisma/nomisma-smart-contract-helpers';
import {
  setupRoleManager,
} from '../access/helpers/role-manager';
import {
  setupCompanyMapper,
} from './helpers/company-mapper';
import {
  revert as EVMRevert,
} from 'truffle-test-helpers';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();

contract('CompanyMapper', function ([
  governor,
  userWhitelistAdmin,
  trader1,
  trader2,
  trader3,
  trader4,
  investor1,
  investor2,
  investor3,
  investor4,
]) {
  beforeEach(async function () {
    this.roleManager = await setupRoleManager([governor]);
    this.companyMapper = await setupCompanyMapper(this.roleManager.address, governor, userWhitelistAdmin);
  });

  describe('#addCompanyMapping', function () {
    it('should add mapping for single company', async function () {
      await this.companyMapper.addTraderToInvestorsMapping(
        trader1,
        [investor1, investor2],
        {from: userWhitelistAdmin}
      );

      const result = await this.companyMapper.getInvestorsForTrader(trader1, {from: userWhitelistAdmin});

      assert.deepEqual(result, [investor1, investor2]);
    });

    it('should add mappings for multiple companies', async function () {
      await this.companyMapper.addTraderToInvestorsMapping(trader1, [investor1], {from: userWhitelistAdmin});
      await this.companyMapper.addTraderToInvestorsMapping(trader2, [investor1], {from: userWhitelistAdmin});
      await this.companyMapper.addTraderToInvestorsMapping(
        trader3,
        [investor1, investor2],
        {from: userWhitelistAdmin}
      );
      await this.companyMapper.addTraderToInvestorsMapping(
        trader4,
        [investor1, investor2, investor3, investor4],
        {from: userWhitelistAdmin}
      );

      const result1 = await this.companyMapper.getInvestorsForTrader(trader1, {from: userWhitelistAdmin});
      const result2 = await this.companyMapper.getInvestorsForTrader(trader2, {from: userWhitelistAdmin});
      const result3 = await this.companyMapper.getInvestorsForTrader(trader3, {from: userWhitelistAdmin});
      const result4 = await this.companyMapper.getInvestorsForTrader(trader4, {from: userWhitelistAdmin});

      assert.deepEqual(result1, [investor1]);
      assert.deepEqual(result2, [investor1]);
      assert.deepEqual(result3, [investor1, investor2]);
      assert.deepEqual(result4, [investor1, investor2, investor3, investor4]);
    });

    it('should return empty array when no investor mapping found', async function () {
      const result = await this.companyMapper.getInvestorsForTrader(trader1, {from: userWhitelistAdmin});

      assert.deepEqual(result, []);
    });

    it('should emit event when adding mapping for company', async function () {
      const { logs } = await this.companyMapper.addTraderToInvestorsMapping(
        trader1,
        [investor1, investor2, investor3],
        {from: userWhitelistAdmin}
      );

      const event = logs.find(e => e.event === 'MappingAdded');
      assert.equal(event.args.trader, trader1);
      assert.deepEqual(event.args.investors, [investor1, investor2, investor3]);
    });

    it('should revert if user does not have required role to add company mapping', async function () {
      await this.companyMapper.addTraderToInvestorsMapping(
        trader1,
        [investor1],
        {from: trader1}
      ).should.be.rejectedWith(EVMRevert);
    });
  });
});
