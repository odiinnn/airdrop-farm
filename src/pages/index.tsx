import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LIFI, { ExtendedChain, RoutesRequest } from '@lifi/sdk';
import { ApproveTokenRequest } from '@lifi/sdk/dist/allowance';
import { RouteOptions } from '@lifi/types/dist/api';
import { ethers } from 'ethers';

import { useAccounts } from '@/storages/accounts';
import { ChainPairType, TokenPairType, TokensAddressesPairType } from '@/types';

//init lifi sdk
const lifi = new LIFI();

//options for swap
const routeOptions: RouteOptions = {
  slippage: 5 / 100, // 5%
  order: 'RECOMMENDED'
}

export default function Home() {
  //private keys store
  const {privateKeys, addPrivateKey} = useAccounts();

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
      setChains(await lifi.getChains());
    })();

  }, [lifi])


  //execute swap fn
  const executeSwap = useCallback(async () => {
    //init rpc url for chain
    const rpcUrl = chains.find(el => el.id === chainPair.fromChainId)?.metamask.rpcUrls[0];

    //init provider for current chain
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    //init user wallet for current provider and private key
    const wallet = new ethers.Wallet(privateKeys[0], provider);

    //amount for swap
    const amountInput = document.getElementById('amount_input_id') as HTMLInputElement;

    // search for chosen Token object type from @lifi/sdk
    const fromToken = tokenPair.fromTokens.find(token => token.address === tokenAddressesPair.fromTokenAddress)
    if (amountInput && fromToken) {

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
        console.log({ txData });

        //extract tx hash from last lifi execution step
        const txHash = txData.steps[txData.steps.length - 1].execution?.process[0].txHash;

        //if have txHash, show it with toast
        if (txHash) {
          toast.success(txHash)
        }
      } else {
        toast.error('No available routes for this pair or top up balance')
      }
    }
  }, [chainPair, tokenAddressesPair])


  //extract token pair for chosen chains
  const getTokenPair = useCallback(async () => {
    const { tokens } = await lifi.getTokens({chains: [chainPair.fromChainId, chainPair.toChainId]});
    if(tokens) {
      setTokenPair({fromTokens: tokens[chainPair.fromChainId], toTokens: tokens[chainPair.toChainId]})
    }
  }, [chainPair])


  //add private key address to store
  const addPrivateKeyHandler = () => {
    const inputData = document.getElementById('private_key_input') as HTMLInputElement;
    if (inputData) {
      addPrivateKey(inputData.value)
    }
  }


  //simple form
  return (
    <main>

      <div>
        <p>Your Accounts</p>
        <div>
          {(privateKeys || []).map(prK => (
            <p key={prK}>{new ethers.Wallet(prK).address}</p>
          ))}
        </div>
        <p>Add Address</p>
        <input placeholder={'Private Key'} id={'private_key_input'}/>
        <button onClick={addPrivateKeyHandler}>Add</button>
      </div>

      <div>
        From:
        <select onChange={event => setChainPair((prev) => ({...prev, fromChainId: Number(event.target.value)}))}>
          {chains.map(chain => <option key={chain.key} value={chain.id}>{chain.name}</option>)}
        </select>

        To:
        <select onChange={event => setChainPair((prev) => ({...prev, toChainId: Number(event.target.value)}))}>
          {chains.map(chain => <option key={chain.key} value={chain.id}>{chain.name}</option>)}
        </select>

        <div>From: {chainPair.fromChainId} To: {chainPair.toChainId}</div>
      </div>
      <div>
        From Currency:
        <select
          onChange={event => setTokenAddressesPair((prev) => ({...prev, fromTokenAddress: event.target.value}))}
          onClick={getTokenPair}
        >
          {tokenPair.fromTokens?.map(token => <option key={token.address} value={token.address}>{token.symbol}</option>)}
        </select>

        To Currency:
        <select
          onChange={event => setTokenAddressesPair((prev) => ({...prev, toTokenAddress: event.target.value}))}
          onClick={getTokenPair}
        >
          {tokenPair.toTokens?.map(token => <option key={token.address} value={token.address}>{token.symbol}</option>)}
        </select>

        <div>From: {tokenAddressesPair.fromTokenAddress} To: {tokenAddressesPair.toTokenAddress}</div>

        <p>Input amount</p>
        <input placeholder={'0.01'} id={'amount_input_id'}/>
        <button onClick={executeSwap}>Swap</button>
      </div>
    </main>
  )
}
