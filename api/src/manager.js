const ethers = require('ethers');
const fs = require('fs')

class Manager {
    constructor(contractAddress, provider) {
        const abi = JSON.parse(fs.readFileSync('./.abi/Manager.json', 'utf8'))
        this.contract = new ethers.Contract(contractAddress, abi, provider)
    }

    async getFactory() {
        return await this.contract.factory();
    }

    async getPosition(params) {
        return await this.contract.getPosition(params);
    }

    async mint(params) {
        return await this.contract.mint(params);
    }

    async swap(params) {
        return await this.contract.swap(params);
    }

    async swapSingle(params) {
        return await this.contract.swapSingle(params);
    }

    async uniswapV3MintCallback(amount0, amount1, data) {
        return await this.contract.uniswapV3MintCallback(amount0, amount1, data);
    }

    async uniswapV3SwapCallback(amount0, amount1, data) {
        return await this.contract.uniswapV3SwapCallback(amount0, amount1, data);
    }
}

module.exports = Manager;