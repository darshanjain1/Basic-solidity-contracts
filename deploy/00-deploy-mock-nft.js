const { network, ethers, } = require('hardhat')
const { developmentChains, DECIMALS, INITIAL_PRICE } = require('../helper-hardhat-config')

const BASE_FEE = ethers.parseEther('0.25') // 0.25 is the premium; it costs 0.25 LINK per request.
const GAS_PRICE_LINK = 1e9 // 1000000000 

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts()

    if (developmentChains.includes(network.name)) {
        log('---------deploying mocks-------');
        // deploy a mock VRF coordinator
        await deploy('VRFCoordinatorV2Mock', {
            from: deployer,
            args: [BASE_FEE, GAS_PRICE_LINK],
            log: true
        })
        await deploy('MockV3Aggregator', {
            from: deployer,
            args: [DECIMALS, INITIAL_PRICE],
            log: true
        })
        log('-----logs deployed-----');
    }
}

module.exports.tags = ['all', 'mocks',"main"]