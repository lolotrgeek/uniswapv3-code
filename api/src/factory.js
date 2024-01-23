const ethers = require('ethers');
const fs = require('fs')

class Factory {
    constructor(contractAddress, provider) {
        this.abi = JSON.parse(fs.readFileSync('./.abi/Factory.json', 'utf8'))
        this.contract = new ethers.Contract(contractAddress, abi, provider);
    }

    async createPool(tokenX, tokenY, fee) {
        return await this.contract.createPool(tokenX, tokenY, fee);
    }

    async getFees(fee) {
        return await this.contract.fees(fee);
    }

    async getParameters() {
        return await this.contract.parameters();
    }

    async getPools(address1, address2, fee) {
        return await this.contract.pools(address1, address2, fee);
    }

    onPoolCreated(listener) {
        this.contract.on('PoolCreated', (token0, token1, fee, pool) => {
            listener(token0, token1, fee, pool);
        });
    }
}

module.exports = Factory;