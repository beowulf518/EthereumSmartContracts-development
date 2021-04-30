import {
  BigNumber,
  getChaiBN,
  contractInstanceAt,
} from '@nomisma/nomisma-smart-contract-helpers';
import {
  setupTokenManager,
} from '../tokens/manager/helpers/token-manager';
import {
  setupRoleManager,
} from '../access/helpers/role-manager';
import {
  tokenAddressFromExchangeConnectorMock,
} from '../helpers/common';
import { setupExchangeConnector } from './helpers/exchange-connector';

require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();

const KyberNetworkMock = artifacts.require('./KyberNetworkMock.sol');
const ERC20Token = artifacts.require('./MintableBurnableERC20TokenMock.sol');
const TokenWrapper = artifacts.require('./TokenWrapper.sol');

contract('ExchangeConnectorBase', function ([owner, tradeDest]) {
  const SRC_AMOUNT = 100;
  const ETH_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

  beforeEach(async function () {
    this.roleManager = await setupRoleManager([owner], [owner]);
    this.tokenManager = await setupTokenManager(this.roleManager, owner);
    this.tokenWrapper = await TokenWrapper.new();
    await this.tokenManager.setTokenWrapper(this.tokenWrapper.address);
    await this.tokenManager.setEthereumAddress(ETH_ADDRESS);

    this.kyberNetworkMock = await KyberNetworkMock.new(this.tokenManager.address);
    this.exchangeConnector = await setupExchangeConnector({
      kyberNetworkAddress: this.kyberNetworkMock.address,
      tokenManagerAddress: this.tokenManager.address,
      roleManager: this.roleManager,
      owner,
    });
    this.rate = 508000;
    this.src = await ERC20Token.new();
    this.dest = await ERC20Token.new();
    await this.kyberNetworkMock.setExpectedRate(this.src.address, this.dest.address, this.rate);
  });

  describe('Normalise exchange rate', function () {
    it('should return normalised exchange rate for decimals src = 18, dest = 18', async function () {
      const exchangeRate = await this.exchangeConnector.getExchangeRate(
        this.src.address,
        this.dest.address,
        SRC_AMOUNT
      );

      exchangeRate.should.be.bignumber.equal(new BigNumber(this.rate));
    });

    it('should return normalised exchange rate for decimals src = 18, dest = 6', async function () {
      await this.dest.setDecimals(6);
      const rate = this.rate * 10 ** 12;
      await this.kyberNetworkMock.setExpectedRate(this.src.address, this.dest.address, rate.toString());

      const exchangeRate = await this.exchangeConnector.getExchangeRate(
        this.src.address,
        this.dest.address, SRC_AMOUNT
      );

      exchangeRate.should.be.bignumber.equal(new BigNumber(this.rate));
    });

    it('should return normalised exchange rate for decimals src = 6, dest = 18', async function () {
      await this.src.setDecimals(6);

      const exchangeRate = await this.exchangeConnector.getExchangeRate(
        this.src.address,
        this.dest.address,
        SRC_AMOUNT
      );

      const scaledExpectedRate = this.rate * 10 ** 12;
      exchangeRate.should.be.bignumber.equal(new BigNumber(scaledExpectedRate.toString()));
    });

    it('should return normalised exchange rate for decimals src = 10, dest = 8', async function () {
      await this.src.setDecimals(10);
      await this.dest.setDecimals(8);
      await this.kyberNetworkMock.setExpectedRate(this.src.address, this.dest.address, this.rate * 10 ** 2);

      const exchangeRate = await this.exchangeConnector.getExchangeRate(
        this.src.address,
        this.dest.address,
        SRC_AMOUNT
      );

      exchangeRate.should.be.bignumber.equal(new BigNumber(this.rate));
    });

    it('should return normalised exchange rate for ETH as src and dest', async function () {
      await this.kyberNetworkMock.setExpectedRates(
        [ETH_ADDRESS, this.src.address],
        [this.dest.address, ETH_ADDRESS],
        [this.rate, this.rate]
      );

      await this.src.setDecimals(20);
      await this.dest.setDecimals(22);

      const actualEthToDestRate = await this.exchangeConnector.getExchangeRate(
        ETH_ADDRESS,
        this.dest.address,
        SRC_AMOUNT
      );
      const actualSrcToEthRate = await this.exchangeConnector.getExchangeRate(
        this.src.address,
        ETH_ADDRESS,
        SRC_AMOUNT
      );

      actualEthToDestRate.should.be.bignumber.equal(new BigNumber(this.rate * 10 ** 4));
      actualSrcToEthRate.should.be.bignumber.equal(new BigNumber(this.rate / 10 ** 2));
    });
  });

  describe('KyberNetworkMock Trade', function () {
    const rate = 1234 * 10 ** 12;
    const srcAmount = 10 ** 18;

    it('should make trade using ETH as source', async function () {
      const destTokenAddress = await tokenAddressFromExchangeConnectorMock(this.kyberNetworkMock.generateAsset(false));
      await this.kyberNetworkMock.setExpectedRate(ETH_ADDRESS, destTokenAddress, rate.toString());

      await this.kyberNetworkMock.trade(
        ETH_ADDRESS,
        0, // srcAmount doesn't matter when ETH = srcAsset
        destTokenAddress,
        tradeDest,
        0, // we do not use that param
        0, // we do not use that param
        ETH_ADDRESS, // we do not use that param
        {
          from: owner,
          value: srcAmount, // 1 ETH
        }
      );

      const destToken = await contractInstanceAt(ERC20Token, destTokenAddress);
      const tradeDestBalance = await destToken.balanceOf(tradeDest);

      tradeDestBalance.should.be.bignumber.equal(new BigNumber(rate)); // because we trade exactly 1 ETH
    });

    it('should make trade using ETH as destination', async function () {
      const srcTokenAddress = await tokenAddressFromExchangeConnectorMock(this.kyberNetworkMock.generateAsset(false));
      await this.kyberNetworkMock.setExpectedRate(srcTokenAddress, ETH_ADDRESS, rate.toString());
      const tradeDestBefore = await web3.eth.getBalance(tradeDest);

      await this.kyberNetworkMock.trade(
        srcTokenAddress,
        srcAmount.toString(),
        ETH_ADDRESS,
        tradeDest,
        0, // we do not use that param
        0, // we do not use that param
        ETH_ADDRESS, // we do not use that param
        {
          from: owner,
          value: rate, // this much ETH is needed to make trade
        }
      );

      const tradeDestAfter = await web3.eth.getBalance(tradeDest);

      const tradeDestDiff = new BigNumber(tradeDestAfter).sub(new BigNumber(tradeDestBefore));
      tradeDestDiff.should.be.bignumber.equal(new BigNumber(rate));
    });
  });
});
