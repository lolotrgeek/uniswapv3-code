import { loadPairs, pairsToTokens, updateAmountOut, addLiquidity, setTransactionFee, getPools, getPool, getPrice, getTokenAmounts, getAmount1 } from '../main'

describe('loadPairs', () => {
  it('should load pairs from the Factory contract', async () => {
    const pairs = await loadPairs()
    expect(pairs).toBeDefined()
    expect(Array.isArray(pairs)).toBe(true)
    expect(pairs.length).toBeGreaterThan(0)
    pairs.forEach(pair => {
      expect(pair.token0).toBeDefined()
      expect(pair.token1).toBeDefined()
      expect(pair.fee).toBeDefined()
      expect(pair.address).toBeDefined()
      console.log(pair)
    })
  })
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

describe('updateAmountOut', () => {
  const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  const token1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  it('should calculate output amount by querying Quoter contract', async () => {
    const amount = "1"
    const expectedAmountOut = "4545" // Replace with the expected output amount
    const amountOut = await updateAmountOut(token0, token1, amount)
    expect(Number(amountOut)).toBeGreaterThan(Number(expectedAmountOut))
  })

  it('should return undefined if amount is 0', async () => {
    const amount = "0"
    const amountOut = await updateAmountOut(token0, token1, amount)
    expect(amountOut).toBeUndefined()
  })

  it('should return undefined if amount is "0"', async () => {
    const amount = "0"
    const amountOut = await updateAmountOut(token0, token1, amount)
    expect(amountOut).toBeUndefined()
  })
})

describe('setTransactionFee', () => {
  it('should return the fee data', async () => {
    const feeData = await setTransactionFee()
    console.log(feeData)
    expect(feeData).toBeDefined()
    // Add more specific assertions for the fee data if needed
  })
})

describe('getPools', () => {
  const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  const token1 = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
  const fee = 3000

  it('should return the pool address', async () => {
    const poolAddress = await getPools()
    expect(poolAddress).toBeDefined()
    // Add more specific assertions for the pool address if needed
  })


})

describe('getPool', () => {
  const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  const token1 = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
  const fee = 3000

  it('should return the pool', async () => {
    const pool = await getPool(token0, token1, fee)
    console.log(pool.interface.fragments.map(f => `${f.name}: ${f.type}`))
    expect(pool).toBeDefined()
    // Add more specific assertions for the pool address if needed
  })

  it('should return undefined if token0 or token1 is not provided', async () => {
    const pool = await getPool(null, token1, fee)
    expect(pool).toBeUndefined()
  })
})

describe('getPrice', () => {
  const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  const token1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  const fee = 3000

  it('should return the price', async () => {
    const price = await getPrice(token0, token1, fee)
    expect(price).toBeDefined()
    // Add more specific assertions for the pool address if needed
  })


  it('should return undefined if token0 or token1 is not provided', async () => {
    const price = await getPrice(null, token1, fee)
    expect(price).toBeUndefined()
  })
})

describe('getTokenAmounts', () => {
  const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  const token1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"

  it('should return the token amounts', async () => {
    const amounts = await getTokenAmounts('1', token0, token1, '4545', '5500')
    expect(amounts).toBeDefined()
    expect(amounts).toBeGreaterThan(5041.078316624442)
    expect(amounts).toBeLessThan(5068)
    //NOTE: likes tickCurrent and price
    // Add more specific assertions for the token amounts if needed
  })

  it(' lower', async () => {
    const amounts = await getTokenAmounts('1', token0, token1, '2000', '5500')
    expect(amounts).toBeDefined()
    expect(amounts).toBeGreaterThan(40485)
    expect(amounts).toBeLessThan(40688)
    // ratio = 1:40485 - 40688
    // Add more specific assertions for the token amounts if needed
  })

  it(' higher', async () => {
    const amounts = await getTokenAmounts('1', token0, token1, '4545', '10000')
    expect(amounts).toBeDefined()
    expect(amounts).toBeGreaterThan(777)
    expect(amounts).toBeLessThan(783)
    // ratio = 1:777 - 782
    // Add more specific assertions for the token amounts if needed
  })

  it(' both', async () => {
    const amounts = await getTokenAmounts('1', token0, token1, '2000', '10000')
    expect(amounts).toBeDefined()
    expect(amounts).toBeGreaterThan(6275)
    // Add more specific assertions for the token amounts if needed
    // ratio = 1:6276
  })

  it('should return undefined if token0 or token1 is not provided', async () => {
    const amounts = await getTokenAmounts('100', null, token1, '4545', '5500')
    expect(amounts).toBeUndefined()
  })
})

describe('getAmount1', () => {
  const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  const token1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"

  it('should return the token amounts', async () => {
    const amounts = await getAmount1('1', token0, token1, '4545', '5500')
    expect(amounts).toBeDefined()
    expect(amounts).toBeGreaterThan(5041.078316624442)
    expect(amounts).toBeLessThan(5068)
    //NOTE: likes tickCurrent and price
    // Add more specific assertions for the token amounts if needed
  })

  it(' lower', async () => {
    const amounts = await getAmount1('1', token0, token1, '2000', '5500')
    expect(amounts).toBeDefined()
    expect(amounts).toBeGreaterThan(40485)
    expect(amounts).toBeLessThan(40688)
    // ratio = 1:40485 - 40688
    // Add more specific assertions for the token amounts if needed
  })

  it(' higher', async () => {
    const amounts = await getAmount1('1', token0, token1, '4545', '10000')
    expect(amounts).toBeDefined()
    expect(amounts).toBeGreaterThan(777)
    expect(amounts).toBeLessThan(783)
    // ratio = 1:777 - 782
    // Add more specific assertions for the token amounts if needed
  })

  it(' both', async () => {
    const amounts = await getAmount1('1', token0, token1, '2000', '10000')
    expect(amounts).toBeDefined()
    expect(amounts).toBeGreaterThan(6275)
    // Add more specific assertions for the token amounts if needed
    // ratio = 1:6276
  })

  it('should return undefined if token0 or token1 is not provided', async () => {
    const amounts = await getTokenAmounts('100', null, token1, '4545', '5500')
    expect(amounts).toBeUndefined()
  })
})

describe('addLiquidity', () => {
  const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  const token1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  const amount0 = '1'

  it('should call the necessary functions and return the liquidity NFT', async () => {

    // Call the addLiquidity function
    const liquidityNFT = await addLiquidity(token0, token1, amount0, 3000, "4545", "5500", 0.5)
    let parsed_result
    if (typeof liquidityNFT === 'string') try { parsed_result = JSON.parse(liquidityNFT) } catch (e) { parsed_result = liquidityNFT }
    parsed_result = liquidityNFT
    console.log(parsed_result)
    expect(parsed_result).toBeDefined()
    expect(typeof parsed_result).toBe('object')
    expect(parsed_result['blockHash']).toBeDefined()
    expect(parsed_result['blockNumber']).toBeDefined()
    expect(parsed_result['from']).toBeDefined()

  })


  it('Low: should call the necessary functions and return the liquidity NFT', async () => {

    // Call the addLiquidity function
    const liquidityNFT = await addLiquidity(token0, token1, amount0, 3000, "2000", "5500", 0.5)
    let parsed_result
    if (typeof liquidityNFT === 'string') try { parsed_result = JSON.parse(liquidityNFT) } catch (e) { parsed_result = liquidityNFT }
    parsed_result = liquidityNFT
    console.log(parsed_result)
    expect(parsed_result).toBeDefined()
    expect(typeof parsed_result).toBe('object')
    expect(parsed_result['blockHash']).toBeDefined()
    expect(parsed_result['blockNumber']).toBeDefined()
    expect(parsed_result['from']).toBeDefined()

  })

  it('High: should call the necessary functions and return the liquidity NFT', async () => {

    // Call the addLiquidity function
    const liquidityNFT = await addLiquidity(token0, token1, amount0, 3000, "4545", "10000", 0.5)
    let parsed_result
    if (typeof liquidityNFT === 'string') try { parsed_result = JSON.parse(liquidityNFT) } catch (e) { parsed_result = liquidityNFT }
    parsed_result = liquidityNFT
    console.log(parsed_result)
    expect(parsed_result).toBeDefined()
    expect(typeof parsed_result).toBe('object')
    expect(parsed_result['blockHash']).toBeDefined()
    expect(parsed_result['blockNumber']).toBeDefined()
    expect(parsed_result['from']).toBeDefined()

  })

  it('Both: should call the necessary functions and return the liquidity NFT', async () => {

    // Call the addLiquidity function
    const liquidityNFT = await addLiquidity(token0, token1, amount0, 3000, "2000", "10000", 0.5)
    let parsed_result
    if (typeof liquidityNFT === 'string') try { parsed_result = JSON.parse(liquidityNFT) } catch (e) { parsed_result = liquidityNFT }
    parsed_result = liquidityNFT
    console.log(parsed_result)
    expect(parsed_result).toBeDefined()
    expect(typeof parsed_result).toBe('object')
    expect(parsed_result['blockHash']).toBeDefined()
    expect(parsed_result['blockNumber']).toBeDefined()
    expect(parsed_result['from']).toBeDefined()

  })

  it('should return undefined if token0 or token1 is not provided', async () => {
    const liquidityNFT = await addLiquidity(null, token1, amount0)
    expect(liquidityNFT).toBeUndefined()
  })
})

