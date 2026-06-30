# 部署指令和交互指令
- 用run脚本文件部署
npx hardhat run scripts/deployFundMe.js

- 用task任务的形式进行部署
npx hardhat deploy-fundMe
npx hardhat interact-fundMe --contract 0x3eEED288c1052aA16adedbfb9E0EC49BD478809F

- 用test框架部署
npx hardhat test --network sepolia

# 链上成果

https://sepolia.etherscan.io/address/0x3eEED288c1052aA16adedbfb9E0EC49BD478809F#code

## 如何使用
1. 将 repo clone到本地：
2. 进入文件夹
3. 安装 NPM package
-  运行 `npm install` 安装 NPM package
4. 添加环境变量
- `npx hardhat env-enc set-pw` 为 `.env.enc` 设置密码
- 添加环境变量`npx hardhat env-enc set`: `PRIVATE_KEY`, `PRIVATE_KEY_1`, `SEPOLIA_URL` 和 `ETHERSCAN_API_KEY`
5. 对 `FundMe.sol` 进行单元测试
- `npx hardhat test` 运行单元测试脚本。
6. 对 `FundMe.sol` 进行集成测试
- `npx hardhat test --network sepolia` 运行集成测试脚本。

更多的相关内容请查看[Web3_tutorial](https://github.com/smartcontractkit/Web3_tutorial_Chinese)的 `README.md`。


## introduction
This is part of the Web3_tutorial. <br>
Video link: WIP<br>

In lesson 5, safety is cannot be ignored in Solidity programming. You will learn how to use the Hardhat framework to conduct unit tests and integration tests on smart contracts, ensuring the contracts you write are secure.

## Getting Started
1. clone the repo
`git clone https://github.com/smartcontractkit/Web3_tutorial_Chinese.git`
2. change directory to folder lesson-5
`cd Web3_tutorial_Chinese/lesson-5`
3. Install NPM package
- Run `npm install` to install NPM packages.
4. Add environment variables
- Set a password for `.env.enc` with `npx hardhat env-enc set-pw`.
- Add environment variables using `npx hardhat env-enc set`: `PRIVATE_KEY`, `PRIVATE_KEY_1`, `SEPOLIA_RPC_URL`, and `ETHERSCAN_API_KEY`.
5. Unit test `FundMe.sol`
- Run unit tests with `npx hardhat test`.
6. Satging test `FundMe.sol`
- Run staging tests with `npx hardhat test --network sepolia`.

For more related content, please refer to the README.md of [Web3_tutorial](https://github.com/smartcontractkit/Web3_tutorial_Chinese).
