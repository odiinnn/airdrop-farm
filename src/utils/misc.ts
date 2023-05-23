import toast from 'react-hot-toast';
import { constants, ethers } from 'ethers';

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

/**
 * Return random value.
 * @param {number} maxValue - max available random value.
 */
export const getRandomValue = (maxValue: number) => {
  return Math.floor(Math.random() * maxValue) + 0.000001; // set to not be zero
}


/**
 * Return random value.
 * @param {ethers.Wallet} wallet - address wallet.
 * @param {string} tokenAddress - token address for approval.
 * @param {string} spender - token spender.
 * @param {string} amount - token amount.
 */
export const approveAllTokens = async (wallet: ethers.Wallet, tokenAddress: string, spender: string, amount: string) => {
  if (tokenAddress === zeroAddress) return;
  const erc20Contract = new ethers.Contract(tokenAddress, erc20abi, wallet);
  const tokenAllowance = parseInt((await getTokenAllowance(erc20Contract, spender))._hex, 16);
  console.log(tokenAllowance, amount)
  if (Number(tokenAllowance) < Number(amount)) {
    const maxAmount = constants.MaxUint256.toString();
    await erc20Contract.approve(spender, maxAmount);
  }
}

export const getTokenAllowance = async (contract: ethers.Contract, spender: string) => {
  return await contract.allowance(contract.signer.getAddress(), spender)
}