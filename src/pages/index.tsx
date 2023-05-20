import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LIFI, { ExtendedChain, RoutesRequest } from '@lifi/sdk';
import { ApproveTokenRequest } from '@lifi/sdk/dist/allowance';
import { RouteOptions } from '@lifi/types/dist/api';
import { ethers } from 'ethers';

import { useAccounts } from '@/storages/accounts';
import {Token} from '@/types';
import { ChainPairType, TokenPairType, TokensAddressesPairType } from '@/types';
import { logger } from '@/utils/logger';


//init lifi sdk
const lifi = new LIFI();

//options for swap
const routeOptions: RouteOptions = {
  slippage: 5 / 100, // 5%
  order: 'RECOMMENDED'
}

export default function Home() {
  //private keys store
  const {privateKeys, addPrivateKey, setIsChosen} = useAccounts();

  //chains stored in state
  const [chains, setChains] = useState<ExtendedChain[]>([]);

  //chosen chins pair
  const [chainPair, setChainPair] = useState<ChainPairType>({
    fromChainId: 1,
    toChainId: 1,
  })

  //chosen token addresses pair
  const [tokenAddressesPair, setTokenAddressesPair] = useState<TokensAddressesPairType>({
    fromTokenAddress: '',
    toTokenAddress: '',
  })

  //tokens, related to chosen chains
  const [tokenPair, setTokenPair] = useState<TokenPairType>({
    fromTokens: [],
    toTokens: []
  })

  useEffect(() => {
    (async () => {
      const lifiChains = await lifi.getChains();
      setChains(lifiChains);
      setChainPair({fromChainId: lifiChains[0].id, toChainId: lifiChains[0].id})
    })();

  }, [lifi])


  const preExecuteChecks = (): [HTMLInputElement, Token] | boolean => {
    //check if user have accounts
    if (!Array.isArray(privateKeys) || privateKeys.length === 0) {
      logger.debug('Private keys', privateKeys)
      toast.error('No Accounts Sir!')
      logger.error('No accounts')
      return false;
    }

    //check if user have chosen accounts
    if (privateKeys.filter(_prK => _prK.isChosen).length === 0) {
      toast.error('No Chosen Accounts Sir!')
      logger.error('No chosen accounts')
      return false;
    }

    //amount for swap
    const amountInput = document.getElementById('amount_input_id') as HTMLInputElement;

    // search for chosen Token object type from @lifi/sdk
    const fromToken = tokenPair.fromTokens.find(token => token.address === tokenAddressesPair.fromTokenAddress)

    if (amountInput.value && fromToken) {
      return [amountInput, fromToken];
    } else {
      toast.error('No Amount or From Token Sir!')
      logger.error('No Amount or From Token')
      return false;
    }
  }


  //execute swap fn
  const executeSwap = useCallback(async () => {

    const preExecuteData = preExecuteChecks();
    if (typeof preExecuteData === 'boolean') return;

    const [amountInput, fromToken] = preExecuteData;

    //init rpc url for chain
    const rpcUrl = chains.find(el => el.id === chainPair.fromChainId)?.metamask.rpcUrls[0];

    //init provider for current chain
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    for (const privateKey of privateKeys) {
      if (!privateKey.isChosen) {
        continue;
      }
      try {
        //init user wallet for current provider and private key
        const wallet = new ethers.Wallet(privateKey.data, provider);

        //parse amount with decimal param
        const amount = (Number(amountInput.value) * Math.pow(10, fromToken.decimals)).toString();

        //params for search route for swap
        const routesRequest: RoutesRequest = {
          fromChainId: chainPair.fromChainId,
          fromAmount: amount,
          fromTokenAddress: tokenAddressesPair.fromTokenAddress,
          toChainId: chainPair.toChainId,
          toTokenAddress: tokenAddressesPair.toTokenAddress,
          options: routeOptions,
        }
        const routes = await lifi.getRoutes(routesRequest);
        const route = routes.routes[0];
        if (route) {
          //params for approve not native  chain tokens
          const approveRequest: ApproveTokenRequest = {
            signer: wallet,
            token: fromToken,
            approvalAddress: route.steps[0].estimate.approvalAddress,
            amount: route.steps[0].estimate.fromAmount,
            infiniteApproval: true
          }
          await lifi.approveToken(approveRequest)

          //execute chosen route
          const txData = await lifi.executeRoute(wallet, route);
          logger.info('Tx data:', txData)

          //extract tx hash from last lifi execution step
          const txHash = txData.steps[txData.steps.length - 1].execution?.process[0].txHash;

          //if have txHash, show it with toast
          if (txHash) {
            logger.info('Tx hash', txHash)
            toast.success(txHash)
          }
        } else {
          logger.error('No available routes for this pair or top up balance')
          toast.error('No available routes for this pair or top up balance')
        }
      }catch (e: any) {
        logger.error('Error while execute', e)
        toast.error(`Error: ${e?.message}. See console for more info.`)
      }
    }

  }, [chainPair, tokenAddressesPair])


  //extract token pair for chosen chains
  const getTokenPair = useCallback(async () => {
    const { tokens } = await lifi.getTokens({chains: [chainPair.fromChainId, chainPair.toChainId]});
    if(tokens) {
      setTokenPair({fromTokens: tokens[chainPair.fromChainId], toTokens: tokens[chainPair.toChainId]})
      setTokenAddressesPair({
        fromTokenAddress: tokens[chainPair.fromChainId][0].address,
        toTokenAddress: tokens[chainPair.toChainId][0].address
      })
    }
  }, [chainPair])


  //add private key address to store
  const addPrivateKeyHandler = () => {
    const inputData = document.getElementById('private_key_input') as HTMLInputElement;
    if (inputData) {
      addPrivateKey(inputData.value)
    }
  }

  const choseChain = async (event: ChangeEvent<HTMLSelectElement>, direction: 'from' | 'to') => {
    setChainPair(prevState => ({
      fromChainId: direction === 'from' ? Number(event.target.value) : prevState.fromChainId,
      toChainId: direction === 'to' ? Number(event.target.value) : prevState.toChainId,
    }))
  }

  const choseTokenAddress = async (event: ChangeEvent<HTMLSelectElement>, direction: 'from' | 'to') => {
    setTokenAddressesPair(prevState => ({
      fromTokenAddress: direction === 'from' ? event.target.value : prevState.fromTokenAddress,
      toTokenAddress: direction === 'to' ? event.target.value : prevState.toTokenAddress,
    }))
  }

  useEffect(() => {
    (async () => await getTokenPair())();
  }, [chainPair])


  //simple form
  return (
    <main>

      <div>
        <p>Add Address</p>
        <input placeholder={'Private Key'} id={'private_key_input'}/>
        <button onClick={addPrivateKeyHandler}>Add</button>
      </div>

      <div>
        From:
        <select onChange={event => choseChain(event, 'from')} defaultValue={chains[0]?.id}>
          {chains.map(chain => <option key={chain.key} value={chain.id}>{chain.name}</option>)}
        </select>

        To:
        <select onChange={event => choseChain(event, 'to')} defaultValue={chains[0]?.id}>
          {chains.map(chain => <option key={chain.key} value={chain.id}>{chain.name}</option>)}
        </select>

        <div>From: {chainPair.fromChainId} To: {chainPair.toChainId}</div>
      </div>
      <div>
        From Currency:
        <select
          onChange={event => choseTokenAddress(event, 'from')}
        >
          {tokenPair.fromTokens?.map(token => <option key={token.address} value={token.address}>{token.symbol}</option>)}
        </select>

        To Currency:
        <select
          onChange={event => choseTokenAddress(event, 'to')}
        >
          {tokenPair.toTokens?.map(token => <option key={token.address} value={token.address}>{token.symbol}</option>)}
        </select>

        <div>From: {tokenAddressesPair.fromTokenAddress} To: {tokenAddressesPair.toTokenAddress}</div>

        <p>Input amount</p>
        <input placeholder={'0.01'} id={'amount_input_id'}/>
        <button onClick={executeSwap}>Swap</button>
      </div>

      <div className={'grid'}>
        {privateKeys.map(privateKey =>
          <div
            className={`address_wrapper ${privateKey.isChosen && 'chosen'}`}
            key={`chose-addr-${privateKey.data}`}
            onClick={() => setIsChosen(privateKey.data, !privateKey.isChosen)}>
              {new ethers.Wallet(privateKey.data).address}
          </div>
        )}
      </div>

    </main>
  )
}
