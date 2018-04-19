//For the testnet deployment use this as folder instead of the original migrations.
//mv migrations migrations-tmp
//mv migrations-testnet migrations

var Migrations = artifacts.require("./Migrations.sol");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
};
