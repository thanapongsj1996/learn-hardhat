// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, run } from "hardhat";

async function main() {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile
    // manually to make sure everything is compiled

    // We get the contract to deploy
    const MyToken = await ethers.getContractFactory("MyToken")
    const myTokenContract = await MyToken.deploy()
    await myTokenContract.deployed()

    const SmartFunding = await ethers.getContractFactory("SmartFunding")
    const smartFundingContract = await SmartFunding.deploy(myTokenContract.address)
    await smartFundingContract.deployed()

    console.log("MyTokenContract deployed to:", myTokenContract.address);
    console.log("SmartFundingContract deployed to:", smartFundingContract.address);

    try {
        await run('verify:verify', {
            address: myTokenContract.address,
            contract: 'contracts/MyToken.sol:MyToken',
        })
    } catch { }

    try {
        await run('verify:verify', {
            address: smartFundingContract.address,
            constructorArguments: [myTokenContract.address],
            contract: 'contracts/SmartFunding.sol:SmartFunding',
        })
    } catch { }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
