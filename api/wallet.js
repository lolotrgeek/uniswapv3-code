import { ethers } from "ethers"

function newWallet() {
    const wallet = ethers.Wallet.createRandom()
    return wallet
}

function restoreWallet(pk){
    const wallet = new ethers.Wallet(pk)
    return wallet
}

function testWallet(){
    const address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    const pk = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    const wallet = new ethers.Wallet(pk)
    return wallet
}

export { newWallet, restoreWallet, testWallet }