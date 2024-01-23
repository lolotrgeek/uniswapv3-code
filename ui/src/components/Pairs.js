import react from "react";

const Pairs = ({ pairs }) => (
  <div>
    {pairs.map((pair, i) => (
      <div>{pair.token0.symbol}/{pair.token1.symbol}</div>)
    )}
  </div>
)

export default Pairs;