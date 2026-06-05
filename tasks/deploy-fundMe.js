const { task } = require("hardhat/config")

// 创建一个task，命令行输入npx hardhat deploy-fundMe就会执行这个task
task("deploy-fundMe", "Deploys the FundMe contract")
    .setAction(async (taskArgs, hre) => {
        // create factory and deploy contract
        const FundMeFactory = await ethers.getContractFactory("FundMe")
        console.log("Deploying FundMe...")
        // 创建一个新的合约实例，并部署到链上. 参数10是构造函数的参数，表示目标金额为10美元
        const fundMe = await FundMeFactory.deploy(600)
        // 等待链上部署完成,广播 交易并等待被链上确认
        await fundMe.waitForDeployment()
        console.log("FundMe deployed to:", fundMe.target)

        await verifyOnSepolia(fundMe, [600])
    }
)

async function verifyOnSepolia(contract, constructorArgs = []) {
    if (hre.network.name !== "sepolia") {
        console.log(`Skipping verification on network ${hre.network.name}`)
        return
    }

    if (!process.env.ETHERSCAN_API_KEY && !process.env.ETHERSCAN_APIKEY) {
        throw new Error("ETHERSCAN_API_KEY is required for sepolia verification")
    }

    // 等待5个确认，确保 Etherscan 已同步合约字节码
    console.log("Waiting for 5 confirmations before verification...")
    const deploymentTx = contract.deploymentTransaction()
    if (deploymentTx) {
        await deploymentTx.wait(5)
        console.log("5 confirmations received, proceeding with verification...")
    }

    // 增加hre.run verify插件，自动在etherscan上验证合约
    await hre.run("verify:verify", {
        address: contract.target,
        constructorArguments: constructorArgs
    })
}
