import { createRequire } from "module"
const require = createRequire(import.meta.url)
const config = {
  wethAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  factoryAddress: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
  managerAddress: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
  quoterAddress: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
  ABIs: {
    'ERC20': require('./src/abi/ERC20.json'),
    'Factory': require('./src/abi/Factory.json'),
    'Manager': require('./src/abi/Manager.json'),
    'Pool': require('./src/abi/Pool.json'),
    'Quoter': require('./src/abi/Quoter.json')
  }
}

config.tokens = {}
config.tokens[config.wethAddress] = { symbol: 'WETH', decimals: 18 }
config.tokens['0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'] = { symbol: 'UNI', decimals: 18 }
config.tokens['0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'] = { symbol: 'WBTC', decimals: 18 }
config.tokens['0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'] = { symbol: 'USDT', decimals: 18 }
config.tokens['0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'] = { symbol: 'USDC', decimals: 18 }

config.pools = {}
config.pools["0x4c3FC63156Ae8130903504408182e8e89e220454"] = { symbol: 'USDT/USDC' }
config.pools["0x553C26124DaD824aAB7C349ED2AA75899156a097"] = { symbol: 'WBTC/USDT' }
config.pools["0xA912b16987066455170cd9Aea18130D0EEDbb12d"] = { symbol: 'WETH/UNI' }
config.pools["0x0787a9981bfDEBe5730DF0Ce71A181F50d178fc9"] = { symbol: 'WETH/USDC' }

export default config