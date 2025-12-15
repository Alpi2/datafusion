# Smart Contracts — DataFusion

This document summarizes the smart contracts used by DataFusion, including responsibilities, important functions/events, and security notes.

Contracts

1. DatasetNFT (ERC-721)

   - Purpose: mint a non-fungible token representing dataset ownership.
   - Important functions:
     - `mint(address creator, string metadataURI)` — mints a token and assigns metadata URI.
     - `tokenURI(uint256 tokenId)` — returns on-chain metadata URI.
     - `royaltyInfo(uint256 tokenId, uint256 salePrice)` — returns royalty to creator (1.5%).
   - Events: `Transfer`, `Minted` (optional custom event).

2. BondingCurve

   - Purpose: ERC20-like token representing dataset shares priced by a quadratic curve.
   - Price function (simplified): price = K \* supply^2 (contract implements integral math for buy/sell).
   - Important functions:
     - `calculateBuyPrice(uint256 amount)` — returns cost to buy `amount` tokens.
     - `calculateSellRefund(uint256 amount)` — returns refund for selling `amount` tokens.
     - `buy(uint256 amount)` — payable function to mint tokens; deducts creator fee (1.5%).
     - `sell(uint256 amount)` — burns tokens and pays refund minus fee.
     - `_graduateToUniswap()` — internal flow to create a Uniswap V3 pool when balance reaches threshold.
   - Events:
     - `TokensPurchased(address indexed buyer, uint256 amount, uint256 cost, uint256 fee)`
     - `TokensSold(address indexed seller, uint256 amount, uint256 refund, uint256 fee)`
     - `Graduated(address indexed pool, uint256 liquidity)`

3. BondingCurveFactory
   - Purpose: deploy a new `BondingCurve` contract and mint the `DatasetNFT` to the creator.
   - Important functions:
     - `deployBondingCurve(name, symbol, metadataURI)` — mints NFT and deploys bonding curve, charges a deployment fee.
   - Events:
     - `BondingCurveDeployed(address curveAddress, address creator, uint256 tokenId)`

Security & Design Notes

- Creator Fee: 1.5% must be transferred atomically during buy/sell flows.
- Graduation: `_graduateToUniswap()` is simplified in the MVP; real Uniswap integration requires WMATIC address, position manager interactions and careful liquidity math.
- Reentrancy: use `ReentrancyGuard` for buy/sell.
- Pause: include pause/unpause accessible by owner for emergency response.
- Overflow: use safe fixed-point math libraries for production (e.g., PRBMath) where needed.
- Audits: contract audit by a reputable firm is required before mainnet deployment.

Testing Checklist (Hardhat)

- Bonding curve math: verify buy/sell integrals with known examples.
- Fee distribution: verify 1.5% transferred to creator.
- Graduation trigger: simulate reaching threshold and ensure `Graduated` event.
- NFT minting: validate metadata URI and owner.
