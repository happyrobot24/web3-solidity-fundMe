const { assert, expect } = require("chai")
const { ethers, deployments, getNamedAccounts, network } = require("hardhat")
const hre = require("hardhat")
const helpers = require("@nomicfoundation/hardhat-network-helpers")
const { devlopmentChains } = require("../../helper-hardhat-config")

!devlopmentChains.includes(network.name)
? describe.skip
: describe("FundMe Contract Test", function () {
    let fundMe
    let fundMeSecondAccount
    let firstAccount
    let secondAccount    
    let mockV3Aggregator


    // 在每个测试用例之前部署一个新的FundMe合约实例
    beforeEach(async function () {
        // 用 tags 的方式部署合约，运行 npx hardhat deploy --tags fundMe 就会执行这个部署脚本
        await deployments.fixture(["all"])
        // 获取部署者账户地址
        firstAccount = (await getNamedAccounts()).firstAccount
        secondAccount = (await getNamedAccounts()).secondAccount
        // 获取部署的 FundMe 合约实例
        const fundMeDeployment = await deployments.get("FundMe")
        const deployerSigner = await hre.ethers.getSigner(firstAccount)
        // 获取第一个账户的 FundMe 合约实例。这样用这个调用的时候就表示第一个账户调用合约
        fundMe = await hre.ethers.getContractAt("FundMe", fundMeDeployment.address, deployerSigner)
        // 获取第二个账户的 FundMe 合约实例。这样用这个调用的时候就表示第二个账户调用合约
        const secondAccountSigner = await hre.ethers.getSigner(secondAccount)
        fundMeSecondAccount = await hre.ethers.getContractAt("FundMe", fundMeDeployment.address, secondAccountSigner)
        mockV3Aggregator = await deployments.get("MockV3Aggregator")

    })

    // Test cases will go here
    it("should the owner must be msg.sender", async function () {
        // 通过合约工厂部署fundMe合约
        // const FundMeFactory = await ethers.getContractFactory("FundMe")
        // const fundMe = await FundMeFactory.deploy(600)
        // await fundMe.waitForDeployment()
        // const [account1] = await ethers.getSigners()

        // 获取部署合约的地址
        const deployerAddress = await fundMe.owner()
        console.log("Deployer address:", deployerAddress)
        console.log("Deployer account:", firstAccount)

        // 断言部署者地址和msg.sender地址相同
        assert.equal(deployerAddress, firstAccount, "Owner should be the deployer")
    })

    it("test priceFeed is correctly initialized", async function () {
        const priceFeedAddress = await fundMe.priceFeed()
        const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
        assert.notEqual(priceFeedAddress, ZERO_ADDRESS, "Price feed address should not be zero")
    });


    // 单元测试 核心方法

    // fund, getFund, refund
    // unit test for fund
    // window open, value greater then minimum value, funder balance
    it("window closed, value grater than minimum, fund failed", 
        async function() {
            // make sure the window is closed
            await helpers.time.increase(200)
            await helpers.mine()
            //value is greater minimum value
            await expect(fundMe.fund({value: ethers.parseEther("0.1")}))
                .to.be.revertedWith("window is closed")
        }
    )

    it("window open, value is less than minimum, fund failed", 
        async function() {
            await expect(fundMe.fund({value: ethers.parseEther("0.001")}))
                .to.be.revertedWith("Send more ETH")
        }
    )

    it("Window open, value is greater minimum, fund success", 
        async function() {
            // greater than minimum
            await fundMe.fund({value: ethers.parseEther("0.01")})
            const balance = await fundMe.funderToAmount(firstAccount)
            await expect(balance).to.equal(ethers.parseEther("0.01"))
        }
    )    

    // unit test for getFund
    // onlyOwner, windowClose, target reached
    it("not onwer, window closed, target reached, getFund failed", 
        async function() {
            // make sure the target is reached 
            await fundMe.fund({value: ethers.parseEther("0.1")})

            // make sure the window is closed
            await helpers.time.increase(200)
            await helpers.mine()

            await expect(fundMeSecondAccount.getFund())
                .to.be.revertedWith("this function can only be called by owner")
        }
    )

    it("window open, target reached, getFund failed", 
        async function() {
            await fundMe.fund({value: ethers.parseEther("0.1")})
            await expect(fundMe.getFund())
                .to.be.revertedWith("window is closed")
        }
    )

    it("window closed, target not reached, getFund failed",
        async function() {
            await fundMe.fund({value: ethers.parseEther("0.01")})
            // make sure the window is closed
            await helpers.time.increase(200)
            await helpers.mine()            
            await expect(fundMe.getFund())
                .to.be.revertedWith("Target is not reached")
        }
    )

    it("window closed, target reached, getFund success", 
        async function() {
            await fundMe.fund({value: ethers.parseEther("0.1")})
            // make sure the window is closed
            await helpers.time.increase(200)
            await helpers.mine()   
            await expect(fundMe.getFund())
                .to.emit(fundMe, "FundWithdrawByOwner")
                .withArgs(ethers.parseEther("0.1"))
        }
    )

    // refund
    // windowClosed, target not reached, funder has balance
    it("window open, target not reached, funder has balance", 
        async function() {
            await fundMe.fund({value: ethers.parseEther("0.01")})
            await expect(fundMe.refund())
                .to.be.revertedWith("window is closed");
        }
    )

    it("window closed, target reach, funder has balance, refund failed", 
        async function() {
            await fundMe.fund({value: ethers.parseEther("0.6")})
            // 打印合约的 余额
            const balance = await ethers.provider.getBalance(fundMe.target)
            console.log("Contract balance before refund:", ethers.formatEther(balance), "ETH")
            // make sure the window is closed
            await helpers.time.increase(200)
            await helpers.mine()  
            await expect(fundMe.refund())
                .to.be.revertedWith("Target is reached");
        }
    )

    it("window closed, target not reach, funder does not has balance", 
        async function() {
            await fundMe.fund({value: ethers.parseEther("0.02")})
             // 3000 * 0.02 = 60 < 100, target not reached
            // 打印合约的 余额
            const balance = await ethers.provider.getBalance(fundMe.target)
            console.log("Contract first balance before refund:", ethers.formatEther(balance), "ETH")
            // 打印合约的 TARGET_AMOUNT
            const targetAmount = await fundMe.TARGET_AMOUNT()
            console.log("Contract TARGET_AMOUNT:", ethers.formatEther(targetAmount), "ETH")
            // 打印合约的 TARGET_AMOUNT 和MIN_AMOUNT 变量的值
            const minAmount = await fundMe.MIN_AMOUNT()
            console.log("Contract MIN_AMOUNT:", ethers.formatEther(minAmount), "ETH")
            // make sure the window is closed
            await helpers.time.increase(200)
            await helpers.mine()  
            await expect(fundMeSecondAccount.refund())
                .to.be.revertedWith("there is no fund for you");
        }
    )

    it("window closed, target not reached, funder has balance", 
        async function() {
            await fundMe.fund({value: ethers.parseEther("0.01")})
            // make sure the window is closed
            await helpers.time.increase(200)
            await helpers.mine()  
            await expect(fundMe.refund())
                .to.emit(fundMe, "RefundByFunder")
                .withArgs(firstAccount, ethers.parseEther("0.01"))
        }
    )

    // // unit test for FundMe contract fund function‘s require(block.timestamp < deployTime + lockTime, "window is closed!");
    // it("should not allow users to fund the contract after lock time", async function () {
    //     const [account1] = await ethers.getSigners()
    //     const fundAmount = ethers.parseEther("0.01") // 0.01 ETH

    //     // 增加区块时间，超过锁定时间
    //     await hre.network.provider.send("evm_increaseTime", [200]) // 增加10分钟
    //     await hre.network.provider.send("evm_mine") // 触发挖矿

    //     // 调用 fund 函数，发送 0.01 ETH
    //     await assert.rejects(
    //         async () => {
    //             const tx = await fundMe.fund({ value: fundAmount })
    //             await tx.wait()
    //         },
    //         (error) => {
    //             assert.include(error.message, "window is closed!", "Error message should include 'window is closed!'")
    //             return true
    //         }
    //     )
    // })


    // // unit test for FundMe contract fund function
    // it("should allow users to fund the contract", async function () {
    //     const [account1] = await ethers.getSigners()
    //     const fundAmount = ethers.parseEther("0.01") // 0.01 ETH

    //     // 调用 fund 函数，发送 0.01 ETH
    //     const tx = await fundMe.fund({ value: fundAmount })
    //     await tx.wait()

    //     // 获取合约的余额
    //     const contractBalance = await ethers.provider.getBalance(fundMe.target)

    //     // 断言合约余额等于发送的金额
    //     assert.equal(contractBalance.toString(), fundAmount.toString(), "Contract balance should be equal to the funded amount")
    // })

    // // unit test for FundMe contract refund function
    // it("should allow users to refund if lock time has passed", async function () {
    //     const [account1] = await ethers.getSigners()
    //     const fundAmount = ethers.parseEther("0.01") // 0.01 ETH

    //     // 调用 fund 函数，发送 0.01 ETH
    //     const tx = await fundMe.fund({ value: fundAmount })
    //     await tx.wait()

    //     // 增加区块时间，超过锁定时间
    //     await hre.network.provider.send("evm_increaseTime", [600]) // 增加10分钟
    //     await hre.network.provider.send("evm_mine") // 触发挖矿

    //     // 调用 refund 函数
    //     const refundTx = await fundMe.refund()
    //     await refundTx.wait()

    //     // 获取合约的余额
    //     const contractBalance = await ethers.provider.getBalance(fundMe.target)

    //     // 断言合约余额为0
    //     assert.equal(contractBalance.toString(), "0", "Contract balance should be zero after refund")
    // })

    // // unit test for FundMe contract getFund function
    // it("should return the correct fund amount for a funder", async function () {
    //     const [account1] = await ethers.getSigners()
    //     const fundAmount = ethers.parseEther("0.01") // 0.01 ETH

    //     // 调用 fund 函数，发送 0.01 ETH
    //     const tx = await fundMe.fund({ value: fundAmount })
    //     await tx.wait()

    //     // 调用 getFund 函数获取资金金额
    //     const fundedAmount = await fundMe.getFund(account1.address)

    //     // 断言返回的金额等于发送的金额
    //     assert.equal(fundedAmount.toString(), fundAmount.toString(), "Funded amount should be equal to the amount sent")
    // })

});