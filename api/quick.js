import { getTokenAmounts } from "./main.js"

async function quick() {

    const token0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const token1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const amounts = await getTokenAmounts('1', token0, token1, '2000', '5500');

    console.log(amounts)
}

quick().then(() => process.exit(0))