import { EVMRevert } from 'truffle-test-helpers';
import {
  setupExConMock,
} from './helpers/excon-mock';
import {
  baseRateWithBaseMultiplier,
  underlyingRateWithBaseMultiplier,
  baseMultiplierBN,
} from '../helpers/constants';
import {
  tokenAddressFromExchangeConnectorMock,
  underlyingSetEthereumAddressCb,
  defaultSetEthereumAddressCb,
} from '../helpers/common';
import {
  BigNumber,
  contractInstanceAt,
  getChaiBN,
} from '@nomisma/nomisma-smart-contract-helpers';
import {
  setupTokenManager,
} from '../tokens/manager/helpers/token-manager';
import {
  setupRoleManager,
} from '../access/helpers/role-manager';


require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();

const Asset = artifacts.require('./MintableBurnableERC20TokenMock.sol');
const ERC20NoReturnSignature = artifacts.require('./ERC20NoReturnSignature.sol');
const TokenWrapper = artifacts.require('./TokenWrapper.sol');


contract('ExchangeConnectorMock', function ([
  owner,
  governance,
  nonGovernance,
  srcCurrencyAddress,
  destCurrencyAddress,
  reciever,
]) {
  describe('Governance role is needed to call setter functions', function () {
    const proper = 'proper';
    const improper = 'improper';
    const properImproper = [
      {
        type: proper,
      },
      {
        type: improper,
      },
    ];

    beforeEach(async function () {
      this.roleManager = await setupRoleManager([owner, governance], [owner, governance]);
      this.tokenManager = await setupTokenManager(this.roleManager, owner);
      this.exchangeConnectorMock = await setupExConMock(
        this.roleManager.address,
        this.tokenManager.address
      );

      this.properImproperMap = {
        [proper]: { from: governance },
        [improper]: { from: nonGovernance },
      };
    });

    properImproper.forEach(
      (
        {
          type,
        }
      ) => {
        const wrapToShould = obj => type === proper ? obj.should.be.fulfilled : obj.should.be.rejectedWith(EVMRevert);
        const text = type === proper ? 'succeeds' : 'reverts';

        it(`setExchangeRate() check ${text}`, async function () {
          const rate = new BigNumber(1.5);
          await wrapToShould(
            this.exchangeConnectorMock.setExchangeRate(
              srcCurrencyAddress,
              destCurrencyAddress,
              rate,
              this.properImproperMap[type]
            )
          );
        });
      });
  });

  const tests = [
    {
      name: 'ERC20 token with Ethereum base',
      isBadToken: false,
      asset: Asset,
      isEthereumBase: true,
    },
    {
      name: 'ERC20 token with Ethereum underlying',
      isBadToken: false,
      asset: Asset,
      isEthereumBase: false,
    },
    {
      name: 'IERC20 token with Ethereum base',
      isBadToken: true,
      asset: ERC20NoReturnSignature,
      isEthereumBase: true,
    },
    {
      name: 'IERC20 token with Ethereum underlying',
      isBadToken: true,
      asset: ERC20NoReturnSignature,
      isEthereumBase: false,
    },
  ];

  tests.forEach(function (test) {
    describe('trade() check', function () {
      beforeEach(async function () {
        this.roleManager = await setupRoleManager([owner, governance], [owner, governance]);
        this.tokenManager = await setupTokenManager(this.roleManager, owner);
        this.tokenWrapper = await TokenWrapper.new();
        await this.tokenManager.setTokenWrapper(this.tokenWrapper.address);
        this.exchangeConnectorMock = await setupExConMock(
          this.roleManager.address,
          this.tokenManager.address
        );
        this.underlyingAddress = await tokenAddressFromExchangeConnectorMock(
          this.exchangeConnectorMock.generateAsset(
            baseRateWithBaseMultiplier,
            test.isBadToken
          )
        );
        this.underlying = await contractInstanceAt(
          test.asset,
          this.underlyingAddress
        );

        this.baseAddress = await tokenAddressFromExchangeConnectorMock(
          this.exchangeConnectorMock.generateAsset(
            underlyingRateWithBaseMultiplier,
            test.isBadToken
          )
        );
        this.base = await contractInstanceAt(
          test.asset,
          this.baseAddress
        );

        if (test.isEthereumBase) {
          await defaultSetEthereumAddressCb(this);
        } else {
          await underlyingSetEthereumAddressCb(this);
        }

        this.rate = 2;
        this.tradeAmountWithoutMultiplier = 10;
        this.toTradeAmount = new BigNumber(
          (this.tradeAmountWithoutMultiplier * baseMultiplierBN).toString()
        ).toString();

        await this.exchangeConnectorMock.setExchangeRate(
          this.baseAddress,
          this.underlyingAddress,
          this.rate,
          {from: governance}
        ).should.be.fulfilled;

        await this.exchangeConnectorMock.send(this.tradeAmountWithoutMultiplier * this.rate, {from: owner});
      });

      it('can trade ' + test.name, async function () {
        let recieverBalanceBefore;
        let recieverBalanceAfter;

        if (test.isEthereumBase) {
          recieverBalanceBefore = await this.underlying.balanceOf(reciever);
          await this.exchangeConnectorMock.trade(
            this.baseAddress,
            this.underlyingAddress,
            reciever,
            this.toTradeAmount,
            {
              value: this.toTradeAmount,
            }
          ).should.be.fulfilled;
          recieverBalanceAfter = await this.underlying.balanceOf(reciever);
        } else {
          recieverBalanceBefore = await web3.eth.getBalance(reciever);
          await this.exchangeConnectorMock.trade(
            this.baseAddress,
            this.underlyingAddress,
            reciever,
            this.toTradeAmount
          ).should.be.fulfilled;
          recieverBalanceAfter = await web3.eth.getBalance(reciever);
        }

        new BigNumber(recieverBalanceAfter)
          .should.be.bignumber.gt(
            new BigNumber(recieverBalanceBefore)
          );

        new BigNumber(recieverBalanceAfter)
          .sub(new BigNumber(this.tradeAmountWithoutMultiplier * this.rate))
          .should.be.bignumber.equal(
            new BigNumber(recieverBalanceBefore)
          );
      });
    });
  });

  it('isZeroRate sets to true and getExchangeRate() returns zero', async function () {
    this.roleManager = await setupRoleManager([owner], [owner]);
    this.tokenManager = await setupTokenManager(this.roleManager, owner);
    this.exchangeConnectorMock = await setupExConMock(
      this.roleManager.address,
      this.tokenManager.address
    );

    await this.exchangeConnectorMock.setZeroRate(
      true
    );

    this.underlyingAddress = await tokenAddressFromExchangeConnectorMock(
      this.exchangeConnectorMock.generateAsset(
        baseRateWithBaseMultiplier,
        false
      )
    );

    this.baseAddress = await tokenAddressFromExchangeConnectorMock(
      this.exchangeConnectorMock.generateAsset(
        underlyingRateWithBaseMultiplier,
        false
      )
    );

    const rate = await this.exchangeConnectorMock.getExchangeRate(
      this.baseAddress,
      this.underlyingAddress,
      100
    );
    const zeroRate = await this.exchangeConnectorMock.isZeroRate();

    rate.should.be.bignumber.equal(new BigNumber(0));
    zeroRate.should.be.equal(true);
  });
});
