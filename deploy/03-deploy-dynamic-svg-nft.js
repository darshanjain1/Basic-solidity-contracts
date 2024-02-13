const { ethers, network, } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const verify = require("../tasks/verify")
const fs = require('fs')

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    const lowSvg = fs.readFileSync('./images/dynamicNft/frown.svg', { encoding: 'utf8' });
    const highSvg = fs.readFileSync('./images/dynamicNft/happy.svg', { encoding: 'utf8' });

    let ethUsdPriceFeedAddress;

    if (developmentChains.includes(network.name)) {
        ethUsdPriceFeedAddress = (await ethers.getContract('MockV3Aggregator')).target
    }
    else {
        ethUsdPriceFeedAddress = networkConfig[network.config.chainId].ethUsdPriceFeed
    }

    const args = [ethUsdPriceFeedAddress, lowSvg, highSvg]
    const dynamicSvgNft = await deploy('DynamicSvgNft', {
        from: deployer,
        args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(dynamicSvgNft.address, args)
    }
}

module.exports.tags = ['all', 'dynamicsvg', 'main']