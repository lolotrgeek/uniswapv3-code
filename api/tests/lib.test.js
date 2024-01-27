import computePoolAddress from "../src/lib/computePoolAddress"
import pairsToTokens from "../src/lib/pairsToTokens"

describe('computePoolAddress', () => {
    const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    const token1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    const fee = 3000
    const factoryAddress = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707'
    const poolAddress = computePoolAddress(factoryAddress, token0, token1, fee)
    expect(poolAddress).toBeDefined()
    expect(poolAddress).toEqual('0x0787a9981bfDEBe5730DF0Ce71A181F50d178fc9')

})

describe('pairsToTokens', () => {
    it('should convert an array of pairs to an array of tokens', async () => {
      const pairs = [
        {
          token0: {
            address: '0x123',
            symbol: 'TOKEN1',
          },
          token1: {
            address: '0x456',
            symbol: 'TOKEN2',
          },
          fee: 500,
          address: '0x789',
        },
        {
          token0: {
            address: '0xabc',
            symbol: 'TOKEN3',
          },
          token1: {
            address: '0xdef',
            symbol: 'TOKEN4',
          },
          fee: 3000,
          address: '0xghi',
        },
      ]
  
      const expectedTokens = [
        {
          symbol: 'TOKEN1',
          address: '0x123',
          selected: false,
        },
        {
          symbol: 'TOKEN2',
          address: '0x456',
          selected: false,
        },
        {
          symbol: 'TOKEN3',
          address: '0xabc',
          selected: false,
        },
        {
          symbol: 'TOKEN4',
          address: '0xdef',
          selected: false,
        },
      ]
  
      const tokens = await pairsToTokens(pairs)
  
      expect(tokens).toEqual(expectedTokens)
    })
  })