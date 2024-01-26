import { ethers } from "ethers"
import config from "./config.js"
import { TickMath, encodeSqrtRatioX96, nearestUsableTick } from '@uniswap/v3-sdk'
import { uint256Max, feeToSpacing } from './src/lib/constants.js'
import PathFinder from './src/lib/pathFinder.js'
import computePoolAddress from './src/lib/computePoolAddress.js'
import pairsToTokens from "./src/lib/paisToTokens.js"
import { q96, countPathTokens, getTickAtSqrtPrice, pathToTypes, priceToSqrtP, priceToTick, sqrtPriceToPrice, tokenByAddress } from './src/lib/utils.js'
import { getLiquidityForAmounts, getLiquidityAmounts, getLiquidityForAmount0, getLiquidityForAmount1 } from "./src/lib/liquidityMath.js"


class API {
    constructor(wallet) {
        this.rpc = "http://localhost:8545/"
        this.provider = new ethers.getDefaultProvider(this.rpc)
        this.walletConnected = wallet.connect(this.provider)
        if (this.walletConnected) {
            this.manager = new ethers.Contract(config.managerAddress, config.ABIs.Manager, this.walletConnected)
            this.quoter = new ethers.Contract(config.quoterAddress, config.ABIs.Quoter, this.walletConnected)
            this.factory = new ethers.Contract(config.factoryAddress, config.ABIs.Factory, this.walletConnected)
        }
        this.address = wallet.address
        this.pairs = []
        this.tokens = []
        this.pools = []
    }

    /**
    * Load pairs from a Factory address by scanning for 'PoolCreated' events.
    * 
    * @returns array of 'pair' objects.
    */
    loadPairs = async () => {
        let events = await this.factory.queryFilter("PoolCreated", "earliest", "latest")
        const pairs = events.map(event => {
            return {
                token0: {
                    address: event.args.token0,
                    symbol: config.tokens[event.args.token0].symbol
                },
                token1: {
                    address: event.args.token1,
                    symbol: config.tokens[event.args.token1].symbol
                },
                fee: event.args.fee,
                address: event.args.pool
            }
        })
        return pairs
    }

    /**
     * Calculates output amount by querying Quoter contract. Sets 'priceAfter' and 'amountOut'.
     * 
     * @param {*} token0 address
     * @param {*} token1 address
     * @param {*} amount string
     */
    updateAmountOut = async (token0, token1, amount) => {
        if (amount === 0 || amount === "0") return
        const pairs = await this.loadPairs()
        const pathFinder = new PathFinder(pairs)
        const path = pathFinder.findPath(token0, token1)
        const packedPath = ethers.solidityPacked(pathToTypes(path), path)
        const amountIn = ethers.parseEther(amount)
        const quote = await this.quoter.quote.staticCall(packedPath, amountIn)
        const amountOut = ethers.formatEther(quote[0])
        return amountOut
    }

    getTransactionFee = async () => {
        const feeData = this.provider.getFeeData()
        return feeData
    }

    /**
     * 
     * @param {string} tokenX address
     * @param {string} tokenY address
     * @param {number} fee `500`, `3000`, or `10000`
     * @returns 
     */
    async createPool (tokenX, tokenY, fee) {
        if (!this.walletConnected) {
            throw new Error('Wallet must be connected to create a pool');
        }
        try {
            const transaction = await this.factory.createPool(tokenX, tokenY, fee);
            const receipt = await transaction.wait();
            const poolAddress = receipt.events?.find(e => e.event === 'PoolCreated')?.args?.pool;
            return poolAddress;
        } catch (error) {
            console.error('Failed to create pool:', error);
            return null;
        }
    }

    getPools = async () => {
        const pairs = await this.loadPairs()
        this.pools = pairs.map(pair => new ethers.Contract(pair.address, config.ABIs.Pool, this.walletConnected))
        return this.pools
    }

    getPool = async (token0, token1, fee) => {
        if (!token0 || !token1) return
        const poolAddress = computePoolAddress(config.factoryAddress, token0, token1, fee)
        const pool = new ethers.Contract(poolAddress, config.ABIs.Pool, this.walletConnected)
        // console.log(pool.interface.fragments.map(f => ({type: f.type, name: f.name})))
        return pool
    }

