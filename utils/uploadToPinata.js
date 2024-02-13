const pinataSdk = require('@pinata/sdk')
const fs = require('fs')
const path = require('path')

require('dotenv').config()

const pinataApiKey = process.env.PINATA_API_KEY
const pinataSecretKey = process.env.PINATA_SECRET_KEY
const pinata = new pinataSdk(pinataApiKey, pinataSecretKey)
const storeImages = async (imagesLocation) => {
    const fullImagesPath = path.resolve(imagesLocation)

    // filter only png files
    const files = fs.readdirSync(fullImagesPath)
    let responses = [];
    console.log('uploading files to Pinata')
    for (fileIndex in files) {
        const readableStreamForFile = await fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`)
        const options = {
            pinataMetadata: {
                name: files[fileIndex]
            }
        }
        try {
            await pinata.pinFileToIPFS(readableStreamForFile, options).then(result => responses.push(result)
            )
                .catch(err => console.log('error while uploading image to Pinata', err))
        }
        catch (err) { console.log('err', err) }
    }
    return { files, responses }
}

const storeTokenUriMetadata = async (metadata) => {
    const options = {
        pinataMetadata: {
            name: metadata.name
        }
    }
    try { return await pinata.pinJSONToIPFS(metadata, options) }
    catch (error) {
        console.log(error)
    }

}
module.exports = { storeImages, storeTokenUriMetadata }