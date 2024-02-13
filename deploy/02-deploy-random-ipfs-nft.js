const { network, getNamedAccounts, ethers } = require('hardhat')
const { networkConfig, developmentChains } = require('../helper-hardhat-config')
const verify = require("../tasks/verify")
const { storeTokenUriMetadata, storeImages } = require('../utils/uploadToPinata')

require('dotenv').config()

const VRF_FUND_AMOUNT = ethers.parseEther("2")
const imagesLocation = "./images/randomNft/"
const metaDataTemplate = {
    name: '',
    description: '',
    attributes: [
        {
            trait_type: "Cuteness",
            value: '100'
        }
    ]
}
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    let vrfCoordinator, vrfCoordinatorAddress, subscriptionId, tokenUris = [
    ]

    const chainId = network.config.chainId
    const gasLane = networkConfig[chainId].gasLane
    const mintFee = networkConfig[chainId].mintFee
    const callbackGasLimit = networkConfig[chainId].callbackGasLimit
    if (process.env.UPLOAD_TO_PINATA === "true") {
        tokenUris = await handleTokenUris()
    }

    if (developmentChains.includes(network.name)) {
        vrfCoordinator = await ethers.getContract('VRFCoordinatorV2Mock')
        vrfCoordinatorAddress = vrfCoordinator.target;
        let transactionResponse = await vrfCoordinator.createSubscription()
        let transactionReceipt = await transactionResponse.wait(1)
        subscriptionId = Number(transactionReceipt.logs[0].args[0])
        await vrfCoordinator.fundSubscription(subscriptionId, VRF_FUND_AMOUNT)
    }
    else {
        vrfCoordinatorAddress = networkConfig[chainId].vrfCoordinatorV2;
        subscriptionId = networkConfig[chainId].subscriptionId
    }
    const args = [vrfCoordinatorAddress, subscriptionId, gasLane, callbackGasLimit, mintFee, tokenUris]

    const randomIpfsNft = await deploy('RandomIpfsNft', {
        from: deployer,
        args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || '1'
    })

    if (developmentChains.includes(network.name)) {
        await vrfCoordinator.addConsumer(subscriptionId, randomIpfsNft.address)
    }
    // verify the contract

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        console.log('network.name', network.name)
        log('-------verifying contract-------')
        await verify(randomIpfsNft.address, args)
        log('----contract verified----------')
    }
}

const handleTokenUris = async () => {
    tokenUris = []
    const { files, responses: imageUploadResponses } = await storeImages(imagesLocation)
    for (imageUploadResponseIndex in imageUploadResponses) {
        let tokenUriMetadata = { ...metaDataTemplate }
        tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "")
        tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`
        tokenUriMetadata.imageUrl = `${process.env.PINATA_IPFS_DOMAIN}${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`
        const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata)
        tokenUris.push(`${process.env.PINATA_IPFS_DOMAIN}${metadataUploadResponse.IpfsHash}`)
    }
    console.log('tokenUris', tokenUris)
    return tokenUris
}

module.exports.tags = ['all', 'randomipfs', 'main']