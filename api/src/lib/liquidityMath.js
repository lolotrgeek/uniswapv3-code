import { q96, getTickAtSqrtPrice } from "./utils.js"

function mulDiv(x, y, z) {
    return Math.floor((x * y) / z)
}

function getLiquidityForAmount0(sqrtPriceAX96, sqrtPriceBX96, amount0) {
    if (sqrtPriceAX96 > sqrtPriceBX96) {
        [sqrtPriceAX96, sqrtPriceBX96] = [sqrtPriceBX96, sqrtPriceAX96]
    }

    const Q96 = Math.pow(2, 96)
    const intermediate = mulDiv(sqrtPriceAX96, sqrtPriceBX96, Q96)
    const liquidity = mulDiv(amount0, intermediate, sqrtPriceBX96 - sqrtPriceAX96)

    return liquidity
}

function getLiquidityForAmount1(sqrtPriceAX96, sqrtPriceBX96, amount1) {
    if (sqrtPriceAX96 > sqrtPriceBX96) {
        [sqrtPriceAX96, sqrtPriceBX96] = [sqrtPriceBX96, sqrtPriceAX96]
    }

    const Q96 = Math.pow(2, 96)
    const liquidity = mulDiv(amount1, Q96, sqrtPriceBX96 - sqrtPriceAX96)

    return liquidity
}

/**
 * Calculates L2 liquidity for given amount0 and amount1
 * @param {*} sqrtPriceX96 
 * @param {*} sqrtPriceAX96 
 * @param {*} sqrtPriceBX96 
 * @param {*} amount0 
 * @param {*} amount1 
 * @returns 
 */
function getLiquidityForAmounts(sqrtPriceX96, sqrtPriceAX96, sqrtPriceBX96, amount0, amount1) {
    if (sqrtPriceAX96 > sqrtPriceBX96) {
        [sqrtPriceAX96, sqrtPriceBX96] = [sqrtPriceBX96, sqrtPriceAX96]
    }

    let liquidity
    if (sqrtPriceX96 <= sqrtPriceAX96) {
        liquidity = getLiquidityForAmount0(sqrtPriceAX96, sqrtPriceBX96, amount0)
    } else if (sqrtPriceX96 <= sqrtPriceBX96) {
        const liquidity0 = getLiquidityForAmount0(sqrtPriceX96, sqrtPriceBX96, amount0)
        const liquidity1 = getLiquidityForAmount1(sqrtPriceAX96, sqrtPriceX96, amount1)
        console.log("liquidity0", liquidity0, "liquidity1", liquidity1)
        if (liquidity0 < liquidity1) {
            console.log("Choosing liquidity0")
            liquidity = liquidity0
        }
        else {
            console.log("Choosing liquidity1")
            liquidity = liquidity1
        }
        // liquidity = liquidity0 < liquidity1 ? liquidity0 : liquidity1
    } else {
        liquidity = getLiquidityForAmount1(sqrtPriceAX96, sqrtPriceBX96, amount1)
    }

    return liquidity
}

/**
 * Calculates real amounts from virtual liquidity L2
 * @param {*} liquidity 
 * @param {*} sqrtPriceX96 
 * @param {*} tickLow 
 * @param {*} tickHigh 
 * @returns 
 */
function getLiquidityAmounts(liquidity, sqrtPriceX96, tickLow, tickHigh) {
    let sqrtRatioA = Math.sqrt(1.0001 ** tickLow)
    let sqrtRatioB = Math.sqrt(1.0001 ** tickHigh)
    let currentTick = getTickAtSqrtPrice(sqrtPriceX96)
    let sqrtPrice = sqrtPriceX96 / q96
    let amount0 = 0
    let amount1 = 0
    if (currentTick < tickLow) {
        amount0 = Math.floor(liquidity * ((sqrtRatioB - sqrtRatioA) / (sqrtRatioA * sqrtRatioB)))
    }
    else if (currentTick >= tickHigh) {
        amount1 = Math.floor(liquidity * (sqrtRatioB - sqrtRatioA))
    }
    else if (currentTick >= tickLow && currentTick < tickHigh) {
        amount0 = Math.floor(liquidity * ((sqrtRatioB - sqrtPrice) / (sqrtPrice * sqrtRatioB)))
        amount1 = Math.floor(liquidity * (sqrtPrice - sqrtRatioA))
    }

    console.log("Amount Token0 in lowest decimal: " + amount0)
    console.log("Amount Token1 in lowest decimal: " + amount1)
    return [amount0, amount1]
}



export { getLiquidityForAmounts, getLiquidityAmounts, getLiquidityForAmount0, getLiquidityForAmount1}