import {
  baseRateWithBaseMultiplier,
} from '../../helpers/constants';
import {
  tokenAddressFromExchangeConnectorMock,
} from '../../helpers/common';
import {
  BigNumber, getChaiBN, contractInstanceAt,
} from '@nomisma/nomisma-smart-contract-helpers';
import {
  setupTokenManager,
} from '../manager/helpers/token-manager';
import {
  setupRoleManager,
} from '../../access/helpers/role-manager';
import {
  revert as EVMRevert,
} from 'truffle-test-helpers';
import { setupExConMock } from '../../exchange/helpers/excon-mock';

const TokenWrapper = artifacts.require('./TokenWrapper.sol');
const TokenWrapperMock = artifacts.require('./TokenWrapperMock.sol');
const Asset = artifacts.require('./MintableBurnableERC20TokenMock.sol');
const ERC20NoReturnSignature = artifacts.require('./ERC20NoReturnSignature.sol');
const ERC20NoReturnValue = artifacts.require('./ERC20NoReturnValue.sol');
const ERC20EmptyTransfer = artifacts.require('./ERC20EmptyTransfer.sol');


require('chai')
  .use(require('chai-as-promised'))
  .use(getChaiBN())
  .should();

contract('TokenWrapperMockTest', function (addresses) {
  beforeEach(async function () {
    const [ owner ] = addresses;
    this.roleManager = await setupRoleManager([owner], [owner]);
    this.tokenManager = await setupTokenManager(this.roleManager, owner);
    this.exchangeConnector = await setupExConMock(
      this.roleManager.address,
      this.tokenManager.address
    );
    this.tokenWrapper = await TokenWrapper.new();
    this.tokenWrapperMock = await TokenWrapperMock.new();
  });

  describe('safeTransferMock', function () {
    it('can transfer compliant tokens', async function () {
      const [, investor, beneficiary] = addresses;
      const amount = '100500';
      const tokenAddress = await tokenAddressFromExchangeConnectorMock(
        this.tokenWrapperMock.generateMockTokenForExchangeConnector(
          this.exchangeConnector.address,
          0,
          baseRateWithBaseMultiplier
        )
      );
      await this.exchangeConnector.tokenFaucet(
        tokenAddress,
        amount,
        {
          from: investor,
        }
      );
      const tokenContract = await contractInstanceAt(
        Asset,
        tokenAddress,
      );

      const balance = await tokenContract.balanceOf(investor);
      balance.should.be.bignumber.equal(new BigNumber(amount));
      await tokenContract.transfer(
        this.tokenWrapperMock.address,
        amount,
        {
          from: investor,
        }
      );
      await this.tokenWrapperMock.safeTransferMock(
        this.tokenWrapper.address,
        tokenContract.address,
        beneficiary,
        amount
      ).should.be.fulfilled;
      const beneficiaryBalance = await tokenContract.balanceOf(beneficiary);
      beneficiaryBalance.should.be.bignumber.equal(new BigNumber(amount));
    });

    it('can transfer no return signature tokens', async function () {
      const [, investor, beneficiary] = addresses;
      const amount = '100500';
      const tokenAddress = await tokenAddressFromExchangeConnectorMock(
        this.tokenWrapperMock.generateMockTokenForExchangeConnector(
          this.exchangeConnector.address,
          2,
          baseRateWithBaseMultiplier
        )
      );
      await this.exchangeConnector.tokenFaucet(
        tokenAddress,
        amount,
        {
          from: investor,
        }
      );
      const tokenContract = await contractInstanceAt(
        ERC20NoReturnSignature,
        tokenAddress,
      );

      const balance = await tokenContract.balanceOf(investor);
      balance.should.be.bignumber.equal(new BigNumber(amount));
      await tokenContract.transfer(
        this.tokenWrapperMock.address,
        amount,
        {
          from: investor,
        }
      );
      await this.tokenWrapperMock.safeTransferMock(
        this.tokenWrapper.address,
        tokenContract.address,
        beneficiary,
        amount
      ).should.be.fulfilled;
      const beneficiaryBalance = await tokenContract.balanceOf(beneficiary);
      beneficiaryBalance.should.be.bignumber.equal(new BigNumber(amount));
    });

    it('can transfer no return value tokens', async function () {
      const [, investor, beneficiary] = addresses;
      const amount = '100500';
      const tokenAddress = await tokenAddressFromExchangeConnectorMock(
        this.tokenWrapperMock.generateMockTokenForExchangeConnector(
          this.exchangeConnector.address,
          1,
          baseRateWithBaseMultiplier
        )
      );
      await this.exchangeConnector.tokenFaucet(
        tokenAddress,
        amount,
        {
          from: investor,
        }
      );
      const tokenContract = await contractInstanceAt(
        ERC20NoReturnValue,
        tokenAddress,
      );

      const balance = await tokenContract.balanceOf(investor);
      balance.should.be.bignumber.equal(new BigNumber(amount));
      await tokenContract.transfer(
        this.tokenWrapperMock.address,
        amount,
        {
          from: investor,
        }
      );
      await this.tokenWrapperMock.safeTransferMock(
        this.tokenWrapper.address,
        tokenContract.address,
        beneficiary,
        amount
      ).should.be.fulfilled;
      const beneficiaryBalance = await tokenContract.balanceOf(beneficiary);
      beneficiaryBalance.should.be.bignumber.equal(new BigNumber(amount));
    });

    it('transfer fails for empty transfer token if transfer is disabled', async function () {
      const [, , beneficiary] = addresses;
      const amount = '100500';
      const tokenAddress = await tokenAddressFromExchangeConnectorMock(
        this.tokenWrapperMock.generateMockTokenForExchangeConnector(
          this.exchangeConnector.address,
          3,
          baseRateWithBaseMultiplier
        )
      );
      await this.exchangeConnector.tokenFaucet(
        tokenAddress,
        amount,
        {
          from: beneficiary,
        }
      );
      const tokenMock = await contractInstanceAt(
        ERC20EmptyTransfer,
        tokenAddress
      );
      await tokenMock.transfer(
        this.tokenWrapperMock.address,
        amount,
        {
          from: beneficiary,
        }
      );
      const tokenWrapperMockBalance = await tokenMock.balanceOf(
        this.tokenWrapperMock.address,
      );
      tokenWrapperMockBalance.should.be.bignumber.equal(
        new BigNumber(amount)
      );
      await tokenMock.toggleTransferEnabled();
      await this.tokenWrapperMock.safeTransferMock(
        this.tokenWrapper.address,
        tokenAddress,
        beneficiary,
        amount
      ).should.be.rejectedWith(EVMRevert);
    });

    it('transfer suceeds for empty transfer token if transfer is enabled', async function () {
      const [, , beneficiary] = addresses;
      const amount = '100500';
      const tokenAddress = await tokenAddressFromExchangeConnectorMock(
        this.tokenWrapperMock.generateMockTokenForExchangeConnector(
          this.exchangeConnector.address,
          3,
          baseRateWithBaseMultiplier
        )
      );
      await this.exchangeConnector.tokenFaucet(
        tokenAddress,
        amount,
        {
          from: beneficiary,
        }
      );
      const tokenMock = await contractInstanceAt(
        ERC20EmptyTransfer,
        tokenAddress
      );
      await tokenMock.transfer(
        this.tokenWrapperMock.address,
        amount,
        {
          from: beneficiary,
        }
      );
      const tokenWrapperMockBalance = await tokenMock.balanceOf(
        this.tokenWrapperMock.address,
      );
      tokenWrapperMockBalance.should.be.bignumber.equal(
        new BigNumber(amount)
      );
      await this.tokenWrapperMock.safeTransferMock(
        this.tokenWrapper.address,
        tokenAddress,
        beneficiary,
        amount
      ).should.be.fulfilled;
    });
  });

  describe('safeApproveMock', function () {
    it('can approve compliant tokens', async function () {
      const [, investor, beneficiary] = addresses;
      const amount = '100500';
      const tokenAddress = await tokenAddressFromExchangeConnectorMock(
        this.tokenWrapperMock.generateMockTokenForExchangeConnector(
          this.exchangeConnector.address,
          0,
          baseRateWithBaseMultiplier
        )
      );
      await this.exchangeConnector.tokenFaucet(
        tokenAddress,
        amount,
        {
          from: investor,
        }
      );
      const tokenContract = await contractInstanceAt(
        Asset,
        tokenAddress,
      );

      let allowance = await tokenContract.allowance(this.tokenWrapperMock.address, beneficiary);
      allowance.should.be.bignumber.equal(new BigNumber(0));
      await tokenContract.transfer(
        this.tokenWrapperMock.address,
        amount,
        {
          from: investor,
        }
      );
      await this.tokenWrapperMock.safeApproveMock(
        this.tokenWrapper.address,
        tokenContract.address,
        beneficiary,
        amount
      ).should.be.fulfilled;
      allowance = await tokenContract.allowance(this.tokenWrapperMock.address, beneficiary);
      allowance.should.be.bignumber.equal(new BigNumber(amount));
    });

    it('can approve no return signature tokens', async function () {
      const [, investor, beneficiary] = addresses;
      const amount = '100500';
      const tokenAddress = await tokenAddressFromExchangeConnectorMock(
        this.tokenWrapperMock.generateMockTokenForExchangeConnector(
          this.exchangeConnector.address,
          2,
          baseRateWithBaseMultiplier
        )
      );
      await this.exchangeConnector.tokenFaucet(
        tokenAddress,
        amount,
        {
          from: investor,
        }
      );
      const tokenContract = await contractInstanceAt(
        ERC20NoReturnSignature,
        tokenAddress,
      );

      let allowance = await tokenContract.allowance(this.tokenWrapperMock.address, beneficiary);
      allowance.should.be.bignumber.equal(new BigNumber(0));
      await tokenContract.transfer(
        this.tokenWrapperMock.address,
        amount,
        {
          from: investor,
        }
      );
      await this.tokenWrapperMock.safeApproveMock(
        this.tokenWrapper.address,
        tokenContract.address,
        beneficiary,
        amount
      ).should.be.fulfilled;
      allowance = await tokenContract.allowance(this.tokenWrapperMock.address, beneficiary);
      allowance.should.be.bignumber.equal(new BigNumber(amount));
    });

    it('can approve no return value tokens', async function () {
      const [, investor, beneficiary] = addresses;
      const amount = '100500';
      const tokenAddress = await tokenAddressFromExchangeConnectorMock(
        this.tokenWrapperMock.generateMockTokenForExchangeConnector(
          this.exchangeConnector.address,
          1,
          baseRateWithBaseMultiplier
        )
      );
      await this.exchangeConnector.tokenFaucet(
        tokenAddress,
        amount,
        {
          from: investor,
        }
      );
      const tokenContract = await contractInstanceAt(
        ERC20NoReturnValue,
        tokenAddress,
      );

      let allowance = await tokenContract.allowance(this.tokenWrapperMock.address, beneficiary);
      allowance.should.be.bignumber.equal(new BigNumber(0));
      await tokenContract.transfer(
        this.tokenWrapperMock.address,
        amount,
        {
          from: investor,
        }
      );
      await this.tokenWrapperMock.safeApproveMock(
        this.tokenWrapper.address,
        tokenContract.address,
        beneficiary,
        amount
      ).should.be.fulfilled;
      allowance = await tokenContract.allowance(this.tokenWrapperMock.address, beneficiary);
      allowance.should.be.bignumber.equal(new BigNumber(amount));
    });

    it('approve fails for empty transfer token', async function () {
      const [, , beneficiary] = addresses;
      const amount = '100500';
      const tokenAddress = await tokenAddressFromExchangeConnectorMock(
        this.tokenWrapperMock.generateMockTokenForExchangeConnector(
          this.exchangeConnector.address,
          3,
          baseRateWithBaseMultiplier
        )
      );
      await this.exchangeConnector.tokenFaucet(
        tokenAddress,
        amount,
        {
          from: beneficiary,
        }
      );
      const tokenMock = await contractInstanceAt(
        ERC20EmptyTransfer,
        tokenAddress
      );
      await tokenMock.transfer(
        this.tokenWrapperMock.address,
        amount,
        {
          from: beneficiary,
        }
      );
      await this.tokenWrapperMock.safeApproveMock(
        this.tokenWrapper.address,
        tokenAddress,
        beneficiary,
        amount
      ).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('safeTransferFromMock', function () {
    it('can transferFrom compliant tokens', async function () {
      const [, investor, beneficiary] = addresses;
      const amount = '100500';
      const tokenAddress = await tokenAddressFromExchangeConnectorMock(
        this.tokenWrapperMock.generateMockTokenForExchangeConnector(
          this.exchangeConnector.address,
          0,
          baseRateWithBaseMultiplier
        )
      );
      await this.exchangeConnector.tokenFaucet(
        tokenAddress,
        amount,
        {
          from: investor,
        }
      );
      const tokenContract = await contractInstanceAt(
        Asset,
        tokenAddress,
      );

      const balance = await tokenContract.balanceOf(investor);
      balance.should.be.bignumber.equal(new BigNumber(amount));
      await tokenContract.transfer(
        this.tokenWrapperMock.address,
        amount,
        {
          from: investor,
        }
      );
      await this.tokenWrapperMock.safeApproveMock(
        this.tokenWrapper.address,
        tokenContract.address,
        this.tokenWrapperMock.address,
        amount
      ).should.be.fulfilled;
      await this.tokenWrapperMock.safeTransferFromMock(
        this.tokenWrapper.address,
        tokenContract.address,
        this.tokenWrapperMock.address,
        beneficiary,
        amount
      ).should.be.fulfilled;
      const beneficiaryBalance = await tokenContract.balanceOf(beneficiary);
      beneficiaryBalance.should.be.bignumber.equal(new BigNumber(amount));
    });

    it('can transferFrom no return signature tokens', async function () {
      const [, investor, beneficiary] = addresses;
      const amount = '100500';
      const tokenAddress = await tokenAddressFromExchangeConnectorMock(
        this.tokenWrapperMock.generateMockTokenForExchangeConnector(
          this.exchangeConnector.address,
          2,
          baseRateWithBaseMultiplier
        )
      );
      await this.exchangeConnector.tokenFaucet(
        tokenAddress,
        amount,
        {
          from: investor,
        }
      );
      const tokenContract = await contractInstanceAt(
        ERC20NoReturnSignature,
        tokenAddress,
      );

      const balance = await tokenContract.balanceOf(investor);
      balance.should.be.bignumber.equal(new BigNumber(amount));
      await tokenContract.transfer(
        this.tokenWrapperMock.address,
        amount,
        {
          from: investor,
        }
      );
      await this.tokenWrapperMock.safeApproveMock(
        this.tokenWrapper.address,
        tokenContract.address,
        this.tokenWrapperMock.address,
        amount
      ).should.be.fulfilled;
      await this.tokenWrapperMock.safeTransferFromMock(
        this.tokenWrapper.address,
        tokenContract.address,
        this.tokenWrapperMock.address,
        beneficiary,
        amount
      ).should.be.fulfilled;
      const beneficiaryBalance = await tokenContract.balanceOf(beneficiary);
      beneficiaryBalance.should.be.bignumber.equal(new BigNumber(amount));
    });

    it('can transferFrom no return value tokens', async function () {
      const [, investor, beneficiary] = addresses;
      const amount = '100500';
      const tokenAddress = await tokenAddressFromExchangeConnectorMock(
        this.tokenWrapperMock.generateMockTokenForExchangeConnector(
          this.exchangeConnector.address,
          1,
          baseRateWithBaseMultiplier
        )
      );
      await this.exchangeConnector.tokenFaucet(
        tokenAddress,
        amount,
        {
          from: investor,
        }
      );
      const tokenContract = await contractInstanceAt(
        ERC20NoReturnValue,
        tokenAddress,
      );

      const balance = await tokenContract.balanceOf(investor);
      balance.should.be.bignumber.equal(new BigNumber(amount));
      await tokenContract.transfer(
        this.tokenWrapperMock.address,
        amount,
        {
          from: investor,
        }
      );
      await this.tokenWrapperMock.safeApproveMock(
        this.tokenWrapper.address,
        tokenContract.address,
        this.tokenWrapperMock.address,
        amount
      ).should.be.fulfilled;
      await this.tokenWrapperMock.safeTransferFromMock(
        this.tokenWrapper.address,
        tokenContract.address,
        this.tokenWrapperMock.address,
        beneficiary,
        amount
      ).should.be.fulfilled;
      const beneficiaryBalance = await tokenContract.balanceOf(beneficiary);
      beneficiaryBalance.should.be.bignumber.equal(new BigNumber(amount));
    });

    it('transferFrom fails for empty transfer token', async function () {
      const [, , beneficiary] = addresses;
      const amount = '100500';
      const tokenAddress = await tokenAddressFromExchangeConnectorMock(
        this.tokenWrapperMock.generateMockTokenForExchangeConnector(
          this.exchangeConnector.address,
          3,
          baseRateWithBaseMultiplier
        )
      );
      await this.exchangeConnector.tokenFaucet(
        tokenAddress,
        amount,
        {
          from: beneficiary,
        }
      );
      const tokenMock = await contractInstanceAt(
        ERC20EmptyTransfer,
        tokenAddress
      );
      await tokenMock.transfer(
        this.tokenWrapperMock.address,
        amount,
        {
          from: beneficiary,
        }
      );
      const tokenWrapperMockBalance = await tokenMock.balanceOf(
        this.tokenWrapperMock.address,
      );
      tokenWrapperMockBalance.should.be.bignumber.equal(
        new BigNumber(amount)
      );
      await this.tokenWrapperMock.safeTransferFromMock(
        this.tokenWrapper.address,
        tokenMock.address,
        this.tokenWrapperMock.address,
        beneficiary,
        amount
      ).should.be.rejectedWith(EVMRevert);
    });
  });
});
