// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DatasetNFT
 * @dev ERC-721 token representing a dataset. Minting is restricted to the contract owner
 * (expected to be the BondingCurveFactory). Stores metadata URI (IPFS), creator and royalty info.
 */
contract DatasetNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter = 1;
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => address) public creators;
    mapping(uint256 => uint96) public royaltyBps; // basis points (150 = 1.5%)

    event NFTMinted(uint256 indexed tokenId, address indexed creator, string metadataURI);

    constructor() ERC721("DataFusion Dataset", "DFDS") {
        // Ownable will set the owner to the deployer
    }

    /**
     * @dev Mint a new dataset NFT. Only the owner (factory) can call this.
     */
    function mint(address creator, string memory metadataURI) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter += 1;

        _safeMint(creator, tokenId);
        _tokenURIs[tokenId] = metadataURI;
        creators[tokenId] = creator;
        royaltyBps[tokenId] = 150; // 1.5%

        emit NFTMinted(tokenId, creator, metadataURI);
        return tokenId;
    }

    /**
     * @dev Return token metadata URI. We keep a simple on-chain mapping to the URI.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenURIs[tokenId];
    }

    /**
     * @dev Simple royalty info helper. Returns (recipient, royaltyAmount) for a sale price.
     */
    function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address, uint256) {
        address creator = creators[tokenId];
        uint256 royaltyAmount = (salePrice * royaltyBps[tokenId]) / 10000;
        return (creator, royaltyAmount);
    }
}
