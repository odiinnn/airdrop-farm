export type ChainPairType = {
  fromChainId: number;
  toChainId: number
}

export type Token = {
  address: string;
  symbol: string;
  decimals: number;
  chainId: number;
  name: string;
  priceUSD?: string;
  logoURI?: string;
}

export type TokensAddressesPairType = {
  fromTokenAddress: string
  toTokenAddress: string
}

export type TokenPairType = {
  fromTokens: Token[];
  toTokens: Token[];
}