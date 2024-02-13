const { ethers, network } = require("hardhat");
const { developmentChains } = require('../helper-hardhat-config');
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { log } = deployments
    const { deployer } = await getNamedAccounts()

    // log('-----minting basic nft----')
    // const basicNft = await ethers.getContract('BasicNFT', deployer)
    // const basicMintNftTrxResponse = await basicNft.mintNft()
    // await basicMintNftTrxResponse.wait(1)
    // log('---minted basic nft is----', await basicNft.tokenURI(0))

    // log('------minting dynamic nft-----')
    // const dynamicSvgNft = await ethers.getContract('DynamicSvgNft', deployer)
    // const dynamicSvgNftMintNftTrxResponse = await dynamicSvgNft.mintNft("1000")
    // await dynamicSvgNftMintNftTrxResponse.wait(1)
    // log('----minted dynamic SVG nft is', await dynamicSvgNft.tokenURI(Number(await dynamicSvgNft.getTokenCounter())-1))

    // const dynamicSvgNft = await ethers.getContract("DynamicSvgNft", deployer)
    // const dynamicSvgNftMintTx = await dynamicSvgNft.mintNft("1000")
    // await dynamicSvgNftMintTx.wait(1)
    // console.log(`Dynamic SVG NFT index 0 tokenURI: ${await dynamicSvgNft.tokenURI(0)}`)

    log('-----minting random nft----')
    const randomNft = await ethers.getContract('RandomIpfsNft', deployer)
    console.log('randomNft.target', randomNft.target)
    const mintFee = await randomNft.getMintFee()
    const randomnftMintTrxResponse = await randomNft.mintNft({ value: mintFee })
    const randomnftMintTrxReceipt = await randomnftMintTrxResponse.wait(1)
    await new Promise(async (resolve, reject) => {

        setTimeout(() => reject("Timeout: 'NFTMinted' event did not fire"), 300000)
        randomNft.once('NftMinted', async () => {
            log('----minted random SVG nft is ', await randomNft.tokenURI(Number(await randomNft.getTokenCounter()) - 1))
            resolve()
        })
        if (developmentChains.includes(network.name)) {
            const requestId = randomnftMintTrxReceipt.logs[1].args[0]
            const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
            await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomNft.target)
        }
    })
}

module.exports.tags = ["mint"]