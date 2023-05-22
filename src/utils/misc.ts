import toast from 'react-hot-toast';
import {ethers} from 'ethers'

import { logger } from '@/utils/logger';

import erc20abi from '../abi/erc20.json';


export const zeroAddress = '0x0000000000000000000000000000000000000000';

/**
 * Custom js sleep function.
 * @param {number} timeInMs - time in ms.
 */
export const sleep = async (timeInMs: number) => {
  return new Promise(resolve => setTimeout(resolve, timeInMs));
}

/**
 * Custom get erc20 token balance by address.
 * @param {string} tokenAddress - erc20 token address.
 * @param {ethers.Wallet} wallet - address Wallet (new ethers.Wallet(privateKey, provider)).
 */
export const getErc20Balance = async (tokenAddress: string, wallet: ethers.Wallet): Promise<string> => {
  try {
    if (tokenAddress === zeroAddress) {
      return (await wallet.getBalance())._hex;
    }

    const erc20tokenContract = new ethers.Contract(tokenAddress, erc20abi, wallet);

    return await erc20tokenContract.balanceOf(wallet.address).toString();
  } catch (e) {
    logger.error('Error: ', e);
    toast.error(String(e));
    return '0';
  }
}


/**
 * Return JsonRpcProvider.
 * @param {string} url - JsonRpc url.
 */
export const getUserProvider = (url: string) => {
  return new ethers.providers.JsonRpcProvider(url);
}

/**
 * Return address Wallet (new ethers.Wallet(privateKey, provider)).
 * @param {string} privateKey - address private key.
 * @param {string} rpcUrl - JsonRpc url.
 */
export const getUserWallet = (privateKey: string, rpcUrl?: string) => {
  return new ethers.Wallet(privateKey, rpcUrl ? getUserProvider(rpcUrl) : undefined);
}