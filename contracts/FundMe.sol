// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

// 1.创建一个收款函数
// 2.记录投资人并查看
// 3.在锁定期内，达到目标值，生产商可以提款
// 4.在锁定期内，没有达到目标值，投资人在锁定期以后退款
contract FundMe{
    mapping (address => uint) public funderToAmount;
    // uint MIN_AMOUNT = 1 * 10 ** 18;  // 1个eth = 10 ** 18 wei
    uint constant MIN_AMOUNT = 1 * 10 ** 18;  // 1 USD
    AggregatorV3Interface public priceFeed;

    uint TARGET_AMOUNT = 10 * 10 ** 18;  // 10 USD

    address public  owner;
    address erc20TokenAddr;
    bool public getFundSuccess = false;

    uint deployTime;
    uint lockTime;

    // 构造函数，部署合约时指定
    constructor (uint _lockTime, address priceFeedAddr) {
        // sepolia testnet
        priceFeed = AggregatorV3Interface(priceFeedAddr);
        owner = msg.sender;
        deployTime = block.timestamp;
        lockTime = _lockTime;
    }

    // 筹款，募集资金。锁定期内
    function fund() external payable {
        uint amount = msg.value;
        uint usdAmount = convertEth2USD(amount);
        require(usdAmount >= MIN_AMOUNT, "USD Amount too low!");
        require(block.timestamp < deployTime + lockTime, "window is closed!");
        // require(amount >= MIN_AMOUNT, "Amount too low!");
        funderToAmount[msg.sender] += msg.value;
    }

    function funderAmount(address addr) public view returns (uint) {
        return funderToAmount[addr];
    }

    // 减少金额。只允许fundMeToken合约调用
    function setfunderAmount(address addr, uint amount) external  {
        require(msg.sender == erc20TokenAddr, "you are not the erc20 contract!");
        funderToAmount[addr] = amount;
    }

        // 设置erc20合约地址。只有owner可以
    function setERC20Addr(address addr) public onlyOwner {
        erc20TokenAddr = addr;
    }

    /**
    * Returns the latest answer.
    */
    function getChainlinkDataFeedLatestAnswer() public view returns (int) {
        // prettier-ignore
        (
        /* uint80 roundId */
        ,
        int answer,
        /*uint256 startedAt*/
        ,
        /*uint256 updatedAt*/
        ,
        /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();
        return answer;
    }

    function convertEth2USD (uint256 ethAmount) internal view returns ( uint256) {
        uint256 price = uint256(getChainlinkDataFeedLatestAnswer());
        // 1 eth = 10^18  price = 10^8 usd
        // ethAmount * price / 10^18 * 10^8
        // 入参 1个eth 1 * 10 ** 18
        // price 是3000 USD 3000 * 10 ** 8
        // 希望返回 1 * 10 ** 18 * 3000
        // 1 * 10 ** 18 *  (3000 * 10 ** 8) / (10 ** 8) = 1 * 10 ** 18 * 3000 表示 1个eth 等于 3000 u
        // 
        return ethAmount * price / (10 ** 8);
    }

    function transferOwner(address newOwner) public onlyOwner {
        owner = newOwner;
    }

    // 提款，锁定期满，金额满足，owner可以提款将合约余额转到用户余额
    function getFund() external windowClosed onlyOwner {
        uint contractBalance = address(this).balance;
        address sender = msg.sender;
        require(convertEth2USD(contractBalance) >= TARGET_AMOUNT, "Not Reach Target Amount!");

        // transfer
        // payable (sender).transfer(contractBalance);
        // send
        // bool success = payable (sender).send(contractBalance);
        // require(success, "Failed!");890
        // call
        bool success;
        (success, ) = payable (sender).call{value: contractBalance}("");
        require(success, "Failed!");
        funderToAmount[sender] = 0;
        getFundSuccess = true;
    }

    // 退款，锁定期满，如果目标未达成，则投资用户可以提走自己的投资金额
    function refund() external windowClosed {
        address myAddress = msg.sender;
        uint contractBalance = address(this).balance;
        require(contractBalance < TARGET_AMOUNT, "Target is reached!");
        uint myContractAmount = funderToAmount[myAddress];
        require(myContractAmount > 0, "you have no balance in this contract!");

        bool success;
        (success, ) = payable (myAddress).call{value: myContractAmount}("");
        require(success, "Failed!");
        funderToAmount[myAddress] = 0;
    }

    modifier windowClosed() {
        require(block.timestamp >= deployTime + lockTime, "window is closed!");
        // 业务方法在require后执行
        _;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "you are not the owner!");
        _;
    }

}