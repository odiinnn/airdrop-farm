import { zeroAddress } from '@/utils/misc';

export type StargateTokenObjectType = {
  address: string;
  symbol: string;
  decimal: number;
}

export type StargateChainObjectType = {
  name: string;
  logoURI: string;
  routerAddress: string;
  routerETHAddress: string;
  bridgeAddress: string;
  layerZeroChainId: number;
  supportedToken: Array<StargateTokenObjectType>;
  rpcUrl: string;
}

export const StargateTestnetChains: Array<StargateChainObjectType> = [
  {
    name: 'Goerli',
    logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/ethereum_goerli.png',
    rpcUrl: 'https://rpc.ankr.com/eth_goerli',
    routerAddress: '0x7612aE2a34E5A363E137De748801FB4c86499152',
    routerETHAddress: '0xdb19Ad528F4649692B92586828346beF9e4a3532',
    bridgeAddress: '0xE6612eB143e4B350d55aA2E229c80b15CA336413',
    layerZeroChainId: 10121,
    supportedToken: [
      {
        address: zeroAddress,
        symbol: 'gETH',
        decimal: 18
      },
      {
        address: '0xDf0360Ad8C5ccf25095Aa97ee5F2785c8d848620',
        symbol: 'USDC',
        decimal: 6
      },
      {
        address: '0x5bcc22abec37337630c0e0dd41d64fd86caee951',
        symbol: 'USDT',
        decimal: 6
      },
      {
        address: '0xCf1F9cD3789Fc6296f4abB11dc460067Ae1a2673',
        symbol: 'SGETH',
        decimal: 18
      }
    ]
  },
  {
    name: 'Arbitrum-Goerli',
    logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/arbitrum_test.png',
    rpcUrl: 'https://goerli-rollup.arbitrum.io/rpc',
    routerAddress: '0xb850873f4c993Ac2405A1AdD71F6ca5D4d4d6b4f',
    routerETHAddress: '0x7612aE2a34E5A363E137De748801FB4c86499152',
    bridgeAddress: '0xd43cbCC7642C1Df8e986255228174C2cca58d65b',
    layerZeroChainId: 10143,
    supportedToken: [
      {
        address: zeroAddress,
        symbol: 'agETH',
        decimal: 18
      },
      {
        address: '0x6aAd876244E7A1Ad44Ec4824Ce813729E5B6C291',
        symbol: 'USDC',
        decimal: 6
      },
      {
        address: '0x533046F316590C19d99c74eE661c6d541b64471C',
        symbol: 'USDT',
        decimal: 6
      },
      {
        address: '0xb45186E02CC4AbC0e390EdFfdc2aBC8D523ea15e',
        symbol: 'SGETH',
        decimal: 18
      }
    ]
  },
  {
    name: 'Optimism-Goerli',
    logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/optimism_test.png',
    rpcUrl: 'https://endpoints.omniatech.io/v1/op/goerli/public',
    routerAddress: '0x95461eF0e0ecabC049a5c4a6B98Ca7B335FAF068',
    routerETHAddress: '0xc744E5c3E5A4F6d70Df217a0837D32B05a951d08',
    bridgeAddress: '0x5A7465e1a68F430E7A696aDBC5C107528C1cC9d0',
    layerZeroChainId: 10132,
    supportedToken: [
      {
        address: zeroAddress,
        symbol: 'ogETH',
        decimal: 18
      },
      {
        address: '0x0CEDBAF2D0bFF895C861c5422544090EEdC653Bf',
        symbol: 'USDC',
        decimal: 6
      },
      {
        address: '0xf70E5b860e24cc18436b1A6AA512a1599EE90731',
        symbol: 'SGETH',
        decimal: 18
      }
    ]
  },
  {
    name: 'BNB Chain',
    logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/bsc_test.png',
    rpcUrl: 'https://bsc-testnet.publicnode.com',
    routerAddress: '0xbB0f1be1E9CE9cB27EA5b0c3a85B7cc3381d8176',
    bridgeAddress: '0xa1E105511416aEc3200CcE7069548cF332c6DCA2',
    routerETHAddress: '',
    layerZeroChainId: 10102,
    supportedToken: [
      {
        address: '0x1010Bb1b9Dff29e6233E7947e045e0ba58f6E92e',
        symbol: 'BUSD',
        decimal: 6
      },
      {
        address: '0xF49E250aEB5abDf660d643583AdFd0be41464EfD',
        symbol: 'USDT',
        decimal: 6
      }
    ]
  },
  {
    name: 'Fuji',
    logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/avalanche_test.png',
    rpcUrl: 'https://avalanche-fuji-c-chain.publicnode.com',
    routerAddress: '0x13093E05Eb890dfA6DacecBdE51d24DabAb2Faa1',
    bridgeAddress: '0x29fBC4E4092Db862218c62a888a00F9521619230',
    routerETHAddress: '',
    layerZeroChainId: 10106,
    supportedToken: [
      {
        address: '0x4A0D1092E9df255cf95D72834Ea9255132782318',
        symbol: 'USDC',
        decimal: 6
      },
      {
        address: '0x134Dc38AE8C853D1aa2103d5047591acDAA16682',
        symbol: 'USDT',
        decimal: 6
      }
    ]
  },
  {
    name: 'Mumbai',
    logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/polygon_test.png',
    rpcUrl: 'https://polygon-mumbai-bor.publicnode.com',
    routerAddress: '0x817436a076060D158204d955E5403b6Ed0A5fac0',
    bridgeAddress: '0x629B57D89b1739eE1C0c0fD9eab426306e11cF42',
    routerETHAddress: '',
    layerZeroChainId: 10109,
    supportedToken: [
      {
        address: '0x742DfA5Aa70a8212857966D491D67B09Ce7D6ec7',
        symbol: 'USDC',
        decimal: 6
      },
      {
        address: '0x6Fc340be8e378c2fF56476409eF48dA9a3B781a0',
        symbol: 'USDT',
        decimal: 6
      }
    ]
  },
  {
    name: 'Fantom',
    logoURI: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/fantom.svg',
    rpcUrl: 'https://endpoints.omniatech.io/v1/fantom/testnet/public',
    routerAddress: '0xa73b0a56B29aD790595763e71505FCa2c1abb77f',
    bridgeAddress: '0xb97948ad8805174e0CB27cAf0115e5eA5e02F3A7',
    routerETHAddress: '',
    layerZeroChainId: 10112,
    supportedToken: [
      {
        address: '0x076488D244A73DA4Fa843f5A8Cd91F655CA81a1e',
        symbol: 'USDC',
        decimal: 6
      },
    ]
  },
]