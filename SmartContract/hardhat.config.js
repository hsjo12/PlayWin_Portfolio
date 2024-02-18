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
    coinmarketcap: "8c73ee1a-5579-43a3-8e29-52893c5ecb00",
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
