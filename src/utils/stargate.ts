import { ethers } from 'ethers';

import { StargateTestnetChains } from '@/constants/stargate-testnet-data';
import { zeroAddress } from '@/utils/misc';

import abiStargateRouter from '../abi/StargateRouter.json'
import abiStargateRouterETH from '../abi/StargateRouterETH.json'

const swapAbiDec = [
      {
        'internalType':'uint16',
        'name':'_dstChainId',
        'type':'uint16'
      },
      {
        'internalType':'uint256',
        'name':'_srcPoolId',
        'type':'uint256'
      },
      {
        'internalType':'uint256',
        'name':'_dstPoolId',
        'type':'uint256'
      },
      {
        'internalType':'address payable',
        'name':'_refundAddress',
        'type':'address'
      },
      {
        'internalType':'uint256',
        'name':'_amountLD',
        'type':'uint256'
      },
      {
        'internalType':'uint256',
        'name':'_minAmountLD',
        'type':'uint256'
      },
      {
        'components':[
          {
            'internalType':'uint256',
            'name':'dstGasForCall',
            'type':'uint256'
          },
          {
            'internalType':'uint256',
            'name':'dstNativeAmount',
            'type':'uint256'
          },
          {
            'internalType':'bytes',
            'name':'dstNativeAddr',
            'type':'bytes'
          }
        ],
        'internalType':'struct IStargateRouter.lzTxObj',
        'name':'_lzTxParams',
        'type':'tuple'
      },
      {
        'internalType':'bytes',
        'name':'_to',
        'type':'bytes'
      },
      {
        'internalType':'bytes',
        'name':'_payload',
        'type':'bytes'
      }
  ] as const;

/**
 * Get supported chains for RouterETH contract.
 */
const supportedEthChainIds = StargateTestnetChains.filter(chain => chain.supportedToken).map(chain => chain.layerZeroChainId);

/**
 * @param {ethers.Wallet} wallet - new ethers.Wallet.
 * @param {string} routerAddress - router address.
 */
export type GetStargateRouterContractInputType = {
  wallet: ethers.Wallet;
  routerAddress: string;
}
/**
 * Return Router Contract.
 * @param {GetStargateRouterContractInputType} props - GetStargateRouterContractInputType.
 */
export const getStargateRouterContract = ({wallet, routerAddress}: GetStargateRouterContractInputType) => {
  return new ethers.Contract(routerAddress, abiStargateRouter, wallet);
}

/**
 * Return Router Contract.
 * @param {GetStargateRouterContractInputType} props - GetStargateRouterContractInputType.
 */
export const getStargateRouterETHContract = ({wallet, routerAddress}: GetStargateRouterContractInputType) => {
  return new ethers.Contract(routerAddress, abiStargateRouterETH, wallet);
}

export const executeSwap = async (amount: string, wallet: ethers.Wallet, routerAddress: string, dstChainId: number) => {
  const contract = getStargateRouterContract({ wallet, routerAddress });
  const minAmount = String(Number(amount) / 100);

  const d = {
    dstChainId, dstp: 1, p: 1, addr: wallet.address, amount, minAmount, pr: { dstGasForCall: 0, dstNativeAmount: 0, dstNativeAddr: '0x' }, dstAddr: wallet.address, payl: '0x'
  }
  // const params = ethers.utils.defaultAbiCoder.encode([...swapAbiDec as any],[...Object.values(d)])
  // console.log({ params })
  // const fee = await contract.quoteLayerZeroFee(dstChainId, '1', wallet.address, params, [...Object.values(d)]);
  const quoteData = await contract.quoteLayerZeroFee(
    dstChainId,                 // destination chainId
    '1',               // function type: see Bridge.sol for all types
    wallet.address,                  // destination of tokens
    '0x',                       // payload, using abi.encode()
    ({
      dstGasForCall: 0,       // extra gas, if calling smart contract,
      dstNativeAmount: 0,     // amount of dust dropped in destination wallet
      dstNativeAddr: wallet.address // destination wallet for dust
    })
  )
  console.log({ quoteData })
  return await contract.swap(dstChainId, 1, 1, wallet.address, amount, minAmount, { dstGasForCall: 0, dstNativeAmount: 0, dstNativeAddr: '0x' }, wallet.address, '', {value: quoteData[0]});
}

export const executeSwapETH = async (amount: string, wallet: ethers.Wallet, routerAddress: string, dstChainId: number) => {
  const contract = getStargateRouterETHContract({ wallet, routerAddress });
  return await contract.swapETH(dstChainId, wallet.address, wallet.address, 1, 1, {value: amount});
}