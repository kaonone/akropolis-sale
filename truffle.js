// Allows us to use ES6 in our migrations and tests.
require('babel-register');
require('babel-polyfill');
const HDWalletProvider = require("./tools/akropolis-hdwallet-provider");
const LedgerWalletProvider = require("truffle-ledger-provider");
const config = require('./test-config.json');

module.exports = {
    networks: {
        development: {
            host: 'localhost',
            port: 8545,
            network_id: '*' // Match any network id
        },
        coverage: {
            host: 'localhost',
            network_id: '*', // eslint-disable-line camelcase
            port: 8555,
            gas: 0xfffffffffff, // <-- Use this high gas value
            gasPrice: 0x01      // <-- Use this low gas price
        },
        kovan: {
          provider: function() {
            return new HDWalletProvider(config.mnemonic, "http://localhost:8545", 0, 3)
          },
          network_id: 42,
          gas: 6500000, // <-- Use this high gas value
          gasPrice: 0x05
        },
				ledger_kovan: {
					provider: new LedgerWalletProvider(
						{
							//Ledger Options
							networkId: 42,
							accountsOffset: 0, // we use the first address
							askConfirm: false,
							accountsLength: 2
						},
						"http://localhost:8545"
					),
					network_id: 42,
					gas: 6500000,
					gasPrice: 5000000000
				},
				ledger_rinkeby: {
					provider: new LedgerWalletProvider(
						{
							//Ledger Options
							networkId: 4,
							accountsOffset: 0, // we use the first address
							askConfirm: false,
							accountsLength: 2
						},
						"http://localhost:8545"
					),
					network_id: 4,
					gas: 6500000,
					gasPrice: 10000000000
				},
        solc: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    }
};