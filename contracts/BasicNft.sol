//SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract BasicNFT is ERC721 {
    uint256 private s_tokenCouter;
    string public constant TOKEN_URI =
        "beige-obedient-aphid-8.mypinata.cloud/ipfs/QmaskvxLfbmNJ1ra43JpYAA3QvfnHbEZMAJCJUbheTQuru";

    constructor() ERC721("Dogie", "Dog") {
        s_tokenCouter = 0;
    }

    function mintNft() external returns (uint256) {
        _safeMint(msg.sender, s_tokenCouter);
        s_tokenCouter++;
        return s_tokenCouter;
    }

    function tokenURI(
        uint256 /*tokenId*/
    ) public pure override returns (string memory) {
        return TOKEN_URI;
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCouter;
    }
}
