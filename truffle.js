// Allows us to use ES6 in our migrations and tests.
require('babel-register');
require('babel-polyfill');

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
        solc: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    }
};