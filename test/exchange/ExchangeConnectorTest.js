import {
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
import { setupExchangeConnector } from './helpers/exchange-connector';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();

const Asset = artifacts.require('./MintableBurnableERC20TokenMock.sol');
const ERC20NoReturnSignature = artifacts.require('./ERC20NoReturnSignature.sol');
const TokenWrapper = artifacts.require('./TokenWrapper.sol');
const KyberNetworkMock = artifacts.require('./KyberNetworkMock.sol');

contract('ExchangeConnector', function ([
  owner,
  reciever,
  governance,
  srcCurrencyAddress1,
  srcCurrencyAddress2,
  srcCurrencyAddress3,
  destCurrencyAddress1,
  destCurrencyAddress2,
  destCurrencyAddress3,
]) {
  beforeEach(async function () {
    this.roleManager = await setupRoleManager([owner, governance], [owner, governance]);
    this.tokenManager = await setupTokenManager(this.roleManager, owner);
    this.kyberNetworkMock = await KyberNetworkMock.new(this.tokenManager.address);
    this.exchangeConnector = await setupExchangeConnector({
      kyberNetworkAddress: this.kyberNetworkMock.address,
      tokenManagerAddress: this.tokenManager.address,
      roleManager: this.roleManager,
      owner,
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
    describe('purchasedAmount returned from trade() is calculated properly', function () {
      beforeEach(async function () {
        this.tokenWrapper = await TokenWrapper.new(this.roleManager.address);
        await this.tokenManager.setTokenWrapper(this.tokenWrapper.address);

        this.underlyingAddress = await tokenAddressFromExchangeConnectorMock(
          this.kyberNetworkMock.generateAsset(
            test.isBadToken
          )
        );
        this.underlying = await contractInstanceAt(
          test.asset,
          this.underlyingAddress
        );

        this.baseAddress = await tokenAddressFromExchangeConnectorMock(
          this.kyberNetworkMock.generateAsset(
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
        this.msgValue = new BigNumber(this.tradeAmountWithoutMultiplier * this.rate).toString();

        await this.kyberNetworkMock.setExpectedRate(
          this.baseAddress,
          this.underlyingAddress,
          this.rate
        ).should.be.fulfilled;

        const fromObj = { from: owner };
        if (test.isEthereumBase) {
          fromObj.value = this.msgValue;
        }

        await this.kyberNetworkMock.send(this.msgValue, fromObj);
      });

      it('for the case case of ' + test.name, async function () {
        if (test.isEthereumBase) {
          await this.exchangeConnector
            .trade(
              this.baseAddress,
              this.underlyingAddress,
              reciever,
              this.toTradeAmount,
              {
                value: this.toTradeAmount,
              }
            ).should.be.fulfilled;
        } else {
          await this.exchangeConnector
            .trade(
              this.baseAddress,
              this.underlyingAddress,
              reciever,
              this.toTradeAmount
            ).should.be.fulfilled;
        }

        const tradeEvent = await this.exchangeConnector.getPastEvents('TradeSucceded');
        // 0 - sourceAsset, 1 - destinationAsset, 2 - beneficiary, 3 - purchasedAmount
        const eventArgs = tradeEvent.find(e => e.event === 'TradeSucceded')
          .args;

        eventArgs[0].should.be.equal(this.baseAddress);
        eventArgs[1].should.be.equal(this.underlyingAddress);
        eventArgs[2].should.be.equal(reciever);
        eventArgs[3].should.be.bignumber.equal(new BigNumber(this.msgValue));
      });
    });
  });

  it('getExchangeRates() returns appropriate rates', async function () {
    this.srcAssets = [
      srcCurrencyAddress1,
      srcCurrencyAddress2,
      srcCurrencyAddress3,
      srcCurrencyAddress1,
    ];

    this.destAssets = [
      destCurrencyAddress1,
      destCurrencyAddress2,
      destCurrencyAddress3,
      destCurrencyAddress3,
    ];

    this.rates = [
      new BigNumber(2).mul(baseMultiplierBN),
      new BigNumber(3).mul(baseMultiplierBN),
      new BigNumber(4).mul(baseMultiplierBN),
      new BigNumber(5).mul(baseMultiplierBN),
    ];

    this.amounts = [
      new BigNumber(7),
      new BigNumber(8),
      new BigNumber(9),
      new BigNumber(10),
    ];

    await this.kyberNetworkMock.setExpectedRates(
      this.srcAssets,
      this.destAssets,
      this.rates
    );

    const returnedRates = await this.exchangeConnector.getExchangeRates(
      this.srcAssets,
      this.destAssets,
      this.amounts
    ).should.be.fulfilled;

    for (let i = 0; i < returnedRates.length; i ++) {
      returnedRates[i].should.be.bignumber.equal(
        this.rates[i]
      );
    }
  });
});
