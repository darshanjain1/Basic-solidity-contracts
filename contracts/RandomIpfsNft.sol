// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

error RandomIpfsNft__NotEnoughEtherSent();
error RandomIpfsNft__RangeOutOfBounds();
error RandomIpfsNft__TransferFailed();

contract RandomIpfsNft is Ownable, ERC721URIStorage, VRFConsumerBaseV2 {
    enum Breed {
        PUG,
        SHIBA_INU,
        ST_BERNARD
    }

    uint256 private immutable i_mintFee;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;

    // VRF helpers
    mapping(uint256 => address) private s_requestIdToSender;

    // NFT variables
    uint256 private s_tokenCounter;
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    string[3] internal s_dogTokenUris;
    uint32 private constant NUM_WORDS = 1;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;

    event NftRequested(uint256 indexed requestId, address indexed requester);
    event NftMinted(Breed dogBreed, address minter);
    modifier minAmount() {
        if (msg.value < i_mintFee) {
            revert RandomIpfsNft__NotEnoughEtherSent();
        }
        _;
    }

    constructor(
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _gasLane,
        uint32 _callbackGasLimit,
        uint256 _mintFee,
        string[3] memory _dogTokenUris
    ) ERC721("Random IPFS NFT", "RIN") VRFConsumerBaseV2(_vrfCoordinator) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        i_subscriptionId = _subscriptionId;
        i_gasLane = _gasLane;
        i_callbackGasLimit = _callbackGasLimit;
        i_mintFee = _mintFee;
        s_tokenCounter = 0;
        s_dogTokenUris = _dogTokenUris;
    }

    function mintNft() public payable minAmount returns (uint256) {
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        s_requestIdToSender[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender);
        return requestId;
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        address dogOwner = s_requestIdToSender[requestId];
        uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;
        Breed dogBreed = getBreedFromModdedRng(moddedRng);
        _safeMint(dogOwner, s_tokenCounter);
        _setTokenURI(s_tokenCounter, s_dogTokenUris[uint256(dogBreed)]);
        s_tokenCounter= s_tokenCounter+1;
        emit NftMinted(dogBreed, dogOwner);
    }

    function getChanceArray() public pure returns (uint256[3] memory) {
        return [10, 40, MAX_CHANCE_VALUE];
    }

    function getBreedFromModdedRng(
        uint256 moddedRng
    ) public pure returns (Breed) {
        uint256 cumulativeSum = 0;
        uint[3] memory chancesArr = getChanceArray();

        for (uint8 i = 0; i < chancesArr.length; i++) {
            if (moddedRng >= cumulativeSum && moddedRng < chancesArr[i]) {
                return Breed(i);
            }
            cumulativeSum = chancesArr[i];
        }
        revert RandomIpfsNft__RangeOutOfBounds();
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert RandomIpfsNft__TransferFailed();
        }
    }

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getDogTokenUris(
        uint256 _index
    ) public view returns (string memory) {
        return s_dogTokenUris[_index];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
