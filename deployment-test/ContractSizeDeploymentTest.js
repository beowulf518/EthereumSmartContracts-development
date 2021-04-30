const BankToken                           = artifacts.require('./BankToken.sol');
const ExchangeConnector                   = artifacts.require('./ExchangeConnector.sol');
const MathHelpers                         = artifacts.require('./MathHelpers.sol');
const Migrations                          = artifacts.require('./Migrations.sol');
const MintableBurnableERC20               = artifacts.require('./MintableBurnableERC20.sol');
const OptionExecutionToken                = artifacts.require('./OptionExecutionToken.sol');
const QtumRepresentationToken             = artifacts.require('./QtumRepresentationToken.sol');
const QuickSort                           = artifacts.require('./QuickSort.sol');
const TokenManagerBase                    = artifacts.require('./TokenManagerBase.sol');
const TokenManagerAdmin                   = artifacts.require('./TokenManagerAdmin.sol');
const TokenManagerAssets                  = artifacts.require('./TokenManagerAssets.sol');
const TokenWrapper                        = artifacts.require('./TokenWrapper.sol');
const Utils                               = artifacts.require('./Utils.sol');
const ExchangeConnectorMock               = artifacts.require('./ExchangeConnectorMock.sol');
const Asset                               = artifacts.require('./MintableBurnableERC20TokenMock.sol');
const Resolver                            = artifacts.require('./Resolver.sol');
const TokenManagerRouter                  = artifacts.require('./TokenManagerRouter.sol');
const TokenValidator                      = artifacts.require('./TokenValidator.sol');
const ExchangeConnectorRouter             = artifacts.require('./ExchangeConnectorRouter.sol');
const IRoleManager                         = artifacts.require('./IRoleManager.sol');
const RoleManager                     = artifacts.require('./RoleManager.sol');
const RoleAware                           = artifacts.require('./RoleAware.sol');
const DateKeeper                          = artifacts.require('./DateKeeper.sol');
const UserValidator                       = artifacts.require('./UserValidator.sol');
const WeeklyValidator                     = artifacts.require('./WeeklyValidator.sol');
const MonthlyValidator                    = artifacts.require('./MonthlyValidator.sol');
const QuarterlyValidator                  = artifacts.require('./QuarterlyValidator.sol');
const FixedValidator                      = artifacts.require('./FixedValidator.sol');
const ERC1410                             = artifacts.require('./ERC1410.sol');
const ERC1594                             = artifacts.require('./ERC1594.sol');
const ERC1644                             = artifacts.require('./ERC1644.sol');
const ERC20Security                       = artifacts.require('./ERC20Security.sol');
const ERC1410Extended                     = artifacts.require('./ERC1410Extended.sol');
const ERC1400Permissions                  = artifacts.require('./ERC1400Permissions');
const ERC1400Router                       = artifacts.require('./ERC1400Router.sol');
const CompanyMapper                       = artifacts.require('./CompanyMapper.sol');

contract('Contract Size Deployment Test', function () {
  const DEPLOYMENT_SIZE_LIMIT = 2 ** 14 + 2 ** 13;
  const contracts = [
    BankToken,
    ExchangeConnector,
    MathHelpers,
    Migrations,
    MintableBurnableERC20,
    OptionExecutionToken,
    QtumRepresentationToken,
    QuickSort,
    TokenManagerBase,
    TokenManagerAdmin,
    TokenManagerAssets,
    TokenValidator,
    TokenWrapper,
    Utils,
    ExchangeConnectorMock,
    Asset,
    Resolver,
    TokenManagerRouter,
    ExchangeConnectorRouter,
    IRoleManager,
    RoleManager,
    RoleAware,
    DateKeeper,
    UserValidator,
    WeeklyValidator,
    MonthlyValidator,
    QuarterlyValidator,
    FixedValidator,
    ERC1410,
    ERC1594,
    ERC1644,
    ERC20Security,
    ERC1410Extended,
    ERC1400Permissions,
    ERC1400Router,
    CompanyMapper,
  ];
  contracts.forEach(contract => {
    it(`Size of ${contract.contractName} contract is less than 24 kb`, async function () {
      const contractSize = contract.deployedBytecode.length;
      assert.isAtMost(
        contractSize,
        DEPLOYMENT_SIZE_LIMIT,
        `Contract ${contract.contractName} is too large, size = ${contractSize} bytes`
      );
    });
  });
});
