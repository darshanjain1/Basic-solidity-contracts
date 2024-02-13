const { deployments, getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config.js")
const { assert } = require("chai");

!developmentChains.includes(network.name) ?
    describe.skip() :
    describe('Basic NFT unit tests', () => {
        let deployer, basicNft
        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer
            await deployments.fixture(['basicNft'])
            basicNft = await ethers.getContract('BasicNFT', deployer)
        })

        describe('Constructor', () => {
            it('Initializes the NFT correctly', async () => {
                let nftName = await basicNft.name()
                let nftSymbol = await basicNft.symbol()
                let tokenCounter = await basicNft.getTokenCounter()
                assert.equal(nftName, 'Dogie')
                assert.equal(nftSymbol, 'Dog')
                assert.equal(tokenCounter, 0)
            })
        })
    })