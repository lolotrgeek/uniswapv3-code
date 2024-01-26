import { TickMath, encodeSqrtRatioX96 } from '@uniswap/v3-sdk'
const q96 = 2 ** 96
const countPathTokens = path => (path.length - 1) / 2 + 1
const priceToSqrtP = price => encodeSqrtRatioX96(price, 1)
const priceToTick = price => TickMath.getTickAtSqrtRatio(priceToSqrtP(price))
const tickToPrice = tick => (1.0001**tick)
const pathToTypes = path => (["address"].concat(new Array(countPathTokens(path) - 1).fill(["uint24", "address"]).flat()))
const tokenByAddress = async (address, tokens) => tokens.filter(t => t.address === address)[0]
const sqrtPriceToPrice = sqrtp => (sqrtp / q96) ** 2
const getTickAtSqrtPrice = sqrtPriceX96 => Math.floor(Math.log((sqrtPriceX96 / q96) ** 2) / Math.log(1.0001))

export { q96, countPathTokens, getTickAtSqrtPrice, pathToTypes, priceToSqrtP, priceToTick, sqrtPriceToPrice, tickToPrice, tokenByAddress }