import { ethers } from 'ethers';

const uint256Max = ethers.constants.MaxUint256;

const feeToSpacing = {
  3000: 60,
  500: 10
}

// forge inspect UniswapV3Pool bytecode| xargs cast keccak
// const poolCodeHash = "0x9dc805423bd1664a6a73b31955de538c338bac1f5c61beb8f4635be5032076a2";
const poolCodeHash = "0x0fc90f62c036998e21025e0735a5b2699bde38f5a8a708c79791b0f2697ed36c"

export { uint256Max, feeToSpacing, poolCodeHash };