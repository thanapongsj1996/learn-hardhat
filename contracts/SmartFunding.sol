// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SmartFunding {
    address public tokenAddress;
    uint256 public goal;
    uint256 public pool;
    uint256 public endtimeInDay;

    mapping(address => uint256) public investOf;
    mapping(address => uint256) public rewardOf;

    event Invest(address indexed from, uint256 amount);

    constructor(address _tokenAddress) {
        tokenAddress = _tokenAddress;
    }

    function initialize(uint256 _goal, uint256 _endtimeInDay) external {
        goal = _goal;
        endtimeInDay = block.timestamp + (_endtimeInDay * 1 days);
    }

    function invest() external payable {
        require(msg.value != 0, "Amount should be more than 0");
        require(investOf[msg.sender] == 0, "Already invest");

        investOf[msg.sender] = msg.value;
        pool += msg.value;

        uint256 totalSupply = IERC20(tokenAddress).totalSupply();
        uint256 reward = (totalSupply / goal) * msg.value;
        rewardOf[msg.sender] = reward;

        emit Invest(msg.sender, msg.value);
    }
}
