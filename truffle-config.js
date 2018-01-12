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
            network_id: '*', // es-lint disable-line camelcase
            port: 8545,
            gas: 0xfffffffffff,
            gasPrice: 0x01
        }
	}
}
