import API from '../main'
import { restoreWallet, testWallet } from '../wallet'

const wallet = testWallet()
const api = new API(wallet)

describe('loadPairs', () => {
  it('should load pairs from the Factory contract', async () => {
    const pairs = await api.loadPairs()
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

describe('updateAmountOut', () => {
  const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  const token1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  it('should calculate output amount by querying Quoter contract', async () => {
    const amount = "1"
    const expectedAmountOut = "4545" // Replace with the expected output amount
    const amountOut = await api.updateAmountOut(token0, token1, amount)
    expect(Number(amountOut)).toBeGreaterThan(Number(expectedAmountOut))
  })

  it('should return undefined if amount is 0', async () => {
    const amount = "0"
    const amountOut = await api.updateAmountOut(token0, token1, amount)
    expect(amountOut).toBeUndefined()
  })

  it('should return undefined if amount is "0"', async () => {
    const amount = "0"
    const amountOut = await api.updateAmountOut(token0, token1, amount)
    expect(amountOut).toBeUndefined()
  })
})

describe('getTransactionFee', () => {
  it('should return the fee data', async () => {
    const feeData = await api.getTransactionFee()
    console.log(feeData)
    expect(feeData).toBeDefined()
    // Add more specific assertions for the fee data if needed
  })
})

describe('createPool', () => {
  const tokenX = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' //uni
  const tokenY = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9" // usdt
  const fee = 3000

  it('should create a pool and return the pool address', async () => {
    const poolAddress = await api.createPool(tokenX, tokenY, fee)
    expect(poolAddress).toBeDefined()
    // Add more specific assertions for the pool address if needed
  })

  it('should return undefined if tokenX or tokenY is not provided', async () => {
    const poolAddress = await api.createPool(null, tokenY, fee)
    expect(poolAddress).toBeUndefined()
  })

  it('should return undefined if fee is not provided', async () => {
    const poolAddress = await api.createPool(tokenX, tokenY, null)
    expect(poolAddress).toBeUndefined()
  })
})

describe('getPools', () => {
  const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  const token1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  const fee = 3000

  it('should return the pool address', async () => {
    const poolAddress = await api.getPools()
    expect(poolAddress).toBeDefined()
    // Add more specific assertions for the pool address if needed
  })


})

describe('getPool', () => {
  const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  const token1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  const fee = 3000

  it('should return the pool', async () => {
    const pool = await api.getPool(token0, token1, fee)
    console.log(pool.interface.fragments.map(f => `${f.name}: ${f.type}`))
    expect(pool).toBeDefined()
    // Add more specific assertions for the pool address if needed
  })

  it('should return undefined if token0 or token1 is not provided', async () => {
    const pool = await api.getPool(null, token1, fee)
    expect(pool).toBeUndefined()
  })
})

describe('getPrice', () => {
  const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  const token1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  const fee = 3000

  it('should return the price', async () => {
    const price = await api.getPrice(token0, token1, fee)
    expect(price).toBeDefined()
    // Add more specific assertions for the pool address if needed
  })


  it('should return undefined if token0 or token1 is not provided', async () => {
    const price = await api.getPrice(null, token1, fee)
    expect(price).toBeUndefined()
  })
})

describe('getAmount1', () => {
  const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  const token1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"

  it('should return the token amounts', async () => {
    const amounts = await api.getAmount1('1', token0, token1, '4545', '5500')
    expect(amounts).toBeDefined()
    expect(amounts).toBeGreaterThan(5041.078316624442)
    expect(amounts).toBeLessThan(5068)
    //NOTE: likes tickCurrent and price
    // Add more specific assertions for the token amounts if needed
  })

  it(' lower', async () => {
    const amounts = await api.getAmount1('1', token0, token1, '2000', '5500')
    expect(amounts).toBeDefined()
    expect(amounts).toBeGreaterThan(40485)
    expect(amounts).toBeLessThan(40688)
    // ratio = 1:40485 - 40688
    // Add more specific assertions for the token amounts if needed
  })

  it(' higher', async () => {
    const amounts = await api.getAmount1('1', token0, token1, '4545', '10000')
    expect(amounts).toBeDefined()
    expect(amounts).toBeGreaterThan(777)
    expect(amounts).toBeLessThan(783)
    // ratio = 1:777 - 782
    // Add more specific assertions for the token amounts if needed
  })

  it(' both', async () => {
    const amounts = await api.getAmount1('1', token0, token1, '2000', '10000')
    expect(amounts).toBeDefined()
    expect(amounts).toBeGreaterThan(6275)
    // Add more specific assertions for the token amounts if needed
    // ratio = 1:6276
  })

  it('small', async () => {
    const amounts = await api.getAmount1('0.01', token0, token1, '4545', '5500')
    expect(amounts).toBeDefined()
    expect(amounts).toBeGreaterThan(48)
    expect(amounts).toBeLessThan(51)
    //NOTE: likes tickCurrent and price
    // Add more specific assertions for the token amounts if needed
  })

  it('should return undefined if token0 or token1 is not provided', async () => {
    const amounts = await api.getAmount1('100', null, token1, '4545', '5500')
    expect(amounts).toBeUndefined()
  })
})

describe('addLiquidity', () => {
  const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  const token1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  const amount0 = '1'

  it('should call the necessary functions and return the liquidity NFT', async () => {

    // Call the addLiquidity function
    const liquidityNFT = await api.addLiquidity(token0, token1, amount0, 3000, "4545", "5500", 0.5)
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
    const liquidityNFT = await api.addLiquidity(token0, token1, amount0, 3000, "2000", "5500", 0.5)
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
    const liquidityNFT = await api.addLiquidity(token0, token1, amount0, 3000, "4545", "10000", 0.5)
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
    const liquidityNFT = await api.addLiquidity(token0, token1, amount0, 3000, "2000", "10000", 0.5)
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

  it('Small: should call the necessary functions and return the liquidity NFT', async () => {

    // Call the addLiquidity function
    const liquidityNFT = await api.addLiquidity(token0, token1, '.001', 3000, "4545", "5500", 0.5)
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

  it('Large: should call the necessary functions and return the liquidity NFT', async () => {

    // Call the addLiquidity function
    const liquidityNFT = await api.addLiquidity(token0, token1, "10", 3000, "4545", "5500", 0.5)
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
    const liquidityNFT = await api.addLiquidity(null, token1, amount0)
    expect(liquidityNFT).toBeUndefined()
  })
})

describe('getLiquidity', () => {
  it('should return the total liquidity in a pool for a given token pair and fee', async () => {
    const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    const token1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    const fee = 3000

    const liquidity = await api.getLiquidity(token0, token1, fee)

    expect(liquidity).toBeDefined()
    expect(typeof liquidity).toBe('bigint')
    // Add more assertions as needed
  })
})

describe('getLiquidityDistribution', () => {
  it('should return the liquidity distribution for a given token pair and fee', async () => {
    const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    const token1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    const fee = 3000

    const liquidityDistribution = await api.getLiquidityDistribution(token0, token1, fee)

    expect(liquidityDistribution).toBeDefined()
    expect(Array.isArray(liquidityDistribution)).toBe(true)
    // Add more assertions as needed
  })
})

describe('getPosition', () => {
  it('should return the liquidity position for a given token pair, fee, and price range', async () => {
    const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    const token1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    const fee = 3000
    const lowerPrice = "4545"
    const upperPrice = "5500"

    const position = await api.getPosition(token0, token1, fee, lowerPrice, upperPrice)

    expect(position).toBeDefined()
    expect(typeof position).toBe('object')
    expect(position.liquidity).toBeGreaterThan(0n)
    expect(position.tokensOwed0).toEqual(0n)
    expect(position.tokensOwed1).toEqual(0n)
    expect(position.feeGrowthInside0LastX128).toEqual(0n)
    expect(position.feeGrowthInside1LastX128).toEqual(0n)
    // Add more assertions as needed
  })
})

describe('getPositions', () => {
  it('should return all positions for the owner', async () => {
    const owner = wallet.address
    const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    const token1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    const fee = 3000

    const positions = await api.getPositions(owner, token0, token1, fee)

    expect(positions).toBeDefined()
    expect(Array.isArray(positions)).toBe(true)
    expect(positions.length).toBeGreaterThan(0)
    // Add more assertions as needed
  })
})

describe('removeLiquidity', () => {
  it('should remove liquidity from a pool', async () => {
    const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    const token1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    const amount = "1"
    const fee = 3000
    const lowerPrice = "4000"
    const upperPrice = "5800"

    const addLiquidityResult = await api.addLiquidity(token0, token1, amount, fee, lowerPrice, upperPrice)
    expect(addLiquidityResult).toBeDefined()
    expect(typeof addLiquidityResult).toBe('object')
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1000 ms
    
    //TODO: panics...
    const result = await api.removeLiquidity(token0, token1, amount, fee, lowerPrice, upperPrice)
    expect(result).toBeDefined()

    const check = await api.getPosition(token0, token1, fee, lowerPrice, upperPrice)
    expect(check).toEqual({ "feeGrowthInside0LastX128": 0n, "feeGrowthInside1LastX128": 0n, "liquidity": 0n, "tokensOwed0": 0n, "tokensOwed1": 0n })
    // Assert the result or perform any necessary validations
  })
})

describe('swap', () => {
  it('should swap tokens', async () => {
    const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const token1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const amount0 = "1";
    const slippage = 0.1;

    const result = await api.swap(token0, token1, amount0, slippage);

    expect(result).toBeDefined();
    // Add more assertions as needed
  });
});

describe('collectFees', () => {
  it('should collect fees from a pool', async () => {
    const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    const token1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    const fee = 3000
    const lowerPrice = "4545"
    const upperPrice = "5500"
    const liquidityNFT = await api.addLiquidity(token0, token1, "1", fee, lowerPrice, upperPrice, 0.5)

    const wallet2 = restoreWallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d")

    const api2 = new API(wallet2)
    const swap = await api2.swap(token0, token1, "1", 0.1)

    const result = await api.collectFees(token0, token1, fee, lowerPrice, upperPrice)
    expect(result).toBeDefined()
    // Add more assertions as needed
  })
})
