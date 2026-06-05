// 创建一个task，命令行输入npx hardhat deploy-fundMe就会执行这个task
task("interact-fundMe", "Interact the FundMe contract")
    .addParam("contract", "The address of the deployed FundMe contract")
    .setAction(async (taskArgs, hre) => {
        // 获取合约地址
        const contractAddress = taskArgs.contract
        console.log("Interacting with FundMe at address:", contractAddress)

        // 获取合约实例
        const fundMe = await ethers.getContractAt("FundMe", contractAddress)
        console.log("Got FundMe contract instance")

        // init 2 accounts
        const [account1, account2] = await ethers.getSigners()
        console.log("Funding with account:", account1.address)

        // fund contract with first account
        const tx1 = await fundMe.fund({ value: ethers.parseEther("0.02") })
        await tx1.wait()
        console.log("Funded 1 ETH from account:", account1.address)

        // check contract balance
        // ethers.provider 相当于 etherscan浏览器
        const balance = await ethers.provider.getBalance(fundMe.target)
        console.log("Contract balance:", ethers.formatEther(balance), "ETH")

        // fund contract with second account
        console.log("Funding with account:", account2.address)
        const tx2 = await fundMe.connect(account2).fund({ value: ethers.parseEther("0.01") })
        await tx2.wait()
        console.log("Funded 2 ETH from account:", account2.address)

        // check contract balance again
        const balance2 = await ethers.provider.getBalance(fundMe.target)
        console.log("Contract balance after second funding:", ethers.formatEther(balance2), "ETH")

        // check funderToAmount mapping
        const amount1 = await fundMe.funderToAmount(account1.address)
        console.log(`Amount funded by ${account1.address}:`, ethers.formatEther(amount1), "ETH")

        const amount2 = await fundMe.funderToAmount(account2.address)
        console.log(`Amount funded by ${account2.address}:`, ethers.formatEther(amount2), "ETH")
    }
    )
