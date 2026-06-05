const { assert } = require("chai")

describe("FundMe Contract Test", function () {
    // Test cases will go here
    it("should the owner must be msg.sender", async function () {
        // 通过合约工厂部署fundMe合约
        const FundMeFactory = await ethers.getContractFactory("FundMe")
        const fundMe = await FundMeFactory.deploy(600)
        await fundMe.waitForDeployment()

        // 获取部署合约的地址
        const deployerAddress = await fundMe.owner()
        const [account1] = await ethers.getSigners()

        // 断言部署者地址和msg.sender地址相同
        assert.equal(deployerAddress, account1.address, "Owner should be the deployer")
    })

});