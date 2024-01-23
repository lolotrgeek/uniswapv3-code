const ethers = require('ethers')
const fs = require('fs')

class Quoter {
    constructor(contractAddress, provider){
        // Define the ABI
        const abi = JSON.parse(fs.readFileSync('./.abi/Quoter.json', 'utf8'))
        // Create a new contract instance
        this.contract = new ethers.Contract(contractAddress, abi, provider)        
    }

    // Function to get factory
    getFactory = async () => {
        return await this.contract.factory()
    }

    // Function to quote
    quote = async (path, amountIn) => {
        return await this.contract.quote(path, amountIn)
    }

    // Function to quoteSingle
    quoteSingle = async (tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96) => {
        const params = {
            tokenIn,
            tokenOut,
            fee,
            amountIn,
            sqrtPriceLimitX96
        };
        return await this.contract.quoteSingle(params);
    }

    // Function to uniswapV3SwapCallback
    uniswapV3SwapCallback = async (amount0Delta, amount1Delta, data) => {
        return await this.contract.uniswapV3SwapCallback(amount0Delta, amount1Delta, data)
    }
}