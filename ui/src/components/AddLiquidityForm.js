import './LiquidityForm.css';
import { BigNumber, ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { uint256Max, feeToSpacing } from '../lib/constants';
import { MetaMaskContext } from '../contexts/MetaMask';
import { TickMath, encodeSqrtRatioX96, nearestUsableTick } from '@uniswap/v3-sdk';
import config from "../config.js";

const slippage = 0.5

const formatAmount = ethers.utils.formatUnits

const priceToSqrtP = (price) => encodeSqrtRatioX96(price, 1);

const priceToTick = (price) => TickMath.getTickAtSqrtRatio(priceToSqrtP(price));

const BackButton = ({ onClick }) => {
  return (
    <button className="BackButton" onClick={onClick}>← Back</button>
  );
}

const PriceRange = ({ lowerPrice, upperPrice, setLowerPrice, setUpperPrice, disabled }) => {
  return (
    <fieldset>
      <label htmlFor="upperPrice">Price range</label>
      <div className="PriceRangeInputs">
        <input
          type="text"
          id="lowerPrice"
          placeholder="0.0"
          readOnly={disabled}
          value={lowerPrice}
          onChange={(ev) => setLowerPrice(ev.target.value)}
        />
        <span>&nbsp;–&nbsp;</span>
        <input
          type="text"
          id="upperPrice"
          placeholder="0.0"
          readOnly={disabled}
          value={upperPrice}
          onChange={(ev) => setUpperPrice(ev.target.value)}
        />
      </div>
    </fieldset>
  );
}

const AmountInput = ({ amount, disabled, setAmount, token }) => {
  return (
    <fieldset>
      <label htmlFor={token.symbol + "_liquidity"}>{token.symbol} amount</label>
      <input
        id={token + "_liquidity"}
        onChange={(ev) => setAmount(ev.target.value)}
        placeholder="0.0"
        readOnly={disabled}
        type="text"
        value={amount} />
    </fieldset>
  );
}

const getPool = async (token0, token1, fee) => {
  if (!token0 || !token1) return
  // const poolAddress = computePoolAddress(config.factoryAddress, token0, token1, fee)
  const poolAddress = "0x0787a9981bfDEBe5730DF0Ce71A181F50d178fc9"
  const provider = new ethers.getDefaultProvider(rpc)
  let walletConnected = wallet.connect(provider)
  const pool = new ethers.Contract(poolAddress, config.ABIs.Pool, walletConnected)
  // console.log(pool.interface.fragments)
  return pool
}


const Q96 = Math.pow(2, 96);

function mulDiv(x, y, z) {
  return Math.floor((x * y) / z);
}
function getLiquidityForAmount0(sqrtPriceAX96, sqrtPriceBX96, amount0) {
  if (sqrtPriceAX96 > sqrtPriceBX96) {
      [sqrtPriceAX96, sqrtPriceBX96] = [sqrtPriceBX96, sqrtPriceAX96];
  }

  const intermediate = mulDiv(sqrtPriceAX96, sqrtPriceBX96, Q96);
  const liquidity = mulDiv(amount0, intermediate, sqrtPriceBX96 - sqrtPriceAX96);

  return liquidity;
}

function getLiquidityForAmount1(sqrtPriceAX96, sqrtPriceBX96, amount1) {
  if (sqrtPriceAX96 > sqrtPriceBX96) {
      [sqrtPriceAX96, sqrtPriceBX96] = [sqrtPriceBX96, sqrtPriceAX96];
  }

  const liquidity = mulDiv(amount1, Q96, sqrtPriceBX96 - sqrtPriceAX96);

  return liquidity;
}
const sqrtPriceToPrice = sqrtp => (sqrtp / Q96) ** 2
const getTickAtSqrtPrice = sqrtPriceX96 => Math.floor(Math.log((sqrtPriceX96 / Q96) ** 2) / Math.log(1.0001))

function getLiquidityForAmounts(sqrtPriceX96, sqrtPriceAX96, sqrtPriceBX96, amount0, amount1) {
  if (sqrtPriceAX96 > sqrtPriceBX96) {
      [sqrtPriceAX96, sqrtPriceBX96] = [sqrtPriceBX96, sqrtPriceAX96];
  }

  let liquidity;
  if (sqrtPriceX96 <= sqrtPriceAX96) {
      liquidity = getLiquidityForAmount0(sqrtPriceAX96, sqrtPriceBX96, amount0);
  } else if (sqrtPriceX96 <= sqrtPriceBX96) {
      const liquidity0 = getLiquidityForAmount0(sqrtPriceX96, sqrtPriceBX96, amount0);
      const liquidity1 = getLiquidityForAmount1(sqrtPriceAX96, sqrtPriceX96, amount1);
      console.log("liquidity0", liquidity0, "liquidity1", liquidity1)
      if (liquidity0 < liquidity1) {
          console.log("Choosing liquidity0")
          liquidity = liquidity0;
      }
      else {
          console.log("Choosing liquidity1")
          liquidity = liquidity1;
      }
      // liquidity = liquidity0 < liquidity1 ? liquidity0 : liquidity1;
  } else {
      liquidity = getLiquidityForAmount1(sqrtPriceAX96, sqrtPriceBX96, amount1);
  }

  return liquidity;
}

function getLiquidityAmounts(liquidity, sqrtPriceX96, tickLow, tickHigh) {
  let sqrtRatioA = Math.sqrt(1.0001 ** tickLow);
  let sqrtRatioB = Math.sqrt(1.0001 ** tickHigh);
  let currentTick = getTickAtSqrtPrice(sqrtPriceX96);
  let sqrtPrice = sqrtPriceX96 / Q96;
  let amount0 = 0;
  let amount1 = 0;
  if (currentTick < tickLow) {
      amount0 = Math.floor(liquidity * ((sqrtRatioB - sqrtRatioA) / (sqrtRatioA * sqrtRatioB)));
  }
  else if (currentTick >= tickHigh) {
      amount1 = Math.floor(liquidity * (sqrtRatioB - sqrtRatioA));
  }
  else if (currentTick >= tickLow && currentTick < tickHigh) {
      amount0 = Math.floor(liquidity * ((sqrtRatioB - sqrtPrice) / (sqrtPrice * sqrtRatioB)));
      amount1 = Math.floor(liquidity * (sqrtPrice - sqrtRatioA));
  }

  console.log("Amount Token0 in lowest decimal: " + amount0)
  console.log("Amount Token1 in lowest decimal: " + amount1)
  return [amount0, amount1]
}
async function getAmount1(amount0, token0, token1, lowerPrice, upperPrice, fee = 3000, slippage = 0.5) {
  if (!token0 || !token1 || !lowerPrice || !upperPrice) return

  const pool = await getPool(token0, token1, fee)
  const has_slot0 = pool.interface.fragments.find(f => f.name === 'slot0')
  if (!has_slot0) return { "error": "Pool does not have slot0" }
  const quote = await pool.slot0()
  let sqrtPriceX96 = Number(quote[0])
  let currentTick = Number(quote[1])
  let price = sqrtPriceToPrice(sqrtPriceX96)

  // based on the code from:
  // https://ethereum.stackexchange.com/questions/99425/calculate-deposit-amount-when-adding-to-a-liquidity-pool-in-uniswap-v3
  const base_liquidity = 1 * ((Math.sqrt(price) * Math.sqrt(upperPrice)) / (Math.sqrt(upperPrice) - Math.sqrt(price)))
  const adjusted_price = base_liquidity * (Math.sqrt(price) - Math.sqrt(lowerPrice))
  // because amount0 stays static if real price is larger than the upperPrice then we get real liquidity linearly in order to get enough liquidity to account for slippage
  if (adjusted_price > upperPrice) {
      return (amount0 * adjusted_price) + (lowerPrice * amount0 * slippage)
  } 
  // otherwise calculate real liquidity hyperbolically using Ticks
  else {
      const lowerPriceTick = priceToTick(lowerPrice)
      const upperPriceTick = priceToTick(upperPrice)
      const tickLow = nearestUsableTick(lowerPriceTick, feeToSpacing[fee])
      const tickCurrent = nearestUsableTick(currentTick, feeToSpacing[fee])
      const tickHigh = nearestUsableTick(upperPriceTick, feeToSpacing[fee])

      // have to adjust amount0 for slippage so virtual liquidity is not too low
      const _min = (100 - slippage) / 100 
      const amount0Min = amount0 * _min
      amount0 = Number(amount0)
      let adjusted_amount0 = amount0 - amount0Min
      amount0 = amount0 + adjusted_amount0
  
      // calculate virtual liquidity from real liquidity
      const liquidity = amount0 * (Math.sqrt(price) * Math.sqrt(upperPrice) / (Math.sqrt(upperPrice) - Math.sqrt(price)))
      let sqrtPrice = Math.sqrt(1.0001 ** tickCurrent)
      let sqrtRatioA = Math.sqrt(1.0001 ** tickLow)
      let sqrtRatioB = Math.sqrt(1.0001 ** tickHigh)
      let amount0_bound = 0
      let amount1_bound = 0
      if (currentTick < tickLow) amount0_bound = liquidity * ((sqrtRatioA * sqrtRatioB) / (sqrtRatioB - sqrtRatioA))
      else if (currentTick >= tickHigh) amount1_bound = liquidity * (sqrtRatioB - sqrtRatioA)
      else if (currentTick >= tickLow && currentTick < tickHigh) {
          amount0_bound = liquidity * ((sqrtRatioA * sqrtRatioB) / (sqrtRatioB - sqrtRatioA))
          amount1_bound = liquidity * (sqrtPrice - sqrtRatioA)
      }
      // get bound (raw, unslipped) liquidity for amount1
      let amount1 = amount1_bound
      let sqrtRatioAX96 = sqrtRatioA * Q96
      let sqrtRatioBX96 = sqrtRatioB * Q96
  
      // get L2 adjusted for slippage
      const Liquidity = getLiquidityForAmounts(sqrtPriceX96, sqrtRatioAX96, sqrtRatioBX96, amount0, amount1)
      const L = getLiquidityAmounts(Liquidity, sqrtPriceX96, tickLow, tickHigh)        
      return L[1]
  }
}


const AddLiquidityForm = ({ toggle, token0Info, token1Info, fee }) => {
  const metamaskContext = useContext(MetaMaskContext);
  const enabled = metamaskContext.status === 'connected';
  const account = metamaskContext.account;
  const poolInterface = new ethers.utils.Interface(config.ABIs.Pool);

  const [token0, setToken0] = useState();
  const [token1, setToken1] = useState();
  const [manager, setManager] = useState();

  const [amount0, setAmount0] = useState("0");
  const [amount1, setAmount1] = useState("0");
  const [lowerPrice, setLowerPrice] = useState(0);
  const [upperPrice, setUpperPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToken0(new ethers.Contract(
      token0Info.address,
      config.ABIs.ERC20,
      new ethers.providers.Web3Provider(window.ethereum).getSigner()
    ));
    setToken1(new ethers.Contract(
      token1Info.address,
      config.ABIs.ERC20,
      new ethers.providers.Web3Provider(window.ethereum).getSigner()
    ));
    setManager(new ethers.Contract(
      config.managerAddress,
      config.ABIs.Manager,
      new ethers.providers.Web3Provider(window.ethereum).getSigner()
    ));
  }, [token0Info, token1Info]);

  const setAmounts = (amount0) => {
    setAmount0(amount0)
    if (upperPrice !== 0 || lowerPrice !== 0) {
      const liquidity_x = 1 * Math.sqrt(price) * Math.sqrt(upperPrice) / (Math.sqrt(upperPrice) - Math.sqrt(price))
      const adjusted_price = liquidity_x * (Math.sqrt(price) - Math.sqrt(lowerPrice))
      console.log('liquidity_x', liquidity_x, 'adjusted_price', adjusted_price)

      //TODO: as low tick gets further from current tick the amount1 increases, but amount0 decreases need to model this to keep amount 0 static
      let liquidity
      if (adjusted_price > upperPrice) {
        liquidity = (amount0 * adjusted_price) + (lowerPrice * amount0 * 0.5)
        setAmount1(liquidity.toString())
      }
      else if (adjusted_price < lowerPrice) {
        let liquidity_y = (amount0 * adjusted_price) + (lowerPrice * amount0 * 0.5)
        setAmount1(liquidity_y.toString())
      }
      else {
        liquidity = amount0 * (Math.sqrt(adjusted_price) * Math.sqrt(upperPrice)) / (Math.sqrt(upperPrice) - Math.sqrt(adjusted_price))
        console.log("Liquidity: ", liquidity)

        const liquidity_y = liquidity * (Math.sqrt(price) - Math.sqrt(lowerPrice))
        setAmount1(liquidity_y.toString())
      }

    }
  }

  /**
   * Adds liquidity to a pool. Asks user to allow spending of tokens.
   */
  const addLiquidity = (e) => {
    e.preventDefault();

    if (!token0 || !token1) {
      return;
    }

    setLoading(true);

    const amount0Desired = ethers.utils.parseEther(amount0);
    const amount1Desired = ethers.utils.parseEther(amount1);

    console.log(amount1Desired.toString(), amount0Desired.toString())
    const amount0Min = amount0Desired.mul((100 - slippage) * 100).div(10000);
    const amount1Min = amount1Desired.mul((100 - slippage) * 100).div(10000);

    console.log(amount0Min.toString(), amount1Min.toString())

    const lowerTick = priceToTick(lowerPrice);
    const upperTick = priceToTick(upperPrice);

    const mintParams = {
      tokenA: token0.address,
      tokenB: token1.address,
      fee: fee,
      lowerTick: nearestUsableTick(lowerTick, feeToSpacing[fee]),
      upperTick: nearestUsableTick(upperTick, feeToSpacing[fee]),
      amount0Desired, amount1Desired, amount0Min, amount1Min
    }
    console.log(mintParams)

    return Promise.all(
      [
        token0.allowance(account, config.managerAddress),
        token1.allowance(account, config.managerAddress)
      ]
    ).then(([allowance0, allowance1]) => {
      return Promise.resolve()
        .then(() => {
          if (allowance0.lt(amount0Desired)) {
            return token0.approve(config.managerAddress, uint256Max).then(tx => tx.wait())
          }
        })
        .then(() => {
          if (allowance1.lt(amount1Desired)) {
            return token1.approve(config.managerAddress, uint256Max).then(tx => tx.wait())
          }
        })
        .then(() => {
          return manager.mint(mintParams)
            .then(tx => tx.wait())
        })
        .then(() => {
          alert('Liquidity added!');
        });
    }).catch((err) => {
      if (err.error && err.error.data && err.error.data.data) {
        let error;

        try {
          error = manager.interface.parseError(err.error.data.data);
        } catch (e) {
          if (e.message.includes('no matching error')) {
            error = poolInterface.parseError(err.error.data.data);
          }
        }

        switch (error.name) {
          case "SlippageCheckFailed":
            alert(`Slippage check failed (amount0: ${formatAmount(error.args.amount0)}, amount1: ${formatAmount(error.args.amount1)})`)
            return;

          case "ZeroLiquidity":
            alert('Zero liquidity!');
            return;

          default:
            console.error(error);
            alert('Unknown error!');

            return;
        }
      }

      console.error(err);
      alert('Failed!');
    }).finally(() => setLoading(false));
  }



  return (
    <section className="LiquidityWrapper">
      <form className="LiquidityForm">
        <BackButton
          onClick={toggle} />
        <PriceRange
          disabled={!enabled || loading}
          lowerPrice={lowerPrice}
          upperPrice={upperPrice}
          setLowerPrice={setLowerPrice}
          setUpperPrice={setUpperPrice} />
        <AmountInput
          amount={amount0}
          disabled={!enabled || loading}
          setAmount={setAmounts}
          token={token0Info} />
        <AmountInput
          amount={amount1}
          disabled={!enabled || loading}
          setAmount={setAmount1}
          token={token1Info} />
        <button className="addLiquidity" disabled={!enabled || loading} onClick={addLiquidity}>Add liquidity</button>
      </form>
    </section>
  );
};

export default AddLiquidityForm;