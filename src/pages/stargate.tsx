import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import { ethers } from 'ethers';

import { AddressCard } from '@/components/address-card';
import { StargateTestnetChains, StargateTokenObjectType } from '@/constants/stargate-testnet-data';
import { useAccounts } from '@/storages/accounts';
import { StargateTokenPairType } from '@/types';
import { ChainPairType, TokensAddressesPairType } from '@/types';
import { logger } from '@/utils/logger';
import { approveAllTokens, getErc20Balance, getRandomValue, sleep, zeroAddress } from '@/utils/misc';
import { executeSwap as exSwap, executeSwapETH } from '@/utils/stargate';


export default function Home() {

  //private keys store
  const {privateKeys, addPrivateKey} = useAccounts();


  //chosen chins pair
  const [chainPair, setChainPair] = useState<ChainPairType>({
    fromChainId: 10121,
    toChainId: 10121,
  })

  //chosen token addresses pair
  const [tokenAddressesPair, setTokenAddressesPair] = useState<TokensAddressesPairType>({
    fromTokenAddress: '',
    toTokenAddress: '',
  })

  //tokens, related to chosen chains
  const [tokenPair, setTokenPair] = useState<StargateTokenPairType>({
    fromTokens: [],
    toTokens: []
  })


  //random states
  const [isRandomOn, setIsRandomOn] = useState<boolean>(false);
  const [randomRange, setRandomRange] = useState<number>(0)


  //handle random mode change
  const handleRandomSwitch = () => {
    setIsRandomOn(prevState => !prevState);
  }

  //handle random range change
  const onRandomRangeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setRandomRange(Number(e.target.value));
  }

  useEffect(() => {
    (async () => {
      setChainPair({
        fromChainId: StargateTestnetChains[0].layerZeroChainId,
        toChainId: StargateTestnetChains[0].layerZeroChainId
      })
    })();

  }, [])


  const preExecuteChecks = useCallback((): [HTMLInputElement, StargateTokenObjectType, number] | boolean => {
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


    //check user chain id and token addresses are the same
    if (chainPair.fromChainId === chainPair.toChainId && tokenAddressesPair.fromTokenAddress === tokenAddressesPair.toTokenAddress) {
      toast.error('The same tokens on the same blockchain cannot be used');
      logger.error('The same tokens on the same blockchain cannot be used');
      return false;
    }


    //check random not zero
    if (isRandomOn && randomRange === 0) {
      toast.error('Random cannot be zero');
      logger.error('Random range is 0');
      return false;
    }

    //repeat element
    const repeat = document.getElementById('repeat_time_input_id') as HTMLInputElement;
    const repeatInSecs = repeat && repeat.value && Number(repeat.value) ? Number(repeat.value) * 1000 : 0; // 1000 - s to ms

    //amount for swap
    const amountInput = document.getElementById('amount_input_id') as HTMLInputElement;

    // search for chosen Token object type from @lifi/sdk
    const fromToken = tokenPair.fromTokens.find(token => token.address === tokenAddressesPair.fromTokenAddress)

    if (((amountInput && amountInput.value) || isRandomOn) && fromToken) {
      return [amountInput, fromToken, repeatInSecs];
    } else {
      toast.error('No Amount or From Token Sir!')
      logger.error('No Amount or From Token')
      logger.debug('Amount input', amountInput)
      logger.debug('From token', fromToken)
      logger.debug('Is random on - ', isRandomOn)
      return false;
    }
  }, [privateKeys.length, tokenAddressesPair, isRandomOn, randomRange, chainPair]);

  const amountForSwap = async (amountInput: HTMLInputElement, tokenDecimal: number, wallet: ethers.Wallet, tokenAddress: string): Promise<string> => {
    if (!isRandomOn) return (Number(amountInput.value) * Math.pow(10, tokenDecimal)).toString();

    const randomPercent = getRandomValue(randomRange) / 100;

    logger.trace('Random is Accepted. Random is', `${randomPercent}%`);

    const userBalance = Number(await getErc20Balance(tokenAddress, wallet));

    return (Math.floor(userBalance * randomPercent)).toString();

  }


  //execute swap fn
  // eslint-disable-next-line sonarjs/cognitive-complexity
  const executeSwap = useCallback(async () => {

    const preExecuteData = preExecuteChecks();
    if (typeof preExecuteData === 'boolean') return;

    const [amountInput, fromToken, repeatInSecs] = preExecuteData;

    //init rpc url for chain
    const rpcUrl = StargateTestnetChains.find(el => el.layerZeroChainId === chainPair.fromChainId)?.rpcUrl;
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
        const amount = await amountForSwap(amountInput, fromToken.decimal, wallet, fromToken.address);
        logger.trace('Amount is', amount)

        const routerData = StargateTestnetChains.find(chain => chain.layerZeroChainId === chainPair.fromChainId);

        logger.trace('Params for approve token: ', {wallet, from: fromToken.address, router: routerData?.routerAddress})
        await approveAllTokens(wallet, fromToken.address, routerData?.routerAddress || '', amount);

        logger.trace('Successful approved or approved amount more than needed')
        //execute chosen route
        const txData = fromToken.address === zeroAddress
          ? await executeSwapETH(amount, wallet, routerData?.routerETHAddress || '', chainPair.toChainId)
          : await exSwap(amount, wallet, routerData?.routerETHAddress || '', chainPair.toChainId);
        logger.trace('Tx data:', txData)

        //extract tx hash from last lifi execution step

        //if have txHash, show it with toast
        if (txData) {
          logger.info('Tx hash', txData)
          toast.success(String(txData))
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

  }, [chainPair, tokenAddressesPair, isRandomOn, randomRange])


  //extract token pair for chosen chains
  const getTokenPair = useCallback(async () => {
    const tokensFrom = StargateTestnetChains.find(ch => ch.layerZeroChainId === chainPair.fromChainId)!.supportedToken;
    const tokensTo = StargateTestnetChains.find(ch => ch.layerZeroChainId === chainPair.toChainId)!.supportedToken;
    setTokenPair({fromTokens: tokensFrom, toTokens: tokensTo})
    setTokenAddressesPair({
      fromTokenAddress: tokensFrom[0].address,
      toTokenAddress: tokensTo[0].address
    })
  }, [chainPair])


  //add private key address to store
  const addPrivateKeyHandler = () => {
    const inputData = document.getElementById('private_key_input') as HTMLInputElement;
    if (inputData) {
      try {
        const _wallet = new ethers.Wallet(inputData.value);
        addPrivateKey(_wallet.privateKey);
      } catch (e) {
        logger.error('Error: not correct private key - ', inputData.value);
        toast.error('Not valid private key')
      }
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
    const chain = StargateTestnetChains.find(_chain => _chain.layerZeroChainId === id);
    return chain?.logoURI || '';
  }

  //simple form
  return (
    <main>
      <Link href={'/'}>Go to Lifi</Link>
      <div className={'column'}>
        <p>Add Address</p>
        <input placeholder={'Private Key'} id={'private_key_input'}/>
        <button onClick={addPrivateKeyHandler}>Add</button>
      </div>

      <div className={'grid'}>
        {privateKeys.map(privateKey =>
          <AddressCard
            key={privateKey.data}
            privateKey={privateKey}
            tokenAddressesPair={tokenAddressesPair}
            chains={[]}
            chainPair={chainPair}
            tokenPair={{fromTokens: [], toTokens: []}}/>
        )}
      </div>

      <div className={'column'}>
        <div className={'row'}>
          <div className={'column'}>
            <p>From:</p>
            <select onChange={event => choseChain(event, 'from')} defaultValue={StargateTestnetChains[0]?.layerZeroChainId}>
              {StargateTestnetChains.map(chain => <option key={chain.layerZeroChainId} value={chain.layerZeroChainId}>{chain.name}</option>)}
            </select>
          </div>
          <div className={'column'}>
            <p>To:</p>
            <select onChange={event => choseChain(event, 'to')} defaultValue={StargateTestnetChains[0]?.layerZeroChainId}>
              {StargateTestnetChains.map(chain => <option key={chain.layerZeroChainId} value={chain.layerZeroChainId}>{chain.name}</option>)}
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
          <input type={'checkbox'} checked={isRandomOn} onChange={handleRandomSwitch}/>
        </div>
        <div className={'column'}>
          {isRandomOn
            ? <>
              <p>Input Random Range</p>
              <input type={'range'} value={randomRange} onChange={onRandomRangeChange}/>
              <p>{randomRange}%</p>
            </>
            : <>
              <p>Input amount</p>
              <input placeholder={'0.01'} id={'amount_input_id'}/>
            </>
          }
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
