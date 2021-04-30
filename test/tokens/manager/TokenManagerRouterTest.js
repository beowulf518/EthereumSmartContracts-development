import {
  getChaiBN,
  contractInstanceAt,
  register,
  BigNumber,
  sha3,
} from '@nomisma/nomisma-smart-contract-helpers';
import {
  setupRoleManager,
} from '../../access/helpers/role-manager';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();

const TokenManagerAdmin = artifacts.require('./TokenManagerAdmin.sol');
const Resolver = artifacts.require('./Resolver.sol');
const TokenManagerRouter = artifacts.require('./TokenManagerRouter.sol');
const Asset = artifacts.require('./MintableBurnableERC20TokenMock.sol');

contract('TokenManagerRouter', function ([
  owner,
  ethAddr1,
  ethAddr2,
]) {
  beforeEach(async function () {
    this.tokenManager = await TokenManagerAdmin.new();
    this.roleManager = await setupRoleManager([owner], [owner]);
    this.resolver = await Resolver.new(this.roleManager.address);
    await register({
      resolver: this.resolver,
      contract: this.tokenManager,
      owner,
      config: ['setEthereumAddress', 'getTokenDecimals', 'getEthereumAddress', 'resolver'],
    });

    this.router = await TokenManagerRouter.new(
      this.roleManager.address,
      this.resolver.address,
      {
        from: owner,
      }
    );
    this.tokenManager = await contractInstanceAt(TokenManagerAdmin, this.router.address);
  });

  describe('Routing calls', function () {
    it('should initialise base contract properly', async function () {
      await this.tokenManager.setEthereumAddress(ethAddr1);
      const actualEthAddr1 = await this.tokenManager.getEthereumAddress();
      await this.tokenManager.setEthereumAddress(ethAddr2);
      const actualEthAddr2 = await this.tokenManager.getEthereumAddress();

      assert.equal(actualEthAddr1, ethAddr1);
      assert.equal(actualEthAddr2, ethAddr2);
    });

    it('should delegate calls successfully', async function () {
      const decimals = new BigNumber(18);
      const token = await Asset.new();
      const decimalsFromFunc = await this.tokenManager.getTokenDecimals(
        token.address
      );

      decimalsFromFunc.should.be.bignumber.equal(decimals);
    });

    it('should keep storage on router after updating resolver signature', async function () {
      await this.tokenManager.setEthereumAddress(ethAddr1);
      let actualEthAddr1 = await this.tokenManager.getEthereumAddress();
      assert.equal(actualEthAddr1, ethAddr1);

      const newTokenManager = await TokenManagerAdmin.new();
      const getEthereumAddressKeccak = sha3('getEthereumAddress()');
      await this.resolver.register(getEthereumAddressKeccak, newTokenManager.address);
      const newTokenManagerAddress = await this.resolver.lookup(getEthereumAddressKeccak.slice(0, 10));
      assert.equal(newTokenManagerAddress, newTokenManager.address); // base contract address is updated in resolver

      actualEthAddr1 = await this.tokenManager.getEthereumAddress();
      assert.equal(actualEthAddr1, ethAddr1);
    });
  });
});
