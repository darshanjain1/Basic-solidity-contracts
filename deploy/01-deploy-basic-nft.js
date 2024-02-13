const { network } = require('hardhat')
const { developmentChains } = require('../helper-hardhat-config')

const verify = require('../tasks/verify')

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
    const { deployer } = await getNamedAccounts()
    const { deploy, get } = await deployments
    const args = []
    console.log('-----------deploying--------');
    await deploy("BasicNFT", {
        from: deployer,
        args,
        waitConfirmations: network.config.blockConfirmations || 1,
        log: true
    })
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    console.log('-----------verifying--------');
        const basicNftContract = await get('BasicNFT')
        const basicNftContractAddress = basicNftContract.address
        await verify(basicNftContractAddress, args)
    }
}
module.exports.tags = ['all','basicNft','main']
