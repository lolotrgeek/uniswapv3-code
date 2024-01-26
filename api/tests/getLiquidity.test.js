import { getLiquidity, addLiquidity } from "../main";

const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const token1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const fee = 3000;

describe('getLiquidity', () => {
    it('should calculate liquidity correctly', async () => {
      // Test case 1
      const liquidity = await getLiquidity(token0, token1, fee);
      expect(liquidity).toBe('ExpectedLiquidityValue1');
  
    });
  });

  describe('Liquidity Test', () => {
    it('should add liquidity correctly', async () => {

      const amount0 = "1"; // replace with your value
      const tickLower = "4545";
      const tickUpper = "5500";
      const amount = 0.5;

      // 1. Get initial liquidity
      const initialLiquidity = await getLiquidity(token0, token1, fee);

      // 2. Add liquidity
      const liquidityNFT = await addLiquidity(token0, token1, amount0, fee, tickLower, tickUpper, amount);

      // 3. Get liquidity after adding
      const afterLiquidity = await getLiquidity(token0, token1, fee);

      // 4. Check if liquidity got added to pool (recheck liquidity)
      expect(afterLiquidity === initialLiquidity).toBe(false);
    });
  });