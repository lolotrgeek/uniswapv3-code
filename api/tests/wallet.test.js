import { ethers } from "ethers";
import { newWallet, restoreWallet, testWallet } from "../wallet";
import API from "../main";

describe("newWallet", () => {
  test("should create a new random wallet", () => {
    const wallet = newWallet();
    expect(wallet).toBeInstanceOf(ethers.Wallet);
  });

  test("should connect to the node using defaultProvider", async () => {
    const wallet = newWallet();
    const provider = ethers.getDefaultProvider("http://localhost:8545/");
    await wallet.connect(provider);
    console.log(wallet)
    expect(wallet.provider).toBe(provider);
  });

  test("should call getPrice from API", async () => {
    const wallet = newWallet();
    const api = new API(wallet);
    const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    const token1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    const fee = 3000    
    let price = await api.getPrice(token0, token1, fee);
    expect(price).toBeGreaterThan(0);
    expect(price).toBeDefined();
  });
  
});
describe("sendETH", () => {
  test("should send ETH from testWallet to newWallet", async () => {
    const new_wallet = newWallet();
    const  test_wallet = testWallet();
    const provider = ethers.getDefaultProvider("http://localhost:8545/");
    let test_signer = await test_wallet.connect(provider);

    const initialBalance = await provider.getBalance(new_wallet.address);
    const testBalance = await provider.getBalance(test_wallet.address);
    const amountToSend = ethers.parseEther("1.0");

    let tx = await test_signer.sendTransaction({
      to: new_wallet.address,
      value: amountToSend,
    });
    let tx_done = await tx.wait();

    const finalBalance = await provider.getBalance(test_wallet.address);
    const newBalance = await provider.getBalance(new_wallet.address);
    console.log(finalBalance.toString())
    console.log(newBalance.toString())

    expect(newBalance).toBeDefined();
    expect(newBalance).toBeGreaterThan(0);
    expect(newBalance).toEqual(initialBalance + amountToSend);
    expect(finalBalance).toBeDefined();
    expect(finalBalance).toBeGreaterThan(0);
    expect(finalBalance).toEqual(testBalance - amountToSend - (tx_done.gasUsed * tx_done.gasPrice));
  });
});


describe("restoreWallet", () => {
  test("should restore wallet from private key", () => {
    const pk = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const wallet = restoreWallet(pk);
    expect(wallet).toBeInstanceOf(ethers.Wallet);
    expect(wallet.privateKey).toBe(pk);
  });
});




describe("testWallet", () => {
  test("should create a wallet with a specific address and private key", () => {
    const address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const pk = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const wallet = testWallet();
    expect(wallet).toBeInstanceOf(ethers.Wallet);
    expect(wallet.address).toBe(address);
    expect(wallet.privateKey).toBe(pk);
  });

  test("should connect to the node using defaultProvider", async () => {
    const wallet = testWallet();
    const provider = ethers.getDefaultProvider("http://localhost:8545/");
    await wallet.connect(provider);
    console.log(wallet)
    expect(wallet.provider).toBe(provider);
  });  
});