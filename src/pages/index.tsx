import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LIFI, { ExtendedChain, RoutesRequest } from '@lifi/sdk';
import { ApproveTokenRequest } from '@lifi/sdk/dist/allowance';
import { RouteOptions } from '@lifi/types/dist/api';
import { ethers } from 'ethers';

import { useAccounts } from '@/storages/accounts';
import { ChainPairType, TokenPairType, TokensAddressesPairType } from '@/types';


const lify = new LIFI();

const routeOptions: RouteOptions = {
  slippage: 5 / 100, // 5%
  order: 'RECOMMENDED'
}

export default function Home() {
  const {privateKeys, addPrivateKey} = useAccounts();
  const [chains, setChains] = useState<ExtendedChain[]>([]);
  const [chainPair, setChainPair] = useState<ChainPairType>({
    fromChainId: 1,
    toChainId: 1,
  })
  const [tokenAddressesPair, setTokenAddressesPair] = useState<TokensAddressesPairType>({
    fromTokenAddress: '',
    toTokenAddress: '',
  })
  const [tokenPair, setTokenPair] = useState<TokenPairType>({
    fromTokens: [],
    toTokens: []
  })

  useEffect(() => {
    (async () => {
      setChains(await lify.getChains());
    })();

  }, [lify])


  const executeSwap = useCallback(async () => {
    const rpcUrl = chains.find(el => el.id === chainPair.fromChainId)?.metamask.rpcUrls[0];
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKeys[0], provider);
    const amountInput = document.getElementById('amount_input_id') as HTMLInputElement;
    const fromToken = tokenPair.fromTokens.find(token => token.address === tokenAddressesPair.fromTokenAddress)
    if (amountInput && fromToken) {
      const amount = (Number(amountInput.value) * Math.pow(10, fromToken.decimals)).toString();
      const routesRequest: RoutesRequest = {
        fromChainId: chainPair.fromChainId,
        fromAmount: amount,
        fromTokenAddress: tokenAddressesPair.fromTokenAddress,
        toChainId: chainPair.toChainId,
        toTokenAddress: tokenAddressesPair.toTokenAddress,
        options: routeOptions,
      }
      const routes = await lify.getRoutes(routesRequest);
      const route = routes.routes[2];
      if (route) {
        const approveRequest: ApproveTokenRequest = {
          signer: wallet,
          token: fromToken,
          approvalAddress: route.steps[0].estimate.approvalAddress,
          amount: route.steps[0].estimate.fromAmount,
          infiniteApproval: true
        }
        await lify.approveToken(approveRequest)
        const txData = await lify.executeRoute(wallet, route);
        console.log({ txData });
        const txHash = txData.steps[txData.steps.length - 1].execution?.process[0].txHash;
        if (txHash) {
          toast.success(txHash)
        }
      } else {
        toast.error('No available routes for this pair or top up balance')
      }
    }
  }, [chainPair, tokenAddressesPair])

  const getTokenPair = useCallback(async () => {
    const { tokens } = await lify.getTokens({chains: [chainPair.fromChainId, chainPair.toChainId]});
    if(tokens) {
      setTokenPair({fromTokens: tokens[chainPair.fromChainId], toTokens: tokens[chainPair.toChainId]})
    }
  }, [chainPair])


  const addPrivateKeyHandler = () => {
    const inputData = document.getElementById('private_key_input') as HTMLInputElement;
    if (inputData) {
      addPrivateKey(inputData.value)
    }
  }

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
