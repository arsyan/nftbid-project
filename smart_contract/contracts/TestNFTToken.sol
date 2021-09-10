// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TestNFTToken is ERC721, Ownable {
    using Counters for Counters.Counter;

    string private baseURL;

    Counters.Counter private _tokenIdCounter;

    constructor() ERC721("Test NFT Token", "TNT") {}

    function _baseURI() internal view override returns (string memory) {
        return baseURL;
    }

    function setBaseURI(string memory newURI) public onlyOwner {
        baseURL = newURI;
    }

    function safeMint(address to) public onlyOwner {
        _safeMint(to, _tokenIdCounter.current());
        _tokenIdCounter.increment();
    }
}
