require('@babel/register');
if (!global._babelPolyfill) {
  require('@babel/polyfill');
}

module.exports = {
  networks: {
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
  },
  compilers: {
    solc: {
      version: '0.5.7',
    },
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
};
