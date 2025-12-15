// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BondingCurve.sol";
import "./DatasetNFT.sol";

/**
 * @title BondingCurveFactory
 * @dev Deploys BondingCurve contracts and mints Dataset NFTs via the provided DatasetNFT contract.
 */
contract BondingCurveFactory {
    DatasetNFT public immutable nftContract;
    address public immutable uniswapFactory;
    address public immutable positionManager;
    address public immutable wrappedNative;
    uint256 public constant DEPLOYMENT_FEE = 100 ether; // 100 $INFL (represented in native units here)

    event BondingCurveDeployed(
        address indexed curve,
        address indexed creator,
        uint256 nftTokenId,
        string name,
        string symbol
    );

    constructor(address _nftContract, address _uniswapFactory, address _positionManager, address _wrappedNative) {
        nftContract = DatasetNFT(_nftContract);
        uniswapFactory = _uniswapFactory;
        positionManager = _positionManager;
        wrappedNative = _wrappedNative;
    }

    /**
     * @dev Deploys a new BondingCurve and mints a Dataset NFT to the caller.
     * Caller must provide the deployment fee.
     */
    function deployBondingCurve(
        string memory name,
        string memory symbol,
        string memory metadataURI
    ) external payable returns (address, uint256) {
        require(msg.value >= DEPLOYMENT_FEE, "Insufficient fee");

        // Mint NFT to the creator. IMPORTANT: The nftContract must have this factory as owner
        // or allow minting by this contract. Ensure ownership is transferred accordingly.
        uint256 tokenId = nftContract.mint(msg.sender, metadataURI);

        // Deploy bonding curve contract
        BondingCurve curve = new BondingCurve(
            name,
            symbol,
            msg.sender,
            address(nftContract),
            tokenId,
            uniswapFactory,
            positionManager,
            wrappedNative
        );

        emit BondingCurveDeployed(address(curve), msg.sender, tokenId, name, symbol);
        return (address(curve), tokenId);
    }
}
