require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 10000,
        details: {
          yulDetails: {
            optimizerSteps: "u",
          },
        },
      },
    },
  },
  gasReporter: {
    currency: "ETH",
    enabled: false,
    coinmarketcap: "",
  },

  networks: {
    hardhat: {
      forking: {
        // mumbai
        url: process.env.RPC_URL,
      },
    },

    mumbai: {
      url: process.env.RPC_URL,
      chainId: 80001,
      accounts: [process.env.MY_PRIVATE_TEST_KEY],
    },
  },
  mocha: {
    timeout: 100000000,
  },
};
