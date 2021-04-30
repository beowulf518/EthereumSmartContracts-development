import {
  setupTokenManager,
} from './helpers/token-manager';
import {
  tokenAddressFromExchangeConnectorMock,
} from '../../helpers/common';
import {
  baseRateWithBaseMultiplier,
} from '../../helpers/constants';
import {
  setupRoleManager,
} from '../../access/helpers/role-manager';
import {
  contractInstanceAt,
  getChaiBN,
  BigNumber,
} from '@nomisma/nomisma-smart-contract-helpers';
import {
  setupExConMock,
} from '../../exchange/helpers/excon-mock';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();


const TokenWrapper = artifacts.require('./TokenWrapper.sol');
const RegistryBaseMock = artifacts.require('./RegistryBaseMock.sol');
const Asset = artifacts.require('./MintableBurnableERC20TokenMock.sol');
const ERC20 = artifacts.require('./MintableBurnableERC20TokenMock.sol');


contract('TokenManager', function ([
  owner,
  payer,
  etherAddr,
  beneficiary,
  spender,
]) {
  beforeEach(async function () {
    this.roleManager = await setupRoleManager([owner], [owner]);
    this.tokenManager = await setupTokenManager(this.roleManager, owner);
    this.reigstryMock = await RegistryBaseMock.new();

    this.tokenWrapper = await TokenWrapper.new();
    await this.tokenManager.setTokenWrapper(this.tokenWrapper.address, { from: owner });
  });

  it('setBankRegistry() sets BankRegistry appropriately', async function () {
    await this.tokenManager.setBankRegistry(this.reigstryMock.address).should.be.fulfilled;

    const registryAddressFromContract = await this.tokenManager.bankRegistry();

    registryAddressFromContract.should.be.equal(
      this.reigstryMock.address
    );
  });

  it('collectFunds() returns appropriate boolean if transfer succeeds and balances change properly', async function () {
    this.token = await Asset.new(
      { from: owner }
    );
    const amount = new BigNumber(777);

    await this.token.transfer(
      payer,
      amount,
      { from: owner }
    ).should.be.fulfilled;

    await this.tokenManager.setBankRegistry(this.reigstryMock.address).should.be.fulfilled;

    const payerBalanceBefore = await this.token.balanceOf(payer);
    const ownerBalanceBefore = await this.token.balanceOf(owner);

    await this.token.approve(
      this.tokenManager.address,
      amount,
      { from: payer }
    );

    await this.tokenManager.collectFunds(
      payer,
      this.token.address,
      amount,
      { from: owner }
    ).should.be.fulfilled;

    const payerBalanceAfter = await this.token.balanceOf(payer);
    const ownerBalanceAfter = await this.token.balanceOf(owner);

    payerBalanceBefore.sub(payerBalanceAfter).should.be.bignumber.equal(amount);
    ownerBalanceAfter.sub(ownerBalanceBefore).should.be.bignumber.equal(amount);
  });

  // eslint-disable-next-line max-len
  it('collectFundsToFundLock() returns appropriate boolean if transfer succeeds and balances change properly', async function () {
    this.token = await Asset.new(
      { from: owner }
    );
    const amount = new BigNumber(777);

    await this.token.transfer(
      payer,
      amount,
      { from: owner }
    ).should.be.fulfilled;

    await this.tokenManager.setOpmRegistry(
      this.reigstryMock.address,
    ).should.be.fulfilled;

    const payerBalanceBefore = await this.token.balanceOf(payer);
    const ownerBalanceBefore = await this.token.balanceOf(owner);

    await this.token.approve(
      this.tokenManager.address,
      amount,
      { from: payer }
    );

    await this.tokenManager.collectFundsToFundLock(
      payer,
      this.token.address,
      amount,
      { from: owner }
    ).should.be.fulfilled;

    const payerBalanceAfter = await this.token.balanceOf(payer);
    const ownerBalanceAfter = await this.token.balanceOf(owner);

    payerBalanceBefore.sub(payerBalanceAfter).should.be.bignumber.equal(amount);
    ownerBalanceAfter.sub(ownerBalanceBefore).should.be.bignumber.equal(amount);
  });

  describe('setter functions emit events with appropriate values', function () {
    it('setBankRegistry() check', async function () {
      const registry = await RegistryBaseMock.new();
      await this.tokenManager.setBankRegistry(registry.address).should.be.fulfilled;

      const events = await this.tokenManager.getPastEvents('BankRegistrySet');
      const registryAddressFromEvent = events.find(
        e => e.event === 'BankRegistrySet'
      ).args.bankRegistryAddress;

      registryAddressFromEvent.should.be.equal(registry.address);
    });

    it('setOpmRegistry() check + variable set', async function () {
      const registry = await RegistryBaseMock.new(this.roleManager.address);
      await this.tokenManager.setOpmRegistry(registry.address).should.be.fulfilled;

      const events = await this.tokenManager.getPastEvents('OpmRegistrySet');
      const registryAddressFromEvent = events.find(
        e => e.event === 'OpmRegistrySet'
      ).args.opmRegistryAddress;

      registryAddressFromEvent.should.be.equal(registry.address);

      const registryAddress = await this.tokenManager.opmRegistry();
      registryAddress.should.be.equal(registry.address);
    });

    it('setTokenWrapper() check', async function () {
      const wrapper = await TokenWrapper.new();
      await this.tokenManager.setTokenWrapper(wrapper.address, { from: owner });

      const events = await this.tokenManager.getPastEvents('TokenWrapperSet');
      const wrapperAddressFromEvent = events.find(
        e => e.event === 'TokenWrapperSet'
      ).args.tokenWrapperAddress;

      wrapperAddressFromEvent.should.be.equal(wrapper.address);
    });

    it('setEthereumAddress() check', async function () {
      await this.tokenManager.setEthereumAddress(etherAddr);

      const events = await this.tokenManager.getPastEvents('EthereumAddressSet');
      const etherAddressFromEvent = events.find(
        e => e.event === 'EthereumAddressSet'
      ).args.etherAddress;

      etherAddressFromEvent.should.be.equal(etherAddr);
    });
  });

  it('tokenRequests() returns arrays of balances and allowances with appropriate values', async function () {
    this.exchangeConnector = await setupExConMock(
      this.roleManager.address,
      this.tokenManager.address
    );

    this.tokenAddresses = [];
    this.tokens = [];
    this.balances = [];
    this.allowances = [];
    this.values = [
      101,
      150,
      73,
      232,
      777,
    ];

    for (let i = 0; i < this.values.length; i++) {
      this.tokenAddresses[i] = await tokenAddressFromExchangeConnectorMock(
        this.exchangeConnector.generateAsset(
          baseRateWithBaseMultiplier,
          false
        )
      );

      this.tokens[i] = await contractInstanceAt(
        ERC20,
        this.tokenAddresses[i]
      );

      await this.exchangeConnector.tokenFaucet(
        this.tokenAddresses[i],
        this.values[i],
        {
          from: beneficiary,
        }
      );

      await this.tokens[i].approve(
        spender,
        this.values[i],
        {
          from: beneficiary,
        }
      );

      this.balances[i] = await this.tokens[i].balanceOf(beneficiary);
      this.allowances[i] = await this.tokens[i].allowance(
        beneficiary,
        spender
      );
    }

    const {
      0: allowances,
      1: balances,
    } = await this.tokenManager.getTokenProperties(
      this.tokenAddresses,
      spender,
      { from: beneficiary }
    ).should.be.fulfilled;

    for (let k = 0; k < this.tokens.length; k++) {
      balances[k].should.be.bignumber.equal(this.balances[k]);
      allowances[k].should.be.bignumber.equal(this.allowances[k]);
    }
  });
});
