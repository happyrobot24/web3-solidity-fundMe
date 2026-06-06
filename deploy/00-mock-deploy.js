const {DECIMAL, INITIAL_ANSWER} = require("../helper-hardhat-config")

const getNamedAccounts = require("hardhat-deploy").getNamedAccounts

module.exports = async ({getNamedAccounts, deployments}) => {
    // 从getNamedAccounts 获取第一个账户的地址，命名为deployer
    const firstAccount = (await getNamedAccounts()).firstAccount
    console.log("Deploying MockV3Aggregator with the account:", firstAccount)
    
    // 从deployments对象中获取deploy函数
    const { deploy } = deployments
    // 调用deploy函数部署合约，传入合约名称和部署参数
    await deploy("MockV3Aggregator", {
        from: firstAccount,
        args: [DECIMAL, INITIAL_ANSWER], // 构造函数参数，8表示usdt8位。3000表示价格3000美元
        log: true
    })
}

module.exports.tags = ["all", "mock"]