    /**
     * Gets the Total Liquidity in a pool for a given token pair and fee.
     * @param {*} token0 
     * @param {*} token1 
     * @param {*} fee 
     * @returns 
     */
    getLiquidity = async (token0, token1, fee) => {
        if (!token0 || !token1) return
        const pool = await this.getPool(token0, token1, fee)
        if (!pool) return
        const liquidity_fragment = pool.interface.fragments.find(f => f.name === 'liquidity')
        if (liquidity_fragment === undefined) return { "error": "Pool does not have liquidity" }
        const liquidity = await pool.liquidity()
        return liquidity
    }

    /**
     * Traverse the Tick Bitmap to create a liquidity distribution (see which ticks liquidity is concentrated)
     * @param {*} token0 
     * @param {*} token1 
     * @param {*} fee 
     */
    getLiquidityDistribution = async (token0, token1, fee) => {
        if (!token0 || !token1) return
        const pool = await this.getPool(token0, token1, fee)
        const has_slot0 = pool.interface.fragments.find(f => f.name === 'slot0')
        if (!has_slot0) return { "error": "Pool does not have slot0" }
        const quote = await pool.slot0()
        let sqrtPriceX96 = Number(quote[0])
        let events = await pool.queryFilter("Mint", "earliest", "latest")
        const liquidity_provided = events.map(event => {
            const tickHigh = nearestUsableTick(Number(event.args.tickUpper), feeToSpacing[fee])
            const tickLow = nearestUsableTick(Number(event.args.tickLower), feeToSpacing[fee])
            let sqrtRatioAX96 = Math.sqrt(1.0001 ** tickLow) * q96
            let sqrtRatioBX96 = Math.sqrt(1.0001 ** tickHigh) * q96
            const amount0 = ethers.formatEther(event.args.amount0)
            const amount1 = ethers.formatEther(event.args.amount1)
            console.log(amount0, amount1)
            const liquidity0 = getLiquidityForAmount0(sqrtPriceX96, sqrtRatioBX96, amount0)
            const liquidity1 = getLiquidityForAmount1(sqrtRatioAX96, sqrtPriceX96, amount1)

            return {
                owner: event.args.owner,
                tickLower: tickToPrice(tickLow).toString(),
                tickUpper: tickToPrice(tickHigh).toString(),
                amount0: amount0,
                amount1: amount1,
                liquidity: ethers.parseEther(Math.min(liquidity0, liquidity1).toString()),
            }
        })
        return liquidity_provided
    }

    /**
     * Gets a Liquidity Position for a given token pair, fee, and price range.
     * @param {*} token0 
     * @param {*} token1 
     * @param {*} fee 
     * @param {*} lowerPrice 
     * @param {*} upperPrice 
     * @returns 
     */
    getPosition = async (token0, token1, fee, lowerPrice, upperPrice) => {
        const lowerTick = priceToTick(lowerPrice)
        const upperTick = priceToTick(upperPrice)
        const params = {
            tokenA: token0,
            tokenB: token1,
            fee: fee,
            owner: this.address,
            lowerTick: nearestUsableTick(lowerTick, feeToSpacing[fee]),
            upperTick: nearestUsableTick(upperTick, feeToSpacing[fee]),
        }
        const positions = await this.manager.getPosition(params)
        if (!positions) return
        return {
            liquidity: positions[0],
            feeGrowthInside0LastX128: positions[1],
            feeGrowthInside1LastX128: positions[2],
            tokensOwed0: positions[3],
            tokensOwed1: positions[4]
        }
    }

    /**
     * Gets all position for the owner.
     * @param {string} owner address
     * @param {string} token0 address
     * @param {string} token1 address
     * @param {number} fee
     * @returns 
     */
    getPositions = async (owner, token0, token1, fee) => {
        if (!token0 || !token1) return
        const pool = await this.getPool(token0, token1, fee)
        let events = await pool.queryFilter("Mint", "earliest", "latest")
    
        return Promise.allSettled(events.filter(event => event.args.owner === owner).map(async event => {
            const tickHigh = nearestUsableTick(Number(event.args.tickUpper), feeToSpacing[fee])
            const tickLow = nearestUsableTick(Number(event.args.tickLower), feeToSpacing[fee])
            const params = {
                tokenA: token0,
                tokenB: token1,
                fee: fee,
                owner: owner,
                lowerTick: tickLow,
                upperTick: tickHigh,
            }
            const positions = await this.manager.getPosition(params)
            if (!positions) return
            return {
                liquidity: positions[0],
                feeGrowthInside0LastX128: positions[1],
                feeGrowthInside1LastX128: positions[2],
                tokensOwed0: positions[3],
                tokensOwed1: positions[4]
            }
        }))
    }

