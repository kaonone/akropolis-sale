var Web3 = require("web3");
var contract = require("truffle-contract");
var Whitelist = contract(require("../build/contracts/Whitelist.json"));
require("bootstrap");

var account;

window.Dapp = {
	start: function() {
		this.setWhitelistedCount();
		//this.setFulfillmentCount();
	},

	setAlert: function(message, type) {
		type = type || "info";
		var element = document.getElementById("alerts");
		element.innerHTML = "<div class='alert alert-" + type + "'>" + message + "</div>";
	},

	throwError: function(message, err) {
		err = err || message;
		this.setAlert("<strong>Error!</strong> " + message, "danger");
		throw err;
	},

	setWhitelistedCount: function() {
		Whitelist.deployed().then(function(instance) {
			return instance.getWhitelistedCount.call();
		}).then(function(value) {
			var element = document.getElementById("whitelisted-count");
			element.innerHTML = value.valueOf();
		}).catch(function(err) {
			console.log(err);
		});
	},

	addToWhitelist: function() {
		var self = this;
		var address = document.getElementById("buyer-address").value;
		console.log("Adding to whitelist: " + address);
		Whitelist.deployed().then(function(instance) {
			self.setAlert("Adding to the whitelist...");
			return instance.addToWhitelist(address, {from: adminAccount});
		}).then(function() {
			self.setWhitelistedCount();
			self.setAlert("Buyer was added!", "success");
		}).catch(function(err) {
			Dapp.throwError("Cannot add to the whitelist!");
			console.log(err);
		});
	},

	removeFromWhitelist: function() {
		var self = this;
		var address = document.getElementById("remove-address").value;
		console.log("Removing from whitelist: " + address);
		Whitelist.deployed().then(function(instance) {
			self.setAlert("Removing from the whitelist...");
			return instance.removeFromWhitelist(address, {from: adminAccount});
		}).then(function() {
			self.setWhitelistedCount();
			self.setAlert("Buyer was removed!", "success");
		}).catch(function(err) {
			Dapp.throwError("Cannot remove from the whitelist!");
			console.log(err);
		});
	},

	checkAddress: function() {
		var self = this;
		var address = document.getElementById("check-address").value;
		console.log("Checking address: " + address);
		Whitelist.deployed().then(function(instance) {
			self.setAlert("CHecking address...");
			return instance.isWhitelisted(address, {from: adminAccount});
		}).then(function(result) {
			console.log(result);
			if (result) {
				self.setAlert("Address: " + address + " is whitelisted.", "success");
			} else {
				self.setAlert("Address: " + address + " is NOT whitelisted.", "danger");
			}
		}).catch(function(err) {
			Dapp.throwError("Cannot check the address!");
			console.log(err);
		});
	}

};

window.addEventListener("load", function() {
	// if (typeof web3 !== "undefined") {
	// 	window.web3 = new Web3(web3.currentProvider);
	// } else {
	// 	window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
	// }

	window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

	Whitelist.setProvider(web3.currentProvider);

	web3.eth.getAccounts(function(err, accounts) {
		if (err) {
			Dapp.throwError("Your browser can't see the decentralized web!", err);
		}
		if (accounts.length == 0) {
			Dapp.throwError("Connect an account!");
		}
		adminAccount = accounts[1];
		Dapp.start();
	});
});