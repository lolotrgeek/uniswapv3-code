const ethers = require('ethers')
const fs = require('fs')

class Token {
    constructor(contractAddress, provider){
        // Read the ABI from the JSON file
        const abi = JSON.parse(fs.readFileSync('./.abi/ERC20.json', 'utf8'))
        // Create a new contract instance
        this.contract = new ethers.Contract(contractAddress, abi, provider)        
    }

    // Function to get DOMAIN_SEPARATOR
    getDomainSeparator = async () => {
        return await this.contract.DOMAIN_SEPARATOR()
    }

    // Function to get allowance
    getAllowance = async (owner, spender) => {
        return await this.contract.allowance(owner, spender)
    }

    // Function to approve
    approve = async (spender, amount) => {
        return await this.contract.approve(spender, amount)
    }

    // Function to get balance
    getBalanceOf = async (account) => {
        return await this.contract.balanceOf(account)
    }

    // Function to get decimals
    getDecimals = async () => {
        return await this.contract.decimals()
    }

    // Function to get name
    getName = async () => {
        return await this.contract.name()
    }

    // Function to get nonces
    getNonces = async (account) => {
        return await this.contract.nonces(account)
    }

    // Function to permit
    permit = async (owner, spender, value, deadline, v, r, s) => {
        return await this.contract.permit(owner, spender, value, deadline, v, r, s)
    }

    // Function to get symbol
    getSymbol = async () => {
        return await this.contract.symbol()
    }

    // Function to get total supply
    getTotalSupply = async () => {
        return await this.contract.totalSupply()
    }

    // Function to transfer
    transfer = async (to, amount) => {
        return await this.contract.transfer(to, amount)
    }

    // Function to transfer from
    transferFrom = async (from, to, amount) => {
        return await this.contract.transferFrom(from, to, amount)
    }

}

