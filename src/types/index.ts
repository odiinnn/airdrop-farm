/**
 * Chain pair type.
 * Used for track chosen user chains
 */
export type ChainPairType = {
  fromChainId: number;
  toChainId: number
}

/**
 * Token type.
 * from @lifi/sdk, bcz no export from lib
 */
export type Token = {
  address: string;
  symbol: string;
  decimals: number;
  chainId: number;
  name: string;
  priceUSD?: string;
  logoURI?: string;
}

/**
 * Token addresses pair type.
 * Used for track chosen user tokens pairs
 */
export type TokensAddressesPairType = {
  fromTokenAddress: string
  toTokenAddress: string
}

/**
 * Token pair type.
 * Used for track token, related for chosen chains
 */
export type TokenPairType = {
  fromTokens: Token[];
  toTokens: Token[];
}