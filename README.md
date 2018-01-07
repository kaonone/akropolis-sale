# Akropolis Token Sale Smart Contracts

This project is a collection of smart contracts that manage the process of AET tokens distribution.

### Overview

The Akropolis project is building the largest alternative pensions infrastructure in the world.
We are creating decentralised pensions on the blockchain, built by and for the people, creating a safer financial future for humanity.

### Installation
This project requires [node-js](https://github.com/nodejs/node) runtime and uses [truffle](https://github.com/trufflesuite/truffle) as the Ethereum smart contract development framework.

In order to run it, install truffle first:

    npm install -g truffle

Then install all of the node-js dependencies

    npm install

Connection to blockchain node is defined in truffle.js:

    module.exports = {
        networks: {
            development: {
                host: 'localhost',
                port: 8545,
                network_id: '*' // Match any network id
            }
        }
    }

We recommend using popular Ethereum test client [Ganache](https://github.com/trufflesuite/ganache) as a default testing node:

    npm install -g ganache

### Running tests

To run all of the smart contract tests, use the following truffle command in your console:

    truffle test

## License

MIT License

Copyright (c) 2018 Akropolis Decentralised Ltd.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
