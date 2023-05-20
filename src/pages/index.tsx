import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import LIFI, { ExtendedChain, RoutesRequest } from '@lifi/sdk';
import { ApproveTokenRequest } from '@lifi/sdk/dist/allowance';
import { RouteOptions } from '@lifi/types/dist/api';
import { ethers } from 'ethers';

import { useAccounts } from '@/storages/accounts';
import {Token} from '@/types';
import { ChainPairType, TokenPairType, TokensAddressesPairType } from '@/types';
import { logger } from '@/utils/logger';
import { sleep } from '@/utils/misc';


//init lifi sdk
const lifi = new LIFI();

//options for swap
const routeOptions: RouteOptions = {
  slippage: 5 / 100, // 5%
  order: 'RECOMMENDED'
}

export default function Home() {
  //private keys store
  const {privateKeys, addPrivateKey, setIsChosen, removePrivateKey} = useAccounts();

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


  const preExecuteChecks = (): [HTMLInputElement, Token, number] | boolean => {
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

    //repeat element
    const repeat = document.getElementById('repeat_time_input_id') as HTMLInputElement;
    const repeatInSecs = repeat && repeat.value && Number(repeat.value) ? Number(repeat.value) * 1000 : 0; // 1000 - s to ms

    //amount for swap
    const amountInput = document.getElementById('amount_input_id') as HTMLInputElement;

    // search for chosen Token object type from @lifi/sdk
    const fromToken = tokenPair.fromTokens.find(token => token.address === tokenAddressesPair.fromTokenAddress)

    if (amountInput.value && fromToken) {
      return [amountInput, fromToken, repeatInSecs];
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

    const [amountInput, fromToken, repeatInSecs] = preExecuteData;

    //init rpc url for chain
    const rpcUrl = chains.find(el => el.id === chainPair.fromChainId)?.metamask.rpcUrls[0];
    logger.trace('Rpc url:', rpcUrl)

    //init provider for current chain
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    logger.trace('Provider', provider)

    for (const privateKey of privateKeys) {
      logger.trace('Start execute for address', new ethers.Wallet(privateKey.data).address)
      if (!privateKey.isChosen) {
        logger.trace('Skip wallet bcz not chosen', new ethers.Wallet(privateKey.data).address)
        continue;
      }
      try {
        //init user wallet for current provider and private key
        const wallet = new ethers.Wallet(privateKey.data, provider);
        logger.trace('Start swap for address', wallet.address)

        //parse amount with decimal param
        const amount = (Number(amountInput.value) * Math.pow(10, fromToken.decimals)).toString();
        logger.trace('Amount is', amount)

        //params for search route for swap
        const routesRequest: RoutesRequest = {
          fromChainId: chainPair.fromChainId,
          fromAmount: amount,
          fromTokenAddress: tokenAddressesPair.fromTokenAddress,
          toChainId: chainPair.toChainId,
          toTokenAddress: tokenAddressesPair.toTokenAddress,
          options: routeOptions,
        }
        logger.trace('Params for routes request: ', routesRequest)
        const routes = await lifi.getRoutes(routesRequest);
        logger.trace('Routes: ', routes)
        const route = routes.routes[0];
        logger.trace('Chosen route: ', route)
        if (!route){
          logger.error('No available routes for this pair or top up balance')
          toast.error('No available routes for this pair or top up balance');
          return;
        }
        //params for approve not native  chain tokens
        const approveRequest: ApproveTokenRequest = {
          signer: wallet,
          token: fromToken,
          approvalAddress: route.steps[0].estimate.approvalAddress,
          amount: route.steps[0].estimate.fromAmount,
          infiniteApproval: true
        }
        logger.trace('Params for approve token: ', approveRequest)
        await lifi.approveToken(approveRequest)

        logger.trace('Successful approved or approved amount more than needed')

        //execute chosen route
        const txData = await lifi.executeRoute(wallet, route);
        logger.trace('Tx data:', txData)

        //extract tx hash from last lifi execution step
        const txHash = txData.steps[txData.steps.length - 1].execution?.process[0].txHash;

        //if have txHash, show it with toast
        if (txHash) {
          logger.info('Tx hash', txHash)
          toast.success(txHash)
        } else {
          logger.warn('Do not find tx hash. Tx data: ', txData)
        }
        if (repeatInSecs) {
          await sleep(repeatInSecs);
          await executeSwap();
        }
      } catch (e: any) {
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
      inputData.value = ''
    }
  }


  //chose chain select handler
  const choseChain = async (event: ChangeEvent<HTMLSelectElement>, direction: 'from' | 'to') => {
    setChainPair(prevState => ({
      fromChainId: direction === 'from' ? Number(event.target.value) : prevState.fromChainId,
      toChainId: direction === 'to' ? Number(event.target.value) : prevState.toChainId,
    }))
  }


  //chose token address select handler
  const choseTokenAddress = async (event: ChangeEvent<HTMLSelectElement>, direction: 'from' | 'to') => {
    setTokenAddressesPair(prevState => ({
      fromTokenAddress: direction === 'from' ? event.target.value : prevState.fromTokenAddress,
      toTokenAddress: direction === 'to' ? event.target.value : prevState.toTokenAddress,
    }))
  }

  useEffect(() => {
    (async () => await getTokenPair())();
  }, [chainPair])


  //get chain logo by id
  const getChainLogoById = (id: number): string => {
    const chain = chains.find(_chain => _chain.id === id);
    return chain?.logoURI || '';
  }

  //remove private key handler
  const removePrivateKeyHandler = (privateKey: string) => {
    return () => removePrivateKey(privateKey)
  }


  //simple form
  return (
    <main>

      <div className={'column'}>
        <p>Add Address</p>
        <input placeholder={'Private Key'} id={'private_key_input'}/>
        <button onClick={addPrivateKeyHandler}>Add</button>
      </div>

      <div className={'grid'}>
        {privateKeys.map(privateKey =>
          <div
            className={`address_wrapper ${privateKey.isChosen && 'chosen'}`}
            key={`chose-addr-${privateKey.data}`}
            onClick={() => setIsChosen(privateKey.data, !privateKey.isChosen)}>
            {new ethers.Wallet(privateKey.data).address}
            <p onClick={removePrivateKeyHandler(privateKey.data)}>del</p>
          </div>
        )}
      </div>

      <div className={'column'}>
        <div className={'row'}>
          <div className={'column'}>
            <p>From:</p>
            <select onChange={event => choseChain(event, 'from')} defaultValue={chains[0]?.id}>
              {chains.map(chain => <option key={chain.key} value={chain.id}>{chain.name}</option>)}
            </select>
          </div>
          <div className={'column'}>
            <p>To:</p>
            <select onChange={event => choseChain(event, 'to')} defaultValue={chains[0]?.id}>
              {chains.map(chain => <option key={chain.key} value={chain.id}>{chain.name}</option>)}
            </select>
          </div>
        </div>
        <div className={'row'}>
          <div className={'column'}>
            <p>From:</p>
            <Image
              src={getChainLogoById(chainPair.fromChainId)}
              loader={() => getChainLogoById(chainPair.fromChainId)}
              width={40}
              height={40}
              alt={''}/>
          </div>
          <div className={'column'}>
            <p>To:</p>
            <Image
              src={getChainLogoById(chainPair.toChainId)}
              loader={() => getChainLogoById(chainPair.toChainId)}
              width={40}
              height={40}
              alt={''}/>
          </div>
        </div>
      </div>
      <div>
        <div className={'row'}>
          <div className={'column'}>
            <p>From Currency:</p>
            <select
              onChange={event => choseTokenAddress(event, 'from')}
            >
              {tokenPair.fromTokens?.map(token => <option key={token.address} value={token.address}>{token.symbol}</option>)}
            </select>
          </div>
          <div className={'column'}>
            <p>To Currency:</p>
            <select
              onChange={event => choseTokenAddress(event, 'to')}
            >
              {tokenPair.toTokens?.map(token => <option key={token.address} value={token.address}>{token.symbol}</option>)}
            </select>
          </div>
        </div>
        <div className={'column'}>
          <p>From: {tokenAddressesPair.fromTokenAddress}</p>
          <p>To: {tokenAddressesPair.toTokenAddress}</p>
        </div>

        <div className={'column'}>
          <p>Input amount</p>
          <input placeholder={'0.01'} id={'amount_input_id'}/>
          <button onClick={executeSwap}>Swap</button>
        </div>
        <div className={'column'}>
          <p>Repeat in(secs):</p>
          <input placeholder={'600'} type={'number'} id={'repeat_time_input_id'}/>
        </div>
      </div>


    </main>
  )
}
