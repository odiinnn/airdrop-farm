import React, {ReactNode} from 'react';
import { Toaster } from 'react-hot-toast';
import {NextPage} from 'next';
import {AppProps} from 'next/app';


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

