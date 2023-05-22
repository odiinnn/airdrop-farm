import React, { FC, useEffect, useState } from 'react';
import { ExtendedChain } from '@lifi/sdk';

import { PrivateKeyObjectType, useAccounts } from '@/storages/accounts';
import { ChainPairType, TokenPairType, TokensAddressesPairType } from '@/types';
import { getErc20Balance, getUserWallet } from '@/utils/misc';


type AddressCardProps = {
  privateKey: PrivateKeyObjectType;
  chainPair: ChainPairType;
  chains: ExtendedChain[];
  tokenPair: TokenPairType;
  tokenAddressesPair: TokensAddressesPairType;
}

type CardBalanceTokenObjectType = {
  balanceFrom: string;
  balanceTo: string;
}

export const AddressCard: FC<AddressCardProps> = ({privateKey, chainPair, chains, tokenPair, tokenAddressesPair}) => {

  const {removePrivateKey, setIsChosen} = useAccounts();

  const [balance, setBalance] = useState<CardBalanceTokenObjectType>({
    balanceFrom: '',
    balanceTo: ''
  });

  //remove private key handler
  const removePrivateKeyHandler = (_privateKey: string) => {
    return () => removePrivateKey(_privateKey)
  }

  useEffect(() => {
    const rpcUrlFrom = chains.find(el => el.id === chainPair.fromChainId)?.metamask.rpcUrls[0];
    const rpcUrlTo = chains.find(el => el.id === chainPair.toChainId)?.metamask.rpcUrls[0];
    const tokenFrom = tokenPair.fromTokens.find(_token => _token.address === tokenAddressesPair.fromTokenAddress);
    const tokenTo = tokenPair.toTokens.find(_token => _token.address === tokenAddressesPair.toTokenAddress);

    if (!tokenFrom || !rpcUrlFrom) {
      setBalance(prevState => ({...prevState, balanceFrom: ''}))
    } else {
      const userWallet = getUserWallet(privateKey.data, rpcUrlFrom);
      (async () => {
        const balanceFrom = parseInt(await getErc20Balance(tokenFrom.address, userWallet), 16) / Math.pow(10, tokenFrom.decimals);
        setBalance(prevState => ({...prevState, balanceFrom: `${tokenFrom.symbol} balance: ${balanceFrom}`}))
      })();
    }
    if (!tokenTo || !rpcUrlTo) {
      setBalance(prevState => ({...prevState, balanceTo: ''}))
    } else {
      const userWallet = getUserWallet(privateKey.data, rpcUrlTo);
      (async () => {
        const balanceTo = parseInt(await getErc20Balance(tokenTo.address, userWallet), 16) / Math.pow(10, tokenTo.decimals);
        setBalance(prevState => ({...prevState, balanceTo: `${tokenTo.symbol} balance: ${balanceTo}`}))
      })();
    }
  }, [chainPair, chains, tokenAddressesPair, tokenPair]);

  const onCardClickHandler = (_privateKey: string, isChosen: boolean) => {
    return () => setIsChosen(_privateKey, isChosen);
  }

  return (
    <div
      className={`address_wrapper ${privateKey.isChosen && 'chosen'}`}
      key={`chose-addr-${privateKey.data}`}
      onClick={onCardClickHandler(privateKey.data, !privateKey.isChosen)}
      >
      {getUserWallet(privateKey.data).address}
      <span>{balance.balanceFrom}</span>
      <span>{balance.balanceTo}</span>
      <p onClick={removePrivateKeyHandler(privateKey.data)}>delete</p>
  </div>
  )
}