// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract SmartFunding is Ownable, Pausable {
    uint256 fundingStage; // 0 = INACTIVE, 1 = ACTIVE, 2 = SUCCESS, 3 = FAIL
    address public tokenAddress;
    uint256 public goal;
    uint256 public pool;
    uint256 public endtime;

    mapping(address => uint256) public investOf;
    mapping(address => uint256) public rewardOf;
    mapping(address => bool) public claimedOf;

    event Invest(address indexed from, uint256 amount);
    event ClaimReward(address indexed from, uint256 amount);
    event Refund(address indexed from, uint256 amount);

    modifier atStage(uint256 stage) {
        require(fundingStage == stage);
        _;
    }

    constructor(address _tokenAddress) {
        tokenAddress = _tokenAddress;
        fundingStage = 0;
    }

    function initialize(uint256 _goal, uint256 _endtime) external onlyOwner {
        goal = _goal;
        endtime = block.timestamp + (_endtime * 1 days);
        fundingStage = 1;
    }

    function calculateReward(uint256 amount) public view returns (uint256) {
        uint256 totalPool = pool + amount;
        uint256 totalSupply = IERC20(tokenAddress).totalSupply();

        if (totalPool <= goal) {
            return (totalSupply / goal) * amount;
        } else {
            return (totalSupply / goal) * (goal - pool);
        }
    }

    function invest() external payable atStage(1) whenNotPaused {
        require(msg.value != 0, "Amount should be more than 0");
        require(investOf[msg.sender] == 0, "Already invest");

        uint256 reward = calculateReward(msg.value);
        rewardOf[msg.sender] = reward;
        investOf[msg.sender] = msg.value;
        pool += msg.value;

        emit Invest(msg.sender, msg.value);
    }

    function claim() external atStage(2) whenNotPaused {
        require(claimedOf[msg.sender] == false, "Already claim");
        require(rewardOf[msg.sender] > 0, "No reward");

        uint256 reward = rewardOf[msg.sender];
        claimedOf[msg.sender] = true;
        rewardOf[msg.sender] = 0;
        IERC20(tokenAddress).transfer(msg.sender, reward);

        emit ClaimReward(msg.sender, reward);
    }

    function refund() external atStage(3) whenNotPaused {
        require(investOf[msg.sender] > 0, "No invest");

        uint256 investAmount = investOf[msg.sender];
        investOf[msg.sender] = 0;
        rewardOf[msg.sender] = 0;
        pool -= investAmount;

        payable(msg.sender).transfer(investAmount);

        emit Refund(msg.sender, investAmount);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
}
