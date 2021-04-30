require('@babel/register');
if (!global._babelPolyfill) {
  require('@babel/polyfill');
}

module.exports = {
  accounts: 35,
  copyPackages: ['openzeppelin-solidity'],
  skipFiles: [
    'Migrations.sol',
    'delegate/Router.sol',
  ],
  testCommand: 'truffle test --network coverage',
};
