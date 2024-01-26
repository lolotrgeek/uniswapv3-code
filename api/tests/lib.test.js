import computePoolAddress from "../src/lib/computePoolAddress"


describe('computePoolAddress', () => {
    const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    const token1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    const fee = 3000
    const factoryAddress = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707'
    const poolAddress = computePoolAddress(factoryAddress, token0, token1, fee)
    expect(poolAddress).toBeDefined()
    expect(poolAddress).toEqual('0x0787a9981bfDEBe5730DF0Ce71A181F50d178fc9')

})