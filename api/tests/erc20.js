const ethers = require('ethers');
const fs = require('fs');
const { Token } = require('../src/erc20');

// Mock provider for testing
const provider = new ethers.providers.JsonRpcProvider();

describe('Token', () => {
  let token;

  beforeAll(() => {
    // Deploy a test ERC20 contract and get its address
    const contractAddress = '0x1234567890abcdef1234567890abcdef12345678';
    token = new Token(contractAddress, provider);
  });

  it('should get the DOMAIN_SEPARATOR', async () => {
    const domainSeparator = await token.getDomainSeparator();
    expect(domainSeparator).toBeDefined();
  });

  it('should get the allowance', async () => {
    const owner = '0xabcdef1234567890abcdef1234567890abcdef12';
    const spender = '0xabcdef1234567890abcdef1234567890abcdef34';
    const allowance = await token.getAllowance(owner, spender);
    expect(allowance).toBeDefined();
  });

  it('should approve the spender', async () => {
    const spender = '0xabcdef1234567890abcdef1234567890abcdef34';
    const amount = ethers.utils.parseEther('100');
    const tx = await token.approve(spender, amount);
    expect(tx).toBeDefined();
  });

  it('should get the balance of an account', async () => {
    const account = '0xabcdef1234567890abcdef1234567890abcdef56';
    const balance = await token.getBalanceOf(account);
    expect(balance).toBeDefined();
  });

  it('should get the decimals', async () => {
    const decimals = await token.getDecimals();
    expect(decimals).toBeDefined();
  });

  it('should get the name', async () => {
    const name = await token.getName();
    expect(name).toBeDefined();
  });

  it('should get the nonces', async () => {
    const account = '0xabcdef1234567890abcdef1234567890abcdef78';
    const nonces = await token.getNonces(account);
    expect(nonces).toBeDefined();
  });

  it('should permit the spender', async () => {
    const owner = '0xabcdef1234567890abcdef1234567890abcdef78';
    const spender = '0xabcdef1234567890abcdef1234567890abcdef90';
    const value = ethers.utils.parseEther('50');
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const v = 27;
    const r = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const s = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const tx = await token.permit(owner, spender, value, deadline, v, r, s);
    expect(tx).toBeDefined();
  });

  it('should get the symbol', async () => {
    const symbol = await token.getSymbol();
    expect(symbol).toBeDefined();
  });

  it('should get the total supply', async () => {
    const totalSupply = await token.getTotalSupply();
    expect(totalSupply).toBeDefined();
  });

  it('should transfer tokens', async () => {
    const to = '0xabcdef1234567890abcdef1234567890abcdef12';
    const amount = ethers.utils.parseEther('10');
    const tx = await token.transfer(to, amount);
    expect(tx).toBeDefined();
  });

  it('should transfer tokens from an account', async () => {
    const from = '0xabcdef1234567890abcdef1234567890abcdef34';
    const to = '0xabcdef1234567890abcdef1234567890abcdef56';
    const amount = ethers.utils.parseEther('5');
    const tx = await token.transferFrom(from, to, amount);
    expect(tx).toBeDefined();
  });
});