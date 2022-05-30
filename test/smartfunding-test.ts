import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { ethers } from "hardhat"
import { MyToken, SmartFunding } from "../typechain"

const { utils } = ethers
const decimals = 18

describe("Deploy smart funding contract", function () {
    let owner: SignerWithAddress
    let myTokenContract: MyToken
    let smartFundingContract: SmartFunding

    beforeEach(async () => {
        [owner] = await ethers.getSigners()

        // Deploy contract
        const MyToken = await ethers.getContractFactory("MyToken")
        myTokenContract = await MyToken.deploy()
        await myTokenContract.deployed()

        const SmartFunding = await ethers.getContractFactory("SmartFunding")
        smartFundingContract = await SmartFunding.deploy(myTokenContract.address)
        await smartFundingContract.deployed()
        await smartFundingContract.initialize(utils.parseEther('1'), 7)
    })

    it("Should deploy smart funding", async function () {
        expect(await smartFundingContract.tokenAddress()).to.equal(myTokenContract.address)
        expect(await myTokenContract.totalSupply()).to.equal(utils.parseUnits('1000000', decimals))
        expect(await myTokenContract.balanceOf(owner.address)).to.equal(utils.parseUnits('1000000', decimals))
    })

    it("Should transfer owner token to smart funding contract", async function () {
        await myTokenContract.connect(owner).transfer(smartFundingContract.address, utils.parseUnits('1000000', decimals))
        expect(await myTokenContract.balanceOf(owner.address)).to.equal(utils.parseUnits('0', decimals))
        expect(await myTokenContract.balanceOf(smartFundingContract.address)).to.equal(utils.parseUnits('1000000', decimals))
    })

    it("Should initialize correctly", async function () {
        expect(await smartFundingContract.goal()).to.equal(utils.parseEther('1'))
    })
})

describe('Smart funding operations', async () => {
    let owner: SignerWithAddress
    let invester1: SignerWithAddress
    let invester2: SignerWithAddress
    let invester3: SignerWithAddress

    let myTokenContract: MyToken
    let smartFundingContract: SmartFunding

    beforeEach(async () => {
        [owner, invester1, invester2, invester3] = await ethers.getSigners()

        // Deploy contract
        const MyToken = await ethers.getContractFactory("MyToken")
        myTokenContract = await MyToken.deploy()
        await myTokenContract.deployed()

        const SmartFunding = await ethers.getContractFactory("SmartFunding")
        smartFundingContract = await SmartFunding.deploy(myTokenContract.address)
        await smartFundingContract.deployed()
        await smartFundingContract.initialize(utils.parseEther('1'), 7)
    })

    it('Should invest success', async () => {
        const tx1 = await smartFundingContract.connect(invester1).invest({ value: utils.parseEther('0.1') })
        await tx1.wait()
        const tx2 = await smartFundingContract.connect(invester2).invest({ value: utils.parseEther('0.2') })
        await tx2.wait()
        const tx3 = smartFundingContract.connect(invester3).invest({ value: utils.parseEther('0') })
        await expect(tx3).to.be.revertedWith('Amount should be more than 0')

        expect(await smartFundingContract.pool()).to.equal(utils.parseEther('0.3'))
        expect(await smartFundingContract.investOf(invester1.address)).to.equal(utils.parseEther('0.1'))
        expect(await smartFundingContract.investOf(invester2.address)).to.equal(utils.parseEther('0.2'))
        expect(tx1).to.emit(smartFundingContract, 'Invest').withArgs(invester1.address, utils.parseEther('0.1'))
        expect(tx2).to.emit(smartFundingContract, 'Invest').withArgs(invester2.address, utils.parseEther('0.1'))

        expect(await smartFundingContract.rewardOf(invester1.address)).to.equal(utils.parseUnits('100000', decimals))
        expect(await smartFundingContract.rewardOf(invester2.address)).to.equal(utils.parseUnits('200000', decimals))
    })
})
