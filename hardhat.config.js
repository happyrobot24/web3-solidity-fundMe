require("@nomicfoundation/hardhat-toolbox");
require("@chainlink/env-enc").config();
require("./tasks")
require("hardhat-deploy")

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  // defaultNetwork: "sepolia",
  solidity: "0.8.24",
  mocha: {
    timeout: 300000 // 300秒
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.SEPOLIA_PRIVATE_KEY, process.env.ETHERSCAN_API_KEY_1].filter(Boolean),
      chainId: 11155111
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  namedAccounts: {
    firstAccount: {
      default: 0
    },
    secondAccount: {
      default: 1
    },
    // deployer: {
    //   default: 0
    // }
  },
  gasReporter: {
    enabled: true,
    // currency: "USD",
    outputFile: "gas-report.txt"
    // noColors: true
  }
};