    /**
     * Get the current price of a pool.
     * @param {*} token0 address 
     * @param {*} token1 address 
     * @param {*} fee 
     * @docs https://uniswapv3book.com/milestone_1/deployment.html?highlight=current%20price#current-tick-and-price
     * @returns 
     */
    getPrice = async (token0, token1, fee) => {
        try {
            if (!token0 || !token1) return
            const pool = await this.getPool(token0, token1, fee)
            const has_slot0 = pool.interface.fragments.find(f => f.name === 'slot0')
            if (!has_slot0) return { "error": "Pool does not have slot0" }
            const quote = await pool.slot0()
            console.log(quote)


            let Decimal0 = config.tokens[token0].decimals
            let Decimal1 = config.tokens[token1].decimals

            console.log(Decimal0, Decimal1)

            let sqrtPriceX96 = Number(quote[0])
            let tickSpacing = 60
            let tick = Number(quote[1])

            let nearest_tick = Math.round(tick / tickSpacing) * tickSpacing
            let tickedsqrtP = Math.floor((1.0001 ** (nearest_tick / 2)) * q96)
            let tickedPrice = sqrtPriceToPrice(tickedsqrtP)

            let ticksqrtP = Math.floor((1.0001 ** (tick / 2)) * q96)
            let tickPrice = sqrtPriceToPrice(ticksqrtP)

            const buyOneOfToken0 = ((sqrtPriceX96 / q96) ** 2) / (10 ** Decimal1 / 10 ** Decimal0)
            const buyOneOfToken1 = (1 / buyOneOfToken0)

            console.log("price of token0 in value of token1 : " + buyOneOfToken0.toString())
            console.log("price of token1 in value of token0 : " + buyOneOfToken1.toString())


            let price = sqrtPriceToPrice(sqrtPriceX96)
            console.log('price', price, 'tickPrice', tickPrice, 'nearest tick', nearest_tick)
            // return price - tickedPrice + price
            return price
        } catch (err) {
            console.error(err)
            return { "error": err }
        }
    }

