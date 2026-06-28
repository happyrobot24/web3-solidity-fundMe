const devlopmentChains = require("../helper-hardhat-config").devlopmentChains
const networkConfig = require("../helper-hardhat-config").networkConfig
const lockTime = require("../helper-hardhat-config").LOCK_TIME

const network = require("hardhat").network
const getNamedAccounts = require("hardhat-deploy").getNamedAccounts

module.exports = async ({getNamedAccounts, deployments}) => {
    // 从getNamedAccounts 获取第一个账户的地址，命名为deployer
    const firstAccount = (await getNamedAccounts()).firstAccount
    console.log("Deploying FundMe with the account:", firstAccount)

    // 获取network的名称，如果是本地开发网络，就部署MockV3Aggregator合约，否则使用已部署的价格预言机地址
    const chainId = network.config.chainId
    const confirmations = networkConfig[chainId]?.blockConfirmations || 0
    console.log("chainId:", chainId, "confirmations:", confirmations)
    let priceFeedAddress
    if (devlopmentChains.includes(network.name)) {
        // 获取MockV3Aggregator合约的部署信息，获取其地址
        const mockV3AggregatorDeployment = await deployments.get("MockV3Aggregator")
        priceFeedAddress = mockV3AggregatorDeployment.address
        console.log("Using MockV3Aggregator deployed to:", priceFeedAddress)
    } else {
        // 从networkConfig中获取当前网络的价格预言机地址，如果没有则使用默认地址
        priceFeedAddress = networkConfig[chainId]?.ethUsdDataFeed || "0x694AA1769357215DE4FAC081bf1f309aDC325306"
        console.log("Using existing price feed at:", priceFeedAddress)
    }
    
    // 从deployments对象中获取deploy函数
    const { deploy } = deployments
    // 调用deploy函数部署合约，传入合约名称和部署参数
    await deploy("FundMe", {
        from: firstAccount,
        args: [lockTime, priceFeedAddress], // 构造函数参数，目标锁定期为10分钟和价格预言机地址
        log: true,
        waitConfirmations: confirmations
    })

    // 默认情况下hardhat会缓存上次已经部署的合约 deployments文件夹缓存
    // 如果需要强制重新部署，可以删除 deployments 文件夹中的缓存文件。或者添加部署参数 force: true 来强制重新部署合约

    // 增加合约的verify功能，在 sepolia 网络上部署后自动在 etherscan 上验证合约
    if (chainId === 11155111 && process.env.ETHERSCAN_API_KEY) {
        // console.log("sepolia Waiting for 5 confirmations before verification...")
        // await new Promise(resolve => setTimeout(resolve, 30000)) // 等待30秒，确保Etherscan已同步合约字节码
        await hre.run("verify:verify", {
            address: (await deployments.get("FundMe")).address,
            constructorArguments: [lockTime, priceFeedAddress]
        })
    } else {
        console.log("Skipping verification on network", network.name)
    }
    
}

module.exports.tags = ["all", "fundMe"]