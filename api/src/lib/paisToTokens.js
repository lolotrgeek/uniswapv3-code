/**
 * Converts an array of pairs to an array of tokens.
 * @param {*} pairs 
 * @returns 
 */
const pairsToTokens = async pairs => {
    const tokens = pairs.reduce((acc, pair) => {
        acc[pair.token0.address] = {
            symbol: pair.token0.symbol,
            address: pair.token0.address,
            selected: false
        }
        acc[pair.token1.address] = {
            symbol: pair.token1.symbol,
            address: pair.token1.address,
            selected: false
        }

        return acc
    }, {})

    return Object.keys(tokens).map(k => tokens[k])
}
export default pairsToTokens