    /**
     * Get amount1 for a given amount0
     * 
     * calculates virtual liquidity from real liquidity and then calculates real amount1 from virtual liquidity to accounting for slippage
     * 
     * @param {*} amount0 
     * @param {*} token0 
     * @param {*} token1 
     * @param {*} lowerPrice 
     * @param {*} upperPrice 
     * @param {*} fee 
     * @param {*} slippage 
     * @returns 
     * 
     * https://medium.com/@xben12/how-uniswap-v3-deposit-amount-calculation-works-and-how-this-impacts-your-capital-efficiency-3e50b7b48c3a
     */
    getAmount1 = async (amount0, token0, token1, lowerPrice, upperPrice, fee = 3000, slippage = 0.5) => {
        if (!token0 || !token1 || !lowerPrice || !upperPrice) return

        const pool = await getPool(token0, token1, fee)
        const has_slot0 = pool.interface.fragments.find(f => f.name === 'slot0')
        if (!has_slot0) return { "error": "Pool does not have slot0" }
        const quote = await pool.slot0()
        let sqrtPriceX96 = Number(quote[0])
        let currentTick = Number(quote[1])
        let price = sqrtPriceToPrice(sqrtPriceX96)

        // based on the code from:
        // https://ethereum.stackexchange.com/questions/99425/calculate-deposit-amount-when-adding-to-a-liquidity-pool-in-uniswap-v3
        const base_liquidity = 1 * ((Math.sqrt(price) * Math.sqrt(upperPrice)) / (Math.sqrt(upperPrice) - Math.sqrt(price)))
        const adjusted_price = base_liquidity * (Math.sqrt(price) - Math.sqrt(lowerPrice))
        // because amount0 stays static if real price is larger than the upperPrice then we get real liquidity linearly in order to get enough liquidity to account for slippage
        if (adjusted_price > upperPrice) {
            return (amount0 * adjusted_price) + (lowerPrice * amount0 * slippage)
        }
        // otherwise calculate real liquidity hyperbolically using Ticks
        else {
            const lowerPriceTick = priceToTick(lowerPrice)
            const upperPriceTick = priceToTick(upperPrice)
            const tickLow = nearestUsableTick(lowerPriceTick, feeToSpacing[fee])
            const tickCurrent = nearestUsableTick(currentTick, feeToSpacing[fee])
            const tickHigh = nearestUsableTick(upperPriceTick, feeToSpacing[fee])


            // have to adjust amount0 for slippage so virtual liquidity is not too low
            const _min = (100 - slippage) / 100
            const amount0Min = amount0 * _min

            let adjusted_amount0 = 0
            amount0 = Number(amount0)
            adjusted_amount0 = amount0 - amount0Min
            amount0 = amount0 + adjusted_amount0
            console.log("amount0", amount0, "amount0Min", amount0Min)

            // calculate virtual liquidity from real liquidity (amount0 -> L0)
            const liquidity = amount0 * (Math.sqrt(price) * Math.sqrt(upperPrice) / (Math.sqrt(upperPrice) - Math.sqrt(price)))
            let sqrtPrice = Math.sqrt(1.0001 ** tickCurrent)
            let sqrtRatioA = Math.sqrt(1.0001 ** tickLow)
            let sqrtRatioB = Math.sqrt(1.0001 ** tickHigh)
            let amount0_bound = 0
            let amount1_bound = 0
            if (currentTick < tickLow) amount0_bound = liquidity * ((sqrtRatioA * sqrtRatioB) / (sqrtRatioB - sqrtRatioA))
            else if (currentTick >= tickHigh) amount1_bound = liquidity * (sqrtRatioB - sqrtRatioA)
            else if (currentTick >= tickLow && currentTick < tickHigh) {
                amount0_bound = liquidity * ((sqrtRatioA * sqrtRatioB) / (sqrtRatioB - sqrtRatioA))
                amount1_bound = liquidity * (sqrtPrice - sqrtRatioA)
            }
            // get L1 or bound (raw, unslipped) liquidity for amount1
            let amount1 = amount1_bound
            // with amounts below 1 no need to adjust L1 for slippage
            if (amount0 < 1) return amount1
            let sqrtRatioAX96 = sqrtRatioA * q96
            let sqrtRatioBX96 = sqrtRatioB * q96

            // get L2 from real amounts adjusted for slippage
            const Liquidity = getLiquidityForAmounts(sqrtPriceX96, sqrtRatioAX96, sqrtRatioBX96, amount0, amount1)
            // convert L2 to into real amounts (L2 -> [amount0, amount1])
            const L = getLiquidityAmounts(Liquidity, sqrtPriceX96, tickLow, tickHigh)
            return L[1]
        }
    }

