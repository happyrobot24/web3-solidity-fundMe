
const {ether} = require("hardhat")

async function main() {
    // create factory and deploy contract
    const FundMeFactory = await ethers.getContractFactory("FundMe")
    // 创建一个新的合约实例，并部署到链上
    const fundMe = await FundMeFactory.deploy()
    // 等待链上部署完成
    await fundMe.waitForDeployment()
    console.log("FundMe deployed to:", fundMe.target)

    // 调用合约的fund函数，发送1个eth
    // const tx = await fundMe.fund({value: ether("1")})
    // // 等待交易被链上确认
    // await tx.wait()
    // console.log("Funded with 1 ETH")
}