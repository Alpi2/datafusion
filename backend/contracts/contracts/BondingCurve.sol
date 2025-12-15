// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";

/**
 * @title BondingCurve
 * @dev ERC20 token representing shares of a dataset following a quadratic bonding curve.
 *      Price function: price = K * supply^2 (integral used for buy/sell cost calculations).
 *      Includes creator fee (1.5%), emergency pause, reentrancy protection, and a simplified
 *      'graduation' flow that attempts to create a Uniswap V3 pool when the contract balance
 *      reaches the graduation threshold.
 */
contract BondingCurve is ERC20, ReentrancyGuard, Ownable {
    uint256 public constant K = 1e14; // 0.0001 ETH per token^2 (scaled)
    uint256 public constant GRADUATION_THRESHOLD = 69000 ether; // 69k (assumes native token units)
    uint256 public constant CREATOR_FEE_BPS = 150; // 1.5%

    address public immutable creator;
    address public immutable datasetNFT;
    uint256 public immutable nftTokenId;
    address public immutable wrappedNative;

    bool public graduated;
    address public uniswapPool;
    bool public paused;

    IUniswapV3Factory public immutable uniswapFactory;
    INonfungiblePositionManager public immutable positionManager;

    event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost, uint256 fee);
    event TokensSold(address indexed seller, uint256 amount, uint256 refund, uint256 fee);
    event Graduated(address indexed pool, uint256 liquidity);
    event Paused(address indexed account);
    event Unpaused(address indexed account);

    constructor(
        string memory name,
        string memory symbol,
        address _creator,
        address _datasetNFT,
        uint256 _nftTokenId,
        address _uniswapFactory,
        address _positionManager,
        address _wrappedNative
    ) ERC20(name, symbol) {
        creator = _creator;
        datasetNFT = _datasetNFT;
        nftTokenId = _nftTokenId;
        uniswapFactory = IUniswapV3Factory(_uniswapFactory);
        positionManager = INonfungiblePositionManager(_positionManager);
        wrappedNative = _wrappedNative;
        graduated = false;
        paused = false;
    }

    modifier whenNotPaused() {
        require(!paused, "Pausable: paused");
        _;
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    /**
     * @dev Calculate buy cost for purchasing `amount` tokens.
     * Uses integral of K * x^2 => K * x^3 / 3. Values scaled to avoid fractional math.
     */
    function calculateBuyPrice(uint256 amount) public view returns (uint256) {
        uint256 currentSupply = totalSupply();
        uint256 newSupply = currentSupply + amount;
        // cost = K * (newSupply^3 - currentSupply^3) / 3
        // Note: we divide by 1e18 to account for K scaling similar to application-level.
        uint256 newCubed = newSupply * newSupply * newSupply;
        uint256 curCubed = currentSupply * currentSupply * currentSupply;
        uint256 diff = newCubed - curCubed;
        uint256 cost = (K * diff) / (3 * 1e18);
        return cost;
    }

    function calculateSellRefund(uint256 amount) public view returns (uint256) {
        uint256 currentSupply = totalSupply();
        require(currentSupply >= amount, "Insufficient supply");
        uint256 newSupply = currentSupply - amount;
        uint256 curCubed = currentSupply * currentSupply * currentSupply;
        uint256 newCubed = newSupply * newSupply * newSupply;
        uint256 diff = curCubed - newCubed;
        uint256 refund = (K * diff) / (3 * 1e18);
        return refund;
    }

    /**
     * @dev Buy `amount` tokens by sending native currency.
     */
    function buy(uint256 amount) external payable nonReentrant whenNotPaused {
        require(!graduated, "Already graduated");
        require(amount > 0, "Amount must be > 0");
        uint256 cost = calculateBuyPrice(amount);
        uint256 fee = (cost * CREATOR_FEE_BPS) / 10000;
        require(msg.value >= cost + fee, "Insufficient payment");

        _mint(msg.sender, amount);

        // Pay creator fee
        (bool sentFee, ) = payable(creator).call{value: fee}("");
        require(sentFee, "Creator fee transfer failed");

        emit TokensPurchased(msg.sender, amount, cost, fee);

        // Check for graduation (simplified: contract balance meets threshold)
        if (address(this).balance >= GRADUATION_THRESHOLD) {
            _graduateToUniswap();
        }

        // Refund excess
        uint256 excess = msg.value - cost - fee;
        if (excess > 0) {
            (bool sent, ) = payable(msg.sender).call{value: excess}("");
            require(sent, "Refund failed");
        }
    }

    /**
     * @dev Sell `amount` tokens back to contract for refund according to bonding curve.
     */
    function sell(uint256 amount) external nonReentrant whenNotPaused {
        require(!graduated, "Already graduated");
        require(amount > 0, "Amount must be > 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        uint256 refund = calculateSellRefund(amount);
        uint256 fee = (refund * CREATOR_FEE_BPS) / 10000;
        uint256 net = refund - fee;

        _burn(msg.sender, amount);

        // Send net refund to seller
        (bool sentNet, ) = payable(msg.sender).call{value: net}("");
        require(sentNet, "Refund transfer failed");
        // Send fee to creator
        (bool sentFee, ) = payable(creator).call{value: fee}("");
        require(sentFee, "Creator fee transfer failed");

        emit TokensSold(msg.sender, amount, net, fee);
    }

    /**
     * @dev Graduate the bonding curve to Uniswap V3 by creating a pool and (simplified)
     * adding liquidity. Production implementation should use proper position manager interactions.
     */
    function _graduateToUniswap() private {
        // Prevent re-entrancy into graduation
        if (graduated) return;

        // Ensure wrapped native token is configured
        require(wrappedNative != address(0), "Wrapped native token not set");

        uint256 tokenLiquidity = totalSupply() / 2; // 50% of supply
        // Mint liquidity tokens to this contract so we can provide them
        _mint(address(this), tokenLiquidity);

        uint256 nativeBalance = address(this).balance;
        require(nativeBalance > 0, "No native balance to provide as liquidity");

        // We'll wrap the native balance to the wrapped token and provide both sides
        uint256 ethLiquidity = nativeBalance;

        // Approve position manager to move ERC20 tokens
        _approve(address(this), address(positionManager), tokenLiquidity);

        // Wrap native currency into WETH-compatible token (assumes wrappedNative implements deposit())
        // Minimal interface: deposit() payable
        (bool success,) = wrappedNative.call{value: ethLiquidity}(abi.encodeWithSignature("deposit()"));
        require(success, "Wrapping native token failed");

        // Approve position manager to spend wrapped native
        IERC20(wrappedNative).approve(address(positionManager), ethLiquidity);

        // Determine token ordering for mint params and corresponding desired amounts
        address token0 = wrappedNative;
        address token1 = address(this);
        uint256 amount0Desired = ethLiquidity;
        uint256 amount1Desired = tokenLiquidity;
        if (address(this) < wrappedNative) {
            token0 = address(this);
            token1 = wrappedNative;
            amount0Desired = tokenLiquidity;
            amount1Desired = ethLiquidity;
        }

        // Create pool if it doesn't exist
        address poolAddress = uniswapFactory.getPool(token0, token1, 3000);
        if (poolAddress == address(0)) {
            poolAddress = uniswapFactory.createPool(token0, token1, 3000);
        }

        // Mint position using nonfungible position manager
        INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
            token0: token0,
            token1: token1,
            fee: 3000,
            tickLower: -887220,
            tickUpper: 887220,
            amount0Desired: amount0Desired,
            amount1Desired: amount1Desired,
            amount0Min: 0,
            amount1Min: 0,
            recipient: owner(),
            deadline: block.timestamp + 120
        });

        // Call mint and ensure it succeeds
        try positionManager.mint(params) returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1) {
            uniswapPool = poolAddress;
            graduated = true;
            emit Graduated(poolAddress, liquidity);
        } catch {
            revert("Uniswap mint failed");
        }
    }

    receive() external payable {}
}