    /**
     * Adds liquidity to a pool. Asks user to allow spending of tokens.
     * 
     * @param {*} token0 address
     * @param {*} token1 address
     * @param {*} amount0 string
     * @param {*} fee number the fee level for the pool: `500`, `3000`, or `10000`
     * @param {*} lowerPrice string the lower price for the liquidity range
     * @param {*} upperPrice string the upper price for the liquidity range
     * @param {*} slippage number
     * 
     */
    addLiquidity = async (token0, token1, amount0, fee, lowerPrice, upperPrice, slippage) => {
        try {
            if (!token0 || !token1) return
            const Token0 = new ethers.Contract(token0, config.ABIs.ERC20, this.walletConnected)
            const Token1 = new ethers.Contract(token1, config.ABIs.ERC20, this.walletConnected)

            const _min = (100 - slippage) * 100
            console.log("min:", _min)

            const amount0Desired = ethers.parseEther(amount0)
            let amount0min = amount0 * _min / 10000
            const amount0Min = ethers.parseEther(amount0min.toString())

            const amount1 = await getAmount1(amount0, token0, token1, lowerPrice, upperPrice, fee, slippage)
            console.log("amount1", amount1)
            const amount1Desired = ethers.parseEther(amount1.toString())
            const amount1Min = ethers.parseEther((amount1 * _min / 10000).toString())

            console.log(amount0Min, amount1Min)
            if (amount1Desired < 0) return 'Invalid amount!'
            if (amount1Desired === amount0Desired) return 'Same amount!'

            // check if amount0Min and amount1Min are smaller than uint256
            if (amount0Min > uint256Max) return 'Amoun0tMin too large!'
            if (amount1Min > uint256Max) return 'Amount1Min too large!'
            // check if amount0Min and amount1Min are greater that uint256
            if (amount0Min < -uint256Max) return 'Amount0Min too small!'
            if (amount1Min < -uint256Max) return 'Amount1Min too small!'

            // check if amount0Desired and amount1Desired are larger than uint256
            if (amount0Desired > uint256Max || amount1Desired > uint256Max) return 'Amount too large!'
            // check if amount0Desired and amount1Desired are smaller than uint256
            if (amount0Desired < -uint256Max || amount1Desired < -uint256Max) return 'Amount too small!'

            if (amount1Desired < amount1Min) return `Will Slip! Amount1 ${amount1Desired.toString()} larger than ${amount1Min.toString()}!`
            if (amount0Desired < amount0Min) return 'Will Slip! Amount0 too small!'

            // const fee = path[1]
            if (fee !== 500 && fee !== 3000 && fee !== 10000) return 'Invalid fee!'
            console.log('fee', fee)

            const lowerPriceTick = priceToTick(lowerPrice)
            const upperPriceTick = priceToTick(upperPrice)

            const lowerTick = nearestUsableTick(lowerPriceTick, feeToSpacing[fee])
            const upperTick = nearestUsableTick(upperPriceTick, feeToSpacing[fee])

            const int24Max = 2 ** 23 - 1

            if (lowerTick > int24Max || upperTick > int24Max) return 'Ticks too large!'
            if (lowerTick < -int24Max || upperTick < -int24Max) return 'Ticks too small!'


            const mintParams = {
                recipient: this.address,
                tokenA: token0,
                tokenB: token1,
                fee,
                lowerTick,
                upperTick,
                amount0Desired,
                amount1Desired,
                amount0Min,
                amount1Min
            }

            console.log('params', mintParams)

            const allowance0 = await Token0.allowance(this.address, config.managerAddress)
            const allowance1 = await Token1.allowance(this.address, config.managerAddress)

            if (allowance0 < amount0Desired) {
                const approve0 = await Token0.approve(config.managerAddress, uint256Max)
                const approve0_receipt = await approve0.wait()
                console.log('approve0', approve0_receipt.logs[0].args)

            }
            if (allowance1 < amount1Desired) {
                const approve1 = await Token1.approve(config.managerAddress, uint256Max)
                const approve1_receipt = await approve1.wait()
                console.log('approve1', approve1_receipt.logs[0].args)
            }
            console.log('minting...')
            const tx = await this.manager.mint(mintParams)
            const liquidityNFT = await tx.wait()

            return liquidityNFT
        } catch (err) {
            let error

            if (err && err.info && err.info.error && err.info.error.data) {

                try {
                    error = this.manager.interface.parseError(err.info.error.data)
                } catch (e) {
                    if (e.message.includes('no matching error')) {
                        let poolInterface = new ethers.utils.Interface(config.ABIs.Pool)
                        error = poolInterface.parseError(err.info.error.data)
                    }
                }
                switch (error.name) {
                    case "SlippageCheckFailed":
                        return (`Slippage check failed (amount0: ${ethers.formatUnits(error.args.amount0)}, amount1: ${ethers.formatUnits(error.args.amount1)})`)
                    case "ZeroLiquidity":
                        return ('Zero liquidity!')
                    case "Panic":
                        console.error(error)
                        return (`Panic! ${error.args[0]} ${JSON.stringify(error.fragment.inputs[0])}`)
                    default:
                        console.error(error)
                        return ('Unknown error!')
                }
            }
            else error = err

            console.error(err)
        }
    }

