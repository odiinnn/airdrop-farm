import React, {ReactNode} from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {NextPage} from 'next';
import {AppProps} from 'next/app';
import axios from 'axios';

import {logger} from '@/utils/logger'

import '../styles/styles.css'


//axios interceptors for errors handling
axios.interceptors.response.use(
  res => res,
  err => {
    logger.error('Axios error: ', err)
    toast.error(`Error: ${err.message}. Check console for more info.`)
  }
)


type ExtendedAppProps = AppProps & {
  Component: NextPage
}

//default next _app.tsx page with Toaster fro notifications
export default function MyApp(props: ExtendedAppProps): ReactNode {
  const {Component, pageProps} = props;
  return <>
          <Component {...pageProps} />
          <Toaster/>
        </>
}

