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
  etherscan: {
    apiKey: {
      // polygonMumbai: process.env.MUMBAI_KEY,
      sepolia: process.env.ETHER_SCAN_KEY,
    },
  },
  networks: {
    hardhat: {
      forking: {
        // seplolia
        url: process.env.RPC_URL,
      },
    },

    sepolia: {
      url: process.env.RPC_URL,
      chainId: 111_55_111,
      accounts: [process.env.MY_PRIVATE_TEST_KEY],
    },
  },
  mocha: {
    timeout: 100000000,
  },
};