    /**
     * 
     * @param {*} token0 address
     * @param {*} token1 address
     * @param {BigInt} amount liquidity amount (get from getPosition)
     * @param {Number} fee pool fee
     * @param {Number} lowerPrice 
     * @param {Number} upperPrice 
     * @returns 
     */
    removeLiquidity = async (token0, token1, amount, fee, lowerPrice, upperPrice) => {
        try {
            if (!token0 || !token1) return
            const lowerTick = nearestUsableTick(priceToTick(lowerPrice), feeToSpacing[fee])
            const upperTick = nearestUsableTick(priceToTick(upperPrice), feeToSpacing[fee])
            const pool = await this.getPool(token0, token1, fee)
            const tx = await pool.burn(lowerTick, upperTick, amount)
            console.log(tx)
            const receipt = await tx.wait()
            if (!receipt || !receipt.events || !receipt.events[0] || receipt.events[0].event !== "Burn") {
                throw Error("Missing Burn event after burning!")
            }
            const amount0Burned = receipt.events[0].args.amount0
            const amount1Burned = receipt.events[0].args.amount1
            const collect_tx = await pool.collect(this.address, lowerTick, upperTick, amount0Burned, amount1Burned)
            const collect_recepit = await collect_tx.wait()
            return collect_recepit
        } catch (error) {
            console.error(error)
        }
    }

    /**
     * 
     * @param {*} token0 
     * @param {*} token1 
     * @param {*} fee 
     * @param {*} lowerPrice 
     * @param {*} upperPrice 
     * @returns 
     */
    collectFees = async (token0, token1, fee, lowerPrice, upperPrice) => {
        try {
            if (!token0 || !token1) return

            const lowerTick = nearestUsableTick(priceToTick(lowerPrice), feeToSpacing[fee])
            const upperTick = nearestUsableTick(priceToTick(upperPrice), feeToSpacing[fee])

            const position = await getPosition(token0, token1, 3000, lowerPrice, upperPrice)
            const pool = await this.getPool(token0, token1, fee)
            const collect_tx = await pool.collect(this.address, lowerTick, upperTick, position.tokensOwed0, position.tokensOwed1)
            const collect_recepit = await collect_tx.wait()
            return collect_recepit
        } catch (error) {
            console.error(error)
        }
    }

    /**
     * Swaps tokens by calling Manager contract. Before swapping, asks users to approve spending of tokens.
     * 
     * @param {*} token0 
     * @param {*} token1 
     * @param {*} amount0 
     * @param {*} slippage 
     * @returns 
     */
    swap = async (token0, token1, amount0, slippage = 0.1) => {
        try {
            const pairs = await loadPairs()
            const pathFinder = new PathFinder(pairs)
            const path = pathFinder.findPath(token0, token1)

            const provider = new ethers.getDefaultProvider(rpc)
            let walletConnected = wallet1.connect(provider)

            const quoter = new ethers.Contract(config.quoterAddress, config.ABIs.Quoter, walletConnected)
            const packedPath = ethers.solidityPacked(pathToTypes(path), path)
            const amountIn = ethers.parseEther(amount0)
            const quote = await quoter.quote.staticCall(packedPath, amountIn)
            const amountOut = quote[0]
            const _min = BigInt((100 - slippage) * 100)
            const minAmountOut = ethers.parseEther(ethers.formatEther(amountOut * _min / BigInt(10000)))
            console.log(amountOut, minAmountOut)
            const params = {
                path: packedPath,
                recipient: this.address,
                amountIn: amountIn,
                minAmountOut: minAmountOut
            }
            const tokenIn = new ethers.Contract(config.wethAddress, config.ABIs.ERC20, walletConnected)
            const token = tokenIn.attach(path[0])
            const allowance = await token.allowance(this.address, config.managerAddress)
            if (allowance < amountIn) {
                const approve_tx = await token.approve(config.managerAddress, uint256Max)
                await approve_tx.wait()
            }

            const manager = await getManager()
            const tx = await manager.swap(params)
            const swap_confirm = await tx.wait()
            // add gas price and sign...
            console.log(swap_confirm)
            const iface = new ethers.Interface(config.ABIs.Manager)
            if (tx && tx.data) {
                const parsed_result = iface.parseTransaction(tx)
                if (parsed_result && parsed_result.args) return parsed_result.args[0]

            }
            return swap_confirm
        } catch (err) {
            console.error(err)
        }
    }

}
export default API