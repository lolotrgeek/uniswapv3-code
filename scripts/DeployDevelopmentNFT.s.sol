// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.14;

import "forge-std/console.sol";
import "forge-std/Script.sol";

import "../src/lib/FixedPoint96.sol";
import "../src/lib/Math.sol";
import "../src/UniswapV3Factory.sol";
import "../src/UniswapV3NFTManager.sol";
import "../src/UniswapV3Pool.sol";
import "../src/UniswapV3Quoter.sol";
import "../test/ERC20Mintable.sol";
import "../test/TestUtils.sol";

contract DeployDevelopment is Script, TestUtils {
    uint24 constant FEE = 3000;

    struct TokenBalances {
        uint256 uni;
        uint256 usdc;
        uint256 usdt;
        uint256 wbtc;
        uint256 weth;
    }

    TokenBalances balances =
        TokenBalances({
            uni: 200 ether,
            usdc: 2_000_000 ether,
            usdt: 2_000_000 ether,
            wbtc: 20 ether,
            weth: 100 ether
        });

    function run() public {
        // DEPLOYING STARGED
        vm.startBroadcast();

        ERC20Mintable weth = new ERC20Mintable("Wrapped Ether", "WETH", 18);
        ERC20Mintable usdc = new ERC20Mintable("USD Coin", "USDC", 18);
        ERC20Mintable uni = new ERC20Mintable("Uniswap Coin", "UNI", 18);
        ERC20Mintable wbtc = new ERC20Mintable("Wrapped Bitcoin", "WBTC", 18);
        ERC20Mintable usdt = new ERC20Mintable("USD Token", "USDT", 18);

        UniswapV3Factory factory = new UniswapV3Factory();
        UniswapV3NFTManager nft = new UniswapV3NFTManager(address(factory));
        UniswapV3Quoter quoter = new UniswapV3Quoter(address(factory));

        UniswapV3Pool wethUsdc = deployPool(
            factory,
            address(weth),
            address(usdc),
            3000,
            5000
        );

        UniswapV3Pool wethUni = deployPool(
            factory,
            address(weth),
            address(uni),
            3000,
            10
        );

        UniswapV3Pool wbtcUSDT = deployPool(
            factory,
            address(wbtc),
            address(usdt),
            3000,
            20_000
        );

        UniswapV3Pool usdtUSDC = deployPool(
            factory,
            address(usdt),
            address(usdc),
            500,
            1
        );

        uni.mint(msg.sender, balances.uni);
        usdc.mint(msg.sender, balances.usdc);
        usdt.mint(msg.sender, balances.usdt);
        wbtc.mint(msg.sender, balances.wbtc);
        weth.mint(msg.sender, balances.weth);

        uni.approve(address(nft), 100 ether);
        usdc.approve(address(nft), 1_005_000 ether);
        usdt.approve(address(nft), 1_200_000 ether);
        wbtc.approve(address(nft), 10 ether);
        weth.approve(address(nft), 11 ether);

        nft.mint(
            UniswapV3NFTManager.MintParams({
                recipient: address(this),
                tokenA: address(weth),
                tokenB: address(usdc),
                fee: FEE,
                lowerTick: tick60(4545),
                upperTick: tick60(5500),
                amount0Desired: 1 ether,
                amount1Desired: 5000 ether,
                amount0Min: 0,
                amount1Min: 0
            })
        );
        nft.mint(
            UniswapV3NFTManager.MintParams({
                recipient: address(this),
                tokenA: address(weth),
                tokenB: address(uni),
                fee: FEE,
                lowerTick: tick60(7),
                upperTick: tick60(13),
                amount0Desired: 10 ether,
                amount1Desired: 100 ether,
                amount0Min: 0,
                amount1Min: 0
            })            
        );

        nft.mint(
            UniswapV3NFTManager.MintParams({
                recipient: address(this),
                tokenA: address(wbtc),
                tokenB: address(usdt),
                fee: FEE,
                lowerTick: tick60(19400),
                upperTick: tick60(20500),
                amount0Desired: 10 ether,
                amount1Desired: 200_000 ether,
                amount0Min: 0,
                amount1Min: 0
            })
        );
        nft.mint(
            UniswapV3NFTManager.MintParams({
                recipient: address(this),
                tokenA: address(usdt),
                tokenB: address(usdc),
                fee: 500,
                lowerTick: sqrtPToNearestTick(uint160(77222060634363714391462903808), tickSpacings[500]),
                upperTick: sqrtPToNearestTick(uint160(81286379615119694729911992320), tickSpacings[500]),
                amount0Desired: 1_000_000 ether,
                amount1Desired: 1_000_000 ether,
                amount0Min: 0,
                amount1Min: 0
            })            
        );

        vm.stopBroadcast();
        // DEPLOYING DONE

        console.log("WETH address", address(weth));
        console.log("UNI address", address(uni));
        console.log("USDC address", address(usdc));
        console.log("USDT address", address(usdt));
        console.log("WBTC address", address(wbtc));

        console.log("Factory address", address(factory));
        console.log("NFT address", address(nft));
        console.log("Quoter address", address(quoter));

        console.log("USDT/USDC address", address(usdtUSDC));
        console.log("WBTC/USDT address", address(wbtcUSDT));
        console.log("WETH/UNI address", address(wethUni));
        console.log("WETH/USDC address", address(wethUsdc));
    }
}